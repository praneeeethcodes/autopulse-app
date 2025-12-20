from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sqlite3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import google.generativeai as genai

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Database setup
DATABASE = 'autopulse.db'

# Email configuration (read from environment variables for safety)
EMAIL_CONFIG = {
    'SMTP_HOST': os.getenv('SMTP_HOST', 'smtp.gmail.com'),
    'SMTP_PORT': int(os.getenv('SMTP_PORT', '587')),
    'EMAIL': os.getenv('SMTP_EMAIL', ''),
    'PASSWORD': os.getenv('SMTP_PASSWORD', ''),
    'MANAGER_EMAIL': os.getenv('MANAGER_EMAIL', 'manager@example.com'),
    'SUPPORT_EMAIL': os.getenv('SUPPORT_EMAIL', 'support@example.com')
}

# Toggle to actually send emails (instead of console print)
SEND_REAL_EMAILS = os.getenv('SEND_REAL_EMAILS', 'false').lower() == 'true'

# Gemini API Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
USE_GEMINI = bool(GEMINI_API_KEY)

if USE_GEMINI:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    gemini_model = None

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
        
        if SEND_REAL_EMAILS and EMAIL_CONFIG['EMAIL'] and EMAIL_CONFIG['PASSWORD']:
            # Real send via SMTP
            server = smtplib.SMTP(EMAIL_CONFIG['SMTP_HOST'], EMAIL_CONFIG['SMTP_PORT'])
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_CONFIG['EMAIL'], EMAIL_CONFIG['PASSWORD'])
            server.send_message(msg)
            server.quit()
            print(f"[EMAIL SENT] to={to_email} subject={subject}")
        else:
            # Development mode: print email contents to console
            print(f"\n{'='*60}")
            print("EMAIL (DRY RUN) — not actually sent")
            print(f"TO: {to_email}")
            print(f"SUBJECT: {subject}")
            print(f"BODY:\n{body}")
            print(f"{'='*60}\n")
        
        return True
    except Exception as e:
        print(f"Email error: {str(e)}")
        return False

