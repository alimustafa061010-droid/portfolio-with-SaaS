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
            This is an automated notification from your Advanced Portfolio Enrollment System.
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
        return True
    except Exception as e:
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
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/enroll', methods=['POST'])
def enroll():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    course = data.get('course')
    phone = data.get('phone')
    message = data.get('message')
    
    if not all([name, email, course]):
        return jsonify({'success': False, 'message': 'Missing data'}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        is_postgres = os.environ.get('POSTGRES_URL') or os.environ.get('DATABASE_URL')
        
        query = "INSERT INTO enrollments (name, email, phone, course, message) VALUES (%s, %s, %s, %s, %s) RETURNING id" if is_postgres else "INSERT INTO enrollments (name, email, phone, course, message) VALUES (?, ?, ?, ?, ?)"
        params = (name, email, phone, course, message)
        
        cursor.execute(query, params)
        if is_postgres:
            enroll_id = cursor.fetchone()[0]
        else:
            enroll_id = cursor.lastrowid
            
        conn.commit()
        conn.close()

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

# Required for Vercel
app = app
