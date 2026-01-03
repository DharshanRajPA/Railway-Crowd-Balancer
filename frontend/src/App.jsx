import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { api } from './api';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function App() {
  const [platforms, setPlatforms] = useState([]);
  const [redirects, setRedirects] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    
    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server');
      setError(null);
    });
    
    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });
    
    newSocket.on('platforms_updated', (data) => {
      console.log('[Socket] Platforms updated:', data);
      setPlatforms(data);
    });
    
    newSocket.on('redirect_issued', (data) => {
      console.log('[Socket] Redirect issued:', data);
      loadRedirects();
    });
    
    newSocket.on('redirect_cleared', (data) => {
      console.log('[Socket] Redirect cleared:', data);
      loadRedirects();
    });
    
    newSocket.on('escalation_created', (data) => {
      console.log('[Socket] Escalation created:', data);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadPlatforms();
    loadRedirects();
  }, []);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      const data = await api.getPlatforms();
      setPlatforms(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load platforms:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRedirects = async () => {
    try {
      // Only load redirects if we have admin key (for admin panel)
      // For now, we'll load them anyway but handle errors gracefully
      const adminKey = localStorage.getItem('adminKey');
      if (adminKey) {
        const data = await api.getRedirects(adminKey);
        setRedirects(data);
      }
    } catch (err) {
      // Silently fail if not admin
      console.debug('Failed to load redirects (may not be admin):', err);
    }
  };

  if (loading && platforms.length === 0) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading platform data...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚉 Railway Crowd Balancer</h1>
        <nav className="app-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'admin' ? 'active' : ''}
            onClick={() => setActiveTab('admin')}
          >
            Admin Panel
          </button>
        </nav>
      </header>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard
            platforms={platforms}
            redirects={redirects}
            onPlatformUpdate={loadPlatforms}
          />
        )}
        {activeTab === 'admin' && (
          <Admin
            platforms={platforms}
            redirects={redirects}
            onPlatformUpdate={loadPlatforms}
            onRedirectsUpdate={loadRedirects}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Smart Indian Railway Platform Crowd Balancer (SIRCB)</p>
      </footer>
    </div>
  );
}

export default App;

