# 🔧 Login Issue - Troubleshooting Guide

## ✅ **Issue Identified**: Database Connection Problem

Your login isn't working because the **backend can't connect to the database quickly**. This is happening because:

1. **Neon Free Tier Cold Start**: Your Neon database went to sleep after inactivity and takes time to wake up
2. **Database was reset**: When we optimized the system, we reset the database which cleared all users

---

## 🚀 **Quick Fix - Follow These Steps:**

### Step 1: Stop All Backend Processes
```bash
cd /Users/atharva/Desktop/civic-connect/backend
pkill -f "tsx.*server"
```

### Step 2: Start Backend (Watch for Database Connection)
```bash
npm run dev
```

**Wait and watch for:** `✅ Database connected successfully`

If you see this, the database is awake and ready!

### Step 3: Test Login from Browser
Open your frontend (usually http://localhost:8080 or http://localhost:5173) and login with:

```
Email: citizen@civictrack.in
Password: password123
```

---

## 📋 **All Test Credentials**

**Password for ALL accounts**: `password123`

### Citizens:
- `citizen@civictrack.in`
- `priya@civictrack.in`
- `arjun@civictrack.in`

### Department (Pune):
- `sanitation@pune.gov.in`
- `roads@pune.gov.in`
- `water@pune.gov.in`
- `electrical@pune.gov.in`

### Municipal:
- `admin@pmc.gov.in` (Pune)
- `admin@bmc.gov.in` (Mumbai)

---

## 🔍 **If Login Still Fails:**

###  Check 1: Is the backend running?
```bash
lsof -ti:5001
```
Should show a process ID. If not, backend isn't running.

### Check 2: Is the database seeded?
```bash
cd backend
npx tsx prisma/seed.ts
```
This will populate the database with test users.

### Check 3: Can the backend reach the database?
Check the backend console output for:
- `✅ Database connected successfully` ← Good!
- `❌ Database connection failed` ← Problem!

If you see the red X, your database might be:
- **Sleeping** (Neon free tier) - Just wait 30-60 seconds for it to wake up
- **Unreachable** - Check your internet connection
- **Wrong credentials** - Check DATABASE_URL in `.env`

### Check 4: Frontend proxy configuration
The frontend should be running on port **8080** and proxying to backend on port **5001**.

Start frontend:
```bash
cd frontend
npm run dev
```

---

## 🐛 **Common Issues & Solutions**

### Issue: "Invalid email or password"
**Cause**: Database has no users
**Solution**: 
```bash
cd backend
npx tsx prisma/seed.ts
```

### Issue: Login button does nothing / hangs forever
**Cause**: Backend can't connect to database (cold start)
**Solution**: 
1. Wait 30-60 seconds for Neon database to wake up
2. Refresh the page and try again

### Issue: "Network Error" or "Failed to fetch"
**Cause**: Backend not running or wrong port
**Solution**:
```bash
# Check what's on port 5001
lsof -ti:5001

# Kill it and restart
pkill -f "tsx.*server"
cd backend && npm run dev
```

### Issue: Database connects but queries are VERY slow
**Cause**: Neon free tier has cold start delays
**Solutions**:
1. **Wait it out**: First query after wakeup can take 30-60 seconds
2. **Upgrade**: Consider Neon paid tier for instant connections
3. **Alternative**: Use local PostgreSQL for development

---

## 🏃 **Quick Start Script**

Save this as `start.sh` and run it:

```bash
#!/bin/bash

echo "🔄 Stopping existing processes..."
pkill -f "tsx.*server"
pkill -f "vite"

echo "🌱 Seeding database..."
cd backend
npx tsx prisma/seed.ts

echo "🚀 Starting backend..."
npm run dev &
BACKEND_PID=$!

echo "⏳ Waiting for database connection..."
sleep 10

echo "🎨 Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ All services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "📱 Open: http://localhost:8080"
echo "🔐 Login: citizen@civictrack.in / password123"
```

Make it executable:
```bash
chmod +x start.sh
./start.sh
```

---

## 📊 **Performance Note**

After the first login (database wake-up), subsequent requests should be **fast** thanks to our optimizations:
- Dashboard: ~300-500ms
- Login: ~200ms
- Upvote: <50ms (instant feel)
- Comments: <50ms (instant feel)

---

## 💡 **Pro Tip**: Local Database for Development

To avoid cold start issues during development, use local PostgreSQL:

```bash
# Install PostgreSQL
brew install postgresql@17
brew services start postgresql@17

# Create local database
createdb civicconnect_dev

# Update .env
DATABASE_URL="postgresql://youruser:yourpassword@localhost:5432/civicconnect_dev"

# Run migrations and seed
cd backend
npx prisma migrate dev
npx tsx prisma/seed.ts
```

---

**Need more help? Check the backend console logs for specific error messages!** 🔍
