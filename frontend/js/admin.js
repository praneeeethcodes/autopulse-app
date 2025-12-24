// API Base URL (Node backend with persistence)
const API_URL = 'http://localhost:3000/api';

// Google Sheet ID (from the link you provided)
// https://docs.google.com/spreadsheets/d/1e2j5NbQKKzuGUgvH8IAfZfKQYoMMh121jCa1z9tQujM/edit?usp=sharing
const GOOGLE_SHEET_ID = '1e2j5NbQKKzuGUgvH8IAfZfKQYoMMh121jCa1z9tQujM';

// DOM Elements
const totalFeedbackEl = document.getElementById('totalFeedback');
const avgRatingEl = document.getElementById('avgRating');
const avgStarsEl = document.getElementById('avgStars');
const criticalIssuesEl = document.getElementById('criticalIssues');
const highPriorityEl = document.getElementById('highPriority');
const feedbackTableEl = document.getElementById('feedbackTable');
const issuesTableEl = document.getElementById('issuesTable');
const googleTableEl = document.getElementById('googleTable');
const googleSheetStatusEl = document.getElementById('googleSheetStatus');

// Tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active states
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            }
        });
    });
});

// Load dashboard data
async function loadDashboard() {
    try {
        // Load stats
        const statsResponse = await fetch(`${API_URL}/stats`);
        const stats = await statsResponse.json();
        
        totalFeedbackEl.textContent = stats.total_feedback;
        avgRatingEl.textContent = stats.avg_rating.toFixed(1);
        criticalIssuesEl.textContent = stats.critical_issues;
        highPriorityEl.textContent = stats.high_priority;
        
        // Display average stars
        avgStarsEl.innerHTML = getStarsHTML(Math.round(stats.avg_rating));
        
        // Load feedback
        const feedbackResponse = await fetch(`${API_URL}/feedback`);
        const feedback = await feedbackResponse.json();
        renderFeedbackTable(feedback);
        
        // Load issues
        const issuesResponse = await fetch(`${API_URL}/issues`);
        const issues = await issuesResponse.json();
        renderIssuesTable(issues);

        // Load Google Sheet responses (runs in parallel, independent of backend)
        loadGoogleSheetData();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        feedbackTableEl.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">Failed to load data. Make sure the backend server is running.</p>';
        issuesTableEl.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">Failed to load data. Make sure the backend server is running.</p>';
    }
}

// Render feedback table
function renderFeedbackTable(feedback) {
    if (feedback.length === 0) {
        feedbackTableEl.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">No feedback submitted yet.</p>';
        return;
    }
    
    const table = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Email</th>
                    <th>Rating</th>
                    <th>Package Damaged</th>
                    <th>On Time</th>
                    <th>Feedback</th>
                </tr>
            </thead>
            <tbody>
                ${feedback.map(item => `
                    <tr>
                        <td>${formatDate(item.timestamp)}</td>
                        <td>${item.email}</td>
                        <td>
                            <span class="stars-rating">${getStarsHTML(item.rating)}</span>
                            ${item.rating}/5
                        </td>
                        <td>${item.package_damaged}</td>
                        <td>${item.on_time}</td>
                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${item.feedback || '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    feedbackTableEl.innerHTML = table;
}

// Render issues table
function renderIssuesTable(issues) {
    if (issues.length === 0) {
        issuesTableEl.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">No issues reported yet.</p>';
        return;
    }
    
    const table = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Email</th>
                    <th>Rating</th>
                    <th>Issue Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                ${issues.map(item => `
                    <tr>
                        <td>${formatDate(item.timestamp)}</td>
                        <td>${item.email}</td>
                        <td>
                            <span class="stars-rating">${getStarsHTML(item.rating)}</span>
                            ${item.rating}/5
                        </td>
                        <td>${item.issue_type}</td>
                        <td>
                            <span class="badge badge-${item.priority.toLowerCase()}">
                                ${item.priority}
                            </span>
                        </td>
                        <td>
                            <span class="badge badge-open">
                                ${item.status}
                            </span>
                        </td>
                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${item.notes || '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    issuesTableEl.innerHTML = table;
}

// ==========================
// GOOGLE SHEET INTEGRATION
// ==========================

async function loadGoogleSheetData() {
    try {
        // The Google Visualization API returns JSON we can parse
        const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json`;
        const res = await fetch(url);
        const text = await res.text();

        // Strip the JS wrapper around the JSON
        const json = parseGVizJSON(text);
        const table = json.table;
        const cols = table.cols.map(c => c.label);
        const rows = table.rows.map(r => r.c.map(cell => cell ? cell.v : ''));

        // Map to our expected headers if present
        // Expected headers: Timestamp, Email, Rating, Package_Damaged, On_Time, Feedback
        const headerIndex = {
            Timestamp: cols.indexOf('Timestamp'),
            Email: cols.indexOf('Email'),
            Rating: cols.indexOf('Rating'),
            Package_Damaged: cols.indexOf('Package_Damaged'),
            On_Time: cols.indexOf('On_Time'),
            Feedback: cols.indexOf('Feedback')
        };

        // If headers aren't matched, show guidance
        if (Object.values(headerIndex).some(i => i === -1)) {
            googleSheetStatusEl.textContent = 'Could not find expected headers. Ensure the sheet has: Timestamp, Email, Rating, Package_Damaged, On_Time, Feedback.';
            renderGoogleTable([]);
            return;
        }

        // Convert rows
        const data = rows.map(r => ({
            timestamp: r[headerIndex.Timestamp],
            email: r[headerIndex.Email],
            rating: Number(r[headerIndex.Rating] || 0),
            package_damaged: r[headerIndex.Package_Damaged],
            on_time: r[headerIndex.On_Time],
            feedback: r[headerIndex.Feedback]
        })).filter(item => item.email); // basic filter for empty rows

        googleSheetStatusEl.textContent = `Loaded ${data.length} responses from Google Sheets`;
        renderGoogleTable(data);
    } catch (err) {
        console.error('Google Sheet load error:', err);
        if (googleSheetStatusEl) {
            googleSheetStatusEl.textContent = 'Failed to load Google Sheet responses. Make sure the sheet is shared (Anyone with link can view) or Published to web.';
        }
        renderGoogleTable([]);
    }
}

function parseGVizJSON(text) {
    // GViz wraps JSON like: google.visualization.Query.setResponse(<json>);
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr);
}

function renderGoogleTable(rows) {
    if (!rows || rows.length === 0) {
        googleTableEl.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">No responses yet or access denied.</p>';
        return;
    }
    const table = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Email</th>
                    <th>Rating</th>
                    <th>Package Damaged</th>
                    <th>On Time</th>
                    <th>Feedback</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(item => `
                    <tr>
                        <td>${formatDate(item.timestamp)}</td>
                        <td>${item.email}</td>
                        <td><span class="stars-rating">${getStarsHTML(item.rating)}</span> ${item.rating || '-'} / 5</td>
                        <td>${item.package_damaged || '-'}</td>
                        <td>${item.on_time || '-'}</td>
                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.feedback || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    googleTableEl.innerHTML = table;
}

// Helper functions
function getStarsHTML(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '★' : '☆';
    }
    return stars;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Auto-refresh dashboard every 30 seconds
setInterval(loadDashboard, 30000);

// Load dashboard on page load
loadDashboard();
