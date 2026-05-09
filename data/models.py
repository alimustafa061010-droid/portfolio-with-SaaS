# Data models for MKT Business Management
import sqlite3
import json
from .db import get_db_connection, resolve_path, make_relative_path

class Customer:
    def __init__(self, serial_number, name, location=None, address=None, phone=None,
                 reference=None, photo_path=None, customer_extra_fields=None, id=None, created_at=None, updated_at=None, **extra):
        self.id = id
        self.serial_number = serial_number
        self.name = name
        self.location = location
        self.address = address
        self.phone = phone
        self.reference = reference
        self.photo_path = resolve_path(photo_path)
        self.customer_extra_fields = customer_extra_fields or {}
        self.created_at = created_at
        self.updated_at = updated_at

    @staticmethod
    def _from_row(row):
        keys = row.keys()
        return Customer(
            id=row['id'] if 'id' in keys else None,
            serial_number=row['serial_number'],
            name=row['name'],
            location=row['location'] if 'location' in keys else None,
            address=row['address'] if 'address' in keys else None,
            phone=row['phone'] if 'phone' in keys else None,
            reference=row['reference'] if 'reference' in keys else None,
            photo_path=row['photo_path'] if 'photo_path' in keys else None,
            customer_extra_fields=json.loads(row['customer_extra_fields']) if 'customer_extra_fields' in keys and row['customer_extra_fields'] else {},
            created_at=row['created_at'] if 'created_at' in keys else None,
            updated_at=row['updated_at'] if 'updated_at' in keys else None,
        )

    @staticmethod
    def create(serial_number, name, location, address, phone, reference, photo_path, customer_extra_fields=None, created_at=None):
        conn = get_db_connection()
        cursor = conn.cursor()
        photo_path = make_relative_path(photo_path)
        if created_at:
            cursor.execute('''
                INSERT INTO customers (serial_number, name, location, address, phone, reference, photo_path, customer_extra_fields, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (serial_number, name, location, address, phone, reference, photo_path, json.dumps(customer_extra_fields or {}), created_at))
        else:
            cursor.execute('''
                INSERT INTO customers (serial_number, name, location, address, phone, reference, photo_path, customer_extra_fields)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (serial_number, name, location, address, phone, reference, photo_path, json.dumps(customer_extra_fields or {})))
        conn.commit()
        conn.close()

    @staticmethod
    def get_by_serial(serial_number):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM customers WHERE serial_number = ?', (serial_number,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return Customer._from_row(row)
        return None

    @staticmethod
    def get_all():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM customers')
        rows = cursor.fetchall()
        conn.close()
        return [Customer._from_row(row) for row in rows]

    @staticmethod
    def update(serial_number, **kwargs):
        conn = get_db_connection()
        cursor = conn.cursor()
        if 'photo_path' in kwargs:
            kwargs['photo_path'] = make_relative_path(kwargs['photo_path'])
        if 'customer_extra_fields' in kwargs and isinstance(kwargs['customer_extra_fields'], dict):
            kwargs['customer_extra_fields'] = json.dumps(kwargs['customer_extra_fields'])
        
        fields = []
        values = []
        for key, value in kwargs.items():
            fields.append(f"{key} = ?")
            values.append(value)
        values.append(serial_number)
        sql = f"UPDATE customers SET {', '.join(fields)} WHERE serial_number = ?"
        cursor.execute(sql, values)
        conn.commit()
        conn.close()

    @staticmethod
    def delete(serial_number):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM customers WHERE serial_number = ?', (serial_number,))
        conn.commit()
        conn.close()


