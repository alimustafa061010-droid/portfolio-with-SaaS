from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import sqlite3
import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from datetime import datetime
from data.db import get_db_connection, initialize_db

app = Flask(__name__)
load_dotenv()
CORS(app) # Enable CORS for the portfolio to talk to this API
app.secret_key = 'your-very-secret-key'

from data.license_manager import LicenseManager
license_mgr = LicenseManager()

# Utility to convert sqlite row to dict
def dict_from_row(row):
    return dict(row) if row else None

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? AND password = ?", (email, password))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'role': user['role']
            }
        })
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

from data.models import Customer, Inventory, Material, InventoryChangeLog, RemovedMaterial
from pdf.generator import generate_invoice_pdf

class Enrollment:
    @staticmethod
    def create(name, email, course, phone=None, message=None):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO enrollments (name, email, phone, course, message)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, email, phone, course, message))
        enroll_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return enroll_id

def send_enrollment_email(enrollment_data):
    """Sends an email notification via Gmail SMTP."""
    sender_email = os.getenv('GMAIL_USER')
    sender_password = os.getenv('GMAIL_APP_PASSWORD')
    receiver_email = os.getenv('GMAIL_USER') # Send to the same email as sender

    if not sender_email or not sender_password:
        print("[ERROR] Email credentials not found in environment variables.")
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = f"New Enrollment Request: {enrollment_data['course']}"
    message["From"] = sender_email
    message["To"] = receiver_email

    text = f"""
    New Enrollment Details:
    -----------------------
    Student Name: {enrollment_data['name']}
    Email: {enrollment_data['email']}
    Phone: {enrollment_data.get('phone', 'N/A')}
    Course: {enrollment_data['course']}
    Message: {enrollment_data.get('message', 'N/A')}
    """

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #4CAF50;">New Enrollment Received!</h2>
        <p>A new student has applied for a course through the website.</p>
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f2f2f2;">
                <td style="padding: 8px; font-weight: bold;">Student Name:</td>
                <td style="padding: 8px;">{enrollment_data['name']}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Email:</td>
                <td style="padding: 8px;">{enrollment_data['email']}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
                <td style="padding: 8px; font-weight: bold;">Phone:</td>
                <td style="padding: 8px;">{enrollment_data.get('phone', 'N/A')}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Course:</td>
                <td style="padding: 8px; color: #E91E63; font-weight: bold;">{enrollment_data['course']}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
                <td style="padding: 8px; font-weight: bold;">Message:</td>
                <td style="padding: 8px;">{enrollment_data.get('message', 'N/A')}</td>
            </tr>
        </table>
        <p style="font-size: 10px; color: #999; margin-top: 20px;">
            This is an automated notification from your Portfolio Academy System.
        </p>
    </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    message.attach(part1)
    message.attach(part2)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message.as_string())
        print(f"[SUCCESS] Enrollment email sent for {enrollment_data['name']}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send enrollment email: {e}")
        return False

@app.route('/api/enroll', methods=['POST'])
def enroll():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    course = data.get('course')
    message = data.get('message')
    
    if not all([name, email, course]):
        return jsonify({'success': False, 'message': 'Name, email and course are required'}), 400
        
    try:
        enroll_id = Enrollment.create(name, email, course, phone, message)
        
        # Trigger email notification
        send_enrollment_email({
            'name': name,
            'email': email,
            'phone': phone,
            'course': course,
            'message': message
        })
        
        return jsonify({'success': True, 'id': enroll_id})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
import shutil
from werkzeug.utils import secure_filename

@app.route('/api/license/status', methods=['GET'])
def get_license_status():
    valid, message = license_mgr.check_license()
    info = license_mgr.get_license_info()
    return jsonify({
        'valid': valid,
        'message': message,
        'info': info,
        'remaining_days': license_mgr.get_remaining_days()
    })

@app.route('/api/license/activate', methods=['POST'])
def activate_license():
    data = request.get_json()
    serial = data.get('serial')
    if not serial:
        return jsonify({'success': False, 'message': 'Serial is required'}), 400
    
    success, message = license_mgr.activate_serial(serial)
    return jsonify({'success': success, 'message': message})

@app.route('/api/inventory', methods=['POST'])
def add_inventory():
    data = request.get_json()
    # First ensure material exists
    mat = Material.get_by_name(data['material_name'])
    if not mat:
        Material.create(data['material_name'], data.get('properties', {}), data.get('category', 'inventory'))
        mat = Material.get_by_name(data['material_name'])
    
    item_id = Inventory.create(
        mat.id, 
        data.get('quantity', 0), 
        data.get('price', 0.0), 
        data.get('image_path', '')
    )
    return jsonify({'success': True, 'id': item_id})

