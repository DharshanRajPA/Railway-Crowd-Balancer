# Smart Indian Railway Platform Crowd Balancer (SIRCB)

A real-time crowd density monitoring and redirection system for Indian railway platforms. This system uses sensor data to track platform occupancy, calculate density, and automatically redirect passengers to safer platforms when overcrowding is detected.

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (check with `node --version`)
- **npm** (comes with Node.js)

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if needed (defaults work for local demo).

3. **Seed the database:**
   ```bash
   npm run seed
   ```
   This creates 3 platforms (Platform 1, 2, 3) with 1000 m² each and initializes counts to 0.

4. **Start the application:**
   ```bash
   npm run dev
   ```
   This starts both backend (port 3001) and frontend (port 5173) concurrently.

5. **Open in browser:**
   ```
   http://localhost:5173
   ```

### Other Commands

- **Reset database:** `npm run reset-db` (deletes `backend/db.sqlite` and reseeds)

## 📋 6-Step Mentor Demo Script

Follow these exact steps to demonstrate the system:

### Step 1: Install Dependencies
```bash
npm install
```
**Expected:** All packages install successfully.

### Step 2: Seed Database
```bash
npm run seed
```
**Expected:** Console shows "Database seeded successfully with 3 platforms" and `backend/db.sqlite` is created.

### Step 3: Start Application
```bash
npm run dev
```
**Expected:** 
- Backend starts on `http://localhost:3001`
- Frontend starts on `http://localhost:5173`
- Console shows "Server running on port 3001" and Vite dev server URL

Open `http://localhost:5173` in your browser.

### Step 4: Simulate Crowding
On the Dashboard page:
1. Find **Platform 1** card
2. Click **"+ 10 Entries"** button
3. **Observe:** Platform 1 count increases to 10, density shows ~1.0% (10/1000 m²)
4. Click **"+ 10 Entries"** again (total 20)
5. Continue clicking until density > 70% (need ~700+ people, so click **"+ 10 Entries"** ~70 times, or use **"+ 5 Entries"** for finer control)

