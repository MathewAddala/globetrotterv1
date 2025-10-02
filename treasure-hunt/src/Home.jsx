import React, { useState, useEffect } from 'react';
import playerService from './services/playerService.js';
import Leaderboard from './Leaderboard.jsx';

// Utility: simple custom modal for themed notifications
const showMessage = (text) => {
    const container = document.getElementById('notification-modal') || (() => {
        const div = document.createElement('div');
        div.id = 'notification-modal';
        document.body.appendChild(div);
        return div;
    })();
    container.textContent = text;
    container.style.display = 'block';
    setTimeout(() => { container.style.display = 'none'; }, 3000);
};

// Animated ship component
function AnimatedShip() {
    return (
        <div className="animated-ship-container">
            <svg width="150" height="150" viewBox="0 0 150 150" className="ship-svg">
                <defs>
                    <filter id="creased" x="-50%" y="-50%" width="200%" height="200%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.09" numOctaves="3" result="noise" />
                        <feDiffuseLighting in="noise" lightingColor="#D2B48C" surfaceScale="2">
                            <feDistantLight azimuth="45" elevation="60" />
                        </feDiffuseLighting>
                    </filter>
                </defs>
                <path d="M 25 115 C 30 125, 120 125, 125 115 L 115 95 L 35 95 Z" fill="#6F4E37" stroke="#4a2e1d" strokeWidth="2"/>
                <path d="M 75 95 L 75 25" stroke="#6F4E37" strokeWidth="4" />
                <path d="M 78 30 C 95 40, 95 60, 78 70 Z" fill="#F5DEB3" stroke="#C19A6B" strokeWidth="1.5" filter="url(#creased)"/>
                <path d="M 72 35 C 55 45, 55 65, 72 75 Z" fill="#F5DEB3" stroke="#C19A6B" strokeWidth="1.5" filter="url(#creased)"/>
                <polygon points="78,25 110,35 78,45" fill="#222" stroke="white" strokeWidth="1"/>
                <text x="88" y="42" fill="white" fontSize="14" fontFamily="serif" textAnchor="middle">☠</text>
            </svg>
            <div className="water"><div className="wave"></div><div className="wave"></div></div>
        </div>
    );
}

export default function Home({ onStartGame, player, setPlayer, leaders: propLeaders = null }) {
    const [usernameInput, setUsernameInput] = useState('');
    const [leaders, setLeaders] = useState(propLeaders || []);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (propLeaders) setLeaders(propLeaders.slice(0, 10));
    }, [propLeaders]);

    const handleCreatePlayer = async () => {
        const name = (usernameInput || '').trim();
        if (!name || name.length < 2) return showMessage("Ye captain's name must be longer!");
        if (isTransitioning) return;

        const allPlayers = await playerService.fetchLeaderboard(100);
        const existingPlayer = allPlayers.find(l => l.username.toLowerCase() === name.toLowerCase());
        
        let p;
        if (existingPlayer) {
            p = { ...existingPlayer };
            showMessage(`Welcome back, Captain ${name}!`);
        } else {
            const id = playerService.generatePlayerId(name);
            p = { id, username: name, score: 0, createdAt: Date.now() };
            showMessage(`Welcome aboard, Captain ${name}!`);
        }
        
        playerService.setLocalPlayer(p);
        await playerService.savePlayerScore(p.id, p.username, p.score);
        setPlayer(p);
        
        setIsTransitioning(true);
        setTimeout(() => onStartGame(p), 1200);
    };

    const handleClearLeaderboard = () => {
        playerService.clearAllLocalPlayers();
        setPlayer(null); // Clear the active player state
        setUsernameInput(''); // Clear input field
        showMessage("The entire crew has been scuttled!");
    };

    return (
        <div className={`home-container-revamped ${isTransitioning ? 'fade-out' : ''}`}>
            <div className="home-background-image" />
            <div className="home-content-wrapper">
                <h1 className="main-title">GlobeTrekker</h1>
                <div className="main-panel">
                    <div className="adventure-awaits-panel">
                        <div className="panel-header">ADVENTURE AWAITS!</div>
                        <div className="panel-content">
                            <div className="username-entry">
                                <input
                                    className="themed-input"
                                    placeholder="Enter your captain's name"
                                    value={usernameInput}
                                    onChange={e => setUsernameInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreatePlayer(); }}
                                />
                                <button 
                                    className="themed-button"
                                    onClick={handleCreatePlayer}
                                    disabled={usernameInput.length < 2}
                                >
                                    Begin Quest
                                </button>
                            </div>
                            <button className="themed-button ghost small" onClick={handleClearLeaderboard}>
                                Scuttle Crew
                            </button>
                        </div>
                    </div>

                    <div className="map-and-leaderboard-panel">
                         <div className="map-side">
                            <div className="map-drawing">
                                <AnimatedShip />
                                <div className="grand-prize-text">The Grand Prize</div>
                            </div>
                         </div>
                         <div className="leaderboard-side">
                            <Leaderboard limit={8} leaders={leaders} currentPlayerId={player?.id} />
                         </div>
                    </div>
                </div>
            </div>
            <div id="notification-modal" className="themed-notification"></div>
        </div>
    );
}