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
    
    if not all([name, email, course]):
        return jsonify({'success': False, 'message': 'Missing data'}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        is_postgres = os.environ.get('POSTGRES_URL') is not None
        
        query = "INSERT INTO enrollments (name, email, phone, course, message) VALUES (%s, %s, %s, %s, %s) RETURNING id" if is_postgres else "INSERT INTO enrollments (name, email, phone, course, message) VALUES (?, ?, ?, ?, ?)"
        params = (name, email, data.get('phone'), course, data.get('message'))
        
        if is_postgres:
            cursor.execute(query, params)
            enroll_id = cursor.fetchone()[0]
        else:
            cursor.execute(query, params)
            enroll_id = cursor.lastrowid
            
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': enroll_id})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Required for Vercel
app = app
