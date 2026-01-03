import { getDB, insertSensorEvent, updatePlatformCount } from './db.js';

const DEBOUNCE_MS = parseInt(process.env.DEBOUNCE_MS || '600', 10);

// In-memory debounce tracking: platformId -> { sensor -> lastTimestamp }
const debounceMap = new Map();

/**
 * Process sensor event with debouncing
 * Returns { processed: boolean, reason?: string }
 */
export function processSensorEvent(platformId, sensor, event, timestamp, isSimulation = false) {
  const db = getDB();
  const now = timestamp ? new Date(timestamp).getTime() : Date.now();
  
  // Debounce check - bypass if simulation
  const key = `${platformId}_${sensor}`;
  const lastEvent = debounceMap.get(key);
  
  if (!isSimulation && lastEvent && (now - lastEvent) < DEBOUNCE_MS) {
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
  
  if (delta !== 0) {
    const updated = updatePlatformCount(platformId, delta);
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

