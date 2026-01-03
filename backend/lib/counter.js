import { getDB, insertSensorEvent, updatePlatformCount } from './db.js';

const DEBOUNCE_MS = parseInt(process.env.DEBOUNCE_MS || '600', 10);

// In-memory debounce tracking: platformId -> { sensor -> lastTimestamp }
const debounceMap = new Map();

/**
 * Process sensor event with debouncing
 * Returns { processed: boolean, reason?: string }
 */
export function processSensorEvent(platformId, sensor, event, timestamp) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'counter.js:processSensorEvent',message:'Sensor event received',data:{platformId,sensor,event,timestamp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const db = getDB();
  const now = timestamp ? new Date(timestamp).getTime() : Date.now();
  
  // Debounce check
  const key = `${platformId}_${sensor}`;
  const lastEvent = debounceMap.get(key);
  
  if (lastEvent && (now - lastEvent) < DEBOUNCE_MS) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'counter.js:processSensorEvent',message:'Event debounced',data:{platformId,sensor,debounceMs:now-lastEvent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return { processed: false, reason: 'debounced' };
  }
  
  // Update debounce map
  debounceMap.set(key, now);
  
  // Store event in database
  insertSensorEvent(platformId, sensor, event, new Date(timestamp || now).toISOString());
  
  // Process count change
  let delta = 0;
  if (sensor === 'entry' && event === 'break') {
    delta = 1;
  } else if (sensor === 'exit' && event === 'break') {
    delta = -1;
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'counter.js:processSensorEvent',message:'Processing count delta',data:{platformId,delta},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (delta !== 0) {
    const updated = updatePlatformCount(platformId, delta);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'counter.js:processSensorEvent',message:'Count updated',data:{platformId,delta,updated},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    return { processed: true, delta, updated };
  }
  
  return { processed: false, reason: 'invalid_sensor_event' };
}

/**
 * Calculate density for a platform
 */
export function calculateDensity(count, area) {
  if (!area || area <= 0) return 0;
  return Math.max(0, Math.min(1, count / area));
}

/**
 * Get density status
 */
export function getDensityStatus(density) {
  const safeThreshold = parseFloat(process.env.DENSITY_SAFE || '0.40');
  const moderateThreshold = parseFloat(process.env.DENSITY_MODERATE || '0.70');
  
  if (density < safeThreshold) {
    return 'SAFE';
  } else if (density < moderateThreshold) {
    return 'MODERATE';
  } else {
    return 'OVERCROWDED';
  }
}

/**
 * Clear debounce map (useful for testing)
 */
export function clearDebounceMap() {
  debounceMap.clear();
}

