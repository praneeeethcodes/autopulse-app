/**
 * SETUP_INSTRUCTIONS.md - Quick Start Guide
 * Copy these instructions for your team
 */

// ========================================
// QUICK SETUP CHECKLIST
// ========================================

Step 1: Create Google Form
✓ Create form with these questions (in exact order):
  1. Email address (Email type)
  2. How would you rate your delivery? (1-5)
  3. Was the package damaged? (Yes/No)
  4. Was delivery on time? (Yes/No)
  5. Additional feedback (Paragraph)

Step 2: Link to Google Sheets
✓ Form → Responses → Create Spreadsheet
✓ Verify column headers:
  Timestamp | Email | Rating | Package_Damaged | On_Time | Feedback

Step 3: Add Apps Script
✓ Sheet → Extensions → Apps Script
✓ Paste Code.gs content
✓ Update CONFIG emails (lines 37-41)
✓ Save project as "AutoPulse"

Step 4: Create Trigger
✓ Click Clock icon (Triggers)
✓ Add Trigger:
  - Function: onFormSubmit
  - Event source: From spreadsheet
  - Event type: On form submit
✓ Authorize permissions

Step 5: Test
✓ Submit test form response
✓ Check emails sent
✓ Verify Issue_Reports sheet created

// ========================================
// IMPORTANT NOTES FOR TEAMMATES
// ========================================

⚠️ Gmail Limits: 100 emails/day on free accounts
⚠️ First run needs authorization (click "Review Permissions")
⚠️ Column headers MUST match exactly (case-sensitive)
⚠️ Rating must be number 1-5 (not text)

📧 Update these emails in CONFIG (lines 37-41):
   - MANAGER_EMAIL
   - SUPPORT_EMAIL
   - WAREHOUSE_EMAIL

🎁 Customize coupon code: CONFIG.COUPON_CODE (line 42)

// ========================================
// TESTING WITHOUT FORM SUBMISSION
// ========================================

In Apps Script editor:
1. Select function: testAutomation
2. Click Run ▶️
3. Check Execution log for results
4. Check your email inbox

// ========================================
// HACKATHON DEMO TIPS
// ========================================

1. Pre-fill form link for quick demo
2. Open Gmail in separate tab before demo
3. Have Issue_Reports sheet ready to show
4. Explain the "why" (business impact):
   - Faster customer response
   - Automated issue tracking
   - Proactive retention (coupons)
   - Priority-based alerts

5. Show the code structure:
   - Clear configuration at top
   - Modular functions (easy to maintain)
   - Error handling included
   - Extensible (easy to add features)

// ========================================
// COLLABORATION WORKFLOW
// ========================================

If working as a team:
1. One person sets up the main script
2. Share the Google Sheet with teammates (Editor access)
3. Test trigger with your own emails first
4. Use testAutomation() for development
5. Update CONFIG for production emails before demo

GitHub Repo Structure:
autopulse-app/
├── Code.gs              # Main Apps Script
├── README.md            # Full documentation
├── SETUP_INSTRUCTIONS.md # This file
└── .gitignore          # Ignore config

// ========================================
// COMMON ISSUES & FIXES
// ========================================

Problem: "Trigger not firing"
Fix: Delete and recreate trigger, ensure form is linked to sheet

Problem: "Emails not sending"
Fix: Check Gmail quota, verify authorization, check spam folder

Problem: "Invalid rating error"
Fix: Ensure Rating column contains numbers 1-5, not text

Problem: "Script timeout"
Fix: Reduce email body length, check for infinite loops

// ========================================
// EMERGENCY CONTACTS (Update for your team)
// ========================================

Script Owner: [Your Name]
Email: [your-email@example.com]
Phone: [Your Phone]

Backup Contact: [Teammate Name]
Email: [teammate-email@example.com]

// ========================================
