"""
License Management System for MKT Business Management
Handles serial number validation, expiration, and usage tracking.
"""

import os
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import hashlib
import sys
import base64
import logging
import platform
import uuid
import requests

# ONLINE LICENSE SERVER URL (now configurable via config file)
# Default points to the local IP, but will favor config file or localhost fallback
DEFAULT_LICENSE_SERVER_URL = os.environ.get('LICENSE_SERVER_URL', 'http://192.168.18.36:5000/api/activate')

# noinspection PyUnresolvedReferences
def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        base_path = sys._MEIPASS  # type: ignore[attr-defined]
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

def get_app_dir():
    if getattr(sys, 'frozen', False):
        # Use user AppData for license file
        appdata = os.environ.get('APPDATA') or os.path.expanduser('~')
        app_dir = os.path.join(appdata, 'ModernMKT')
        os.makedirs(app_dir, exist_ok=True)
        return app_dir
    return os.path.dirname(__file__)

class LicenseManager:
    def __init__(self, db_path: str = ""):
        """Initialize the license manager"""
        # Setup logging
        self._setup_logging()
        
        app_dir = get_app_dir()
        if not db_path:
            db_path = os.path.join(app_dir, "license_data.db")
        self.db_path = db_path
        self.license_file = os.path.join(app_dir, "license.dat")
        
        # Generate encryption key based on machine ID
        self._encryption_key = self._generate_encryption_key()
        
        # Define serial number types and their expiration periods
        self.serial_types = {
            # Lifetime License (1 key)
            "MKT-LIFE-7X2Q-9Z8W": {"type": "lifetime", "expiry_days": None},
            # 30-Day Licenses (50 random keys)
            "MKT-30D-8Q2ZK-1JX9A": {"type": "30day", "expiry_days": 30},
            "MKT-30D-2L7VM-4KQ8B": {"type": "30day", "expiry_days": 30},
            "MKT-30D-5N1XP-7RZ2C": {"type": "30day", "expiry_days": 30},
            "MKT-30D-9W4QJ-2T8LS": {"type": "30day", "expiry_days": 30},
            "MKT-30D-3K8ZV-6YQ1D": {"type": "30day", "expiry_days": 30},
            "MKT-30D-7P2XK-5L9QJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-1J6QZ-8V2KP": {"type": "30day", "expiry_days": 30},
            "MKT-30D-4N9XJ-3Q7VL": {"type": "30day", "expiry_days": 30},
            "MKT-30D-6Y1QK-2P8ZJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-2T7VL-9Q4XJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-5L8QK-1J7XZ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-8V2KP-6Y1QJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-3Q7VL-4N9XK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-7RZ2C-5N1XP": {"type": "30day", "expiry_days": 30},
            "MKT-30D-1JX9A-2L7VM": {"type": "30day", "expiry_days": 30},
            "MKT-30D-4KQ8B-8Q2ZK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-6YQ1D-3K8ZV": {"type": "30day", "expiry_days": 30},
            "MKT-30D-2P8ZJ-7P2XK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-5L9QJ-9W4QJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-8V2KP-1J6QZ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-3Q7VL-4N9XJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-7RZ2C-6Y1QK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-1JX9A-2T7VL": {"type": "30day", "expiry_days": 30},
            "MKT-30D-4KQ8B-5L8QK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-6YQ1D-8Q2ZK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-2P8ZJ-3K8ZV": {"type": "30day", "expiry_days": 30},
            "MKT-30D-5N1XP-7P2XK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-8V2KP-9Q4XJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-3Q7VL-1J7XZ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-7RZ2C-6Y1QJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-1JX9A-4N9XK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-4KQ8B-2L7VM": {"type": "30day", "expiry_days": 30},
            "MKT-30D-6YQ1D-5L9QJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-2P8ZJ-8Q2ZK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-5N1XP-3K8ZV": {"type": "30day", "expiry_days": 30},
            "MKT-30D-8V2KP-7P2XK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-3Q7VL-9W4QJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-7RZ2C-1J6QZ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-1JX9A-4KQ8B": {"type": "30day", "expiry_days": 30},
            "MKT-30D-4N9XJ-6Y1QK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-6YQ1D-2T7VL": {"type": "30day", "expiry_days": 30},
            "MKT-30D-2P8ZJ-5L8QK": {"type": "30day", "expiry_days": 30},
            "MKT-30D-5N1XP-8V2KP": {"type": "30day", "expiry_days": 30},
            "MKT-30D-8Q2ZK-3Q7VL": {"type": "30day", "expiry_days": 30},
            "MKT-30D-3K8ZV-7RZ2C": {"type": "30day", "expiry_days": 30},
            "MKT-30D-7P2XK-1JX9A": {"type": "30day", "expiry_days": 30},
            "MKT-30D-1J6QZ-4N9XJ": {"type": "30day", "expiry_days": 30},
            "MKT-30D-4KQ8B-6YQ1D": {"type": "30day", "expiry_days": 30},
            "MKT-30D-6Y1QK-2L7VM": {"type": "30day", "expiry_days": 30},
            "MKT-30D-2T7VL-5L9QJ": {"type": "30day", "expiry_days": 30},
        }
        
        # Load server configuration
        self._load_server_config()
        self._initialize_database()

    def _load_server_config(self):
        """Load server configuration from file or use defaults"""
        app_dir = get_app_dir()
        config_path = os.path.join(app_dir, "server_config.json")
        
        self.server_url = DEFAULT_LICENSE_SERVER_URL
        
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    self.server_url = config.get('license_server_url', DEFAULT_LICENSE_SERVER_URL)
            except Exception as e:
                self.logger.error(f"Failed to load server config: {e}")
        else:
            # Create default config
            try:
                with open(config_path, 'w') as f:
                    json.dump({'license_server_url': DEFAULT_LICENSE_SERVER_URL}, f, indent=4)
            except Exception as e:
                self.logger.error(f"Failed to create default server config: {e}")
    
    def _initialize_database(self):
        """Initialize the license database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create table for tracking used serial numbers
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS used_serials (
                serial TEXT PRIMARY KEY,
                machine_id TEXT NOT NULL,
                activation_date TEXT NOT NULL,
                expiry_date TEXT,
                license_type TEXT NOT NULL,
                is_active INTEGER DEFAULT 1
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def _setup_logging(self):
        """Setup logging for license operations"""
        log_dir = os.path.join(get_app_dir(), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        log_file = os.path.join(log_dir, 'license_operations.log')
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def _generate_encryption_key(self) -> str:
        """Generate encryption key based on machine ID"""
        machine_id = self._get_machine_id()
        # Create a deterministic key based on machine ID
        key_hash = hashlib.sha256(machine_id.encode()).digest()
        return base64.urlsafe_b64encode(key_hash).decode()
    
    def _encrypt_data(self, data: str) -> str:
        """Encrypt data using machine-specific key"""
        try:
            # Simple XOR encryption with machine-specific key
            key_bytes = self._encryption_key.encode()
            data_bytes = data.encode()
            encrypted = bytearray()
            
            for i, byte in enumerate(data_bytes):
                encrypted.append(byte ^ key_bytes[i % len(key_bytes)])
            
            return base64.b64encode(bytes(encrypted)).decode()
        except Exception as e:
            self.logger.error(f"Encryption failed: {e}")
            return data  # Fallback to plain text
    
    def _decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt data using machine-specific key"""
        try:
            # Simple XOR decryption with machine-specific key
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            key_bytes = self._encryption_key.encode()
            decrypted = bytearray()
            
            for i, byte in enumerate(encrypted_bytes):
                decrypted.append(byte ^ key_bytes[i % len(key_bytes)])
            
            return bytes(decrypted).decode()
        except Exception as e:
            self.logger.error(f"Decryption failed: {e}")
            return encrypted_data  # Fallback to original data
    
    def _get_machine_id(self) -> str:
        """Generate a unique machine identifier"""
        # Get system information
        system_info = [
            platform.node(),
            platform.machine(),
            platform.processor(),
            str(uuid.getnode())  # MAC address
        ]
        
        # Create a hash of the system info
        machine_hash = hashlib.md5(''.join(system_info).encode()).hexdigest()
        return machine_hash
    
    def is_serial_predefined(self, serial: str) -> bool:
        """Check if the serial number is in the predefined local list"""
        return serial in self.serial_types

    def is_serial_valid(self, serial: str) -> bool:
        """A serial is locally valid if it's predefined OR if it follows server-side rules"""
        # We allow any serial to be 'valid' locally so it can be sent to the server for verification.
        return True
    
    def is_serial_used(self, serial: str) -> bool:
        """Check if a serial number has been used on any machine"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM used_serials WHERE serial = ?', (serial,))
        count = cursor.fetchone()[0]
        
        conn.close()
        return count > 0
    
    def is_serial_used_on_this_machine(self, serial: str) -> bool:
        """Check if a serial number has been used on this specific machine"""
        machine_id = self._get_machine_id()
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM used_serials WHERE serial = ? AND machine_id = ?', 
                      (serial, machine_id))
        count = cursor.fetchone()[0]
        
        conn.close()
        return count > 0
    
    def activate_serial_online(self, serial: str) -> tuple:
        """Activate serial online with the license server"""
        machine_id = self._get_machine_id()
        urls_to_try = [self.server_url]
        
        # If the primary URL is not localhost, try localhost as a fallback
        if '127.0.0.1' not in self.server_url and 'localhost' not in self.server_url:
            urls_to_try.append('http://127.0.0.1:5000/api/activate')
            
        last_error = "Unknown error"
        
        for url in urls_to_try:
            try:
                self.logger.info(f"Attempting online activation at {url}...")
                response = requests.post(
                    url,
                    json={'serial': serial, 'machine_id': machine_id},
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        # Save license info locally
                        activation_date = datetime.now()
                        expiry_date = None
                        if data.get('expiry_date'):
                            try:
                                expiry_date = datetime.fromisoformat(data['expiry_date'])
                            except Exception:
                                expiry_date = None
                        license_type = data.get('license_type', 'online')
                        self._save_license_file(serial, activation_date, expiry_date, license_type)
                        self.logger.info(f"Online license activated for serial: {serial} VIA {url}")
                        return True, f"Online activation successful. Type: {license_type}"
                    else:
                        return False, data.get('message', 'Activation rejected by server')
                elif response.status_code == 404:
                    last_error = f"Server endpoint not found at {url}"
                else:
                    last_error = f"Server returned error {response.status_code}"
            except requests.exceptions.ConnectionError:
                last_error = f"Could not connect to license server at {url}. Please check if the server is running and the IP/Port is correct."
            except Exception as e:
                last_error = f"Online activation error at {url}: {e}"
        
        return False, last_error

    def activate_serial(self, serial: str) -> tuple:
        """
        Activate serial.
        - If serial is predefined, allow offline fallback if server is unreachable.
        - If serial is NOT predefined, enforcement is strict: MUST succeed online.
        """
        is_predefined = self.is_serial_predefined(serial)
        
        online_ok, online_msg = self.activate_serial_online(serial)
        if online_ok:
            return True, online_msg
            
        # If online failed, check if we can fallback
        if is_predefined:
            self.logger.info(f"Online activation failed for predefined serial {serial}. Falling back to offline.")
            try:
                activation_date = datetime.now()
                expiry_date = None
                # Get expiry days from predefined info
                info = self.serial_types.get(serial, {})
                days = info.get("expiry_days")
                if days:
                    expiry_date = activation_date + timedelta(days=days)
                
                license_type = 'offline'
                self._save_license_file(serial, activation_date, expiry_date, license_type)
                return True, f"Offline activation successful (Predefined Key). Type: {info.get('type', 'offline')}"
            except Exception as e:
                return False, f"Local activation failed: {e}"
        else:
            # Not predefined and online failed
            return False, f"Online verification mandatory for this key. Server error: {online_msg}"
    
    def _save_license_file(self, serial: str, activation_date: datetime, 
                          expiry_date: Optional[datetime], license_type: str):
        """Save license information to the license file"""
        license_data = {
            "serial": serial,
            "activation_date": activation_date.isoformat(),
            "expiry_date": expiry_date.isoformat() if expiry_date else None,
            "license_type": license_type,
            "machine_id": self._get_machine_id()
        }
        
        try:
            # Convert to JSON and encrypt
            json_data = json.dumps(license_data, indent=2)
            encrypted_data = self._encrypt_data(json_data)
            
            with open(self.license_file, 'w') as f:
                f.write(encrypted_data)
            
            self.logger.info(f"License file saved successfully for serial: {serial}")
        except Exception as e:
            self.logger.error(f"Failed to save license file: {e}")
            raise

    def verify_license_online(self) -> Tuple[bool, str]:
        """
        Background check with server.
        - If server reachable: strict enforcement.
        - **FIX**: If it's a Master Key, don't delete it if the server returns 404 (Not Found).
          This prevents distributed apps from killing their own license if they hit a different/new server.
        - If server unreachable: allow local license (mix of both).
        - Skip for 'offline' license types.
        """
        info = self.get_license_info()
        if not info:
            return False, "No license info found"
            
        license_type = info.get('license_type', 'unknown')
        serial = info.get('serial', 'N/A')
        is_predefined = self.is_serial_predefined(serial)
        
        if license_type == 'offline':
            return True, "Offline license, skipping online verification"
            
        machine_id = self._get_machine_id()
        
        try:
            # Determine verify URL from server_url
            verify_url = self.server_url.replace('/activate', '/verify')
            if '/verify' not in verify_url:
                verify_url = self.server_url.rstrip('/') + '/verify'
                
            response = requests.post(verify_url, 
                                     json={'serial': serial, 'machine_id': machine_id}, 
                                     timeout=8)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    return True, "Verification successful"
                return False, result.get('message', 'License invalid')
            elif response.status_code in [403, 404]:
                # Special bypass for Master Keys if server doesn't know them (404)
                if is_predefined and response.status_code == 404:
                    self.logger.info(f"Master key {serial} not found on server {verify_url}, allowing bypass.")
                    return True, "Master key bypass"
                    
                # Explicit rejection from server (or unknown non-master key)
                msg = response.json().get('message', 'License revoked or machine unregistered')
                self.logger.error(f"License revoked by server: {msg}")
                # Optional: Delete local license file to force re-activation
                if os.path.exists(self.license_file):
                    try: os.remove(self.license_file)
                    except: pass
                return False, msg
            else:
                self.logger.warning(f"Server verification returned status {response.status_code}")
                return True, "Assuming valid due to server issue"
        except Exception as e:
            self.logger.warning(f"Connection to license server failed during background check: {e}")
            # This is the 'mix of both' part: if internet is down, let them in.
            return True, "Server unreachable, using local validation"
    
    def check_license(self) -> Tuple[bool, str]:
        """Check if the current license is valid (no local serial list check)"""
        if not os.path.exists(self.license_file):
            self.logger.warning("No license file found")
            return False, "No license file found"
        try:
            with open(self.license_file, 'r') as f:
                encrypted_data = f.read()
            try:
                decrypted_data = self._decrypt_data(encrypted_data)
                license_data = json.loads(decrypted_data)
            except (json.JSONDecodeError, Exception):
                self.logger.info("Attempting to read license file as plain JSON")
                license_data = json.loads(encrypted_data)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            self.logger.error(f"Invalid license file format: {e}")
            return False, "Invalid license file format"
        serial = license_data.get("serial")
        if not serial:
            self.logger.error("No serial number in license file")
            return False, "No serial number in license file"
            
        license_type = license_data.get("license_type", "unknown")
        
        # STRICT RULE: If the license is 'offline' but the serial isn't predefined, it's invalid.
        if license_type == 'offline' and not self.is_serial_predefined(serial):
            self.logger.error(f"Offline license detected for non-predefined serial: {serial}")
            return False, "Offline license not allowed for this key type. Please activate online."

        # No local serial validation here (allow server-verified keys)
        machine_id = self._get_machine_id()
        if license_data.get("machine_id") != machine_id:
            self.logger.error(f"License not authorized for this machine. Expected: {license_data.get('machine_id')}, Got: {machine_id}")
            return False, "License not authorized for this machine"
        expiry_date_str = license_data.get("expiry_date")
        if expiry_date_str:
            try:
                expiry_date = datetime.fromisoformat(expiry_date_str)
                if datetime.now() > expiry_date:
                    self.logger.warning(f"License has expired for serial: {serial}")
                    return False, "License has expired"
            except ValueError as e:
                self.logger.error(f"Invalid expiry date format: {e}")
                return False, "Invalid expiry date format"
        self.logger.info(f"License validation successful for serial: {serial}")
        return True, "License is valid"
    
    def get_license_info(self) -> Optional[Dict]:
        """Get current license information"""
        if not os.path.exists(self.license_file):
            return None
        
        try:
            with open(self.license_file, 'r') as f:
                encrypted_data = f.read()
            
            # Try to decrypt the data
            try:
                decrypted_data = self._decrypt_data(encrypted_data)
                return json.loads(decrypted_data)
            except (json.JSONDecodeError, Exception):
                # Fallback: try to read as plain JSON (for backward compatibility)
                return json.loads(encrypted_data)
        except (json.JSONDecodeError, FileNotFoundError):
            return None
    
    def get_remaining_days(self) -> Optional[int]:
        """Get remaining days for the current license"""
        license_info = self.get_license_info()
        if not license_info or not license_info.get("expiry_date"):
            return None  # Lifetime license
        
        try:
            expiry_date = datetime.fromisoformat(license_info["expiry_date"])
            remaining = (expiry_date - datetime.now()).days
            return max(0, remaining)
        except ValueError:
            return None
    
    def get_available_serials(self) -> Dict[str, List[str]]:
        """Get available serial numbers by type"""
        available = {"1year": [], "lifetime": [], "legacy": []}
        
        for serial, info in self.serial_types.items():
            if not self.is_serial_used(serial):
                available[info["type"]].append(serial)
        
        return available
    
    def get_used_serials(self) -> List[Dict]:
        """Get list of used serial numbers"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT serial, machine_id, activation_date, expiry_date, license_type, is_active
            FROM used_serials
            ORDER BY activation_date DESC
        ''')
        
        results = []
        for row in cursor.fetchall():
            results.append({
                "serial": row[0],
                "machine_id": row[1],
                "activation_date": row[2],
                "expiry_date": row[3],
                "license_type": row[4],
                "is_active": bool(row[5])
            })
        
        conn.close()
        return results 