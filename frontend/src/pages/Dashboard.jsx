import { useState, useEffect, useRef } from 'react';
import PlatformCard from '../components/PlatformCard';
import './Dashboard.css';

function Dashboard({ platforms, redirects, onPlatformUpdate }) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioRef = useRef(null);
  const lastRedirectRef = useRef(null);

  // Load audio alert
  useEffect(() => {
    audioRef.current = new Audio('/alert.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Play alert when redirect is issued
  useEffect(() => {
    if (redirects.length > 0 && audioEnabled) {
      const latestRedirect = redirects[0];
      const redirectKey = `${latestRedirect.from_platform_id}_${latestRedirect.id}`;
      
      if (lastRedirectRef.current !== redirectKey) {
        lastRedirectRef.current = redirectKey;
        
        // Try to play audio, fallback to beep if file not found
        if (audioRef.current) {
          audioRef.current.play().catch(() => {
            // Fallback to beep
            const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OSdTQ8OUKjl8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKR5/g8r5sIQUrgc7y2Yk2CBtpvfDknU0PDlCo5fC2YxwGOJHX8sx5LAUkd8fw3ZBAC');
            beep.play().catch(() => {});
          });
        }
      }
    }
  }, [redirects, audioEnabled]);

  const getRedirectForPlatform = (platformId) => {
    return redirects.find(r => r.from_platform_id === platformId && !r.cleared_at);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Platform Status Dashboard</h2>
        <div className="dashboard-controls">
          <label>
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
            />
            Enable Audio Alerts
          </label>
          <button onClick={onPlatformUpdate} className="btn-refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      {platforms.length === 0 ? (
        <div className="empty-state">
          <p>No platforms found. Please seed the database.</p>
        </div>
      ) : (
        <div className="platforms-grid">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              redirect={getRedirectForPlatform(platform.id)}
              onUpdate={onPlatformUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