@app.route('/api/inventory/<int:item_id>', methods=['PUT'])
def update_inventory(item_id):
    data = request.get_json()
    try:
        Inventory.update(item_id, **data)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/inventory/<int:item_id>', methods=['DELETE'])
def delete_inventory(item_id):
    try:
        Inventory.delete(item_id, force=True)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/materials', methods=['GET'])
def get_materials():
    category = request.args.get('category')
    mats = Material.get_all(include_inactive=True, category=category)
    return jsonify([{'id': m.id, 'name': m.name, 'properties': m.properties, 'active': m.active, 'category': m.category} for m in mats])

@app.route('/api/materials', methods=['POST'])
def add_material():
    data = request.get_json()
    try:
        Material.create(data['name'], data.get('properties', {}), data.get('category', 'inventory'))
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/materials/<name>', methods=['PUT'])
def update_material(name):
    data = request.get_json()
    try:
        Material.update(name, **data)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/materials/<name>', methods=['DELETE'])
def delete_material(name):
    try:
        Material.delete(name)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/customers', methods=['POST'])
def add_customer():
    data = request.get_json()
    try:
        Customer.create(
            data['serial_number'],
            data['name'],
            data.get('location', ''),
            data.get('address', ''),
            data.get('phone', ''),
            data.get('reference', ''),
            data.get('photo_path', ''),
            data.get('extra_fields', {})
        )
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/customers/<serial>', methods=['GET'])
def get_customer(serial):
    customer = Customer.get_by_serial(serial)
    if not customer:
        return jsonify({'success': False, 'message': 'Not found'}), 404
    return jsonify({
        'id': customer.id, 'serial_number': customer.serial_number, 'name': customer.name,
        'location': customer.location, 'address': customer.address, 'phone': customer.phone,
        'reference': customer.reference, 'photo_path': customer.photo_path,
        'customer_extra_fields': customer.customer_extra_fields,
        'created_at': customer.created_at, 'updated_at': customer.updated_at
    })

@app.route('/api/customers/<serial>', methods=['PUT'])
def update_customer(serial):
    data = request.get_json()
    try:
        Customer.update(serial, **data)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/customers/<serial>', methods=['DELETE'])
def delete_customer(serial):
    try:
        Customer.delete(serial)
        # Also clean up their directory if needed
        app_data = os.path.join(os.getenv('APPDATA', os.path.expanduser('~')), 'ModernMKT')
        customer_dir = os.path.join(app_data, 'customers', serial)
        if os.path.exists(customer_dir):
            shutil.rmtree(customer_dir)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/customers/<serial>/files', methods=['GET'])
def get_customer_files(serial):
    app_data = os.path.join(os.getenv('APPDATA', os.path.expanduser('~')), 'ModernMKT')
    customer_dir = os.path.join(app_data, 'customers', serial)
    if not os.path.exists(customer_dir):
        return jsonify([])
    files = [f for f in os.listdir(customer_dir) if f.endswith('.pdf')]
    return jsonify(files)

@app.route('/api/files/all', methods=['GET'])
def get_all_files():
    app_data = os.path.join(os.getenv('APPDATA', os.path.expanduser('~')), 'ModernMKT')
    customers_root = os.path.join(app_data, 'customers')
    if not os.path.exists(customers_root):
        return jsonify([])
    
    all_files = []
    for serial in os.listdir(customers_root):
        customer_dir = os.path.join(customers_root, serial)
        if os.path.isdir(customer_dir):
            for f in os.listdir(customer_dir):
                if f.endswith('.pdf'):
                    fpath = os.path.join(customer_dir, f)
                    stats = os.stat(fpath)
                    all_files.append({
                        'serial': serial,
                        'filename': f,
                        'size': stats.st_size,
                        'created_at': datetime.fromtimestamp(stats.st_ctime).strftime('%Y-%m-%d %H:%M:%S')
                    })
    all_files.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify(all_files)

from flask import send_from_directory
@app.route('/api/files/<serial>/<filename>')
def serve_pdf(serial, filename):
    app_data = os.path.join(os.getenv('APPDATA', os.path.expanduser('~')), 'ModernMKT')
    customer_dir = os.path.join(app_data, 'customers', serial)
    return send_from_directory(customer_dir, filename)

