#!/bin/bash
echo "🏗️  Building AutoPulse for production..."

# Copy frontend to backend public folder
echo "📂 Copying frontend files to backend..."
rm -rf backend-nodejs/public
mkdir -p backend-nodejs/public
cp -r frontend/* backend-nodejs/public/

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend-nodejs
npm install --production
cd ..

echo "✅ Build complete! Ready for deployment."
echo ""
echo "Next steps:"
echo "1. Deploy 'backend-nodejs' folder to Render"
echo "2. Set environment variables: SMTP_EMAIL, SMTP_PASSWORD"
echo "3. Build command: bash build.sh"
echo "4. Start command: npm start"
