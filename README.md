# AutoPulse – Smart Delivery Feedback Automation 📦✨

> An intelligent Google Apps Script automation that processes delivery feedback in real-time and takes action based on customer ratings and delivery status.

---

## 🎯 Project Overview

**AutoPulse** automatically monitors Google Form submissions for delivery feedback and:
- 🚨 Alerts managers when ratings are low
- ✉️ Sends apology emails for poor experiences
- 🎁 Rewards happy customers with discount codes
- 📊 Tracks issues in a dedicated Issue_Reports sheet
- 🔴 Flags damaged packages as Critical priority

Perfect for hackathons, logistics companies, e-commerce platforms, and customer success teams!

---

## 🏗️ Architecture

```
Google Form (Feedback)
        ↓
Google Sheets (Form Responses)
        ↓
Apps Script Trigger (onFormSubmit)
        ↓
    [Decision Logic]
        ↓
   ┌────┴────┬──────────┬──────────┐
   ↓         ↓          ↓          ↓
 Email    Email      Alert      Issue
Customer Manager   Support    Tracking
```

---

## 📋 Prerequisites

1. **Google Account** with access to:
   - Google Forms
   - Google Sheets
   - Gmail (for sending emails)

2. **Google Form** with these questions (in order):
   - Email (email type)
   - Rating (1-5, linear scale or number)
   - Package Damaged? (Yes/No, multiple choice)
   - On Time? (Yes/No, multiple choice)
   - Feedback (paragraph text)

3. **Google Sheet** linked to the form with column headers:
   ```
   Timestamp | Email | Rating | Package_Damaged | On_Time | Feedback
   ```

---

## 🚀 Setup Instructions

### Step 1: Create Your Google Form & Sheet

1. Create a Google Form with the required questions (see Prerequisites)
2. Link it to a Google Sheet (Responses → Create Spreadsheet)
3. Ensure column headers match exactly: `Timestamp`, `Email`, `Rating`, `Package_Damaged`, `On_Time`, `Feedback`

### Step 2: Add the Apps Script Code

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete any default code in `Code.gs`
4. Copy and paste the entire contents of `Code.gs` from this repo
5. Click the **Save** icon (💾)
6. Rename the project to "AutoPulse" (click "Untitled project" at the top)

### Step 3: Configure Email Addresses

In the `Code.gs` file, update the `CONFIG` object with your actual email addresses:

```javascript
const CONFIG = {
  MANAGER_EMAIL: "yourmanager@example.com",     // Change this
  SUPPORT_EMAIL: "yoursupport@example.com",      // Change this
  WAREHOUSE_EMAIL: "yourwarehouse@example.com",  // Change this
  COUPON_CODE: "SAVE10",
  ISSUE_SHEET_NAME: "Issue_Reports",
  LOW_RATING_THRESHOLD: 2,
  HIGH_RATING_THRESHOLD: 4
};
```

### Step 4: Set Up the Form Submit Trigger

1. In Apps Script, click the **Clock icon** ⏰ (Triggers) in the left sidebar
2. Click **+ Add Trigger** (bottom right)
3. Configure the trigger:
   - **Choose function:** `onFormSubmit`
   - **Event source:** From spreadsheet
   - **Event type:** On form submit
4. Click **Save**
5. **Authorize the script:**
   - Google will ask for permissions
   - Review permissions carefully
   - Click **Allow**

### Step 5: Test the Automation

**Option 1: Submit a Test Form**
1. Fill out your Google Form with test data
2. Check your email and the Issue_Reports sheet

**Option 2: Use Built-in Test Functions**
1. In Apps Script, select `testAutomation` from the function dropdown
2. Click **Run** ▶️
3. Check the **Execution log** (View → Logs)

---

## 🧠 Decision Logic

### Scenario 1: Low Rating (1-2 stars)
```
IF Rating ≤ 2:
  ✉️ Send apology email to customer
  🚨 Alert logistics manager
  📝 Log issue in Issue_Reports (Priority: High)
```

### Scenario 2: Damaged Package
```
IF Package_Damaged == "Yes":
  🔴 Mark Priority as "Critical"
  📧 Alert warehouse & support teams
  💡 Add note: "Suggested action: Replacement or Refund"
```

### Scenario 3: High Rating (4-5 stars)
```
IF Rating ≥ 4:
  🎉 Send thank-you email to customer
  🎁 Include discount coupon code (SAVE10)
```

---

## 📊 Issue_Reports Sheet

The script automatically creates this sheet with the following columns:

| Column      | Description                                    |
|-------------|------------------------------------------------|
| Timestamp   | When the issue occurred                        |
| Email       | Customer email                                 |
| Rating      | Customer rating (1-5)                          |
| Issue_Type  | "Low Rating" or "Package Damaged"              |
| Priority    | "Critical" (damaged) or "High" (low rating)    |
| Status      | "Open" (new issues)                            |
| Notes       | Suggested actions and customer feedback        |

**Color Coding:**
- 🔴 Critical = Red background
- 🟠 High = Orange background

---

## 📧 Email Templates