@app.route('/api/generate-invoice', methods=['POST'])
def generate_invoice():
    data = request.get_json()
    customer_serial = data.get('customer_serial')
    selected_items = data.get('items', []) # List of dicts with id, quantity, price, etc.
    misc_items = data.get('misc_items', [])
    bill_type = data.get('type', 'invoice') # 'invoice', 'quotation', or 'repair'
    
    is_quotation = bill_type == 'quotation'
    is_repair = bill_type == 'repair'
    
    customer = Customer.get_by_serial(customer_serial)
    if not customer:
        return jsonify({'success': False, 'message': 'Customer not found'}), 404
        
    try:
        # Resolve assets
        project_root = os.path.dirname(os.path.abspath(__file__))
        watermark = os.path.join(project_root, 'mktwatermark.png')
        
        # Terms and Conditions
        if is_repair:
            terms_filename = 'Repair Terms and Conditions.docx'
        else:
            terms_filename = 'Terms and Conditions.docx'
        
        terms_path = os.path.join(project_root, terms_filename)
        
        pdf_path = generate_invoice_pdf(
            customer, 
            selected_items, 
            misc_items, 
            is_quotation=is_quotation,
            is_repair=is_repair,
            watermark_image_path=watermark if os.path.exists(watermark) else None,
            terms_path=terms_path if os.path.exists(terms_path) else None
        )
        return jsonify({'success': True, 'pdf_path': pdf_path})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT i.*, m.name as material_name, m.category as material_category
        FROM inventory i
        JOIN materials m ON i.material_id = m.id
    ''')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict_from_row(row) for row in rows])

@app.route('/api/customers', methods=['GET'])
def get_customers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM customers')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict_from_row(row) for row in rows])

@app.route('/api/logs/inventory', methods=['GET'])
def get_inventory_logs():
    logs = InventoryChangeLog.get_all()
    return jsonify([{
        'id': l.id, 'item_id': l.item_id, 'action': l.action, 
        'quantity_before': l.quantity_before, 'quantity_after': l.quantity_after,
        'timestamp': l.timestamp, 'user': l.user, 'note': l.note
    } for l in logs])

@app.route('/api/logs/materials', methods=['GET'])
def get_materials_logs():
    logs = RemovedMaterial.get_all()
    return jsonify([{
        'id': l.id, 'name': l.name, 'properties': l.properties, 'removed_at': l.removed_at
    } for l in logs])

@app.route('/api/system/reset', methods=['POST'])
def system_reset():
    data = request.get_json()
    pin = data.get('pin')
    if pin != 'admin123':  # The default hardcoded admin pin from factory reset
        return jsonify({'success': False, 'message': 'Invalid PIN.'}), 401
        
    try:
        app_data = os.path.join(os.getenv('APPDATA', os.path.expanduser('~')), 'ModernMKT')
        
        # Wipe database
        conn = get_db_connection()
        cursor = conn.cursor()
        tables = ['inventory', 'inventory_change_log', 'materials', 'removed_materials', 'customers']
        for table in tables:
            cursor.execute(f"DELETE FROM {table}")
        conn.commit()
        conn.close()
        
        # Set a flag or re-initialize logic if needed later
        return jsonify({'success': True, 'message': 'System factory reset successful.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/system/backup', methods=['GET'])
def system_backup():
    app_data = os.path.join(os.getenv('APPDATA', os.path.expanduser('~')), 'ModernMKT')
    db_path = os.path.join(app_data, 'mkt_data.db')
    if os.path.exists(db_path):
        return send_from_directory(app_data, 'mkt_data.db', as_attachment=True)
    return jsonify({'success': False, 'message': 'Database not found'}), 404

@app.route('/api/system/restore', methods=['POST'])
def system_restore():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    if file and file.filename.endswith('.db'):
        try:
            app_data = os.path.join(os.getenv('APPDATA', os.path.expanduser('~')), 'ModernMKT')
            db_path = os.path.join(app_data, 'mkt_data.db')
            
            # Backup current just in case
            if os.path.exists(db_path):
                shutil.copy2(db_path, db_path + f".bak_{datetime.now().strftime('%Y%m%d%H%M%S')}")
                
            file.save(db_path)
            return jsonify({'success': True, 'message': 'Database restored successfully. Please restart the application.'})
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500
    return jsonify({'success': False, 'message': 'Invalid file type. Must be a .db file.'}), 400

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    stats = {}
    cursor.execute("SELECT COUNT(*) FROM customers")
    stats['customers'] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM inventory")
    stats['inventory_items'] = cursor.fetchone()[0]
    
    cursor.execute("SELECT SUM(quantity) FROM inventory")
    stats['total_stock'] = cursor.fetchone()[0] or 0
    
    conn.close()
    return jsonify(stats)

@app.route('/')
def home():
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head><title>MKT API Service</title></head>
    <body style="background: #111; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
        <div style="text-align: center;">
            <h1 style="color: #00c6ff;">MKT Service Engine Active</h1>
            <p>API v1.0 running on port 5000</p>
        </div>
    </body>
    </html>
    ''')

if __name__ == '__main__':
    initialize_db()
    app.run(host='0.0.0.0', port=5000)