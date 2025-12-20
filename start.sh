#!/bin/bash
echo ""
echo "============================================================"
echo "🚀 Starting AutoPulse Servers..."
echo "============================================================"
echo ""

# Set environment variables (replace with your actual values)
export SMTP_EMAIL="saipraneethjairam@gmail.com"
export SMTP_PASSWORD="your_app_password_here"  # Replace with 16-char app password

# Start Backend (Node.js)
echo "📧 Starting Backend (Node.js Email Server) on port 3000..."
cd backend-nodejs
npm install > /dev/null 2>&1
node app.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start Frontend (Python HTTP Server)
echo "🌐 Starting Frontend (HTTP Server) on port 8000..."
cd frontend
python -m http.server 8000 &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================================"
echo "✅ Servers Started!"
echo "============================================================"
echo ""
echo "📧 Backend:  http://localhost:3000"
echo "🌐 Frontend: http://localhost:8000"
echo "📊 Admin:    http://localhost:8000/admin.html"
echo ""
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop servers, run: kill $BACKEND_PID $FRONTEND_PID"
echo "============================================================"
echo ""

# Keep script running
wait
