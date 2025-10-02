import React, { useState, useEffect, useCallback, useRef } from 'react';
import playerService from './services/playerService.js';
import Leaderboard from './Leaderboard.jsx';

// Utility: simple custom modal replacement for alert()
const showMessage = (text) => {
    const container = document.getElementById('notification-modal') || (() => {
        const div = document.createElement('div');
        div.id = 'notification-modal';
        div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);padding:20px 40px;background:rgba(0,0,0,0.8);color:white;border-radius:12px;z-index:10000;box-shadow:0 10px 30px rgba(0,255,255,0.4);backdrop-filter:blur(5px);font-family:sans-serif;font-weight:bold;text-align:center;';
        document.body.appendChild(div);
        return div;
    })();
    container.textContent = text;
    container.style.display = 'block';
    setTimeout(() => { container.style.display = 'none'; }, 3000);
};

export default function Home({ onStartGame, player, setPlayer, totalPoints, leaders: propLeaders = null }) {
    const [usernameInput, setUsernameInput] = useState('');
    const [leaders, setLeaders] = useState(propLeaders || []);
    const [loadingLeaders, setLoadingLeaders] = useState(!propLeaders);
    const chestRef = useRef(null);
    const animatingRef = useRef(false);
    const [isCinematic, setIsCinematic] = useState(false);
    const overlayRef = useRef(null);

    // If there is an active recorded player in localStorage, load it to show the session state
    useEffect(() => {
        const lp = playerService.getLocalPlayer();
        if (lp && !player) {
            setPlayer(lp);
        }
    }, []);

    // If the parent passes the leaders (real-time subscription from App), prefer that.
    useEffect(() => {
        if (propLeaders) {
            setLeaders(propLeaders.slice(0, 12));
            setLoadingLeaders(false);
        } else {
            // otherwise, load once from service
            let mounted = true;
            (async () => {
                setLoadingLeaders(true);
                const rows = await playerService.fetchLeaderboard(12);
                if (mounted) setLeaders(rows || []);
                setLoadingLeaders(false);
            })();
            return () => { mounted = false; };
        }
    }, [propLeaders]);

    
    const handleCreatePlayer = async () => {
        const name = (usernameInput || '').trim();
        if (!name || name.length < 2) return showMessage('Please enter a username (2+ characters).');

        // Check if a player with this name already exists in the current leaderboard session (case-insensitive)
        const existingPlayer = leaders.find(l => l.username.toLowerCase() === name.toLowerCase());

        let p;
        if (existingPlayer) {
            // If they exist, use their existing ID and score
            p = { id: existingPlayer.id, username: existingPlayer.username, score: existingPlayer.score, createdAt: existingPlayer.createdAt || Date.now() };
            showMessage(`Welcome back, ${existingPlayer.username}! Continuing your score of ${existingPlayer.score} pts.`);
        } else {
            // Create new player
            const id = playerService.generatePlayerId(name);
            p = { id, username: name, score: 0, createdAt: Date.now() };
            showMessage(`Welcome, ${name}! Start your treasure hunt!`);
        }
        
        // Save to session storage and update local state
        playerService.setLocalPlayer(p);
        setPlayer(p);
        setUsernameInput('');

        // Play chest open animation then cinematic overlay and start
        try {
            if (chestRef.current && window.anime) {
                animatingRef.current = true;
                // disable inputs during the chest animation
                setIsCinematic(true);
                await new Promise(res => {
                    window.anime({
                        targets: chestRef.current,
                        scale: [1, 1.16, 1],
                        rotate: [0, -10, 0],
                        duration: 680,
                        easing: 'easeInOutQuad',
                        complete: () => { animatingRef.current = false; res(); }
                    });
                });
            }
        } catch (e) { /* ignore */ }

    // Update the session leaderboard
    await playerService.savePlayerScore(p.id, p.username, p.score);
    reloadLeaders();

        // Run a cinematic overlay sequence then start the game
        try {
            await runCinematicSequence();
        } catch (e) { /* ignore animation errors */ }
        setIsCinematic(false);
        onStartGame(p);
    };

    const handleSignOut = () => {
        playerService.removeActivePlayer();
        setPlayer(null);
        setUsernameInput('');
        showMessage('Signed out. Choose or create a different explorer.');
    };

    // Cinematic overlay sequence returns a promise that resolves when animation finishes
    const runCinematicSequence = () => {
        return new Promise((resolve) => {
            if (!overlayRef.current || !window.anime) return resolve();
            setIsCinematic(true);
            const overlay = overlayRef.current;
            overlay.innerHTML = '';
            // create radial burst particles
            const particleCount = 28;
            for (let i = 0; i < particleCount; i++) {
                const p = document.createElement('div');
                p.className = 'cinema-particle';
                p.style.left = '50%';
                p.style.top = '50%';
                overlay.appendChild(p);
            }
            // animate overlay fade-in and particle blast
            window.anime.timeline({
                begin() {
                    overlay.style.pointerEvents = 'none';
                }
            })
            .add({ targets: overlay, opacity: [0, 1], duration: 420, easing: 'easeOutQuad' })
            .add({
                targets: '.cinema-particle',
                translateX() { return function() { return (Math.random() - 0.5) * 1200; }; },
                translateY() { return function() { return (Math.random() - 0.5) * 800; }; },
                scale: [0.2, 1.2],
                opacity: [0.9, 0],
                duration: 900,
                delay: (el, i) => i * 20,
                easing: 'easeOutExpo'
            })
            .add({ targets: overlay, opacity: [1, 0], duration: 480, easing: 'easeInQuad', delay: 120 })
            .finished.then(() => {
                // cleanup
                overlay.innerHTML = '';
                setIsCinematic(false);
                resolve();
            });
        });
    };
    
    // helper to reload leaders (used after saving scores)
    const reloadLeaders = async () => {
        try {
            const rows = await playerService.fetchLeaderboard(12);
            setLeaders(rows || []);
        } catch (e) { /* ignore */ }
    };

    // Highlight the currently playing session user on the leaderboard
    const currentPlayerId = player?.id;

    return (
        <div className="home-container gamified">
            <div className="home-header">
                <h1 className="glow">GlobeTrekker</h1>
                <p className="tagline">Spin. Discover. Conquer the map.</p>
            </div>

            <div className="home-main-row">
                <div className="chest-area" ref={chestRef} aria-hidden>
                    <svg className="chest-svg" width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g1" x1="0" x2="1"><stop offset="0%" stopColor="#c98f2a"/><stop offset="100%" stopColor="#ffd86b"/></linearGradient>
                            <linearGradient id="g2" x1="0" x2="1"><stop offset="0%" stopColor="#6b3e1a"/><stop offset="100%" stopColor="#2b1608"/></linearGradient>
                        </defs>
                        <rect x="12" y="46" rx="14" ry="14" width="176" height="88" fill="url(#g2)" stroke="#2b1200" strokeWidth="2" />
                        <rect x="18" y="26" rx="10" ry="10" width="164" height="36" fill="url(#g1)" stroke="#a0631b" strokeWidth="2" />
                        <rect x="38" y="64" width="124" height="8" fill="#ffd86b" opacity="0.85" />
                        <g fill="#ffd86b" opacity="0.95"><circle cx="56" cy="96" r="6"/><circle cx="100" cy="96" r="6"/><circle cx="144" cy="96" r="6"/></g>
                        <rect x="22" y="70" width="156" height="8" fill="rgba(0,0,0,0.08)" />
                    </svg>
                </div>

                <div className="leaderboard-panel gamified">
                    <Leaderboard limit={12} leaders={leaders} currentPlayerId={currentPlayerId} />
                </div>
            </div>

            <div className="player-entry-card gamified">
                {player && player.id ? (
                    <div className="player-signed-in">
                        <p className="welcome-text">Welcome back, <span className="name-highlight">{player.username}</span> — <span className="score-highlight">{player.score || 0} pts</span></p>
                        <div className="player-controls">
                            <button className="btn ghost big" onClick={handleSignOut} disabled={isCinematic}>Logout</button>
                            <button className="btn ghost" onClick={async () => { await playerService.clearAllLocalPlayers(); setLeaders([]); showMessage('Local leaderboard cleared.'); }} disabled={isCinematic}>Reset Local Leaderboard</button>
                        </div>
                    </div>
                ) : (
                    <div className="player-sign-up">
                        <input
                            className="username-input gamified"
                            placeholder="Choose your explorer name"
                            value={usernameInput}
                            onChange={e => setUsernameInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && usernameInput.length >= 2 && !isCinematic) handleCreatePlayer(); }}
                            disabled={isCinematic}
                        />
                        <button
                            className="btn primary big gamified-start"
                            onClick={handleCreatePlayer}
                            disabled={isCinematic || usernameInput.length < 2}
                        >
                            Start Adventure!
                        </button>
                    </div>
                )}
            </div>

            {/* cinematic overlay */}
            <div ref={overlayRef} className={"cinema-overlay " + (isCinematic ? 'visible' : '')}></div>
        </div>
    );
}
