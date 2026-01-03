import express from 'express';
import { updatePlatformArea, resetPlatformCount, clearRedirect, getAllActiveRedirects, getRecentEscalations } from '../lib/db.js';
import { getAllPlatforms } from '../lib/db.js';
import { emit } from '../lib/realtime.js';

const router = express.Router();

const ADMIN_KEY = process.env.ADMIN_KEY || 'demo_key_change_in_production';

/**
 * Middleware to check admin key
 */
function checkAdminKey(req, res, next) {
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  
  if (!adminKey || adminKey !== ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Invalid or missing admin key.'
    });
  }
  
  next();
}

// Apply admin middleware to all routes
router.use(checkAdminKey);

/**
 * GET /api/admin/redirects
 * Get all active redirects
 */
router.get('/redirects', (req, res) => {
  try {
    const redirects = getAllActiveRedirects();
    res.json({
      success: true,
      redirects
    });
  } catch (error) {
    console.error('[Admin Route] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/redirects/:platformId/clear
 * Clear redirect for a platform
 */
router.post('/redirects/:platformId/clear', (req, res) => {
  try {
    const platformId = parseInt(req.params.platformId, 10);
    
    if (isNaN(platformId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform ID'
      });
    }
    
    const cleared = clearRedirect(platformId);
    
    if (!cleared) {
      return res.status(404).json({
        success: false,
        error: 'No active redirect found for this platform'
      });
    }
    
    // Emit real-time update
    emit('redirect_cleared', { platformId });
    const platforms = getAllPlatforms();
    emit('platforms_updated', platforms);
    
    res.json({
      success: true,
      message: 'Redirect cleared'
    });
  } catch (error) {
    console.error('[Admin Route] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/escalations
 * Get recent escalations
 */
router.get('/escalations', (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const escalations = getRecentEscalations(limit);
    
    res.json({
      success: true,
      escalations
    });
  } catch (error) {
    console.error('[Admin Route] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/platforms/:id/area
 * Update platform area
 */
router.post('/platforms/:id/area', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { area } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform ID'
      });
    }
    
    if (!area || typeof area !== 'number' || area <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid area. Must be a positive number.'
      });
    }
    
    const updated = updatePlatformArea(id, area);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found'
      });
    }
    
    // Emit real-time update
    const platforms = getAllPlatforms();
    emit('platforms_updated', platforms);
    
    res.json({
      success: true,
      message: 'Platform area updated'
    });
  } catch (error) {
    console.error('[Admin Route] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/platforms/:id/reset
 * Reset platform count
 */
router.post('/platforms/:id/reset', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform ID'
      });
    }
    
    const updated = resetPlatformCount(id);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found'
      });
    }
    
    // Clear any active redirects for this platform
    clearRedirect(id);
    
    // Emit real-time update
    emit('redirect_cleared', { platformId: id });
    const platforms = getAllPlatforms();
    emit('platforms_updated', platforms);
    
    res.json({
      success: true,
      message: 'Platform count reset'
    });
  } catch (error) {
    console.error('[Admin Route] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

