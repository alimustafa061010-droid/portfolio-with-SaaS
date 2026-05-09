from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from datetime import datetime
from data.db import get_db_connection, initialize_db

app = Flask(__name__)
load_dotenv()
CORS(app)

# Initialize DB on startup (this works fine in serverless if Postgres is used)
try:
    initialize_db()
except Exception as e:
    print(f"Error initializing DB: {e}")

class Enrollment:
    @staticmethod
    def create(name, email, course, phone=None, message=None):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Determine if we are using Postgres or SQLite for the query syntax
        is_postgres = os.environ.get('POSTGRES_URL') is not None
        
        query = '''
            INSERT INTO enrollments (name, email, phone, course, message)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
        ''' if is_postgres else '''
            INSERT INTO enrollments (name, email, phone, course, message)
            VALUES (?, ?, ?, ?, ?)
        '''
        
        params = (name, email, phone, course, message)
        
        if is_postgres:
            cursor.execute(query, params)
            enroll_id = cursor.fetchone()[0]
        else:
            cursor.execute(query, params)
            enroll_id = cursor.lastrowid
            
        conn.commit()
        conn.close()
        return enroll_id

def send_enrollment_email(enrollment_data):
    """Sends an email notification via Gmail SMTP."""
    sender_email = os.getenv('GMAIL_USER')
    sender_password = os.getenv('GMAIL_APP_PASSWORD')
    receiver_email = os.getenv('GMAIL_USER')

    if not sender_email or not sender_password:
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
    </body>
    </html>
    """

    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message.as_string())
        return True
    except Exception as e:
        print(f"Email error: {e}")
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
        return jsonify({'success': False, 'message': 'Required fields missing'}), 400
        
    try:
        enroll_id = Enrollment.create(name, email, course, phone, message)
        send_enrollment_email(data)
        return jsonify({'success': True, 'id': enroll_id})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    db_status = "unknown"
    db_error = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        conn.close()
        db_status = "connected"
    except Exception as e:
        db_status = "failed"
        db_error = str(e)

    return jsonify({
        'status': 'healthy' if db_status == "connected" else 'degraded',
        'database': {
            'status': db_status,
            'error': db_error,
            'type': 'postgres' if os.environ.get('POSTGRES_URL') else 'sqlite'
        },
        'environment': 'vercel' if os.environ.get('VERCEL') else 'local',
        'timestamp': datetime.now().isoformat()
    })

# This is required for Vercel
app = app