### Apology Email (Low Rating)
- **Subject:** "We're Sorry – Let's Make It Right"
- **Content:** Sincere apology, acknowledgment of feedback, promise to contact within 24 hours

### Thank You Email (High Rating)
- **Subject:** "Thank You! 🎉 Here's a Special Offer"
- **Content:** Gratitude message + `SAVE10` coupon code

### Manager Alert
- **Subject:** "🚨 ALERT: [Issue Type] – Immediate Attention Required"
- **Content:** Full customer details and feedback for quick action

### Damage Alert
- **Subject:** "🔴 CRITICAL: Damaged Package Report"
- **Content:** Sent to both warehouse and support teams with suggested action

---

## 🛠️ Customization Options

### Change Rating Thresholds
```javascript
const CONFIG = {
  LOW_RATING_THRESHOLD: 3,  // Send apology for ratings ≤ 3
  HIGH_RATING_THRESHOLD: 5   // Only send coupons for perfect 5-star ratings
};
```

### Add More Email Recipients
```javascript
// In sendManagerAlert function, add:
GmailApp.sendEmail("ceo@example.com", subject, body);
```

### Customize Coupon Codes
```javascript
const CONFIG = {
  COUPON_CODE: "HOLIDAY20",  // 20% holiday discount
};
```

### Add SMS Notifications (Twilio Integration)
Use `UrlFetchApp` to call Twilio API for critical alerts.

---

## 🧪 Testing Guide

### Test Low Rating Scenario
1. Submit form with Rating = 1-2
2. Verify:
   - ✅ Apology email sent to customer
   - ✅ Alert email sent to manager
   - ✅ Issue logged in Issue_Reports sheet

### Test Damaged Package Scenario
1. Submit form with Package_Damaged = "Yes"
2. Verify:
   - ✅ Alert sent to warehouse team
   - ✅ Priority marked as "Critical"
   - ✅ Notes include "Replacement or Refund"

### Test High Rating Scenario
1. Submit form with Rating = 4-5
2. Verify:
   - ✅ Thank you email sent with coupon code

### Use Built-in Test Functions
```javascript
// In Apps Script editor:
testAutomation()    // Tests low rating + damage
testHighRating()    // Tests high rating scenario
```

---

## 🐛 Troubleshooting

### Emails Not Sending
- **Check Gmail quota:** Free accounts = 100 emails/day
- **Verify authorization:** Re-run trigger setup
- **Check spam folder:** Emails might be filtered

### Trigger Not Firing
- **Re-create trigger:** Delete and add again
- **Check form-sheet link:** Ensure form responses go to the correct sheet
- **Test manually:** Use `testAutomation()` function

### Invalid Data Errors
- **Check column order:** Must match exactly (Timestamp, Email, Rating, etc.)
- **Verify rating format:** Must be a number 1-5
- **Email validation:** Ensure email field contains "@"

### Script Timeout
- **Reduce complexity:** If processing >50 responses, batch operations
- **Optimize email sending:** Limit email body length

---

## 📈 Future Enhancements

- [ ] **Sentiment Analysis:** Use Google Cloud Natural Language API to analyze feedback text
- [ ] **Dashboard:** Create real-time charts showing rating trends
- [ ] **Auto-Close Issues:** Mark issues as "Resolved" after 7 days
- [ ] **SMS Alerts:** Integrate Twilio for critical damage reports
- [ ] **Slack Integration:** Post alerts to Slack channels
- [ ] **Machine Learning:** Predict delivery issues based on historical data
- [ ] **Multi-language Support:** Send emails in customer's preferred language

---

## 🎤 Hackathon Presentation Tips

### Key Talking Points
1. **Problem Statement:** Manual feedback processing is slow and error-prone
2. **Solution:** Automated, intelligent response system using Google Apps Script
3. **Impact:** 
   - ⚡ Instant response to customer issues (vs. hours/days)
   - 🎯 Prioritizes critical problems (damaged packages)
   - 💰 Increases customer retention with proactive service
4. **Demo:** Live form submission → show emails + Issue_Reports sheet update
5. **Scalability:** Can handle unlimited form responses (within Gmail quota)

### Live Demo Script
1. Show the Google Form interface
2. Submit a low-rating response (Rating = 1, Package_Damaged = Yes)
3. Switch to Gmail → show apology email and manager alert
4. Open Issue_Reports sheet → show new row with Critical priority
5. Submit a high-rating response (Rating = 5)
6. Show thank-you email with coupon code

---

## 📜 License

MIT License - Feel free to use this for your hackathon, personal projects, or commercial applications!

---

## 👥 Contributing

This project was built for hackathons and learning. Contributions are welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📞 Support

Questions? Issues? Suggestions?
- Open an issue on GitHub
- Check the troubleshooting section above
- Review Google Apps Script documentation

---

## 🏆 Credits

**Project:** AutoPulse – Smart Delivery Feedback Automation  
**Tech Stack:** Google Forms, Google Sheets, Google Apps Script, Gmail API  
**Built for:** Hackathons, Logistics Automation, Customer Success Teams  

---

**⭐ Star this repo if it helped you win your hackathon!**
