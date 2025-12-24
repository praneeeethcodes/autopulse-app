const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --------------------
// File Storage Setup
// --------------------
const DATA_DIR = path.join(__dirname, 'data');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const ISSUES_FILE = path.join(DATA_DIR, 'issues.json');

function ensureFiles() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
    if (!fs.existsSync(FEEDBACK_FILE)) fs.writeFileSync(FEEDBACK_FILE, '[]');
    if (!fs.existsSync(ISSUES_FILE)) fs.writeFileSync(ISSUES_FILE, '[]');
}

function readJSON(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
        return [];
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

ensureFiles();

// --------------------
// SMTP (Safe Mode)
// --------------------
const transporter =
    process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD
        ? nodemailer.createTransport({
              host: 'smtp.gmail.com',
              port: 587,
              secure: false,
              auth: {
                  user: process.env.SMTP_EMAIL,
                  pass: process.env.SMTP_PASSWORD
              }
          })
        : null;

if (transporter) {
    transporter.verify(err => {
        if (err) {
            console.error('⚠️ SMTP verification failed:', err.message);
        } else {
            console.log('✅ SMTP ready');
        }
    });
} else {
    console.log('⚠️ SMTP disabled (no credentials)');
}

// --------------------
// Health
// --------------------
app.get('/api/health', (_, res) => {
    res.json({ status: 'OK', email: !!transporter });
});

// --------------------
// Read APIs
// --------------------
app.get('/api/feedback', (_, res) => {
    res.json(readJSON(FEEDBACK_FILE));
});

app.get('/api/issues', (_, res) => {
    res.json(readJSON(ISSUES_FILE));
});

app.get('/api/stats', (_, res) => {
    const feedback = readJSON(FEEDBACK_FILE);
    const issues = readJSON(ISSUES_FILE);

    const total = feedback.length;
    const avg =
        total > 0
            ? feedback.reduce((s, f) => s + (Number(f.rating) || 0), 0) / total
            : 0;

    res.json({
        total_feedback: total,
        avg_rating: Number(avg.toFixed(2)),
        critical_issues: issues.filter(i => i.priority === 'Critical').length,
        high_priority: issues.filter(i => i.priority === 'High').length
    });
});

// --------------------
// Feedback API (CORE FIX)
// --------------------
app.post('/api/feedback', (req, res) => {
    try {
        const { email, rating, packageDamaged, onTime, feedback } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email required' });
        }

        const record = {
            timestamp: new Date().toISOString(),
            email,
            rating: Number(rating) || 0,
            package_damaged:
                String(packageDamaged).toLowerCase() === 'yes' ? 'Yes' : 'No',
            on_time: String(onTime).toLowerCase() === 'yes' ? 'Yes' : 'No',
            feedback: feedback || ''
        };

        // Save feedback
        const feedbackList = readJSON(FEEDBACK_FILE);
        feedbackList.push(record);
        writeJSON(FEEDBACK_FILE, feedbackList);

        // Issue detection
        const issues = readJSON(ISSUES_FILE);

        if (record.rating <= 2) {
            issues.push({
                timestamp: record.timestamp,
                email: record.email,
                rating: record.rating,
                issue_type: 'Low Rating',
                priority:
                    record.package_damaged === 'Yes' ? 'Critical' : 'High',
                status: 'Open',
                notes: record.feedback
            });
        }

        if (record.package_damaged === 'Yes') {
            issues.push({
                timestamp: record.timestamp,
                email: record.email,
                rating: record.rating,
                issue_type: 'Package Damaged',
                priority: 'Critical',
                status: 'Open',
                notes: record.feedback
            });
        }

        writeJSON(ISSUES_FILE, issues);

        // Respond immediately (EMAIL DECOUPLED)
        res.json({
            success: true,
            message: 'Feedback saved successfully'
        });

        // --------------------
        // Async Email (Non-blocking)
        // --------------------
        if (!transporter) return;

        let subject = 'Thank you for your feedback';
        let body = `<p>Thanks for rating us ${record.rating}/5</p>`;

        if (record.rating <= 2) {
            subject = "We're Sorry – Let's Fix This";
            body = `<p>We noticed your low rating and will reach out shortly.</p>`;
        } else if (record.rating >= 4) {
            subject = 'Thank You! 🎁 SAVE10';
            body = `<h2>SAVE10</h2><p>10% off your next order</p>`;
        }

        transporter
            .sendMail({
                from: process.env.SMTP_EMAIL,
                to: email,
                subject,
                html: body
            })
            .then(info =>
                console.log('📧 Email sent:', info.messageId)
            )
            .catch(err =>
                console.error('⚠️ Email failed:', err.message)
            );
    } catch (err) {
        console.error('❌ Feedback error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// --------------------
// Server Start
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 AutoPulse Backend Running');
    console.log(`🌐 http://localhost:${PORT}`);
    console.log('='.repeat(60));
});
