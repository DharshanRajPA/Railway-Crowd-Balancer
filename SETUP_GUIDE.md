# 🚀 Complete Beginner's Guide - Railway Crowd Balancer

## 📖 What is This Project?

Imagine you have 3 railway platforms. This system:
- Counts how many people are on each platform
- Shows you the crowd density (how crowded it is)
- Automatically tells people to move to another platform when one gets too crowded
- Shows everything on a website you can see in your browser

**Simple Example:**
- Platform 1 has 700 people out of 1000 capacity = 70% full = OVERCROWDED
- System says: "Go to Platform 2 instead!"
- Platform 2 has only 200 people = 20% full = SAFE

---

## ✅ STEP 1: Check What You Need

### You Need Node.js (This is Like Installing an App)

**What is Node.js?**
- It's a program that lets your computer run JavaScript code
- Think of it like installing Microsoft Word to write documents
- You need it to run this project

**How to Check if You Have It:**

1. Press `Windows Key` (the key with Windows logo)
2. Type: `cmd`
3. Press `Enter`
4. A black window opens (this is Command Prompt)
5. Type: `node --version`
6. Press `Enter`

**What Should Happen:**
- ✅ **GOOD:** You see something like `v18.17.0` or `v20.10.0`
- ❌ **BAD:** You see `'node' is not recognized` or an error

**If You Don't Have Node.js:**

1. Open your web browser (Chrome, Firefox, Edge - any browser)
2. Go to: **https://nodejs.org/**
3. You'll see a big green button that says "LTS" - click it
4. A file downloads (like `node-v20.x.x-x64.msi`)
5. Double-click the downloaded file
6. Click "Next" → "Next" → "I accept" → "Next" → "Install"
7. Wait for it to install
8. Click "Finish"
9. **IMPORTANT:** Restart your computer
10. Check again with `node --version` in Command Prompt

---

## 📦 STEP 2: Install Everything (The Easy Way)

### Method 1: Use the Setup Script (EASIEST)

