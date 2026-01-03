import { useState } from 'react';
import { api } from '../api';
import './PlatformCard.css';

function PlatformCard({ platform, redirect, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const density = platform.density || 0;
  const densityPercent = (density * 100).toFixed(1);
  const status = platform.status || 'SAFE';

  const handleSimulate = async (sensor, count) => {
    setLoading(true);
    setError(null);
    
    try {
      if (sensor === 'entry') {
        await api.simulateEntries(platform.id, count);
      } else {
        await api.simulateExits(platform.id, count);
      }
      
      // Wait a bit for server to process
      setTimeout(() => {
        onUpdate();
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'SAFE':
        return '#4caf50';
      case 'MODERATE':
        return '#ff9800';
      case 'OVERCROWDED':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getDensityBarColor = () => {
    if (density < 0.4) return '#4caf50';
    if (density < 0.7) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className={`platform-card ${status.toLowerCase()}`}>
      <div className="platform-header">
        <h2>{platform.name}</h2>
        <span className="status-badge" style={{ backgroundColor: getStatusColor() }}>
          {status}
        </span>
      </div>

      <div className="platform-stats">
        <div className="stat">
          <label>Count:</label>
          <span className="stat-value">{platform.count || 0}</span>
        </div>
        <div className="stat">
          <label>Area:</label>
          <span className="stat-value">{platform.area || 0} m²</span>
        </div>
        <div className="stat">
          <label>Density:</label>
          <span className="stat-value">{densityPercent}%</span>
        </div>
      </div>

      <div className="density-bar-container">
        <div
          className="density-bar"
          style={{
            width: `${Math.min(100, densityPercent)}%`,
            backgroundColor: getDensityBarColor()
          }}
        />
      </div>

      {redirect && (
        <div className="redirect-banner">
          <strong>⚠️ {platform.name} overcrowded!</strong>
          <p>Please move to {redirect.to_platform_name}</p>
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="platform-controls">
        <button
          onClick={() => handleSimulate('entry', 10)}
          disabled={loading}
          className="btn btn-entry"
        >
          + 10 Entries
        </button>
        <button
          onClick={() => handleSimulate('entry', 5)}
          disabled={loading}
          className="btn btn-entry-small"
        >
          + 5 Entries
        </button>
        <button
          onClick={() => handleSimulate('exit', 8)}
          disabled={loading}
          className="btn btn-exit"
        >
          - 8 Exits
        </button>
        <button
          onClick={() => handleSimulate('exit', 5)}
          disabled={loading}
          className="btn btn-exit-small"
        >
          - 5 Exits
        </button>
      </div>

      {loading && <div className="loading-overlay">Processing...</div>}
    </div>
  );
}

export default PlatformCard;

