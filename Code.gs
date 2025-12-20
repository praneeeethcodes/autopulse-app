/**
 * ========================================
 * AutoPulse – Smart Delivery Feedback Automation
 * ========================================
 * 
 * PURPOSE: Automatically process delivery feedback from Google Forms
 * and take actions based on customer ratings and delivery status.
 * 
 * AUTHOR: Your Team Name
 * DATE: December 2025
 * HACKATHON: [Your Hackathon Name]
 * 
 * ========================================
 * SHEET STRUCTURE
 * ========================================
 * Form Responses Sheet Columns (Row 1):
 * - Timestamp
 * - Email
 * - Rating (1-5)
 * - Package_Damaged (Yes/No)
 * - On_Time (Yes/No)
 * - Feedback (text)
 * 
 * ========================================
 * HOW TO SET UP THE TRIGGER
 * ========================================
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Paste this code
 * 4. Click the clock icon (Triggers) in the left sidebar
 * 5. Click "+ Add Trigger" (bottom right)
 * 6. Configure:
 *    - Choose function: onFormSubmit
 *    - Event source: From spreadsheet
 *    - Event type: On form submit
 * 7. Save and authorize the script
 * 
 * ========================================
 */

// ========================================
// CONFIGURATION CONSTANTS
// ========================================

const CONFIG = {
  MANAGER_EMAIL: "manager@example.com",
  SUPPORT_EMAIL: "support@example.com",
  WAREHOUSE_EMAIL: "warehouse@example.com",
  COUPON_CODE: "SAVE10",
  ISSUE_SHEET_NAME: "Issue_Reports",
  LOW_RATING_THRESHOLD: 2,
  HIGH_RATING_THRESHOLD: 4
};

// ========================================
// MAIN TRIGGER FUNCTION
// ========================================

/**
 * Main function that runs automatically when a form is submitted
 * This is the entry point for all automation logic
 * 
 * @param {Object} e - Event object from form submission trigger
 */
function onFormSubmit(e) {
  try {
    Logger.log("=== AutoPulse: New form submission received ===");
    
    // Get the response data
    const sheet = e.range.getSheet();
    const row = e.range.getRow();
    
    // Read the latest response data
    const data = readFormResponse(sheet, row);
    
    // Validate the data
    if (!validateData(data)) {
      Logger.log("Invalid data received. Skipping processing.");
      return;
    }
    
    Logger.log("Processing feedback from: " + data.email);
    Logger.log("Rating: " + data.rating);
    
    // ========================================
    // DECISION LOGIC STARTS HERE
    // ========================================
    
    // SCENARIO 1: Low Rating (1-2) - Critical Issue
    if (data.rating <= CONFIG.LOW_RATING_THRESHOLD) {
      handleLowRating(data);
    }
    
    // SCENARIO 2: Package Damaged - Critical Priority
    if (data.packageDamaged === "Yes") {
      handleDamagedPackage(data);
    }
    
    // SCENARIO 3: High Rating (4-5) - Send Thank You
    if (data.rating >= CONFIG.HIGH_RATING_THRESHOLD) {
      handleHighRating(data);
    }
    
    Logger.log("=== AutoPulse: Processing complete ===");
    
  } catch (error) {
    Logger.log("ERROR in onFormSubmit: " + error.message);
    // Optionally send error alert to admin
    sendErrorAlert(error);
  }
}

// ========================================
// DATA READING & VALIDATION
// ========================================

/**
 * Read form response data from the sheet
 * 
 * @param {Sheet} sheet - The active sheet
 * @param {number} row - Row number of the response
 * @return {Object} Structured data object
 */
function readFormResponse(sheet, row) {
  const values = sheet.getRange(row, 1, 1, 6).getValues()[0];
  
  return {
    timestamp: values[0],
    email: String(values[1]).trim(),
    rating: parseInt(values[2]),
    packageDamaged: String(values[3]).trim(),
    onTime: String(values[4]).trim(),
    feedback: String(values[5]).trim()
  };
}

/**
 * Validate form response data
 * 
 * @param {Object} data - Form response data
 * @return {boolean} True if data is valid
 */
function validateData(data) {
  // Check if email is valid
  if (!data.email || !data.email.includes("@")) {
    Logger.log("Invalid email: " + data.email);
    return false;
  }
  
  // Check if rating is valid (1-5)
  if (isNaN(data.rating) || data.rating < 1 || data.rating > 5) {
    Logger.log("Invalid rating: " + data.rating);
    return false;
  }
  
  return true;
}

// ========================================
// SCENARIO HANDLERS
// ========================================

/**
 * Handle low rating scenario (Rating <= 2)
 * - Send apology email to customer
 * - Alert logistics manager
 * - Log issue in Issue_Reports sheet
 * 
 * @param {Object} data - Form response data
 */