1. Open **File Explorer** (the folder icon on your taskbar)
2. Go to: `C:\Dharshan Raj P A\College\Projects\Pervasive\Railway-Crowd-Balancer`
3. Look for a file called: `setup.bat`
4. **Double-click** `setup.bat`
5. A black window opens and shows progress
6. Wait 3-5 minutes (it's installing things)
7. When it says "Setup Complete!" - you're done!
8. Press any key to close the window

**If setup.bat doesn't exist or doesn't work, use Method 2 below.**

### Method 2: Manual Installation (Step by Step)

**Open Command Prompt:**
1. Press `Windows Key + R`
2. Type: `cmd`
3. Press `Enter`

**Copy and paste these commands ONE BY ONE (press Enter after each):**

```bash
cd "C:\Dharshan Raj P A\College\Projects\Pervasive\Railway-Crowd-Balancer"
```

**Press Enter** - You should see the folder path in the prompt

```bash
npm install
```

**Press Enter** - Wait 1-2 minutes, you'll see lots of text scrolling

```bash
cd backend
```

**Press Enter**

```bash
npm install
```

**Press Enter** - Wait 1-2 minutes

```bash
cd ..
```

**Press Enter** - This goes back to the main folder

```bash
cd frontend
```

**Press Enter**

```bash
npm install
```

**Press Enter** - Wait 2-3 minutes (frontend has more stuff to install)

```bash
cd ..
```

**Press Enter** - Back to main folder

```bash
npm run seed
```

**Press Enter** - You should see: "Database seeded successfully with 3 platforms"

**✅ Installation Complete!**

---

## 🗄️ STEP 3: Create the Database

**If you used the setup script, this is already done! Skip to Step 4.**

**If you did manual installation, you already ran `npm run seed` - Skip to Step 4.**

**If you haven't created the database yet:**

In Command Prompt, type:

```bash
npm run seed
```

**Press Enter**

**What Should Happen:**
- You see: `[Seed] Initializing database...`
- Then: `[Seed] Database seeded successfully with 3 platforms`
- A file called `db.sqlite` appears in the `backend` folder

---

## 🚀 STEP 4: Start the Application

**Keep Command Prompt open!**

### Option A: Start Both Servers Together (RECOMMENDED)

Type this command:

```bash
npm run dev
```

**Press Enter**

**What Should Happen:**
- You see TWO things starting:
  1. `[Server] Server running on port 3001` ← Backend (the brain)
  2. `Local: http://localhost:5173` ← Frontend (the website)

**KEEP THIS WINDOW OPEN!** Don't close it. If you close it, the app stops working.

### Option B: Start Servers Separately (If Option A Doesn't Work)

**Open TWO Command Prompt windows:**

**Window 1 - Backend:**
```bash
cd "C:\Dharshan Raj P A\College\Projects\Pervasive\Railway-Crowd-Balancer\backend"
npm run dev
```

**Window 2 - Frontend:**
```bash
cd "C:\Dharshan Raj P A\College\Projects\Pervasive\Railway-Crowd-Balancer\frontend"
npm run dev
```

**Keep BOTH windows open!**

---

## 🌐 STEP 5: Open the Website

1. **Open your web browser** (Chrome, Firefox, Edge - any browser works)
2. **Click on the address bar** (where you type websites)
3. **Type exactly:** `http://localhost:5173`
4. **Press Enter**

**What You Should See:**
- A webpage with "🚉 Railway Crowd Balancer" at the top
- Three cards showing:
  - **Platform 1** (Count: 0, Area: 1000 m², Density: 0.0%, Status: SAFE)
  - **Platform 2** (Count: 0, Area: 1000 m², Density: 0.0%, Status: SAFE)
  - **Platform 3** (Count: 0, Area: 1000 m², Density: 0.0%, Status: SAFE)
- Buttons: "+ 10 Entries", "+ 5 Entries", "- 8 Exits", "- 5 Exits"

**If You See an Error:**
- Make sure the servers are running (check Command Prompt windows)
- Make sure the address is exactly: `http://localhost:5173` (not https, not .com)
- Try refreshing the page (press F5)

---

## 🧪 STEP 6: Test It Works

### Test 1: Add People to Platform 1

1. Find the **Platform 1** card
2. Click the button: **"+ 10 Entries"**
3. **Watch:**
   - Count changes from 0 to 10
   - Density changes from 0.0% to 1.0%
   - Status stays "SAFE" (green)

### Test 2: Make Platform 1 Overcrowded

1. Keep clicking **"+ 10 Entries"** on Platform 1
2. Click it **about 70 times** (or keep clicking until density > 70%)
3. **Watch for:**
   - Red banner appears: "⚠️ Platform 1 overcrowded! Please move to Platform 2"
   - Status changes to "OVERCROWDED" (red badge)
   - Density bar turns red
   - You might hear a beep sound (audio alert)

**Tip:** Instead of clicking 70 times, you can click "+ 10 Entries" about 7 times, then check the density. If it's still below 70%, keep clicking.

### Test 3: Reduce the Crowd

1. Click **"- 8 Exits"** on Platform 1 multiple times
2. **Watch:** When density goes below 70%, the red banner disappears
3. Status changes back to "SAFE" or "MODERATE"

### Test 4: Try the Admin Panel

1. Click the **"Admin Panel"** tab at the top of the page
2. You'll see a login form
3. Enter password: `demo_key_change_in_production`
4. Click **"Login"**
5. **Try these:**
   - Click on Platform 2's area number (shows "1000")
   - Change it to `500` and press Enter
   - Watch: Density recalculates (if Platform 2 had 100 people, density jumps from 10% to 20%)
   - Click **"Reset Count"** button on Platform 1
   - Watch: Count goes back to 0, density becomes 0%

---

## 🔧 Troubleshooting (Fixing Problems)

### Problem 1: "node is not recognized"

**What it means:** Node.js is not installed or not found

**How to fix:**
1. Go to https://nodejs.org/
2. Download and install Node.js (LTS version)
3. Restart your computer
4. Try again

### Problem 2: "npm is not recognized"

**What it means:** npm (Node Package Manager) is missing

**How to fix:**
1. npm comes with Node.js
2. Reinstall Node.js from https://nodejs.org/
3. Restart your computer

### Problem 3: "Port 3001 already in use" or "Port 5173 already in use"

**What it means:** Another program is using these ports

**How to fix:**
1. Close other programs that might be using these ports
2. Or restart your computer
3. Try running `npm run dev` again

**To find what's using the port:**
```bash
netstat -ano | findstr :3001
```
This shows a number (PID). Then kill it:
```bash
taskkill /PID <the number> /F
```

### Problem 4: "Cannot find module" or "Module not found"

**What it means:** Dependencies weren't installed properly

**How to fix:**
Run these commands again:
```bash
cd "C:\Dharshan Raj P A\College\Projects\Pervasive\Railway-Crowd-Balancer"
npm install
cd backend
npm install
cd ..
cd frontend
npm install
cd ..
```

### Problem 5: "Database locked"

**What it means:** Multiple instances of the backend are running

**How to fix:**
1. Close ALL Command Prompt windows
2. Delete the file: `backend\db.sqlite` (in File Explorer)
3. Run `npm run seed` again

### Problem 6: Browser shows blank page or "Cannot connect"

**How to fix:**
1. Check Command Prompt - are servers running? (You should see output)
2. Make sure URL is exactly: `http://localhost:5173` (not https)
3. Try refreshing (F5)
4. Press F12 in browser, look at "Console" tab for errors
5. Make sure you didn't close the Command Prompt window

### Problem 7: "EACCES" or "Permission denied"

**What it means:** You don't have permission

**How to fix:**
1. Right-click on Command Prompt
2. Select "Run as administrator"
3. Try commands again

---

## 📝 Quick Reference - All Commands in Order

**Copy and paste these ONE BY ONE:**

```bash
# Go to project folder
cd "C:\Dharshan Raj P A\College\Projects\Pervasive\Railway-Crowd-Balancer"

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Create database
npm run seed

# Start application
npm run dev
```

**Then open browser:** `http://localhost:5173`

---

## ✅ Checklist - Did Everything Work?

After following all steps, check:

- [ ] Node.js installed (run `node --version` - should show v18+ or v20+)
- [ ] npm installed (run `npm --version` - should show a version number)
- [ ] All dependencies installed (no errors during `npm install`)
- [ ] Database created (file `backend\db.sqlite` exists)
- [ ] Backend server running (see "Server running on port 3001" in Command Prompt)
- [ ] Frontend server running (see "Local: http://localhost:5173" in Command Prompt)
- [ ] Website opens (can see the dashboard in browser)
- [ ] Can see 3 platform cards
- [ ] Can click buttons and see counts change
- [ ] Can trigger overcrowding alert (red banner appears)

---

## 🎓 Understanding the Project Structure

**What Each Folder Does:**

- **`backend/`** - The server (the brain)
  - Handles all the logic
  - Stores data in database
  - Makes decisions about redirects
  - Runs on port 3001

- **`frontend/`** - The website (what you see)
  - The user interface
  - Shows platform cards
  - Buttons and forms
  - Runs on port 5173

- **`backend/db.sqlite`** - The database (storage)
  - Stores platform data
  - Created automatically when you run `npm run seed`
  - Contains: platform names, areas, counts, redirects, escalations

**How They Work Together:**
1. Frontend (website) sends requests to Backend (server)
2. Backend processes the request and updates database
3. Backend sends updates back to Frontend via Socket.io (real-time)
4. Frontend shows the updated information

---

## 🆘 Still Having Problems?

1. **Read the main README.md file** - It has more technical details
2. **Check browser console** - Press F12, look at "Console" tab
3. **Check Command Prompt** - Look for red error messages
4. **Make sure all files exist** - Check folders in File Explorer
5. **Restart everything** - Close all windows, restart computer, try again

---

## 📚 What You Learned

After following this guide, you now know:
- How to install Node.js
- How to use Command Prompt
- How to install npm packages
- How to run a Node.js application
- How to access a local website
- Basic troubleshooting

---

**🎉 Congratulations!**

If you followed all steps, your Railway Crowd Balancer is now running!

**Remember:**
- Keep the Command Prompt window open while using the app
- To stop the app, press `Ctrl + C` in Command Prompt
- To start again, just run `npm run dev`

**Good luck! 🍀**

