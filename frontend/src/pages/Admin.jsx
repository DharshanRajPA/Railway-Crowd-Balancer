import { useState, useEffect } from 'react';
import { api } from '../api';
import './Admin.css';

const ADMIN_KEY = 'demo_key_change_in_production';

function Admin({ platforms, redirects, onPlatformUpdate, onRedirectsUpdate }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('adminKey') || '');
  const [authenticated, setAuthenticated] = useState(false);
  const [escalations, setEscalations] = useState([]);
  const [editingArea, setEditingArea] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (adminKey) {
      checkAuth();
      loadEscalations();
    }
  }, [adminKey]);

  const checkAuth = async () => {
    try {
      // Try to fetch redirects as auth check
      await api.getRedirects(adminKey);
      setAuthenticated(true);
      localStorage.setItem('adminKey', adminKey);
    } catch (err) {
      setAuthenticated(false);
      localStorage.removeItem('adminKey');
    }
  };

  const loadEscalations = async () => {
    if (!adminKey) return;
    
    try {
      const data = await api.getEscalations(adminKey, 10);
      setEscalations(data);
    } catch (err) {
      console.error('Failed to load escalations:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    await checkAuth();
    if (!authenticated) {
      setError('Invalid admin key');
    }
  };

  const handleUpdateArea = async (platformId, newArea) => {
    if (!adminKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await api.updatePlatformArea(platformId, newArea, adminKey);
      setEditingArea({ ...editingArea, [platformId]: false });
      onPlatformUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCount = async (platformId) => {
    if (!adminKey) return;
    
    if (!confirm(`Reset count for ${platforms.find(p => p.id === platformId)?.name}?`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await api.resetPlatformCount(platformId, adminKey);
      onPlatformUpdate();
      onRedirectsUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="admin-login">
        <h2>Admin Panel</h2>
        <form onSubmit={handleLogin}>
          <label>
            Admin Key:
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key"
              autoFocus
            />
          </label>
          <button type="submit">Login</button>
          {error && <div className="error-message">{error}</div>}
        </form>
        <p className="hint">Default key: demo_key_change_in_production</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <button onClick={() => {
          setAuthenticated(false);
          setAdminKey('');
          localStorage.removeItem('adminKey');
        }} className="btn-logout">
          Logout
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="admin-sections">
        <section className="admin-section">
          <h3>Platform Management</h3>
          <div className="platforms-table">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Count</th>
                  <th>Area (m²)</th>
                  <th>Density</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((platform) => (
                  <tr key={platform.id}>
                    <td>{platform.name}</td>
                    <td>{platform.count}</td>
                    <td>
                      {editingArea[platform.id] ? (
                        <input
                          type="number"
                          defaultValue={platform.area}
                          onBlur={(e) => {
                            const newArea = parseFloat(e.target.value);
                            if (newArea > 0 && newArea !== platform.area) {
                              handleUpdateArea(platform.id, newArea);
                            } else {
                              setEditingArea({ ...editingArea, [platform.id]: false });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newArea = parseFloat(e.target.value);
                              if (newArea > 0 && newArea !== platform.area) {
                                handleUpdateArea(platform.id, newArea);
                              } else {
                                setEditingArea({ ...editingArea, [platform.id]: false });
                              }
                            } else if (e.key === 'Escape') {
                              setEditingArea({ ...editingArea, [platform.id]: false });
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => setEditingArea({ ...editingArea, [platform.id]: true })}
                          className="editable"
                        >
                          {platform.area}
                        </span>
                      )}
                    </td>
                    <td>{(platform.density * 100).toFixed(1)}%</td>
                    <td>
                      <span className={`status-badge status-${platform.status.toLowerCase()}`}>
                        {platform.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleResetCount(platform.id)}
                        disabled={loading}
                        className="btn-reset"
                      >
                        Reset Count
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-section">
          <h3>Active Redirects</h3>
          {redirects.length === 0 ? (
            <p className="empty-message">No active redirects</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Attempt</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {redirects.map((redirect) => (
                  <tr key={redirect.id}>
                    <td>{redirect.from_platform_name}</td>
                    <td>{redirect.to_platform_name}</td>
                    <td>{redirect.attempt}</td>
                    <td>{new Date(redirect.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-section">
          <h3>Recent Escalations</h3>
          {escalations.length === 0 ? (
            <p className="empty-message">No escalations</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Reason</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {escalations.map((escalation) => (
                  <tr key={escalation.id}>
                    <td>{escalation.platform_name}</td>
                    <td>{escalation.reason}</td>
                    <td>{new Date(escalation.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

export default Admin;

