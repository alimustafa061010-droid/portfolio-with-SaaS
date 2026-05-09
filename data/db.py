# Database connection and schema for MKT Business Management
import sqlite3
import os
import threading
import time
from contextlib import contextmanager
from typing import Optional, Dict, Any

def get_app_data_path():
    """Get the application data directory in a writable location"""
    app_data = os.path.join(os.getenv('APPDATA', os.path.expanduser('~')), 'ModernMKT')
    if not os.path.exists(app_data):
        os.makedirs(app_data, exist_ok=True)
    return os.path.abspath(app_data)

def resolve_path(path: str) -> str:
    """Resolve a relative path from the app data directory to an absolute path."""
    if not path:
        return ""
    if os.path.isabs(path):
        if os.path.exists(path):
            return path
        # Try to resolve old absolute path to current user's AppData
        filename = os.path.basename(path)
        # Search for the same filename in its respective folder structure
        # (e.g., and the subfolder name)
        # For simplicity, if it's absolute but doesn't exist, we'll try to guess its relative parts
        # Most of our paths are ModernMKT/customers/ID/photo.png
        parts = path.replace('\\', '/').split('/')
        if 'ModernMKT' in parts:
            idx = parts.index('ModernMKT')
            rel = os.path.join(*parts[idx+1:])
            abs_path = os.path.join(get_app_data_path(), rel)
            if os.path.exists(abs_path):
                return abs_path
        return path # Fallback
    return os.path.join(get_app_data_path(), path)

def make_relative_path(abs_path: str) -> str:
    """Convert an absolute path in the app data directory to a relative path."""
    if not abs_path:
        return ""
    app_data = get_app_data_path()
    if abs_path.startswith(app_data):
        return os.path.relpath(abs_path, app_data)
    return abs_path # Return as is if it's not in AppData

# The database should be in a writable location like AppData
APP_DATA_DIR = get_app_data_path()
DB_FILENAME = os.path.join(APP_DATA_DIR, 'mkt_business.db')

# Migration logic for existing database
_old_db_path = os.path.join(os.path.dirname(__file__), '..', 'mkt_business.db')
if os.path.exists(_old_db_path) and not os.path.exists(DB_FILENAME):
    try:
        import shutil
        shutil.move(_old_db_path, DB_FILENAME)
        print(f"Migrated database from {_old_db_path} to {DB_FILENAME}")
    except Exception as e:
        print(f"Failed to migrate database: {e}")
        # Fallback to old path if copy fails (though it might still have permission issues)
        if not os.path.exists(DB_FILENAME):
            DB_FILENAME = _old_db_path

# Global connection pool
_connection_pool = None
_pool_lock = threading.Lock()

class DatabaseManager:
    """Database manager without connection pooling (thread-safe for SQLite)"""
    
    def __init__(self, db_path: str = DB_FILENAME, max_connections: int = 5):
        self.db_path = db_path
        # max_connections is ignored now, but kept for compatibility
        self.lock = threading.Lock()
    
    def _create_connection(self) -> sqlite3.Connection:
        """Create a new database connection with optimizations"""
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row
        # Enable WAL mode for better concurrency
        conn.execute("PRAGMA journal_mode=WAL")
        # Enable foreign keys
        conn.execute("PRAGMA foreign_keys=ON")
        # Set cache size for better performance
        conn.execute("PRAGMA cache_size=10000")
        # Set temp store to memory for better performance
        conn.execute("PRAGMA temp_store=MEMORY")
        # Set synchronous mode for better performance (NORMAL is a good balance)
        conn.execute("PRAGMA synchronous=NORMAL")
        return conn
    
    @contextmanager
    def get_connection(self):
        """Get a new connection for each context (thread-safe)"""
        conn = None
        try:
            conn = self._create_connection()
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()

# Global database manager instance
_db_manager = None

def get_db_manager() -> DatabaseManager:
    """Get the global database manager instance"""
    global _db_manager
    if _db_manager is None:
        with _pool_lock:
            if _db_manager is None:
                _db_manager = DatabaseManager()
    return _db_manager

def get_db_connection():
    """Get a database connection (legacy function for compatibility)"""
    return get_db_manager()._create_connection()

@contextmanager
def get_db_connection_context():
    """Get a database connection with context manager"""
    with get_db_manager().get_connection() as conn:
        yield conn

def execute_query(query: str, params: Optional[tuple] = None) -> list:
    """Execute a query and return results"""
    with get_db_connection_context() as conn:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.fetchall()

def execute_update(query: str, params: Optional[tuple] = None) -> int:
    """Execute an update query and return affected rows"""
    with get_db_connection_context() as conn:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        conn.commit()
        return cursor.rowcount

