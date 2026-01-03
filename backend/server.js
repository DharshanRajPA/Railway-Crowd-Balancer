import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB, closeDB, getDB } from './lib/db.js';
import { initRealtime, emit } from './lib/realtime.js';
import { evaluateAllPlatforms, checkFeedbackLoop } from './lib/decision.js';
import sensorRoutes from './routes/sensor.js';
import platformRoutes from './routes/platform.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuration
const PORT = process.env.BACKEND_PORT || 3001;
const DECISION_INTERVAL = parseInt(process.env.DECISION_INTERVAL || '5000', 10);
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL || '10000', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Initialize database
console.log('[Server] Initializing database...');
initDB();
console.log('[Server] Database initialized');

// Initialize Socket.io
console.log('[Server] Initializing Socket.io...');
initRealtime(server);
console.log('[Server] Socket.io initialized');

// Routes
app.use('/api', sensorRoutes);
app.use('/api', platformRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const db = getDB();
    const dbStatus = db ? 'connected' : 'disconnected';
    
    res.json({
      success: true,
      version: '1.0.0',
      dbStatus,
      lastDecisionTime: lastDecisionTime || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Decision engine state
let decisionInterval = null;
let feedbackInterval = null;
let lastDecisionTime = null;

/**
 * Emit event wrapper for decision engine
 */
function emitEvent(event, data) {
  emit(event, data);
  console.log(`[Decision Engine] Emitted ${event}:`, JSON.stringify(data, null, 2));
}

/**
 * Start decision engine
 */
function startDecisionEngine() {
  console.log(`[Decision Engine] Starting decision engine (interval: ${DECISION_INTERVAL}ms)`);
  
  decisionInterval = setInterval(() => {
    try {
      lastDecisionTime = new Date();
      const redirects = evaluateAllPlatforms(emitEvent);
      
      if (redirects.length > 0) {
        console.log(`[Decision Engine] Issued ${redirects.length} redirect(s)`);
      }
    } catch (error) {
      console.error('[Decision Engine] Error in decision loop:', error);
    }
  }, DECISION_INTERVAL);
  
  console.log(`[Decision Engine] Starting feedback loop (interval: ${CHECK_INTERVAL}ms)`);
  
  feedbackInterval = setInterval(() => {
    try {
      const actions = checkFeedbackLoop(emitEvent);
      
      if (actions.length > 0) {
        console.log(`[Feedback Loop] Processed ${actions.length} action(s)`);
      }
    } catch (error) {
      console.error('[Feedback Loop] Error in feedback loop:', error);
    }
  }, CHECK_INTERVAL);
}

/**
 * Stop decision engine
 */
function stopDecisionEngine() {
  if (decisionInterval) {
    clearInterval(decisionInterval);
    decisionInterval = null;
  }
  if (feedbackInterval) {
    clearInterval(feedbackInterval);
    feedbackInterval = null;
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`[Server] Server running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[Server] API endpoints: http://localhost:${PORT}/api/*`);
  
  // Start decision engine
  startDecisionEngine();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down gracefully...');
  stopDecisionEngine();
  closeDB();
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Shutting down gracefully...');
  stopDecisionEngine();
  closeDB();
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

