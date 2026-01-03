import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

/**
 * Initialize database connection and create schema
 */
export function initDB() {
  const dbPath = path.join(__dirname, '..', 'db.sqlite');
  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create platforms table
  db.exec(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      area REAL NOT NULL DEFAULT 1000.0,
      count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create sensor_events table (for debouncing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sensor_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_id INTEGER NOT NULL,
      sensor TEXT NOT NULL,
      event TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      processed INTEGER DEFAULT 0,
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    )
  `);
  
  // Create redirects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS redirects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_platform_id INTEGER NOT NULL,
      to_platform_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      cleared_at DATETIME,
      attempt INTEGER DEFAULT 1,
      FOREIGN KEY (from_platform_id) REFERENCES platforms(id),
      FOREIGN KEY (to_platform_id) REFERENCES platforms(id)
    )
  `);
  
  // Create escalations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS escalations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    )
  `);
  
  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sensor_events_platform_timestamp 
    ON sensor_events(platform_id, timestamp);
    
    CREATE INDEX IF NOT EXISTS idx_redirects_from_platform 
    ON redirects(from_platform_id, cleared_at);
    
    CREATE INDEX IF NOT EXISTS idx_escalations_platform 
    ON escalations(platform_id, resolved_at);
  `);
  
  console.log('[DB] Database initialized at:', dbPath);
}

/**
 * Get database instance
 */
export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDB() {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] Database connection closed');
  }
}

/**
 * Get all platforms with current status
 */
export function getAllPlatforms() {
  const db = getDB();
  const densitySafe = parseFloat(process.env.DENSITY_SAFE || '0.40');
  const densityModerate = parseFloat(process.env.DENSITY_MODERATE || '0.70');
  return db.prepare(`
    SELECT 
      id,
      name,
      area,
      count,
      CASE 
        WHEN (CAST(count AS REAL) / area) < ? THEN 'SAFE'
        WHEN (CAST(count AS REAL) / area) < ? THEN 'MODERATE'
        ELSE 'OVERCROWDED'
      END as status,
      (CAST(count AS REAL) / area) as density
    FROM platforms
    ORDER BY id
  `).all(densitySafe, densityModerate);
}

/**
 * Get platform by ID
 */
export function getPlatformById(id) {
  const db = getDB();
  const densitySafe = parseFloat(process.env.DENSITY_SAFE || '0.40');
  const densityModerate = parseFloat(process.env.DENSITY_MODERATE || '0.70');
  return db.prepare(`
    SELECT 
      id,
      name,
      area,
      count,
      CASE 
        WHEN (CAST(count AS REAL) / area) < ? THEN 'SAFE'
        WHEN (CAST(count AS REAL) / area) < ? THEN 'MODERATE'
        ELSE 'OVERCROWDED'
      END as status,
      (CAST(count AS REAL) / area) as density
    FROM platforms
    WHERE id = ?
  `).get(densitySafe, densityModerate, id);
}

/**
 * Update platform count
 */
export function updatePlatformCount(id, delta) {
  const db = getDB();
  // Get current count first
  const platform = db.prepare('SELECT count FROM platforms WHERE id = ?').get(id);
  if (!platform) {
    return false;
  }
  const newCount = Math.max(0, platform.count + delta);
  const result = db.prepare(`
    UPDATE platforms 
    SET count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newCount, id);
  
  return result.changes > 0;
}

/**
 * Reset platform count to 0
 */
export function resetPlatformCount(id) {
  const db = getDB();
  const result = db.prepare(`
    UPDATE platforms 
    SET count = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);
  
  return result.changes > 0;
}

/**
 * Update platform area
 */
export function updatePlatformArea(id, area) {
  const db = getDB();
  const result = db.prepare(`
    UPDATE platforms 
    SET area = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(area, id);
  
  return result.changes > 0;
}

/**
 * Insert sensor event
 */
export function insertSensorEvent(platformId, sensor, event, timestamp) {
  const db = getDB();
  const result = db.prepare(`
    INSERT INTO sensor_events (platform_id, sensor, event, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(platformId, sensor, event, timestamp);
  
  return result.lastInsertRowid;
}

/**
 * Get active redirect for platform
 */
export function getActiveRedirect(platformId) {
  const db = getDB();
  return db.prepare(`
    SELECT * FROM redirects
    WHERE from_platform_id = ? AND cleared_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `).get(platformId);
}

/**
 * Create redirect
 */
export function createRedirect(fromPlatformId, toPlatformId, attempt = 1) {
  const db = getDB();
  const result = db.prepare(`
    INSERT INTO redirects (from_platform_id, to_platform_id, attempt)
    VALUES (?, ?, ?)
  `).run(fromPlatformId, toPlatformId, attempt);
  
  return result.lastInsertRowid;
}

/**
 * Clear redirect
 */
export function clearRedirect(platformId) {
  const db = getDB();
  const result = db.prepare(`
    UPDATE redirects
    SET cleared_at = CURRENT_TIMESTAMP
    WHERE from_platform_id = ? AND cleared_at IS NULL
  `).run(platformId);
  
  return result.changes > 0;
}

/**
 * Get all active redirects
 */
export function getAllActiveRedirects() {
  const db = getDB();
  return db.prepare(`
    SELECT 
      r.*,
      p1.name as from_platform_name,
      p2.name as to_platform_name
    FROM redirects r
    JOIN platforms p1 ON r.from_platform_id = p1.id
    JOIN platforms p2 ON r.to_platform_id = p2.id
    WHERE r.cleared_at IS NULL
    ORDER BY r.created_at DESC
  `).all();
}

/**
 * Create escalation
 */
export function createEscalation(platformId, reason) {
  const db = getDB();
  const result = db.prepare(`
    INSERT INTO escalations (platform_id, reason)
    VALUES (?, ?)
  `).run(platformId, reason);
  
  return result.lastInsertRowid;
}

/**
 * Get recent escalations
 */
export function getRecentEscalations(limit = 10) {
  const db = getDB();
  return db.prepare(`
    SELECT 
      e.*,
      p.name as platform_name
    FROM escalations e
    JOIN platforms p ON e.platform_id = p.id
    WHERE e.resolved_at IS NULL
    ORDER BY e.created_at DESC
    LIMIT ?
  `).all(limit);
}

/**
 * Get redirect attempt count for platform
 */
export function getRedirectAttemptCount(platformId) {
  const db = getDB();
  const result = db.prepare(`
    SELECT MAX(attempt) as max_attempt
    FROM redirects
    WHERE from_platform_id = ? AND cleared_at IS NULL
  `).get(platformId);
  
  return result?.max_attempt || 0;
}

