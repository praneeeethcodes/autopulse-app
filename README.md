# AutoPulse – Smart Delivery Feedback Automation 🚀

A complete web application that automates delivery feedback collection and intelligently responds based on customer ratings.

## ✨ Features

- **Customer Feedback Form** with star ratings and delivery status
- **Admin Dashboard** with real-time statistics and issue tracking
- **Smart Email Automation**:
	- Low ratings (1-2) → Apology email + Manager alert
	- Damaged packages → Critical issue alert to support team
	- High ratings (4-5) → Thank you email with discount code
- **SQLite Database** for feedback and issue tracking
- **REST API** built with Flask
- **Responsive Design** works on desktop and mobile

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Modern UI with gradient backgrounds and animations

**Backend:**
- Python 3.x
- Flask (REST API)
- SQLite (Database)
- SMTP (Email automation)

## 📦 Installation

### 1. Clone the Repository
```powershell
git clone https://github.com/praneeeethcodes/autopulse-app.git
cd autopulse-app
```

### 2. Install Python Dependencies
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Configure Email (Optional)
Edit `backend/app.py` and update the `EMAIL_CONFIG` dictionary:
```python
EMAIL_CONFIG = {
		'EMAIL': 'your-email@gmail.com',
		'PASSWORD': 'your-app-password',  # Use Gmail App Password
		'MANAGER_EMAIL': 'manager@example.com',
		'SUPPORT_EMAIL': 'support@example.com'
}
```

### 🤖 AI-Powered Emails (Optional - Gemini Integration)

AutoPulse can use Google's Gemini AI to generate personalized, context-aware email responses instead of static templates.

**Setup:**
1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set environment variable:
```powershell
$env:GEMINI_API_KEY = "your-api-key-here"
```
3. Restart the backend server

**How it works:**
- **With API key:** Gemini generates smart, personalized emails based on customer feedback
- **Without API key:** Falls back to standard email templates (no errors)

**Note:** By default, emails are printed to console (development mode). To send real emails, set:
```powershell
$env:SEND_REAL_EMAILS = "true"
$env:SMTP_EMAIL = "your-email@gmail.com"
$env:SMTP_PASSWORD = "your-app-password"
$env:MANAGER_EMAIL = "manager@company.com"
$env:SUPPORT_EMAIL = "support@company.com"
```

## 🚀 Running the Application

### Start the Backend Server
```powershell
cd backend
python app.py
```

The API will start at `http://localhost:5000`

### Open the Frontend
Open `frontend/index.html` in your browser, or use a simple HTTP server:

```powershell
cd frontend
python -m http.server 8000
```

Then visit `http://localhost:8000`

## 📱 Usage

### Customer Flow
1. Open the feedback form
2. Enter email and rate delivery (1-5 stars)
3. Select if package was damaged or delivered late
4. Submit feedback
5. Receive instant email response based on rating

### Admin Dashboard
- View all feedback submissions
- Track critical and high-priority issues
- Monitor average ratings and trends
- Access via `admin.html`

## 🎯 Business Logic

```
Rating 1-2 → Apology Email + Manager Alert + High Priority Issue
Package Damaged → Critical Alert + Support Team Email + Issue Log
Rating 4-5 → Thank You Email + SAVE10 Coupon Code
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/feedback` | Submit new feedback |
| GET | `/api/feedback` | Get all feedback |
| GET | `/api/issues` | Get all issues |
| GET | `/api/stats` | Get dashboard statistics |
| GET | `/api/health` | Health check |

## 🗂️ Project Structure

```
autopulse-app/
├── frontend/
│   ├── index.html          # Customer feedback form
│   ├── admin.html          # Admin dashboard
│   ├── css/
│   │   └── style.css       # All styles
│   └── js/
│       ├── feedback.js     # Form logic
│       └── admin.js        # Dashboard logic
├── backend/
│   └── app.py              # Flask API server
├── requirements.txt        # Python dependencies
├── .gitignore
└── README.md
```

## 🎨 Screenshots

**Feedback Form:**
- Modern gradient background
- Interactive star rating
- Real-time validation

**Admin Dashboard:**
- Statistics cards
- Filterable tables
- Issue tracking with priority badges

## 🔧 Customization

### Change Rating Thresholds
Edit `backend/app.py`:
```python
if rating <= 2:  # Change to 3 for more strict
if rating >= 4:  # Change to 5 for only perfect ratings
```

### Customize Coupon Code
```python
body = f"🎁 Coupon Code: HOLIDAY20"  # Change SAVE10
```

### Add More Fields
1. Add input to `index.html`
2. Update `feedback.js` to collect data
3. Modify database schema in `app.py`
4. Update API to handle new field

## 📧 Email Configuration (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the generated password in `EMAIL_CONFIG['PASSWORD']`

## 🐛 Troubleshooting

**Backend won't start:**
- Check Python version: `python --version` (should be 3.7+)
- Reinstall dependencies: `pip install -r requirements.txt`

**Frontend can't connect to backend:**
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify `API_URL` in JavaScript files

**Database errors:**
- Delete `autopulse.db` and restart backend to recreate

## 🚀 Deployment

### Backend (Heroku, Railway, Render)
```powershell
# Add Procfile
echo "web: python backend/app.py" > Procfile
```

### Frontend (Netlify, Vercel, GitHub Pages)
- Deploy the `frontend/` folder
- Update `API_URL` in JS files to your backend URL

## 🤝 Contributing

Contributions welcome! To contribute:

1. Fork the repo
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

MIT License - Free to use for personal and commercial projects!

## 👥 Team Collaboration

**Invite teammates:**
- Repo → Settings → Collaborators → Add people
- Give "Write" access for push permissions

**Workflow:**
```powershell
# Clone repo
git clone https://github.com/praneeeethcodes/autopulse-app.git
cd autopulse-app

# Create feature branch
git checkout -b feature/my-feature

# Make changes, then commit
git add .
git commit -m "feat: add my feature"
git push -u origin feature/my-feature

# Open Pull Request on GitHub
```

## 📞 Support

- **Issues:** Open an issue on GitHub
- **Questions:** Check the code comments (heavily documented)

---

**⭐ Star this repo if you find it useful!**