function handleLowRating(data) {
  Logger.log("ALERT: Low rating detected (" + data.rating + "/5)");
  
  // 1. Send apology email to customer
  sendApologyEmail(data);
  
  // 2. Alert the logistics manager
  sendManagerAlert(data, "Low Rating");
  
  // 3. Log the issue
  const priority = (data.packageDamaged === "Yes") ? "Critical" : "High";
  logIssue({
    email: data.email,
    rating: data.rating,
    issueType: "Low Rating",
    priority: priority,
    status: "Open",
    timestamp: data.timestamp,
    notes: "Feedback: " + data.feedback
  });
}

/**
 * Handle damaged package scenario
 * - Mark as Critical priority
 * - Send alert to support/warehouse team
 * - Log issue with suggested action
 * 
 * @param {Object} data - Form response data
 */
function handleDamagedPackage(data) {
  Logger.log("ALERT: Damaged package reported!");
  
  // 1. Send alert to warehouse team
  sendDamageAlert(data);
  
  // 2. Log the critical issue
  logIssue({
    email: data.email,
    rating: data.rating,
    issueType: "Package Damaged",
    priority: "Critical",
    status: "Open",
    timestamp: data.timestamp,
    notes: "Suggested action: Replacement or Refund. Feedback: " + data.feedback
  });
}

/**
 * Handle high rating scenario (Rating >= 4)
 * - Send thank you email with coupon code
 * 
 * @param {Object} data - Form response data
 */
function handleHighRating(data) {
  Logger.log("SUCCESS: High rating received (" + data.rating + "/5)");
  
  // Send thank you email with coupon
  sendThankYouEmail(data);
}

// ========================================
// EMAIL FUNCTIONS
// ========================================

/**
 * Send apology email to customer for low rating
 * 
 * @param {Object} data - Form response data
 */
function sendApologyEmail(data) {
  const subject = "We're Sorry – Let's Make It Right";
  
  const body = `
Dear Valued Customer,

We sincerely apologize for the experience you had with your recent delivery.

Your feedback is extremely important to us, and we take your ${data.rating}-star rating seriously. We understand that we fell short of your expectations.

${data.packageDamaged === "Yes" ? "We're especially concerned to hear that your package was damaged. " : ""}

Our team is reviewing your case immediately, and a customer service representative will contact you within 24 hours to resolve this issue.

Feedback you provided: "${data.feedback}"

We value your business and hope to regain your trust.

Best regards,
The AutoPulse Logistics Team

---
Reference: ${data.timestamp}
  `;
  
  try {
    GmailApp.sendEmail(data.email, subject, body);
    Logger.log("Apology email sent to: " + data.email);
  } catch (error) {
    Logger.log("Failed to send apology email: " + error.message);
  }
}

/**
 * Send thank you email to customer for high rating
 * 
 * @param {Object} data - Form response data
 */
function sendThankYouEmail(data) {
  const subject = "Thank You! 🎉 Here's a Special Offer";
  
  const body = `
Dear Valued Customer,

Thank you so much for your ${data.rating}-star rating! We're thrilled that you had a great delivery experience.

As a token of our appreciation, here's an exclusive coupon code for your next order:

🎁 Coupon Code: ${CONFIG.COUPON_CODE}
💰 Discount: 10% off your next purchase

Your feedback motivates us to keep delivering excellence!

${data.feedback ? 'Your comment: "' + data.feedback + '"' : ''}

We look forward to serving you again soon!

Best regards,
The AutoPulse Logistics Team

---
Coupon valid for 30 days | Reference: ${data.timestamp}
  `;
  
  try {
    GmailApp.sendEmail(data.email, subject, body);
    Logger.log("Thank you email sent to: " + data.email);
  } catch (error) {
    Logger.log("Failed to send thank you email: " + error.message);
  }
}

/**
 * Send alert email to logistics manager
 * 
 * @param {Object} data - Form response data
 * @param {string} alertType - Type of alert
 */
function sendManagerAlert(data, alertType) {
  const subject = `🚨 ALERT: ${alertType} – Immediate Attention Required`;
  
  const body = `
LOGISTICS MANAGER ALERT

Alert Type: ${alertType}
Customer Email: ${data.email}
Rating: ${data.rating}/5
Package Damaged: ${data.packageDamaged}
On Time: ${data.onTime}
Timestamp: ${data.timestamp}

Customer Feedback:
"${data.feedback}"

ACTION REQUIRED: Please review and contact the customer within 24 hours.

---
AutoPulse Automation System
  `;
  
  try {
    GmailApp.sendEmail(CONFIG.MANAGER_EMAIL, subject, body);
    Logger.log("Manager alert sent to: " + CONFIG.MANAGER_EMAIL);
  } catch (error) {
    Logger.log("Failed to send manager alert: " + error.message);
  }
}

