// API Base URL
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const totalFeedbackEl = document.getElementById('totalFeedback');
const avgRatingEl = document.getElementById('avgRating');
const avgStarsEl = document.getElementById('avgStars');
const criticalIssuesEl = document.getElementById('criticalIssues');
const highPriorityEl = document.getElementById('highPriority');
const feedbackTableEl = document.getElementById('feedbackTable');
const issuesTableEl = document.getElementById('issuesTable');

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
