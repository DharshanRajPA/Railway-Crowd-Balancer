import dotenv from 'dotenv';
import { getCount, setCount, incrementCount, logEvent, getPlatforms, getPlatform } from './db.js';

dotenv.config();

// Configuration from environment
const DEBOUNCE_MS = parseInt(process.env.DEBOUNCE_MS || '600', 10);
const MAX_EVENTS_PER_SEC = parseInt(process.env.MAX_EVENTS_PER_SEC_PER_PLATFORM || '10', 10);
const DENSITY_SAFE = parseFloat(process.env.DENSITY_SAFE || '0.40');
const DENSITY_MODERATE = parseFloat(process.env.DENSITY_MODERATE || '0.70');

/**
 * DEBOUNCE ALGORITHM
 * 
 * Problem: IR sensors trigger multiple times as a person walks through a gate.
 * Solution: Track the last event time per platform. If a new entry event arrives
 * within DEBOUNCE_MS (default 600ms), ignore it as it's likely the same person.
 * 
 * Rationale: 
 * - Average human walking speed: ~1.4 m/s
 * - Gate width: ~1m
 * - Time to cross: ~700ms
 * - 600ms debounce window ensures we don't double-count the same person
 * 
 * Implementation: Use a Map to track lastEventTime[platformId] = timestamp
 */
const lastEventTime = new Map();

/**
 * RATE LIMITING ALGORITHM
 * 
 * Problem: Prevent sensor spam or malfunction from overwhelming the system.
 * Solution: Sliding window counter per platform. Keep timestamps of recent events
 * in the last 1 second. If count >= MAX_EVENTS_PER_SEC, reject the event.
 * 
 * Rationale:
 * - Normal operation: 1-2 events per second per platform
 * - Malfunction: 100+ events per second
 * - Max 10 events/sec allows for bursts but prevents abuse
 * 
 * Implementation: eventCounters[platformId] = [timestamp1, timestamp2, ...]
 * Clean old timestamps (>1s ago) before checking limit.
 */
const eventCounters = new Map();

/**
 * Clean old timestamps from rate limit counter (keep only last 1 second)
 */
function cleanRateLimitCounter(platformId) {
  const now = Date.now();
  const oneSecondAgo = now - 1000;
  
  if (!eventCounters.has(platformId)) {
    eventCounters.set(platformId, []);
    return;
  }
  
  const timestamps = eventCounters.get(platformId);
  const filtered = timestamps.filter(ts => ts > oneSecondAgo);
  eventCounters.set(platformId, filtered);
}

/**
 * Check if platform has exceeded rate limit
 * @returns {boolean} true if rate limit exceeded
 */
function checkRateLimit(platformId) {
  cleanRateLimitCounter(platformId);
  
  const timestamps = eventCounters.get(platformId) || [];
  
  if (timestamps.length >= MAX_EVENTS_PER_SEC) {
    return true; // Rate limit exceeded
  }
  
  // Add current timestamp
  timestamps.push(Date.now());
  eventCounters.set(platformId, timestamps);
  
  return false; // Within rate limit
}

/**
 * Calculate density (people per square meter)
 * Formula: density = count / area_m2
 * 
 * @param {number} platformId - Platform ID
 * @returns {number} Density value (0.0 to potentially >1.0)
 */
export function calculateDensity(platformId) {
  const platform = getPlatform(platformId);
  if (!platform) {
    return 0;
  }
  
  const count = getCount(platformId);
  const area = platform.area_m2;
  
  if (area <= 0) {
    return 0;
  }
  
  return count / area;
}

/**
 * Classify density level based on thresholds
 * 
 * Thresholds (configurable via .env):
 * - SAFE: density < 0.40 (40% capacity)
 * - MODERATE: 0.40 <= density < 0.70 (40-70% capacity)
 * - OVERCROWDED: density >= 0.70 (70%+ capacity)
 * 
 * @param {number} density - Density value
 * @returns {string} 'SAFE' | 'MODERATE' | 'OVERCROWDED'
 */