**Expected:** 
- When Platform 1 density exceeds 70% (OVERCROWDED):
  - Red banner appears: **"Platform 1 overcrowded! Please move to Platform 2"** (or Platform 3 if it's safer)
  - Audio alert plays (beep or mp3 if available)
  - Platform card shows red status badge "OVERCROWDED"
  - Density bar fills red

### Step 5: Observe Feedback Loop
After redirect is issued:
1. **Wait 10 seconds** (CHECK_INTERVAL)
2. **Observe:** System re-evaluates Platform 1 density
3. If density still > 70%:
   - Redirect retries (up to RETRY_LIMIT=2 times)
   - If density > 85% (ESCALATION_THRESHOLD) or retries exceeded:
     - Escalation banner appears: **"Escalation: Platform 1 requires staff intervention"**
     - Platform marked as escalated

**To clear redirect:**
- Click **"- 8 Exits"** on Platform 1 multiple times to reduce count below 70%
- Redirect banner disappears automatically

### Step 6: Admin Panel Demo
1. Navigate to **"Admin Panel"** tab
2. Enter admin key: `demo_key_change_in_production` (from `.env`)
3. **Edit Platform Area:**
   - Click on Platform 2's area value (e.g., "1000")
   - Change to `500` (smaller area = higher density for same count)
   - Press Enter or click Save
4. **Observe:** Platform 2 density recalculates (if it had 100 people, density jumps from 10% to 20%)
5. **Reset Count:**
   - Click **"Reset Count"** button on Platform 1
   - Count resets to 0, density becomes 0%, redirect clears

**Expected:**
- Area updates persist in database
- Density recalculates immediately
- Active redirects table shows current redirects (from → to, attempt number)
- Escalations table shows any escalated platforms

## 🏗️ Architecture

### Backend (`/backend`)
- **Express.js** server on port 3001
- **SQLite** database (`db.sqlite`) using `better-sqlite3` (synchronous)
- **Socket.io** for real-time updates
- **Core modules:**
  - `lib/counter.js` - Sensor event processing, debounce, density calculation
  - `lib/decision.js` - Multi-platform decision engine with hysteresis
  - `lib/db.js` - Database schema and queries
  - `lib/realtime.js` - Socket.io interface

### Frontend (`/frontend`)
- **React 18+** with **Vite**
- **Socket.io client** for live updates
- **Pages:**
  - Dashboard - Platform cards with simulation controls
  - Admin Panel - Area editing, redirect management

### Key Algorithms

1. **Debounce:** Prevents double-counting when IR sensors trigger multiple times (600ms window)
2. **Hysteresis:** Prevents flip-flopping redirects (15s cooldown per platform)
3. **Decision Engine:** Evaluates all platforms every 5s, issues redirects to safest alternative
4. **Feedback Loop:** Re-checks overcrowded platforms every 10s, retries or escalates if needed

See `docs/design-notes.md` for detailed algorithm explanations.

## 🔧 Configuration

Edit `.env` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | 3001 | Backend server port |
| `FRONTEND_PORT` | 5173 | Frontend dev server port |
| `ADMIN_KEY` | demo_key_change_in_production | Admin API key |
| `DECISION_INTERVAL` | 5000 | Decision engine tick interval (ms) |
| `DEBOUNCE_MS` | 600 | Sensor debounce window (ms) |
| `DENSITY_SAFE` | 0.40 | Density threshold for SAFE (< 40%) |
| `DENSITY_MODERATE` | 0.70 | Density threshold for OVERCROWDED (> 70%) |
| `REDIRECT_COOLDOWN_MS` | 15000 | Hysteresis cooldown (ms) |
| `RETRY_LIMIT` | 2 | Max redirect retries before escalation |
| `ESCALATION_THRESHOLD` | 0.85 | Density threshold for escalation |

## 📡 API Endpoints

### Sensor Ingestion
- `POST /api/sensor` - Submit sensor event
  ```json
  {
    "platformId": 1,
    "sensor": "entry",
    "event": "break",
    "ts": "2024-01-01T12:00:00.000Z"
  }
  ```

### Platform Management
- `GET /api/platforms` - Get all platforms with status
- `POST /api/platforms/:id/area` - Update platform area (admin)
- `POST /api/platforms/:id/reset` - Reset platform count (admin)

### Admin
- `GET /api/admin/redirects` - Get active redirects
- `POST /api/admin/redirects/:platformId/clear` - Clear redirect
- `GET /api/admin/escalations` - Get recent escalations

### Health
- `GET /api/health` - System health check

See `docs/api-curl-examples.md` for complete API reference with curl examples.

## 🔌 Hardware Integration

The system accepts HTTP POST requests from ESP32/Arduino devices. See `docs/esp32-example-httppost.ino` for example code.

**Example curl:**
```bash
curl -X POST http://localhost:3001/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"platformId":1,"sensor":"entry","event":"break","ts":"2024-01-01T12:00:00.000Z"}'
```

## 🌐 Remote Access (ngrok)

To expose the frontend for remote demos:

1. Install ngrok: `npm install -g ngrok` or download from ngrok.com
2. Run: `npx ngrok http 5173`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Share URL with mentor/team

**Note:** If backend is also exposed remotely, set `VITE_BACKEND_URL` in `frontend/.env`:
```
VITE_BACKEND_URL=https://your-backend-ngrok-url
```

## 🔒 Security (Demo-Grade)

**⚠️ WARNING:** This is a **demo/prototype** system. It is **NOT production-ready**.

**Current security:**
- Admin endpoints protected by `X-Admin-Key` header
- Rate limiting on sensor ingestion (10 events/sec per platform)
- No authentication for public endpoints

**Production hardening required:**
- TLS/HTTPS encryption
- Proper authentication (JWT/OAuth)
- Database encryption
- Input validation and sanitization
- CORS restrictions
- Physical tamper detection
- Audit logging
- Rate limiting per IP address
- SQL injection prevention (use parameterized queries - already implemented)
- XSS prevention (React escapes by default)

## 📁 Project Structure

```
/
├── README.md                 # This file
├── .env.example              # Environment variables template
├── package.json              # Root package.json with workspaces
├── backend/
│   ├── server.js            # Express + Socket.io entry point
│   ├── seed.js              # Database seeding script
│   ├── package.json         # Backend dependencies
│   ├── db.sqlite            # SQLite database (created at runtime)
│   ├── routes/
│   │   ├── sensor.js        # POST /api/sensor
│   │   ├── platform.js      # Platform endpoints
│   │   └── admin.js         # Admin endpoints
│   └── lib/
│       ├── db.js            # Database layer
│       ├── counter.js       # Core counting logic
│       ├── decision.js      # Decision engine
│       └── realtime.js      # Socket.io interface
├── frontend/
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── index.html           # HTML entry point
│   ├── src/
│   │   ├── main.jsx         # React entry point
│   │   ├── App.jsx          # Main component
│   │   ├── App.css          # Global styles
│   │   ├── api.js           # HTTP client
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Dashboard.css
│   │   │   ├── Admin.jsx
│   │   │   └── Admin.css
│   │   └── components/
│   │       ├── PlatformCard.jsx
│   │       └── PlatformCard.css
│   └── public/
│       └── alert.mp3        # Audio alert (optional)
└── docs/
    ├── demo-script.md       # Detailed demo script
    ├── api-curl-examples.md # API reference
    ├── design-notes.md      # Algorithm explanations
    └── esp32-example-httppost.ino
```

## 🐛 Troubleshooting

**Database locked error:**
- Ensure only one instance of backend is running
- Delete `backend/db.sqlite` and run `npm run seed` again

**Port already in use:**
- Change `BACKEND_PORT` or `FRONTEND_PORT` in `.env`
- Kill process using port: `lsof -ti:3001 | xargs kill` (Mac/Linux) or `netstat -ano | findstr :3001` (Windows)

**Socket.io connection failed:**
- Ensure backend is running on port 3001
- Check browser console for CORS errors
- Verify `VITE_BACKEND_URL` if using remote backend

**Simulation not updating counts:**
- Check browser DevTools Network tab - verify POST requests succeed
- Check backend console for errors
- Verify database is seeded (`npm run seed`)

## 📚 Documentation

- `docs/demo-script.md` - Step-by-step demo guide
- `docs/api-curl-examples.md` - Complete API reference
- `docs/design-notes.md` - Algorithm details and rationale
- `docs/esp32-example-httppost.ino` - Hardware integration example

## 🎯 Success Criteria Checklist

After running `npm run dev` and opening `http://localhost:5173`:

- ✅ Dashboard loads with 3 platform cards
- ✅ Clicking "+ 10 Entries" increases count
- ✅ Density updates in real-time
- ✅ When density > 70%, red redirect banner appears
- ✅ Audio alert plays (beep or mp3)
- ✅ Socket.io events emit (check browser console)
- ✅ Clicking "- 8 Exits" reduces count
- ✅ Redirect banner clears when density < 70%
- ✅ Admin panel loads and allows area editing
- ✅ Database persists across restarts
- ✅ No console errors

## 📝 License

This is a demo/prototype system for academic/mentor demonstration purposes.

## 👥 Credits

Built for Smart Indian Railway Platform Crowd Balancer (SIRCB) project.
