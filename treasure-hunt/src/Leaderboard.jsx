import React, { useEffect, useState } from 'react';
import playerService from './services/playerService';

export default function Leaderboard({ limit = 10, leaders: propLeaders = null, currentPlayerId = null }) {
  const [leaders, setLeaders] = useState(propLeaders || []);
  const [loading, setLoading] = useState(!propLeaders);

  useEffect(() => {
    let mounted = true;
    if (propLeaders) {
      setLeaders((propLeaders || []).slice(0, limit));
      setLoading(false);
      return () => { mounted = false; };
    }
    (async () => {
      const rows = await playerService.fetchLeaderboard(limit);
      if (mounted) setLeaders((rows || []).slice(0, limit));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [limit, propLeaders]);

  return (
    <div className="leaderboard">
      <h4>Leaderboard</h4>
      {loading ? <div className="loading">Loading scores...</div> : (
        leaders && leaders.length ? (
          <ol className="leaderboard-list">
            {leaders.map((p, i) => (
              <li key={p.id || i} className={p.id === currentPlayerId ? 'current-player' : ''}>
                <span className="rank">#{i+1}</span>
                <strong className="username-text">{p.username || 'player'}</strong>
                <span className="score-text">{p.score || 0} pts</span>
              </li>
            ))}
          </ol>
        ) : <div className="empty">No scores yet</div>
      )}
    </div>
  );
}
