import os
import threading
import time
from contextlib import contextmanager
from typing import Optional, Dict, Any
import sqlite3

# Conditional import for Postgres
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

def get_db_connection():
    """Get a database connection (Postgres for Vercel, SQLite for local)"""
    postgres_url = os.environ.get('POSTGRES_URL') or os.environ.get('DATABASE_URL')
    
    if postgres_url and HAS_POSTGRES:
        # Normalize protocol for psycopg2 compatibility (Supabase/Vercel)
        if postgres_url.startswith('postgres://'):
            postgres_url = postgres_url.replace('postgres://', 'postgresql://', 1)
        
        # Strip problematic query parameters (like supa=base) that psycopg2 doesn't like
        if '?' in postgres_url:
            postgres_url = postgres_url.split('?')[0]
            
        conn = psycopg2.connect(postgres_url, sslmode='require')
        return conn
    else:
        # Fallback to local SQLite
        # Define DB_FILENAME if not already
        db_path = os.path.join(os.path.dirname(__file__), '..', 'mkt_business.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn

@contextmanager
def get_db_connection_context():
    """Context manager for database connections"""
    conn = None
    try:
        conn = get_db_connection()
        yield conn
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

def initialize_db():
    """Initialize database tables for Postgres/SQLite"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Use SERIAL for Postgres, AUTOINCREMENT for SQLite
        is_postgres = os.environ.get('POSTGRES_URL') is not None
        id_type = "SERIAL PRIMARY KEY" if is_postgres else "INTEGER PRIMARY KEY AUTOINCREMENT"
        text_type = "TEXT"
        timestamp_type = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"

        # List of table creation statements
        tables = [
            # Enrollment table
            f'''CREATE TABLE IF NOT EXISTS enrollments (
                id {id_type},
                name {text_type} NOT NULL,
                email {text_type} NOT NULL,
                phone {text_type},
                course {text_type} NOT NULL,
                message {text_type},
                created_at {timestamp_type}
            )''',
            # Users table
            f'''CREATE TABLE IF NOT EXISTS users (
                id {id_type},
                email {text_type} UNIQUE,
                password {text_type},
                role {text_type} DEFAULT 'user',
                created_at {timestamp_type}
            )''',
            # Customers table
            f'''CREATE TABLE IF NOT EXISTS customers (
                id {id_type},
                serial_number {text_type} UNIQUE,
                name {text_type},
                location {text_type},
                address {text_type},
                phone {text_type},
                reference {text_type},
                photo_path {text_type},
                customer_extra_fields {text_type} DEFAULT '{{}}',
                created_at {timestamp_type},
                updated_at {timestamp_type}
            )''',
            # Materials table
            f'''CREATE TABLE IF NOT EXISTS materials (
                id {id_type},
                name {text_type} UNIQUE,
                properties {text_type},
                created_at {timestamp_type},
                active INTEGER DEFAULT 1,
                category {text_type} DEFAULT 'inventory'
            )''',
            # Inventory table
            f'''CREATE TABLE IF NOT EXISTS inventory (
                id {id_type},
                material_id INTEGER,
                quantity INTEGER DEFAULT 0,
                price REAL DEFAULT 0.0,
                image_path {text_type},
                properties {text_type},
                created_at {timestamp_type},
                updated_at {timestamp_type}
            )''',
            # Removed materials
            f'''CREATE TABLE IF NOT EXISTS removed_materials (
                id {id_type},
                name {text_type},
                properties {text_type},
                removed_at {timestamp_type},
                removed_by {text_type}
            )''',
            # Change log
            f'''CREATE TABLE IF NOT EXISTS inventory_change_log (
                id {id_type},
                item_id INTEGER,
                action {text_type} NOT NULL,
                quantity_before INTEGER,
                quantity_after INTEGER,
                timestamp {timestamp_type},
                "user" {text_type},
                note {text_type}
            )'''
        ]

        for table_sql in tables:
            try:
                cursor.execute(table_sql)
                conn.commit()
            except Exception as e:
                conn.rollback()
                print(f"Error creating table: {e}")
                # We continue if it's "already exists" but for Postgres IF NOT EXISTS should handle it
                # If it's a real error, we might want to know
        
        # Add index statements
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_customers_serial ON customers(serial_number)",
            "CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)",
            "CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name)",
            "CREATE INDEX IF NOT EXISTS idx_inventory_material ON inventory(material_id)",
            "CREATE INDEX IF NOT EXISTS idx_log_item ON inventory_change_log(item_id)"
        ]
        
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
                conn.commit()
            except Exception:
                conn.rollback()

        # Insert default admin if not exists
        try:
            cursor.execute("SELECT COUNT(*) FROM users")
            if cursor.fetchone()[0] == 0:
                cursor.execute("INSERT INTO users (email, password, role) VALUES ('admin@mkt.com', 'admin123', 'admin')")
                conn.commit()
        except Exception:
            conn.rollback()

    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

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