const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * API client for backend communication
 */
export const api = {
  /**
   * Get all platforms
   */
  async getPlatforms() {
    const response = await fetch(`${BACKEND_URL}/api/platforms`);
    if (!response.ok) {
      throw new Error(`Failed to fetch platforms: ${response.statusText}`);
    }
    const data = await response.json();
    return data.platforms || [];
  },

  /**
   * Get platform by ID
   */
  async getPlatform(id) {
    const response = await fetch(`${BACKEND_URL}/api/platforms/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch platform: ${response.statusText}`);
    }
    const data = await response.json();
    return data.platform;
  },

  /**
   * Submit sensor event
   */
  async submitSensorEvent(platformId, sensor, event, ts = null) {
    const response = await fetch(`${BACKEND_URL}/api/sensor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platformId,
        sensor,
        event,
        ts: ts || new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to submit sensor event: ${response.statusText}`);
    }
    
    return await response.json();
  },

  /**
   * Simulate entries (for testing)
   */
  async simulateEntries(platformId, count) {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(
        this.submitSensorEvent(platformId, 'entry', 'break')
      );
    }
    return Promise.all(promises);
  },

  /**
   * Simulate exits (for testing)
   */
  async simulateExits(platformId, count) {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(
        this.submitSensorEvent(platformId, 'exit', 'break')
      );
    }
    return Promise.all(promises);
  },

  /**
   * Update platform area (admin)
   */
  async updatePlatformArea(platformId, area, adminKey) {
    const response = await fetch(`${BACKEND_URL}/api/admin/platforms/${platformId}/area`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey
      },
      body: JSON.stringify({ area })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update platform area: ${response.statusText}`);
    }
    
    return await response.json();
  },

  /**
   * Reset platform count (admin)
   */
  async resetPlatformCount(platformId, adminKey) {
    const response = await fetch(`${BACKEND_URL}/api/admin/platforms/${platformId}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to reset platform count: ${response.statusText}`);
    }
    
    return await response.json();
  },

  /**
   * Get active redirects (admin)
   */
  async getRedirects(adminKey) {
    const response = await fetch(`${BACKEND_URL}/api/admin/redirects`, {
      headers: {
        'X-Admin-Key': adminKey
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to fetch redirects: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.redirects || [];
  },

  /**
   * Get escalations (admin)
   */
  async getEscalations(adminKey, limit = 10) {
    const response = await fetch(`${BACKEND_URL}/api/admin/escalations?limit=${limit}`, {
      headers: {
        'X-Admin-Key': adminKey
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to fetch escalations: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.escalations || [];
  },

  /**
   * Health check
   */
  async healthCheck() {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return await response.json();
  }
};

