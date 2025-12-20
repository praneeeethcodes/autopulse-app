# AutoPulse Deployment Guide

## Deploy to Render (2 Services)

### 1. Backend (Web Service)
1. Create New **Web Service** on Render
2. Connect your GitHub repo
3. Configure:
   - **Name**: autopulse-backend
   - **Root Directory**: `backend-nodejs`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `SMTP_EMAIL` = your_gmail@gmail.com
     - `SMTP_PASSWORD` = your_16_char_app_password
4. Deploy → copy the backend URL (e.g., `https://autopulse-backend.onrender.com`)

### 2. Frontend (Static Site)
1. Create New **Static Site** on Render
2. Connect your GitHub repo
3. Configure:
   - **Name**: autopulse-frontend
   - **Root Directory**: `.` (root)
   - **Build Command**: `echo "No build needed"`
   - **Publish Directory**: `frontend`
4. Update `frontend/js/feedback.js` line 2:
   ```javascript
   const API_URL = 'https://autopulse-backend.onrender.com/api';
   ```
5. Deploy

## Alternative: Single Web Service (Frontend + Backend)
Deploy both together as one Node service:
1. Move frontend files to `backend-nodejs/public`
2. Add to `backend-nodejs/app.js` before routes:
   ```javascript
   app.use(express.static('public'));
   ```
3. Deploy as Web Service:
   - **Root Directory**: `backend-nodejs`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Access at: `https://your-app.onrender.com`