export function classifyDensity(density) {
  if (density < DENSITY_SAFE) {
    return 'SAFE';
  } else if (density < DENSITY_MODERATE) {
    return 'MODERATE';
  } else {
    return 'OVERCROWDED';
  }
}

/**
 * Process a sensor event with debounce and rate limiting
 * 
 * This is the CORE counting logic that prevents double-counting and handles
 * entry/exit events to maintain accurate platform counts.
 * 
 * @param {number} platformId - Platform ID
 * @param {string} sensor - Sensor type: 'entry' | 'exit' | 'camera'
 * @param {string} event - Event type: 'break' | 'restore'
 * @param {string} timestamp - ISO timestamp string
 * @returns {object} Result with platform status
 */
export function processSensorEvent(platformId, sensor, event, timestamp) {
  // Validate inputs
  if (!platformId || !sensor || !event || !timestamp) {
    throw new Error('Missing required parameters: platformId, sensor, event, timestamp');
  }
  
  // Check rate limit
  if (checkRateLimit(platformId)) {
    throw new Error(`Rate limit exceeded for platform ${platformId}. Max ${MAX_EVENTS_PER_SEC} events/sec.`);
  }
  
  // Log event to database
  logEvent(platformId, sensor, event, timestamp);
  
  const eventTimestamp = new Date(timestamp).getTime();
  const now = Date.now();
  
  // DEBOUNCE LOGIC: Only apply to entry events
  if (sensor === 'entry' && event === 'break') {
    const lastTime = lastEventTime.get(platformId) || 0;
    const timeSinceLastEvent = eventTimestamp - lastTime;
    
    if (timeSinceLastEvent < DEBOUNCE_MS) {
      // Ignore this event (debounced)
      return {
        platformId,
        count: getCount(platformId),
        density: calculateDensity(platformId),
        level: classifyDensity(calculateDensity(platformId)),
        debounced: true,
        timeSinceLastEvent,
        message: `Event debounced (${timeSinceLastEvent}ms < ${DEBOUNCE_MS}ms)`
      };
    }
    
    // Update last event time
    lastEventTime.set(platformId, eventTimestamp);
  }
  
  // Process event: increment on entry, decrement on exit
  let countDelta = 0;
  
  if (sensor === 'entry' && event === 'break') {
    countDelta = 1; // Person entered
  } else if (sensor === 'exit' && event === 'break') {
    countDelta = -1; // Person exited
  }
  // Note: 'restore' events are logged but don't change count
  // (sensor beam restored after break)
  
  // Update count in database
  if (countDelta !== 0) {
    const newCount = incrementCount(platformId, countDelta);
    
    // Calculate updated status
    const density = calculateDensity(platformId);
    const level = classifyDensity(density);
    
    return {
      platformId,
      count: newCount,
      density,
      level,
      debounced: false,
      timeSinceLastEvent: sensor === 'entry' ? (eventTimestamp - (lastEventTime.get(platformId) || 0)) : null,
      message: `Count ${countDelta > 0 ? 'incremented' : 'decremented'} by ${Math.abs(countDelta)}`
    };
  }
  
  // Event logged but no count change
  return {
    platformId,
    count: getCount(platformId),
    density: calculateDensity(platformId),
    level: classifyDensity(calculateDensity(platformId)),
    debounced: false,
    message: 'Event logged (no count change)'
  };
}

/**
 * Get current status for a platform
 */
export function getPlatformStatus(platformId) {
  const platform = getPlatform(platformId);
  if (!platform) {
    return null;
  }
  
  const count = getCount(platformId);
  const density = calculateDensity(platformId);
  const level = classifyDensity(density);
  
  return {
    id: platform.id,
    name: platform.name,
    area_m2: platform.area_m2,
    count,
    density,
    level
  };
}

/**
 * Get status for all platforms
 */
export function getAllPlatformStatus() {
  const platforms = getPlatforms();
  
  return platforms.map(platform => {
    const density = calculateDensity(platform.id);
    const level = classifyDensity(density);
    
    return {
      id: platform.id,
      name: platform.name,
      area_m2: platform.area_m2,
      count: platform.count || 0,
      density,
      level
    };
  });
}

