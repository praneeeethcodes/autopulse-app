from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sqlite3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Database setup
DATABASE = 'autopulse.db'

# Email configuration (update with your SMTP details)
EMAIL_CONFIG = {
    'SMTP_HOST': 'smtp.gmail.com',  # Change for your email provider
    'SMTP_PORT': 587,
    'EMAIL': 'your-email@gmail.com',  # Change this
    'PASSWORD': 'your-app-password',  # Use App Password for Gmail
    'MANAGER_EMAIL': 'manager@example.com',
    'SUPPORT_EMAIL': 'support@example.com'
}

# Initialize database
def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create feedback table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            email TEXT NOT NULL,
            rating INTEGER NOT NULL,
            package_damaged TEXT NOT NULL,
            on_time TEXT NOT NULL,
            feedback TEXT
        )
    ''')
    
    # Create issues table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            email TEXT NOT NULL,
            rating INTEGER NOT NULL,
            issue_type TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✓ Database initialized successfully")

# Helper function to get database connection
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Email sending function
def send_email(to_email, subject, body):
    """Send email using SMTP"""
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_CONFIG['EMAIL']
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        # For development/testing, print instead of sending
        print(f"\n{'='*60}")
        print(f"EMAIL SENT TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"BODY:\n{body}")
        print(f"{'='*60}\n")
        
        # Uncomment below to actually send emails
        """
        server = smtplib.SMTP(EMAIL_CONFIG['SMTP_HOST'], EMAIL_CONFIG['SMTP_PORT'])
        server.starttls()
        server.login(EMAIL_CONFIG['EMAIL'], EMAIL_CONFIG['PASSWORD'])
        server.send_message(msg)
        server.quit()
        """
        
        return True
    except Exception as e:
        print(f"Email error: {str(e)}")
        return False

# Routes

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """Handle new feedback submission"""
    try:
        data = request.json
        timestamp = datetime.now().isoformat()
        
        # Validate data
        required_fields = ['email', 'rating', 'packageDamaged', 'onTime']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        email = data['email']
        rating = int(data['rating'])
        package_damaged = data['packageDamaged']
        on_time = data['onTime']
        feedback_text = data.get('feedback', '')
        
        # Store feedback in database
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO feedback (timestamp, email, rating, package_damaged, on_time, feedback)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (timestamp, email, rating, package_damaged, on_time, feedback_text))
        conn.commit()
        conn.close()
        
        # Process feedback logic
        process_feedback(timestamp, email, rating, package_damaged, on_time, feedback_text)
        
        return jsonify({
            'success': True,
            'message': 'Feedback submitted successfully'
        }), 201
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def process_feedback(timestamp, email, rating, package_damaged, on_time, feedback_text):
    """Process feedback and trigger actions"""
    
    # Scenario 1: Low Rating (1-2)
    if rating <= 2:
        # Send apology email to customer
        subject = "We're Sorry – Let's Make It Right"
        body = f"""
Dear Valued Customer,

We sincerely apologize for the experience you had with your recent delivery.

Your {rating}-star rating is extremely important to us, and we understand we fell short of your expectations.

{f"We're especially concerned that your package was damaged." if package_damaged == "Yes" else ""}

Our team is reviewing your case immediately, and a customer service representative will contact you within 24 hours.

Your feedback: "{feedback_text}"

We value your business and hope to regain your trust.

Best regards,
The AutoPulse Team
        """
        send_email(email, subject, body)
        
        # Alert manager
        manager_subject = f"🚨 ALERT: Low Rating ({rating}/5) - Immediate Action Required"
        manager_body = f"""
LOGISTICS MANAGER ALERT

Customer Email: {email}
Rating: {rating}/5
Package Damaged: {package_damaged}
On Time: {on_time}
Timestamp: {timestamp}

Customer Feedback:
"{feedback_text}"

ACTION REQUIRED: Contact customer within 24 hours.
        """
        send_email(EMAIL_CONFIG['MANAGER_EMAIL'], manager_subject, manager_body)
        
        # Log issue
        priority = "Critical" if package_damaged == "Yes" else "High"
        log_issue(timestamp, email, rating, "Low Rating", priority, "Open", 
                 f"Feedback: {feedback_text}")
    
    # Scenario 2: Damaged Package
    if package_damaged == "Yes":
        # Send damage alert
        subject = "🔴 CRITICAL: Damaged Package Report"
        body = f"""
WAREHOUSE/SUPPORT TEAM ALERT

CRITICAL ISSUE: Customer reported damaged package

Customer Email: {email}
Rating: {rating}/5
Timestamp: {timestamp}

Customer Feedback: "{feedback_text}"

SUGGESTED ACTION: Replacement or Refund

Please coordinate with logistics manager and contact customer immediately.
        """
        send_email(EMAIL_CONFIG['SUPPORT_EMAIL'], subject, body)
        
        # Log critical issue
        log_issue(timestamp, email, rating, "Package Damaged", "Critical", "Open",
                 f"Suggested action: Replacement or Refund. Feedback: {feedback_text}")
    
    # Scenario 3: High Rating (4-5)
    if rating >= 4:
        subject = "Thank You! 🎉 Here's a Special Offer"
        body = f"""
Dear Valued Customer,

Thank you so much for your {rating}-star rating! We're thrilled that you had a great delivery experience.

As a token of our appreciation, here's an exclusive coupon code for your next order:

🎁 Coupon Code: SAVE10
💰 Discount: 10% off your next purchase

{f'Your comment: "{feedback_text}"' if feedback_text else ''}

We look forward to serving you again soon!

Best regards,
The AutoPulse Team

---
Coupon valid for 30 days
        """
        send_email(email, subject, body)

def log_issue(timestamp, email, rating, issue_type, priority, status, notes):
    """Log an issue in the database"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO issues (timestamp, email, rating, issue_type, priority, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (timestamp, email, rating, issue_type, priority, status, notes))
    conn.commit()
    conn.close()

@app.route('/api/feedback', methods=['GET'])
def get_feedback():
    """Get all feedback"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM feedback ORDER BY timestamp DESC')
        feedback = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(feedback)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/issues', methods=['GET'])
def get_issues():
    """Get all issues"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM issues ORDER BY timestamp DESC')
        issues = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(issues)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dashboard statistics"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Total feedback
        cursor.execute('SELECT COUNT(*) as count FROM feedback')
        total_feedback = cursor.fetchone()['count']
        
        # Average rating
        cursor.execute('SELECT AVG(rating) as avg FROM feedback')
        avg_rating = cursor.fetchone()['avg'] or 0
        
        # Critical issues
        cursor.execute('SELECT COUNT(*) as count FROM issues WHERE priority = "Critical"')
        critical_issues = cursor.fetchone()['count']
        
        # High priority issues
        cursor.execute('SELECT COUNT(*) as count FROM issues WHERE priority = "High"')
        high_priority = cursor.fetchone()['count']
        
        conn.close()
        
        return jsonify({
            'total_feedback': total_feedback,
            'avg_rating': round(avg_rating, 1),
            'critical_issues': critical_issues,
            'high_priority': high_priority
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'OK', 'message': 'AutoPulse API is running'})

if __name__ == '__main__':
    init_db()
    print("\n" + "="*60)
    print("🚀 AutoPulse Backend Server Starting...")
    print("="*60)
    print("📡 API running at: http://localhost:5000")
    print("📊 Database: autopulse.db")
    print("📧 Email Mode: DEVELOPMENT (emails printed to console)")
    print("\nTo enable real email sending:")
    print("1. Update EMAIL_CONFIG in app.py")
    print("2. Uncomment email sending code in send_email()")
    print("="*60 + "\n")
    app.run(debug=True, port=5000)