class Material:
    def __init__(self, name, properties, id=None, active=1, category='inventory'):
        self.id = id
        self.name = name
        self.properties = properties  # Should be a dict
        self.active = active
        self.category = category or 'inventory'

    @staticmethod
    def create(name, properties, category='inventory'):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO materials (name, properties, active, category)
            VALUES (?, ?, 1, ?)
        ''', (name, json.dumps(properties), category))
        conn.commit()
        conn.close()

    @staticmethod
    def get_by_name(name, include_inactive=False, category=None):
        conn = get_db_connection()
        cursor = conn.cursor()
        if include_inactive:
            if category is None:
                cursor.execute('SELECT * FROM materials WHERE name = ?', (name,))
            else:
                cursor.execute('SELECT * FROM materials WHERE name = ? AND category = ?', (name, category))
        else:
            if category is None:
                cursor.execute('SELECT * FROM materials WHERE name = ? AND active = 1', (name,))
            else:
                cursor.execute('SELECT * FROM materials WHERE name = ? AND active = 1 AND category = ?', (name, category))
        row = cursor.fetchone()
        conn.close()
        if row:
            return Material(
                row['name'],
                json.loads(row['properties']),
                id=row['id'],
                active=row['active'] if 'active' in row.keys() else 1,
                category=row['category'] if 'category' in row.keys() else 'inventory'
            )
        return None

    @staticmethod
    def get_all(include_inactive=False, category='inventory'):
        conn = get_db_connection()
        cursor = conn.cursor()
        if include_inactive:
            if category is None:
                cursor.execute('SELECT * FROM materials')
            else:
                cursor.execute('SELECT * FROM materials WHERE category = ?', (category,))
        else:
            if category is None:
                cursor.execute('SELECT * FROM materials WHERE active = 1')
            else:
                cursor.execute('SELECT * FROM materials WHERE active = 1 AND category = ?', (category,))
        rows = cursor.fetchall()
        conn.close()
        return [
            Material(
                row['name'],
                json.loads(row['properties']),
                id=row['id'],
                active=row['active'] if 'active' in row.keys() else 1,
                category=row['category'] if 'category' in row.keys() else 'inventory'
            )
            for row in rows
        ]

    @staticmethod
    def update(name, **kwargs):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        fields = []
        values = []
        for key, value in kwargs.items():
            if key == 'properties' and isinstance(value, dict):
                value = json.dumps(value)
            fields.append(f"{key} = ?")
            values.append(value)
        values.append(name)
        
        sql = f"UPDATE materials SET {', '.join(fields)} WHERE name = ?"
        cursor.execute(sql, values)
        conn.commit()
        conn.close()

    @staticmethod
    def delete(name):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM materials WHERE name = ?', (name,))
        conn.commit()
        conn.close()

    @staticmethod
    def soft_delete(name):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE materials SET active = 0 WHERE name = ?', (name,))
        conn.commit()
        conn.close()

    @staticmethod
    def update_active(name, active):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE materials SET active = ? WHERE name = ?', (active, name))
        conn.commit()
        conn.close()

class Inventory:
    def __init__(self, material_id, quantity, price, image_path, properties=None, id=None, created_at=None):
        self.id = id
        self.material_id = material_id
        self.quantity = quantity
        self.price = price
        self.image_path = resolve_path(image_path)
        self.properties = properties or {}
        self.created_at = created_at

    @staticmethod
    def get_by_id(id):
        """Return a single inventory item by id or None if missing."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM inventory WHERE id = ?', (id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return Inventory(
                row['material_id'],
                row['quantity'],
                row['price'],
                row['image_path'],
                json.loads(row['properties'] or '{}'),
                id=row['id'],
                created_at=row['created_at']
            )
        return None

    @staticmethod
    def create(material_id, quantity, price, image_path, properties=None):
        conn = get_db_connection()
        cursor = conn.cursor()
        image_path = make_relative_path(image_path)
        cursor.execute('''
            INSERT INTO inventory (material_id, quantity, price, image_path, properties)
            VALUES (?, ?, ?, ?, ?)
        ''', (material_id, quantity, price, image_path, json.dumps(properties or {})))
        item_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Log the creation
        from datetime import datetime
        InventoryChangeLog.create(
            item_id, 'create', 0, quantity, 
            datetime.now().isoformat(), None, 
            f"Created new inventory item with price {price}"
        )
        return item_id

    @staticmethod
    def get_by_material_id(material_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM inventory WHERE material_id = ?', (material_id,))
        rows = cursor.fetchall()
        conn.close()
        return [Inventory(row['material_id'], row['quantity'], row['price'], row['image_path'], json.loads(row['properties'] or '{}'), id=row['id'], created_at=row['created_at']) for row in rows]

    @staticmethod
    def get_all_with_material(category='inventory'):
        """Fetch all inventory items joined with their material names."""
        conn = get_db_connection()
        cursor = conn.cursor()
        query = '''
            SELECT i.*, m.name as material_name, m.category as material_category
            FROM inventory i
            JOIN materials m ON i.material_id = m.id
        '''
        if category:
            query += ' WHERE m.category = ?'
            cursor.execute(query, (category,))
        else:
            cursor.execute(query)
            
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for row in rows:
            inv = Inventory(
                row['material_id'], row['quantity'], row['price'], 
                row['image_path'], json.loads(row['properties'] or '{}'), 
                id=row['id'], created_at=row['created_at']
            )
            inv.material_name = row['material_name']
            inv.material_category = row['material_category']
            results.append(inv)
        return results

    @staticmethod
    def update(id, **kwargs):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current values for logging
        cursor.execute('SELECT * FROM inventory WHERE id = ?', (id,))
        current_item = cursor.fetchone()
        if not current_item:
            conn.close()
            raise ValueError(f"Inventory item with id {id} not found")
        
        # Check for quantity update
        if 'quantity' in kwargs:
            new_qty = kwargs['quantity']
            if new_qty < 0:
                conn.close()
                raise ValueError("Inventory quantity cannot be negative.")
        
        # Determine action type
        action = 'edit'
        if 'quantity' in kwargs:
            old_qty = current_item['quantity']
            new_qty = kwargs['quantity']
            if new_qty > old_qty:
                action = 'restock'
            elif new_qty < old_qty:
                action = 'sale'
        
        if 'image_path' in kwargs:
            kwargs['image_path'] = make_relative_path(kwargs['image_path'])
            
        fields = []
        values = []
        for key, value in kwargs.items():
            if key == 'properties' and isinstance(value, dict):
                value = json.dumps(value)
            fields.append(f"{key} = ?")
            values.append(value)
        values.append(id)
        sql = f"UPDATE inventory SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(sql, values)
        conn.commit()
        
        # Log the change using the SAME transaction to avoid deadlocks
        from datetime import datetime
        quantity_before = current_item['quantity']
        quantity_after = kwargs.get('quantity', quantity_before)
        
        note_parts = []
        if 'quantity' in kwargs:
            note_parts.append(f"Quantity: {quantity_before} → {quantity_after}")
        if 'price' in kwargs:
            note_parts.append(f"Price: {current_item['price']} → {kwargs['price']}")
        if 'properties' in kwargs:
            note_parts.append("Properties updated")
        
        note = " | ".join(note_parts) if note_parts else "Item updated"
        
        InventoryChangeLog.create(
            id, action, quantity_before, quantity_after,
            datetime.now().isoformat(), None, note,
            existing_cursor=cursor
        )
        
        conn.commit() # Commit both updates
        
        # After update, check for low inventory
        low_inventory = False
        if 'quantity' in kwargs:
            if kwargs['quantity'] < 5:
                low_inventory = True
        conn.close()
        return low_inventory

    @staticmethod
    def delete(id, force=False):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM inventory WHERE id = ?', (id,))
        row = cursor.fetchone()
        if row and row['quantity'] > 0 and not force:
            conn.close()
            raise ValueError("Cannot delete inventory item with nonzero quantity.")
        # Save item info for logging before deletion
        item_info = None
        if row:
            item_info = {
                'material_id': row['material_id'],
                'quantity': row['quantity'],
                'price': row['price'],
                'image_path': row['image_path'],
                'properties': row['properties']
            }
        # Log removal BEFORE deletion within the SAME transaction
        try:
            from datetime import datetime
            InventoryChangeLog.create(
                id,
                'remove',
                row['quantity'] if row else 0,
                0,
                datetime.now().isoformat(),
                None,
                json.dumps(item_info) if item_info else "Item Logged for Deletion",
                existing_cursor=cursor
            )
        except Exception as e:
            print(f"[DEBUG] Failed to log inventory deletion for id {id}: {e}")
            
        cursor.execute('DELETE FROM inventory WHERE id = ?', (id,))
        
        # Check if this was the last inventory item for this material
        if item_info:
            mat_id = item_info['material_id']
            cursor.execute('SELECT COUNT(*) as cnt FROM inventory WHERE material_id = ?', (mat_id,))
            res = cursor.fetchone()
            if res and res['cnt'] == 0:
                # Check the material's category and name before deleting it
                cursor.execute('SELECT name, category FROM materials WHERE id = ?', (mat_id,))
                mat_row = cursor.fetchone()
                if mat_row:
                    # NEVER auto-delete repair materials OR system-core inventory materials
                    if mat_row['category'] == 'repair':
                        print(f"[DEBUG] Material '{mat_row['name']}' (Repair) preserved.")
                    else:
                        core_materials = [
                            "Solar Plate", "Stand", "Inverter", "AC Safety Breaker", "DC Safety Breaker",
                            "Protection Unit", "Overload Unit", "Change Over", "Display Meter", "DP Box",
                            "Battery", "AC Cable", "DC Cable", "Contactor"
                        ]
                        if mat_row['name'] not in core_materials:
                            cursor.execute('DELETE FROM materials WHERE id = ?', (mat_id,))
                            print(f"[DEBUG] Material '{mat_row['name']}' automatically removed as it is now empty.")
        
        conn.commit()
        conn.close()
        return item_info

class RemovedMaterial:
    def __init__(self, name, properties, removed_at, id=None):
        self.id = id
        self.name = name
        self.properties = properties  # Should be a dict
        self.removed_at = removed_at

    @staticmethod
    def create(name, properties, removed_at):
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO removed_materials (name, properties, removed_at)
                VALUES (?, ?, ?)
            ''', (name, json.dumps(properties), removed_at))
            conn.commit()
        finally:
            conn.close()

    @staticmethod
    def get_all():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM removed_materials')
        rows = cursor.fetchall()
        conn.close()
        return [RemovedMaterial(row['name'], json.loads(row['properties']), row['removed_at'], id=row['id']) for row in rows]

    @staticmethod
    def clear_all():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM removed_materials')
        conn.commit()
        conn.close()

    @staticmethod
    def delete_by_id(rm_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM removed_materials WHERE id = ?', (rm_id,))
        conn.commit()
        conn.close()

class InventoryChangeLog:
    def __init__(self, item_id, action, quantity_before, quantity_after, timestamp, user=None, note=None, id=None):
        self.id = id
        self.item_id = item_id
        self.action = action  # e.g., 'restock', 'remove', 'edit', 'create', 'sale'
        self.quantity_before = quantity_before
        self.quantity_after = quantity_after
        self.timestamp = timestamp
        self.user = user
        self.note = note

    @staticmethod
    def create(item_id, action, quantity_before, quantity_after, timestamp, user=None, note=None, existing_cursor=None):
        if existing_cursor:
            existing_cursor.execute('''
                INSERT INTO inventory_change_log (item_id, action, quantity_before, quantity_after, timestamp, user, note)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (item_id, action, quantity_before, quantity_after, timestamp, user, note))
            return

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO inventory_change_log (item_id, action, quantity_before, quantity_after, timestamp, user, note)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (item_id, action, quantity_before, quantity_after, timestamp, user, note))
            conn.commit()
        finally:
            conn.close()

    @staticmethod
    def get_all():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM inventory_change_log ORDER BY timestamp DESC')
        rows = cursor.fetchall()
        conn.close()
        return [InventoryChangeLog(**row) for row in rows]

    @staticmethod
    def get_by_item_id(item_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM inventory_change_log WHERE item_id = ? ORDER BY timestamp DESC', (item_id,))
        rows = cursor.fetchall()
        conn.close()
        return [InventoryChangeLog(**row) for row in rows]

    @staticmethod
    def get_by_action(action):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM inventory_change_log WHERE action = ? ORDER BY timestamp DESC', (action,))
        rows = cursor.fetchall()
        conn.close()
        return [InventoryChangeLog(**row) for row in rows]

    @staticmethod
    def get_by_date_range(start_date, end_date):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM inventory_change_log 
            WHERE timestamp BETWEEN ? AND ? 
            ORDER BY timestamp DESC
        ''', (start_date, end_date))
        rows = cursor.fetchall()
        conn.close()
        return [InventoryChangeLog(**row) for row in rows]

    @staticmethod
    def get_summary_stats():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                action,
                COUNT(*) as count,
                SUM(CASE WHEN quantity_after > quantity_before THEN quantity_after - quantity_before ELSE 0 END) as total_added,
                SUM(CASE WHEN quantity_before > quantity_after THEN quantity_before - quantity_after ELSE 0 END) as total_removed
            FROM inventory_change_log 
            GROUP BY action
        ''')
        rows = cursor.fetchall()
        conn.close()
        return rows

    @staticmethod
    def cleanup_orphaned_entries():
        """Remove log entries for deleted inventory items"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM inventory_change_log 
            WHERE item_id NOT IN (SELECT id FROM inventory)
            AND item_id IS NOT NULL
        ''')
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        return deleted_count 