def initialize_db():
    """Initialize database with optimized schema"""
    with get_db_connection_context() as conn:
        cursor = conn.cursor()
        
        # Create customers table with optimized indexes
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                serial_number TEXT UNIQUE,
                name TEXT,
                location TEXT,
                address TEXT,
                phone TEXT,
                reference TEXT,
                photo_path TEXT,
                customer_extra_fields TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Add customer_extra_fields column if it doesn't exist (for existing databases)
        try:
            cursor.execute("ALTER TABLE customers ADD COLUMN customer_extra_fields TEXT DEFAULT '{}'")
        except sqlite3.OperationalError:
            pass
        
        # Create index on serial_number for faster lookups
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_customers_serial 
            ON customers(serial_number)
        ''')
        
        # Create index on name for faster searches
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_customers_name 
            ON customers(name)
        ''')
        
        # Create materials table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                properties TEXT, -- JSON string
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active INTEGER DEFAULT 1,
                category TEXT DEFAULT 'inventory'
            )
        ''')
        
        # Add active column if it doesn't exist (for existing databases)
        try:
            cursor.execute("ALTER TABLE materials ADD COLUMN active INTEGER DEFAULT 1")
        except sqlite3.OperationalError:
            pass
        
        # Add category column if it doesn't exist (for existing databases)
        try:
            cursor.execute("ALTER TABLE materials ADD COLUMN category TEXT DEFAULT 'inventory'")
        except sqlite3.OperationalError:
            pass
        
        # Create index on material name
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_materials_name 
            ON materials(name)
        ''')
        
        # Create inventory table with optimized structure
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                material_id INTEGER,
                quantity INTEGER DEFAULT 0,
                price REAL DEFAULT 0.0,
                image_path TEXT,
                properties TEXT, -- JSON string
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(material_id) REFERENCES materials(id) ON DELETE CASCADE
            )
        ''')
        
        # Create indexes for inventory
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_inventory_material 
            ON inventory(material_id)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_inventory_quantity 
            ON inventory(quantity)
        ''')
        
        # Create removed_materials table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS removed_materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                properties TEXT, -- JSON string
                removed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                removed_by TEXT
            )
        ''')
        
        # Create inventory_change_log table with optimized structure
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS inventory_change_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER,
                action TEXT NOT NULL,
                quantity_before INTEGER,
                quantity_after INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user TEXT,
                note TEXT,
                FOREIGN KEY(item_id) REFERENCES inventory(id) ON DELETE SET NULL
            )
        ''')
        
        # Create indexes for change log
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_log_item 
            ON inventory_change_log(item_id)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_log_timestamp 
            ON inventory_change_log(timestamp)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_log_action 
            ON inventory_change_log(action)
        ''')
        
        # Create triggers for updated_at timestamps
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_customers_timestamp 
            AFTER UPDATE ON customers
            BEGIN
                UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        ''')
        
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_inventory_timestamp 
            AFTER UPDATE ON inventory
            BEGIN
                UPDATE inventory SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        ''')
        
        # Create users table for web authentication
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create enrollment table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                course TEXT NOT NULL,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Insert a default admin user if no users exist
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO users (email, password, role) VALUES ('admin@mkt.com', 'admin123', 'admin')")

        conn.commit()

def optimize_database():
    """Run database optimization commands"""
    with get_db_connection_context() as conn:
        cursor = conn.cursor()
        
        # Analyze tables for better query planning
        cursor.execute("ANALYZE")
        
        # Vacuum database to reclaim space
        cursor.execute("VACUUM")
        
        # Reindex for better performance
        cursor.execute("REINDEX")
        
        conn.commit()

def get_database_stats() -> Dict[str, Any]:
    """Get database statistics for monitoring"""
    with get_db_connection_context() as conn:
        cursor = conn.cursor()
        
        stats = {}
        
        # Get table sizes
        cursor.execute("""
            SELECT name, sql FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        """)
        tables = cursor.fetchall()
        
        for table in tables:
            table_name = table['name']
            cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
            count = cursor.fetchone()['count']
            stats[table_name] = count
        
        # Get database size
        cursor.execute("PRAGMA page_count")
        page_count = cursor.fetchone()[0]
        cursor.execute("PRAGMA page_size")
        page_size = cursor.fetchone()[0]
        stats['database_size_mb'] = (page_count * page_size) / (1024 * 1024)
        
        return stats

def backup_database(backup_path: str):
    """Create a backup of the database"""
    import shutil
    try:
        shutil.copy2(DB_FILENAME, backup_path)
        print(f"Database backed up to: {backup_path}")
        return True
    except Exception as e:
        print(f"Backup failed: {e}")
        return False

# Performance monitoring
_query_times = {}
_query_lock = threading.Lock()

def monitor_query_performance(func):
    """Decorator to monitor query performance"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            end_time = time.time()
            query_time = end_time - start_time
            
            with _query_lock:
                if func.__name__ not in _query_times:
                    _query_times[func.__name__] = []
                _query_times[func.__name__].append(query_time)
                
                # Keep only last 100 measurements
                if len(_query_times[func.__name__]) > 100:
                    _query_times[func.__name__] = _query_times[func.__name__][-100:]
    
    return wrapper

def get_query_performance_stats() -> Dict[str, Dict[str, float]]:
    """Get query performance statistics"""
    with _query_lock:
        stats = {}
        for func_name, times in _query_times.items():
            if times:
                stats[func_name] = {
                    'avg_time': sum(times) / len(times),
                    'min_time': min(times),
                    'max_time': max(times),
                    'count': len(times)
                }
        return stats 