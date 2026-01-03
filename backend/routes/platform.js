import express from 'express';
import { getAllPlatforms, getPlatformById, updatePlatformArea, resetPlatformCount, clearRedirect } from '../lib/db.js';
import { emit } from '../lib/realtime.js';

const router = express.Router();

/**
 * GET /api/platforms
 * Get all platforms with current status
 */
router.get('/platforms', (req, res) => {
  try {
    const platforms = getAllPlatforms();
    res.json({
      success: true,
      platforms
    });
  } catch (error) {
    console.error('[Platform Route] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/platforms/:id
 * Get platform by ID
 */
router.get('/platforms/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform ID'
      });
    }
    
    const platform = getPlatformById(id);
    
    if (!platform) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found'
      });
    }
    
    res.json({
      success: true,
      platform
    });
  } catch (error) {
    console.error('[Platform Route] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/platforms/:id/area
 * Update platform area (admin only - check in admin route)
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
    
    // Admin check is done in admin route middleware
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
    console.error('[Platform Route] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/platforms/:id/reset
 * Reset platform count (admin only - check in admin route)
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
    
    // Admin check is done in admin route middleware
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
    const platforms = getAllPlatforms();
    emit('platforms_updated', platforms);
    emit('redirect_cleared', { platformId: id });
    
    res.json({
      success: true,
      message: 'Platform count reset'
    });
  } catch (error) {
    console.error('[Platform Route] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

