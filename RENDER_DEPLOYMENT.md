# Deploy AutoPulse to Render

## Step 1: Prepare Project
Run the build script locally to test:
```bash
chmod +x build.sh
./build.sh
```

This copies frontend files into `backend-nodejs/public/` for single-server deployment.

---

## Step 2: Create Render Service

1. Go to https://render.com and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub repository

---

## Step 3: Configure Render

**Basic Settings:**
- **Name**: `autopulse` (or your preferred name)
- **Root Directory**: `backend-nodejs`
- **Runtime**: Node
- **Build Command**: `bash ../build.sh && npm install --production`
- **Start Command**: `node app.js`

**Environment Variables:**
Click **Add Environment Variable** and add:
```
SMTP_EMAIL = saipraneethjairam@gmail.com
SMTP_PASSWORD = fxox fuwy mtyq xtcs
NODE_ENV = production
```

**Plan**: Free tier (adequate for demo/learning)

---

## Step 4: Deploy

1. Click **Create Web Service**
2. Render will automatically build and deploy
3. Wait ~5 minutes for deployment to complete
4. Your app will be live at: `https://autopulse-xxxxx.onrender.com`

---

## Step 5: Test

- **Frontend**: https://autopulse-xxxxx.onrender.com
- **Admin**: https://autopulse-xxxxx.onrender.com/admin.html
- **API Health**: https://autopulse-xxxxx.onrender.com/api/health

---

## Troubleshooting

**Build fails?**
- Check `backend-nodejs/package.json` has all dependencies
- Ensure `.env` is in `backend-nodejs` (Render reads env vars automatically)

**Static files not loading?**
- Verify `build.sh` ran: `frontend` files should be in `backend-nodejs/public/`
- Check app.js has `app.use(express.static('public'));`

**Emails not sending?**
- Verify SMTP_PASSWORD is correct (16-char Gmail app password)
- Check Logs in Render dashboard for SMTP errors

---

## Free Tier Limits

- 750 hours/month (always-on okay for personal projects)
- 100GB/month bandwidth
- Auto-spins down after 15 mins inactivity (cold start delay)

Upgrade to Pro for always-on performance if needed.