def generate_email_with_gemini(email_type, context):
    """Generate email content using Gemini AI"""
    if not USE_GEMINI or not gemini_model:
        return None
    
    try:
        prompts = {
            'apology': f"""Write a sincere, professional apology email for a customer who gave a {context['rating']}-star delivery rating.
            
Context:
- Package damaged: {context['package_damaged']}
- On time: {context['on_time']}
- Customer feedback: "{context['feedback']}"

Requirements:
- Warm, empathetic tone
- Acknowledge the specific issues
- Promise action within 24 hours
- Keep it concise (under 150 words)
- Sign as "The AutoPulse Team"
            
Generate only the email body, no subject line.""",
            
            'thankyou': f"""Write a cheerful thank-you email for a customer who gave a {context['rating']}-star delivery rating.

Context:
- Customer feedback: "{context['feedback']}"

Requirements:
- Enthusiastic but professional tone
- Thank them for the high rating
- Include this exact coupon code: SAVE10 (10% off next purchase)
- Mention coupon is valid for 30 days
- Keep it under 100 words
- Sign as "The AutoPulse Team"

Generate only the email body, no subject line.""",
            
            'manager_alert': f"""Write a concise alert email for a logistics manager about a customer issue.

Context:
- Customer email: {context['email']}
- Rating: {context['rating']}/5
- Package damaged: {context['package_damaged']}
- On time: {context['on_time']}
- Customer feedback: "{context['feedback']}"

Requirements:
- Professional, urgent tone
- Bullet-point format
- Clear action required: contact customer within 24 hours
- Under 100 words

Generate only the email body, no subject line.""",
            
            'damage_alert': f"""Write a critical alert email for warehouse/support team about a damaged package.

Context:
- Customer email: {context['email']}
- Rating: {context['rating']}/5
- Customer feedback: "{context['feedback']}"

Requirements:
- Urgent, action-oriented tone
- Suggest: Replacement or Refund
- Request immediate coordination with logistics manager
- Under 80 words

Generate only the email body, no subject line."""
        }
        
        if email_type not in prompts:
            return None
        
        response = gemini_model.generate_content(prompts[email_type])
        return response.text.strip() if response and response.text else None
        
    except Exception as e:
        print(f"Gemini generation error: {str(e)}")
        return None

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
    
    # Prepare context for Gemini
    context = {
        'email': email,
        'rating': rating,
        'package_damaged': package_damaged,
        'on_time': on_time,
        'feedback': feedback_text,
        'timestamp': timestamp
    }
    
    # Scenario 1: Low Rating (1-2)
    if rating <= 2:
        # Generate apology email with Gemini (fallback to template if Gemini unavailable)
        subject = "We're Sorry – Let's Make It Right"
        gemini_body = generate_email_with_gemini('apology', context)
        
        if gemini_body:
            body = gemini_body
        else:
            # Fallback template
            body = f"""Dear Valued Customer,

We sincerely apologize for the experience you had with your recent delivery.

Your {rating}-star rating is extremely important to us, and we understand we fell short of your expectations.

{f"We're especially concerned that your package was damaged." if package_damaged == "Yes" else ""}

Our team is reviewing your case immediately, and a customer service representative will contact you within 24 hours.

Your feedback: "{feedback_text}"

We value your business and hope to regain your trust.

Best regards,
The AutoPulse Team"""
        
        send_email(email, subject, body)
        
        # Generate manager alert with Gemini
        manager_subject = f"🚨 ALERT: Low Rating ({rating}/5) - Immediate Action Required"
        gemini_manager = generate_email_with_gemini('manager_alert', context)
        
        if gemini_manager:
            manager_body = gemini_manager
        else:
            # Fallback template
            manager_body = f"""LOGISTICS MANAGER ALERT

Customer Email: {email}
Rating: {rating}/5
Package Damaged: {package_damaged}
On Time: {on_time}
Timestamp: {timestamp}

Customer Feedback:
"{feedback_text}"

ACTION REQUIRED: Contact customer within 24 hours."""
        
        send_email(EMAIL_CONFIG['MANAGER_EMAIL'], manager_subject, manager_body)
        
        # Log issue
        priority = "Critical" if package_damaged == "Yes" else "High"
        log_issue(timestamp, email, rating, "Low Rating", priority, "Open", 
                 f"Feedback: {feedback_text}")
    
    # Scenario 2: Damaged Package
    if package_damaged == "Yes":
        # Generate damage alert with Gemini
        subject = "🔴 CRITICAL: Damaged Package Report"
        gemini_damage = generate_email_with_gemini('damage_alert', context)
        
        if gemini_damage:
            body = gemini_damage
        else:
            # Fallback template
            body = f"""WAREHOUSE/SUPPORT TEAM ALERT

CRITICAL ISSUE: Customer reported damaged package

Customer Email: {email}
Rating: {rating}/5
Timestamp: {timestamp}

Customer Feedback: "{feedback_text}"

SUGGESTED ACTION: Replacement or Refund

Please coordinate with logistics manager and contact customer immediately."""
        
        send_email(EMAIL_CONFIG['SUPPORT_EMAIL'], subject, body)
        
        # Log critical issue
        log_issue(timestamp, email, rating, "Package Damaged", "Critical", "Open",
                 f"Suggested action: Replacement or Refund. Feedback: {feedback_text}")
    
    # Scenario 3: High Rating (4-5)
    if rating >= 4:
        # Generate thank you email with Gemini
        subject = "Thank You! 🎉 Here's a Special Offer"
        gemini_thanks = generate_email_with_gemini('thankyou', context)
        
        if gemini_thanks:
            body = gemini_thanks
        else:
            # Fallback template
            body = f"""Dear Valued Customer,

Thank you for your amazing {rating}-star rating! 🌟

We're thrilled that you had a great delivery experience with AutoPulse.

{"We're glad your package arrived on time!" if on_time == "Yes" else ""}

Your kind words mean so much to us: "{feedback_text}"

As a token of our appreciation, here's an exclusive discount code for your next order:

🎁 COUPON CODE: AUTOPULSE{rating}STAR
💰 10% OFF your next purchase

(Valid for 30 days)

Thank you for choosing AutoPulse!

Best regards,
The AutoPulse Team"""
        
        send_email(email, subject, body)


# API Routes

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
    print(f"📧 Email Mode: {'REAL SEND' if SEND_REAL_EMAILS else 'DEVELOPMENT (console only)'}")
    print("\nTo enable real email sending (Gmail):")
    print("1) Set environment variables SMTP_EMAIL, SMTP_PASSWORD (App Password), MANAGER_EMAIL, SUPPORT_EMAIL")
    print("2) Set SEND_REAL_EMAILS=true")
    print("="*60 + "\n")
    app.run(debug=True, port=5000)
