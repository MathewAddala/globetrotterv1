import React, { useEffect, useState } from 'react';
import playerService from './services/playerService';

export default function Leaderboard({ limit = 10 }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await playerService.fetchLeaderboard(limit);
      if (mounted) setLeaders(rows || []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [limit]);

  if (loading) return <div className="leaderboard">Loading leaderboard...</div>;
  return (
    <div className="leaderboard">
      <h4>Leaderboard</h4>
      {leaders.length === 0 ? <div className="empty">No scores yet</div> : (
        <ol>
          {leaders.map((p, i) => (
            <li key={p.id || i}><strong>{p.username || 'player'}</strong> — {p.score || 0} pts</li>
          ))}
        </ol>
      )}
    </div>
  );
}
