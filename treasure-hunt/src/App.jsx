import React, { useState, useEffect, useRef } from 'react';
import Globe from './Globe.jsx'; // Corrected import path
import TreasureCard from './TreasureCard.jsx'; // Corrected import path
import playerService from './services/playerService.js'; // Corrected import path
import { loadTreasureLists, findRandomLandLocation, indianTreasures, internationalTreasures, jackpotLocation, fetchWikipediaSummary, worldWonders, fetchWikimediaImages, fetchUnsplashImages } from './services/dataService.js'; // Corrected import path
import Home from './Home.jsx';

// Maptiler key from the original file - assume it's set up externally if needed
const MAPTILER_TOKEN = 'POKHjCgjvtPFhVMQXdBz';

// Utility: simple custom modal replacement for alert()
const showMessage = (text) => {
    // In a real environment, you'd use a state variable and a custom modal component.
    // Here we'll use a simple temporary DOM element.
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

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetRotation, setTargetRotation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [revealedTreasures, setRevealedTreasures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [player, setPlayer] = useState(null); // Managed after auth is ready
  const [usernameInput, setUsernameInput] = useState('');
  const [leaders, setLeaders] = useState([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const recentHistoryRef = useRef([]);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // --- Initialization and Auth Effect ---
  useEffect(() => {
    async function initApp() {
        // 1. Load treasures
        await loadTreasureLists();
        
    // 2. Load local player (localStorage-backed)
    const localPlayer = playerService.getLocalPlayer();
    if (localPlayer) {
      setPlayer(localPlayer);
      setTotalPoints(localPlayer.score || 0);
    }
        
        setIsLoading(false);
        setIsAuthReady(true);
    }
    initApp();
  }, []);

  const handleStartFromHome = (p) => {
    // p is the player object created/selected in Home
    setPlayer(p);
    setTotalPoints(p.score || 0);
    setCurrentView('globe');
  };

  // --- Leaderboard Subscription Effect ---
  useEffect(() => {
    let unsubscribe;
    if (isAuthReady) {
        // Subscribe to real-time leaderboard updates
        unsubscribe = playerService.subscribeToLeaderboard(setLeaders, 12);
    }
    return () => { 
      if (unsubscribe) unsubscribe(); 
    };
  }, [isAuthReady]);


  // --- Map Effect ---
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
          .setPopup(new maplibregl.Popup({ offset: 25 }).setText(currentLocation.name)) // Add a simple popup
          .addTo(newMap);
          
        newMap.flyTo({ 
          center: [currentLocation.lon, currentLocation.lat], 
          zoom: 12, 
          duration: 2500 
        });
        
        // call async prepare function without blocking the map load
        (async () => { await prepareTreasureCards(currentLocation); })();
      });
      
      // Cleanup map on unmount/re-run
      return () => {
        if (newMap) {
          try { newMap.remove(); } catch (e) { console.warn('Error removing map:', e); }
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, currentLocation, isAuthReady]); 
  
  // --- Card Animation Effect ---
  useEffect(() => {
    if (revealedTreasures.length > 0) {
        setTimeout(() => {
            animateCardsIn();
        }, 1200);
    }
  }, [revealedTreasures]);
  
  // Utility: pick a random element that's not the same as recent history (if possible)
  const pickNonRepeating = (arr) => {
    if (!arr || arr.length === 0) return null;
    if (arr.length === 1) return arr[0];
    const recent = recentHistoryRef.current || [];
    const pool = arr.filter(a => !recent.includes(a.name || a.itemLabel?.value || a.itemLabel));
    const finalPool = pool.length ? pool : arr;
    const pick = finalPool[Math.floor(Math.random() * finalPool.length)];
    const nameToRecord = pick.name || pick.itemLabel?.value || pick.itemLabel || '';
    
    // update history (keep last 8 entries)
    if (nameToRecord) {
        recent.unshift(nameToRecord);
        recent.splice(8);
        recentHistoryRef.current = recent;
    }
    return pick;
  };
  
  const handleSpin = async () => {
    if (!player || !player.id) return showMessage('Please create a player profile to start the hunt!');
    if (isSpinning) return;
    setIsSpinning(true);
    
    // Clear previous state
    if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* ignore */ }
        mapRef.current = null;
    }
    setRevealedTreasures([]);
    setCurrentLocation(null);

    try {
      const chance = Math.random();
      let treasure;
      
      if (chance < 0.05) { 
        // 1 in 20 chance to get jackpotLocation (KL University)
        treasure = jackpotLocation;
      } else if (chance < 0.40) { 
        // Indian treasures (35% chance)
        treasure = pickNonRepeating(indianTreasures);
      } else if (chance < 0.75) { 
        // International treasures (35% chance)
        // Prefer preloaded international list; if empty, pick from worldWonders
        if (internationalTreasures && internationalTreasures.length > 0) {
          treasure = pickNonRepeating(internationalTreasures);
        } else {
          treasure = pickNonRepeating(worldWonders);
        }
      } else if (chance < 0.95) { 
        // World Wonders (20% chance)
        treasure = pickNonRepeating(worldWonders);
      } else {
        // Random Land Location (5% chance)
        treasure = await findRandomLandLocation();
      }

      if (!treasure) {
          treasure = pickNonRepeating(worldWonders) || jackpotLocation; // Final guaranteed fallback
      }
        
      let normalized = {
        name: treasure.name || treasure.itemLabel || (treasure.itemLabel && treasure.itemLabel.value) || 'Unknown Location',
        lat: treasure.lat || treasure.latitude || (treasure.lat && treasure.lat.value) || (treasure.location && treasure.location.lat),
        lon: treasure.lon || treasure.longitude || (treasure.lon && treasure.lon.value) || (treasure.location && treasure.location.lon),
        description: treasure.description || treasure.shortDescription || treasure.desc || (treasure.description && treasure.description.value) || '',
        imageUrl: treasure.imageUrl || treasure.image || null,
        points: treasure.points || 50
      };

      // Normalize coordinates to numbers, handle missing data
      normalized.lat = isFinite(Number(normalized.lat)) ? Number(normalized.lat) : 0;
      normalized.lon = isFinite(Number(normalized.lon)) ? Number(normalized.lon) : 0;
      
      // If the coordinate is (0,0) or invalid after all normalization, pick a random safe spot.
      if (normalized.lat === 0 && normalized.lon === 0) {
          const fallback = await findRandomLandLocation();
          normalized.lat = fallback.lat;
          normalized.lon = fallback.lon;
          if (normalized.name === 'Unknown Location') normalized.name = fallback.name;
          if (!normalized.description || normalized.description.length < 20) normalized.description = fallback.description;
      }

      setCurrentLocation(normalized);
      
      // Compute rotation
      const THREE = window.THREE;
      const target = new THREE.Vector3();
      const phi = (90 - normalized.lat) * (Math.PI / 180);
      const theta = (normalized.lon + 180) * (Math.PI / 180);
      target.setFromSphericalCoords(1, phi, theta);
      const mx = new THREE.Matrix4().lookAt(target, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
      const finalRotation = new THREE.Quaternion().setFromRotationMatrix(mx);
      // Ensure a good dramatic spin, 8 full rotations
      const spinQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 16);
      setTargetRotation(spinQuaternion.multiply(finalRotation));
      
      triggerVortexAnimation();
    } catch (e) {
      console.error('Spin failed:', e);
      setIsSpinning(false); // Release spin lock on failure
      showMessage('An error occurred during the spin. Try again!');
    }
  };
  
  const triggerVortexAnimation = () => {
    const vortexContainer = document.querySelector('.vortex-container');
    const anime = window.anime;
    vortexContainer.innerHTML = '';
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.classList.add('vortex-particle');
        p.style.top = `${anime.random(0,100)}%`; 
        p.style.left = `${anime.random(0,100)}%`; 
        p.style.opacity = '0';
        vortexContainer.appendChild(p);
    }
    anime({
        targets: '.vortex-particle', opacity: [0, 0.5], scale: [0, 3], duration: 600, easing: 'easeOutExpo', delay: anime.stagger(10),
        complete: () => {
            setCurrentView('map');
            anime({ targets: '.vortex-particle', opacity: 0, duration: 800, easing: 'easeInExpo', delay: anime.stagger(10, {easing: 'easeInCubic'}) });
        }
    });
  };
  
  const handleReset = () => {
      setIsSpinning(false);
      setCurrentView('globe');
      setRevealedTreasures([]);
  };

  const animateCardsIn = () => {
      const anime = window.anime;
      anime({
        targets: '.treasure-card',
        translateY: ['100px', 0],
        opacity: [0, 1],
        duration: 1200,
        delay: anime.stagger(150, {start: 300}),
        easing: 'easeOutElastic(1, .8)',
      });
  };

  const prepareTreasureCards = async (location) => {
    // Fallback placeholder that is guaranteed to work
    const fallbackImage = 'https://placehold.co/1000x500/101827/fff?text=Image+Not+Found';
    const locationName = location.name || "Random Discovery";
    const rawDescription = location.description || location.desc || location.shortDescription || '';
    const briefDescription = rawDescription ? rawDescription.replace(/\s+/g, ' ').trim().slice(0, 157).trim() + '...' : 'A fascinating place with rich culture, history and sights.';
    const points = location.points || 50;

    // --- Image Selection Logic (Card 2 Reliability Focus) ---
    // C2: Photo-only card MUST have a reliable image. Prioritize Unsplash > Location Image > Wikimedia > Fallback
    let photoCardImage = location.imageUrl || fallbackImage; // Start with location's Wikidata image or fallback
    
    // 1. Try Unsplash for the best visual photo (priority for card 2)
    let unsplashImages = [];
    try { 
        unsplashImages = await fetchUnsplashImages(locationName, 2); 
    } catch { /* ignore */ }
    
    if (unsplashImages.length > 0) {
        photoCardImage = unsplashImages[0];
    } 
    
    // 2. Fallback to Wikimedia search if Unsplash fails/empty and we need a better image than the initial location.imageUrl
    if (photoCardImage === fallbackImage || photoCardImage === location.imageUrl) {
        let wmImages = [];
        try { wmImages = await fetchWikimediaImages(locationName, 1); } catch { /* ignore */ }
        if (wmImages.length > 0) {
            photoCardImage = wmImages[0];
        }
    }
    
    // Check if this is the jackpot and override the photo image if needed (must be done last)
    const isJackpot = location.name && location.name.toLowerCase().includes('kl university');
    if (isJackpot && jackpotLocation.imageUrl) {
        photoCardImage = jackpotLocation.imageUrl;
    }
    
    // C1: Info Card image (optional, typically text-focused but keeping the initial setting if available)
    const infoCardImage = location.imageUrl || null;

    // Build richer informational text for the info card
    const metaParts = [];
    if (location.country) metaParts.push(`Country: ${location.country}`);
    const lat = location.lat || 0;
    const lon = location.lon || 0;
    if (isFinite(lat) && isFinite(lon)) metaParts.push(`Coordinates: ${lat.toFixed(3)}, ${lon.toFixed(3)}`);
    metaParts.push(`Points: ${points}`);

    const longInfo = `${briefDescription}\n\n${metaParts.join(' • ')}`;

    const cardsData = [
      { 
        type: 'info',
        name: locationName,
        fact: longInfo,
        imageUrl: infoCardImage, // Keeping location's image here if it exists for the info card layout
      },
      { 
        type: 'photo',
        name: `Photo of ${locationName}`,
        imageUrl: photoCardImage, // The reliable, curated image for the second card
      },
      { 
        type: 'points',
        name: 'Treasure Points',
        points: points,
      }
    ];

    setRevealedTreasures(cardsData);
    // allow spinning again after cards are prepared/animated
    setTimeout(() => setIsSpinning(false), 1400);
  };

  const handlePointsReveal = async (points) => {
    const newTotalPoints = (player.score || 0) + (points || 0);
    setTotalPoints(newTotalPoints);
    
    // Update local state first
    const updatedPlayer = { ...player, score: newTotalPoints, updatedAt: Date.now() };
    setPlayer(updatedPlayer);
    
    // Persist score to Firestore (this will trigger a leaderboard update)
    if (player && player.id) {
        await playerService.savePlayerScore(player.id, player.username || 'player', newTotalPoints);
    }
  };

  // player creation is now handled by Home; App no longer exposes a direct create function

  const handleSignOut = () => {
    playerService.removeActivePlayer();
    setPlayer(null);
    setTotalPoints(0);
  };

  const handleEditUsername = () => {
      setUsernameInput(player.username);
      handleSignOut(); // Force sign-out to show input for re-entry
  };

  return (
    <>
      {currentView === 'globe' && (
        <Globe 
          isSpinning={isSpinning}
          targetRotation={targetRotation}
          isVisible={true}
        />
      )}
      <div 
        className="map-container" 
        ref={mapContainerRef} 
        style={{ opacity: currentView === 'map' ? 1 : 0, pointerEvents: currentView === 'map' ? 'auto' : 'none' }} 
      >
        <div className="treasure-card-wrapper">
        {revealedTreasures.map((treasure, index) => (
          <TreasureCard key={index} treasure={treasure} onPointsReveal={handlePointsReveal} />
        ))}
          </div>
        </div>
        <div className="vortex-container" />

  {currentView === 'home' ? (
  <Home onStartGame={handleStartFromHome} player={player} setPlayer={setPlayer} totalPoints={totalPoints} leaders={leaders} currentPlayerId={player?.id} />
        ) : (
          <>
            {/* in-game UI container */}
            <div className="ui-container">
              <button 
                className="spin-button" 
                onClick={handleSpin} 
                disabled={isLoading || isSpinning || !player?.id} 
                style={{display: currentView === 'globe' ? 'block' : 'none'}}
              >
                {isLoading ? 'Loading Treasures...' : (!player?.id ? 'Enter Username to Play' : (isSpinning ? 'Spinning...' : 'Find Treasure!'))}
              </button>
              <button 
                className="play-again-button" 
                onClick={handleReset} 
                style={{display: currentView === 'map' ? 'block' : 'none'}}
              >
                Spin Again!
              </button>
            </div>
            {/* Small profile panel top-right during play */}
            {player && (
              <div className="sidebar" style={{ right: 20, top: 20, width: 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.9em', color: '#bfefff', fontWeight: 700 }}>{player.username}</div>
                    <div style={{ fontSize: '0.75em', color: '#dcefff' }}>{player.score || 0} pts</div>
                  </div>
                  <div>
                    <button className="btn ghost" onClick={() => { handleSignOut(); setCurrentView('home'); }}>Logout</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </>
    );
  }
