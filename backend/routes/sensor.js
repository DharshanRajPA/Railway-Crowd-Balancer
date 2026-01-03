import express from 'express';
import { processSensorEvent } from '../lib/counter.js';
import { emit } from '../lib/realtime.js';
import { getAllPlatforms } from '../lib/db.js';

const router = express.Router();

// Rate limiting: track requests per platform
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const RATE_LIMIT_MAX = 10; // 10 requests per second per platform

function checkRateLimit(platformId) {
  const now = Date.now();
  const key = platformId;
  const record = rateLimitMap.get(key);
  
  if (!record || (now - record.windowStart) > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { windowStart: now, count: 1 });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * POST /api/sensor
 * Submit sensor event
 */
router.post('/sensor', (req, res) => {
  try {
    const { platformId, sensor, event, ts } = req.body;
    
    // Validation
    if (!platformId || !sensor || !event) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: platformId, sensor, event'
      });
    }
    
    if (!['entry', 'exit'].includes(sensor)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sensor type. Must be "entry" or "exit"'
      });
    }
    
    if (!['break', 'make'].includes(event)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type. Must be "break" or "make"'
      });
    }
    
    // Rate limiting
    if (!checkRateLimit(platformId)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Maximum 10 events per second per platform.'
      });
    }
    
    // Process sensor event
    const { isSimulation } = req.body;
    const result = processSensorEvent(platformId, sensor, event, ts, !!isSimulation);
    
    if (!result.processed) {
      return res.status(200).json({
        success: true,
        processed: false,
        reason: result.reason || 'unknown'
      });
    }
    
    // Emit real-time update
    const platforms = getAllPlatforms();
    emit('platforms_updated', platforms);
    
    res.json({
      success: true,
      processed: true,
      delta: result.delta,
      updated: result.updated
    });
  } catch (error) {
    console.error('[Sensor Route] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

