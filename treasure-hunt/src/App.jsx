import React, { useState, useEffect, useRef } from 'react';
import Globe from './Globe.jsx';
import TreasureCard from './TreasureCard.jsx';
import playerService from './services/playerService.js';
import { loadTreasureLists, findRandomLandLocation, indianTreasures, internationalTreasures, jackpotLocation, worldWonders, fetchAndCacheImageUrls } from './services/dataService.js';
import Home from './Home.jsx';

const MAPTILER_TOKEN = 'POKHjCgjvtPFhVMQXdBz';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetRotation, setTargetRotation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [revealedTreasures, setRevealedTreasures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const recentHistoryRef = useRef([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    async function initApp() {
        await loadTreasureLists();
        const localPlayer = playerService.getLocalPlayer();
        if (localPlayer) {
          setPlayer(localPlayer);
        }
        setIsLoading(false);
        setIsAuthReady(true);
    }
    initApp();
  }, []);

  const handleStartFromHome = (p) => {
    setPlayer(p);
    setCurrentView('globe');
  };

  useEffect(() => {
    let unsubscribe;
    if (isAuthReady) {
        unsubscribe = playerService.subscribeToLeaderboard(setLeaders, 10);
    }
    return () => { 
      if (unsubscribe) unsubscribe(); 
    };
  }, [isAuthReady]);

  useEffect(() => {
    const maplibregl = window.maplibregl;
    if (currentView === 'map' && currentLocation && maplibregl) {
      if (mapRef.current) mapRef.current.remove();
      
      const newMap = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_TOKEN}`,
        center: [currentLocation.lon, currentLocation.lat], 
        zoom: 3
      });
      mapRef.current = newMap;
      
      newMap.on('load', () => {
        new maplibregl.Marker()
          .setLngLat([currentLocation.lon, currentLocation.lat])
          .setPopup(new maplibregl.Popup({ offset: 25, className: 'themed-popup' }).setText(currentLocation.name))
          .addTo(newMap);
          
        newMap.flyTo({ 
          center: [currentLocation.lon, currentLocation.lat], 
          zoom: 12, 
          duration: 2500 
        });
        
        setTimeout(() => {
            prepareTreasureCards(currentLocation);
        }, 1000);
      });
      
      return () => {
        if (newMap) {
          try { newMap.remove(); } catch (e) { console.warn('Error removing map:', e); }
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, currentLocation]);
  
  const pickNonRepeating = (arr) => {
    if (!arr || arr.length === 0) return null;
    if (arr.length === 1) return arr[0];
    const recent = recentHistoryRef.current || [];
    const pool = arr.filter(a => !recent.includes(a.name));
    const finalPool = pool.length ? pool : arr;
    const pick = finalPool[Math.floor(Math.random() * finalPool.length)];
    recent.unshift(pick.name);
    recent.splice(15);
    recentHistoryRef.current = recent;
    return pick;
  };
  
  const handleSpin = async () => {
    if (isSpinning || (player && player.spinsLeft <= 0)) return;
    setIsSpinning(true);

    const updatedPlayer = { ...player, spinsLeft: player.spinsLeft - 1 };
    setPlayer(updatedPlayer);
    await playerService.savePlayerState(updatedPlayer);
    
    if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* ignore */ }
        mapRef.current = null;
    }
    setRevealedTreasures([]);
    setCurrentLocation(null);

    const chance = Math.random();
    let treasure;
    
    if (chance < 0.1) {
      treasure = jackpotLocation;
    } else if (chance < 0.2) {
      treasure = pickNonRepeating(worldWonders);
    } else if (chance < 0.6) {
      treasure = pickNonRepeating(indianTreasures);
    } else {
      const nonWonderInternationals = internationalTreasures.filter(
        t => !worldWonders.some(w => w.name === t.name)
      );
      treasure = pickNonRepeating(nonWonderInternationals);
    }

    if (!treasure) {
      console.warn("Treasure selection failed, using fallback.");
      treasure = pickNonRepeating(internationalTreasures) || jackpotLocation;
    }
      
    setCurrentLocation(treasure);
    
    const THREE = window.THREE;
    const target = new THREE.Vector3();
    const phi = (90 - treasure.lat) * (Math.PI / 180);
    const theta = (treasure.lon + 180) * (Math.PI / 180);
    target.setFromSphericalCoords(1, phi, theta);
    const mx = new THREE.Matrix4().lookAt(target, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
    const finalRotation = new THREE.Quaternion().setFromRotationMatrix(mx);
    const spinQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 16);
    setTargetRotation(spinQuaternion.multiply(finalRotation));
    
    triggerVortexAnimation();
  };
  
  const triggerVortexAnimation = () => {
    const vortexContainer = document.querySelector('.vortex-container');
    const anime = window.anime;
    if (!vortexContainer || !anime) return;
    vortexContainer.innerHTML = '';
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.classList.add('vortex-particle-themed');
        p.style.top = `${anime.random(0,100)}%`; 
        p.style.left = `${anime.random(0,100)}%`; 
        p.style.opacity = '0';
        vortexContainer.appendChild(p);
    }
    anime({
        targets: '.vortex-particle-themed', opacity: [0, 0.7], scale: [0, 3], duration: 600, easing: 'easeOutExpo', delay: anime.stagger(10),
        complete: () => {
            setCurrentView('map');
            anime({ targets: '.vortex-particle-themed', opacity: 0, duration: 800, easing: 'easeInExpo', delay: anime.stagger(10, {easing: 'easeInCubic'}) });
        }
    });
  };
  
  const handleReset = () => {
      setIsSpinning(false);
      setCurrentView('globe');
      setRevealedTreasures([]);
  };

  const prepareTreasureCards = async (location) => {
    let imageUrls = [];
    if (location.name === jackpotLocation.name) {
        imageUrls = [jackpotLocation.imageUrl, jackpotLocation.imageUrl]; 
    } else {
        imageUrls = await fetchAndCacheImageUrls(location.name);
    }

    let cardsData = [
      { type: 'info', name: location.name, fact: location.description || "A place of great interest!", imageUrl: imageUrls[0], isVisible: false },
      { type: 'photo', name: `A view of ${location.name}`, imageUrl: imageUrls[1] || imageUrls[0], isVisible: false }
    ];

    if (location.lootedMessage) {
        cardsData.push({ type: 'looted', name: 'Empty Handed!', message: location.lootedMessage, isVisible: false });
    } else {
        cardsData.push({ type: 'points', name: 'Doubloons', points: location.points, isVisible: false });
    }

    setRevealedTreasures(cardsData);

    setTimeout(() => {
        setRevealedTreasures(prev => prev.map(c => ({ ...c, isVisible: true })));
    }, 100);

    setTimeout(() => setIsSpinning(false), 1400);
  };

  const handlePointsReveal = async ({ points, rect }) => {
    if (!player || !player.id || points === 0) return;
    const newTotalPoints = (player.score || 0) + (points || 0);
    const updatedPlayer = { ...player, score: newTotalPoints };
    setPlayer(updatedPlayer);
    await playerService.savePlayerState(updatedPlayer);

    const scoreEl = document.querySelector('.player-info-panel');
    if (!scoreEl || !rect) return;

    const scoreRect = scoreEl.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const endX = scoreRect.left + scoreRect.width / 2;
    const endY = scoreRect.top + scoreRect.height / 2;

    for (let i = 0; i < 15; i++) {
        const coin = document.createElement('div');
        coin.classList.add('coin-particle');
        document.body.appendChild(coin);

        const anime = window.anime;

        anime({
            targets: coin,
            left: [startX, endX + anime.random(-20, 20)],
            top: [startY, endY + anime.random(-10, 10)],
            scale: [1, 0.5],
            opacity: [1, 0],
            duration: 600 + anime.random(0, 300),
            easing: 'easeInCubic',
            delay: i * 30,
            complete: () => coin.remove()
        });
    }
  };
  
  const handleSignOut = () => {
    playerService.removeActivePlayer();
    setPlayer(null);
    setCurrentView('home');
    setRevealedTreasures([]);
    setCurrentLocation(null);
  };
  
  const getButtonText = () => {
      if (isSpinning) return 'Sailing...';
      if (player && player.spinsLeft <= 0) return 'Game Over';
      return 'Find Treasure!';
  };

  return (
    <>
      {currentView === 'home' ? (
        <Home onStartGame={handleStartFromHome} player={player} setPlayer={setPlayer} leaders={leaders} />
      ) : (
        <div className="game-view">
          <Globe 
            isSpinning={isSpinning}
            targetRotation={targetRotation}
            isVisible={currentView === 'globe'}
          />
          <div 
            className="map-container" 
            ref={mapContainerRef} 
            style={{ opacity: currentView === 'map' ? 1 : 0, pointerEvents: currentView === 'map' ? 'auto' : 'none' }} 
          >
            <div className="treasure-card-wrapper">
              {revealedTreasures.map((treasure, index) => (
                <TreasureCard key={index} treasure={treasure} onPointsReveal={handlePointsReveal} isVisible={treasure.isVisible} />
              ))}
            </div>
          </div>
          <div className="vortex-container" />

          <div className="ui-container">
            {currentView === 'globe' ? (
                <button 
                  className="themed-button spin-button" 
                  onClick={handleSpin} 
                  disabled={isLoading || isSpinning || (player && player.spinsLeft <= 0)} 
                >
                  {getButtonText()}
                </button>
            ) : (
              // This logic now shows a "Game Over" button when spins run out.
              player && player.spinsLeft > 0 ? (
                <button 
                  className="themed-button play-again-button" 
                  onClick={handleReset} 
                >
                  Sail Again!
                </button>
              ) : (
                <button 
                  className="themed-button game-over-button" 
                  disabled
                >
                  Game Over
                </button>
              )
            )}
          </div>
          
          {player && (
            <div className="player-info-panel">
              <div className="player-name">{player.username}</div>
              <div className="player-score">{player.score || 0} pts</div>
              <div className="player-spins">Spins Left: {player.spinsLeft}</div>
              <button className="themed-button logout-button" onClick={handleSignOut}>
                Abandon Ship
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

