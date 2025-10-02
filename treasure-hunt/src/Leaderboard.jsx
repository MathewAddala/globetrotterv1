import React from 'react';

export default function Leaderboard({ limit = 10, leaders = [], currentPlayerId = null }) {
  return (
    <div className="leaderboard-container">
      <h4>Top Captains</h4>
      {leaders && leaders.length > 0 ? (
        <ol className="leaderboard-list-revamped">
          {leaders.slice(0, limit).map((p, i) => (
            <li key={p.id || i} className={p.id === currentPlayerId ? 'current-player' : ''}>
              <span className="rank">#{i+1}</span>
              <span className="username">{p.username || 'A mysterious sailor'}</span>
              <span className="score">{p.score || 0} pts</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="no-scores">The leaderboard is empty. Be the first to make your mark!</div>
      )}
    </div>
  );
}
