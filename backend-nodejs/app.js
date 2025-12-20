const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_EMAIL || 'saipraneethjairam@gmail.com',
        pass: process.env.SMTP_PASSWORD || ''  // Gmail App Password
    }
});

// Test SMTP connection
transporter.verify((error, success) => {
    if (error) {
        console.log('SMTP Connection Failed:', error.message);
    } else {
        console.log('SMTP Server Connected Successfully');
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Email Server Running' });
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
    try {
        const { email, subject, body } = req.body;

        if (!email || !subject || !body) {
            return res.status(400).json({
                success: false,
                error: 'Missing email, subject, or body'
            });
        }

        const mailOptions = {
            from: process.env.SMTP_EMAIL || 'saipraneethjairam@gmail.com',
            to: email,
            subject: subject,
            html: body
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email sent to ${email}`);
        console.log(`   Message ID: ${info.messageId}`);

        res.json({
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Feedback submission with auto-email
app.post('/api/feedback', async (req, res) => {
    try {
        const { email, rating, packageDamaged, onTime, feedback } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        let subject, body;

        // Low rating (1-2) - send apology
        if (rating <= 2) {
            subject = "We're Sorry – Let's Make It Right";
            body = `
                <h2>We Sincerely Apologize</h2>
                <p>Dear Valued Customer,</p>
                <p>We're very sorry for the ${rating}-star experience you had with your delivery.</p>
                <p>${packageDamaged === 'Yes' ? '<strong>We understand your package was damaged.</strong>' : ''}</p>
                <p>Your feedback: "${feedback}"</p>
                <p><strong>Our team will contact you within 24 hours to make it right.</strong></p>
                <p>Thank you for giving us a chance to improve.</p>
                <p>Best regards,<br/>The AutoPulse Team</p>
            `;
        }
        // High rating (4-5) - send thank you with coupon
        else if (rating >= 4) {
            subject = "Thank You! Here's a 10% Discount 🎁";
            body = `
                <h2>Thank You!</h2>
                <p>Dear Valued Customer,</p>
                <p>Thank you for your wonderful ${rating}-star rating!</p>
                <p>We're thrilled you had a great experience.</p>
                <p><strong>Use this coupon code for 10% off your next order:</strong></p>
                <h1 style="color: #2563eb; font-size: 32px;">SAVE10</h1>
                <p><em>Valid for 30 days</em></p>
                <p>Thank you for choosing AutoPulse!</p>
                <p>Best regards,<br/>The AutoPulse Team</p>
            `;
        }
        // Medium rating (3) - send neutral
        else {
            subject = "Thank You for Your Feedback";
            body = `
                <h2>Thank You</h2>
                <p>Dear Valued Customer,</p>
                <p>Thank you for taking the time to rate your delivery experience.</p>
                <p>Your feedback helps us improve: "${feedback}"</p>
                <p>We appreciate your business!</p>
                <p>Best regards,<br/>The AutoPulse Team</p>
            `;
        }

        // Send email
        const mailOptions = {
            from: process.env.SMTP_EMAIL || 'saipraneethjairam@gmail.com',
            to: email,
            subject: subject,
            html: body
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ FEEDBACK EMAIL SENT`);
        console.log(`TO: ${email}`);
        console.log(`RATING: ${rating}/5`);
        console.log(`MESSAGE ID: ${info.messageId}`);
        console.log(`${'='.repeat(60)}\n`);

        res.json({
            success: true,
            message: 'Feedback received and email sent',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Error processing feedback:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 AutoPulse Email Server Running`);
    console.log(`📧 SMTP Host: smtp.gmail.com`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🔑 Email: ${process.env.SMTP_EMAIL || 'saipraneethjairam@gmail.com'}`);
    console.log(`${'='.repeat(60)}\n`);
});