/**
 * Send alert email to warehouse team for damaged package
 * 
 * @param {Object} data - Form response data
 */
function sendDamageAlert(data) {
  const subject = `🔴 CRITICAL: Damaged Package Report`;
  
  const body = `
WAREHOUSE/SUPPORT TEAM ALERT

CRITICAL ISSUE: Customer reported damaged package

Customer Email: ${data.email}
Rating: ${data.rating}/5
Timestamp: ${data.timestamp}

Customer Feedback:
"${data.feedback}"

SUGGESTED ACTION: Replacement or Refund

Please coordinate with logistics manager and contact customer immediately.

---
AutoPulse Automation System
  `;
  
  try {
    GmailApp.sendEmail(CONFIG.WAREHOUSE_EMAIL, subject, body);
    GmailApp.sendEmail(CONFIG.SUPPORT_EMAIL, subject, body);
    Logger.log("Damage alerts sent to warehouse and support teams");
  } catch (error) {
    Logger.log("Failed to send damage alert: " + error.message);
  }
}

// ========================================
// ISSUE TRACKING FUNCTIONS
// ========================================

/**
 * Log an issue to the Issue_Reports sheet
 * Creates the sheet if it doesn't exist
 * 
 * @param {Object} issue - Issue data object
 */
function logIssue(issue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let issueSheet = ss.getSheetByName(CONFIG.ISSUE_SHEET_NAME);
  
  // Create the Issue_Reports sheet if it doesn't exist
  if (!issueSheet) {
    Logger.log("Creating Issue_Reports sheet...");
    issueSheet = ss.insertSheet(CONFIG.ISSUE_SHEET_NAME);
    
    // Add headers
    const headers = ["Timestamp", "Email", "Rating", "Issue_Type", "Priority", "Status", "Notes"];
    issueSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    issueSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    issueSheet.setFrozenRows(1);
    
    Logger.log("Issue_Reports sheet created with headers");
  }
  
  // Append the issue data
  const rowData = [
    issue.timestamp,
    issue.email,
    issue.rating,
    issue.issueType,
    issue.priority,
    issue.status,
    issue.notes || ""
  ];
  
  issueSheet.appendRow(rowData);
  
  // Apply color coding based on priority
  const lastRow = issueSheet.getLastRow();
  const priorityCell = issueSheet.getRange(lastRow, 5);
  
  if (issue.priority === "Critical") {
    priorityCell.setBackground("#ff0000").setFontColor("#ffffff");
  } else if (issue.priority === "High") {
    priorityCell.setBackground("#ff9900").setFontColor("#ffffff");
  }
  
  Logger.log("Issue logged: " + issue.issueType + " (" + issue.priority + ")");
}

// ========================================
// ERROR HANDLING
// ========================================

/**
 * Send error alert to admin when script fails
 * 
 * @param {Error} error - Error object
 */
function sendErrorAlert(error) {
  const subject = "⚠️ AutoPulse Script Error";
  const body = `
An error occurred in the AutoPulse automation script:

Error Message: ${error.message}
Stack Trace: ${error.stack}

Timestamp: ${new Date()}

Please check the script logs and fix the issue.

---
AutoPulse Automation System
  `;
  
  try {
    // Send to manager or admin email
    GmailApp.sendEmail(CONFIG.MANAGER_EMAIL, subject, body);
  } catch (e) {
    Logger.log("Failed to send error alert: " + e.message);
  }
}

// ========================================
// TESTING & UTILITY FUNCTIONS
// ========================================

/**
 * Test function to manually trigger the automation
 * Use this to test without submitting a real form
 * 
 * To run: Select this function and click the Run button
 */
function testAutomation() {
  // Simulate a low-rating response
  const testData = {
    timestamp: new Date(),
    email: "test.customer@example.com",
    rating: 2,
    packageDamaged: "Yes",
    onTime: "No",
    feedback: "Package arrived damaged and late. Very disappointed."
  };
  
  Logger.log("=== Running Test Automation ===");
  handleLowRating(testData);
  handleDamagedPackage(testData);
  Logger.log("=== Test Complete ===");
}

/**
 * Test function for high rating scenario
 */
function testHighRating() {
  const testData = {
    timestamp: new Date(),
    email: "happy.customer@example.com",
    rating: 5,
    packageDamaged: "No",
    onTime: "Yes",
    feedback: "Perfect delivery! Very satisfied."
  };
  
  Logger.log("=== Testing High Rating ===");
  handleHighRating(testData);
  Logger.log("=== Test Complete ===");
}
