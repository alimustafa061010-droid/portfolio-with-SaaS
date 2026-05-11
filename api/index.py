from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from datetime import datetime
from data.db import get_db_connection, initialize_db, HAS_POSTGRES

app = Flask(__name__)
load_dotenv()
CORS(app)

# Initialize DB
try:
    initialize_db()
except Exception as e:
    print(f"Init error: {e}")

LAST_EMAIL_ERROR = None

def send_enrollment_email(enrollment_data):
    global LAST_EMAIL_ERROR
    """Sends an email notification via Gmail SMTP."""
    sender_email = os.getenv('GMAIL_USER')
    sender_password = os.getenv('GMAIL_APP_PASSWORD')
    receiver_email = os.getenv('RECEIVER_EMAIL') or os.getenv('GMAIL_USER')

    if not sender_email or not sender_password:
        LAST_EMAIL_ERROR = "Credentials not found in environment"
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
        <h2 style="color: #6366f1;">New Enrollment Received!</h2>
        <p>A new student has applied for a course through the website.</p>
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f8fafc;">
                <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Student Name:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">{enrollment_data['name']}</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Email:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">{enrollment_data['email']}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Phone:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">{enrollment_data.get('phone', 'N/A')}</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Course:</td>
                <td style="padding: 12px; color: #6366f1; font-weight: bold; border: 1px solid #e2e8f0;">{enrollment_data['course']}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Message:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">{enrollment_data.get('message', 'N/A')}</td>
            </tr>
        </table>
        <p style="font-size: 11px; color: #64748b; margin-top: 30px; text-align: center;">
            This is an automated notification from your Portfolio Enrollment System.
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
        LAST_EMAIL_ERROR = "None (Success)"
        return True
    except Exception as e:
        LAST_EMAIL_ERROR = str(e)
        print(f"[ERROR] Failed to send enrollment email: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health():
    db_status = "unknown"
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        conn.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"failed: {str(e)}"

    return jsonify({
        'status': 'healthy' if "connected" in db_status else 'degraded',
        'database': db_status,
        'email_setup': {
            'has_user': os.getenv('GMAIL_USER') is not None,
            'has_password': os.getenv('GMAIL_APP_PASSWORD') is not None,
            'receiver': os.getenv('RECEIVER_EMAIL') or os.getenv('GMAIL_USER'),
            'last_error': LAST_EMAIL_ERROR
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/activate', methods=['POST'])
def activate():
    data = request.get_json()
    serial = data.get('serial')
    machine_id = data.get('machine_id')
    
    if not serial or not machine_id:
        return jsonify({'success': False, 'message': 'Missing serial or machine_id'}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        is_postgres = os.environ.get('POSTGRES_URL') or os.environ.get('DATABASE_URL')
        
        # Check if license exists and its status
        q_select = "SELECT machine_id, status, license_type, expiry_date FROM licenses WHERE serial = %s" if is_postgres else "SELECT machine_id, status, license_type, expiry_date FROM licenses WHERE serial = ?"
        cursor.execute(q_select, (serial,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({'success': False, 'message': 'Invalid serial number'}), 404
            
        db_machine_id = row[0]
        db_status = row[1]
        license_type = row[2]
        expiry_date = row[3]
        
        # If already activated on another machine
        if db_machine_id and db_machine_id != machine_id:
            return jsonify({'success': False, 'message': 'License already activated on another device'}), 403
            
        # Activate if not already
        now_str = datetime.now().isoformat()
        if not db_machine_id:
            q_update = "UPDATE licenses SET machine_id = %s, activation_date = %s, status = 'active' WHERE serial = %s" if is_postgres else "UPDATE licenses SET machine_id = ?, activation_date = ?, status = 'active' WHERE serial = ?"
            cursor.execute(q_update, (machine_id, now_str, serial))
            conn.commit()
            
        conn.close()
        return jsonify({
            'success': True, 
            'message': 'Activation successful',
            'license_type': license_type,
            'expiry_date': expiry_date
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/verify', methods=['POST'])
def verify():
    data = request.get_json()
    serial = data.get('serial')
    machine_id = data.get('machine_id')
    
    if not serial or not machine_id:
        return jsonify({'success': False, 'message': 'Missing data'}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        is_postgres = os.environ.get('POSTGRES_URL') or os.environ.get('DATABASE_URL')
        
        q_verify = "SELECT 1 FROM licenses WHERE serial = %s AND machine_id = %s AND status = 'active'" if is_postgres else "SELECT 1 FROM licenses WHERE serial = ? AND machine_id = ? AND status = 'active'"
        cursor.execute(q_verify, (serial, machine_id))
        
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': True, 'message': 'Verification successful'})
        else:
            conn.close()
            return jsonify({'success': False, 'message': 'Invalid or revoked license'}), 403
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Required for Vercel
app = app
