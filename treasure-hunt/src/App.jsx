import React, { useState, useEffect, useRef } from 'react';
import Globe from './Globe';
import TreasureCard from './TreasureCard';
import Leaderboard from './Leaderboard';
import playerService from './services/playerService';
import { loadTreasureLists, findRandomLandLocation, indianTreasures, internationalTreasures, jackpotLocation, fetchWikipediaSummary, worldWonders, fetchWikimediaImages, fetchUnsplashImages } from './services/dataService.js';

const MAPTILER_TOKEN = 'POKHjCgjvtPFhVMQXdBz';

export default function App() {
  const [currentView, setCurrentView] = useState('globe');
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetRotation, setTargetRotation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [revealedTreasures, setRevealedTreasures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [player, setPlayer] = useState(() => playerService.getLocalPlayer());
  const [usernameInput, setUsernameInput] = useState('');
  const [leaders, setLeaders] = useState([]);
  // recentHistoryRef tracks recent picks; lastLocationName removed as it's no longer used
  const recentHistoryRef = useRef([]);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    async function loadData() {
        await loadTreasureLists();
        setIsLoading(false);
    }
    loadData();
    // initial leaderboard
    (async () => {
      const rows = await playerService.fetchLeaderboard(12);
      setLeaders(rows || []);
    })();
  }, []);

  useEffect(() => {
    if (currentView === 'map' && currentLocation) {
      const maplibregl = window.maplibregl;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_TOKEN}`,
        center: [currentLocation.lon, currentLocation.lat], 
        zoom: 3
      });
      mapRef.current.on('load', () => {
        new maplibregl.Marker().setLngLat([currentLocation.lon, currentLocation.lat]).addTo(mapRef.current);
        mapRef.current.flyTo({ center: [currentLocation.lon, currentLocation.lat], zoom: 12, duration: 2500 });
        // call async prepare function without blocking the map load
        (async () => { await prepareTreasureCards(currentLocation); })();
      });
    }
  }, [currentView, currentLocation]);
  
  useEffect(() => {
    if (revealedTreasures.length > 0) {
        setTimeout(() => {
            animateCardsIn();
        }, 1200);
    }
  }, [revealedTreasures]);
  
  const handleSpin = async () => {
    if (!player || !player.id) return alert('Please enter a username to play and save your player profile.');
    if (isSpinning) return; // prevent rapid double clicks
    setIsSpinning(true);
    try {

    // clear previous state for a smooth spin-to-spin transition
    if (mapRef.current) {
  try { mapRef.current.remove(); } catch { /* ignore */ }
      mapRef.current = null;
    }
    setRevealedTreasures([]);

  const chance = Math.random();
  let treasure;
  if (chance < 0.1) { 
    // 1 in 10 chance to get jackpotLocation (KL University)
    treasure = jackpotLocation;
    console.log("JACKPOT / KL University spin! Landing on:", treasure.name);
  } else if (chance < 0.35) { 
    // Indian treasure - avoid immediate repeat
      if (indianTreasures && indianTreasures.length > 0) {
      treasure = pickNonRepeating(indianTreasures);
      console.log("Spinning to Indian treasure:", treasure && treasure.name);
    }
  } else if (chance < 0.6) { 
    // International treasure
    // Prefer preloaded international list; if empty, pick from worldWonders
    if (internationalTreasures && internationalTreasures.length > 0) {
      treasure = pickNonRepeating(internationalTreasures);
      console.log("Spinning to International treasure:", treasure && treasure.name);
    } else {
      treasure = pickNonRepeating(worldWonders);
      console.log("Spinning to curated world wonder:", treasure && treasure.name);
    }
  } else if (chance < 0.85) { 
    // Occasionally pick a world wonder directly for high points
  treasure = pickNonRepeating(worldWonders);
    console.log("Spinning to curated world wonder:", treasure && treasure.name);
  } else {
    // As a final fallback, prefer a world wonder
  treasure = pickNonRepeating(worldWonders);
    console.log("Fallback spin to curated world wonder:", treasure && treasure.name);
  }
    
  // normalize location fields to expected names used across the app
    let normalized = {
      name: treasure.name || treasure.itemLabel || (treasure.itemLabel && treasure.itemLabel.value) || treasure.itemLabel,
      lat: treasure.lat || treasure.latitude || (treasure.lat && treasure.lat.value) || (treasure.location && treasure.location.lat),
      lon: treasure.lon || treasure.longitude || (treasure.lon && treasure.lon.value) || (treasure.location && treasure.location.lon),
      description: treasure.description || treasure.shortDescription || treasure.desc || (treasure.description && treasure.description.value) || '',
      imageUrl: treasure.imageUrl || treasure.image || null,
      points: treasure.points || 50
    };

    // If description or image missing, try Wikipedia summary for better content
    if ((!normalized.description || normalized.description.length < 30) || !normalized.imageUrl) {
      try {
        // sanitize name for wiki lookup: use first segment before comma and only short/simple titles
        const candidate = (normalized.name || '').split(',')[0].trim();
  const okForWiki = candidate && candidate.length > 2 && candidate.length < 80 && /^[\w\s\-']+$/.test(candidate);
        if (okForWiki) {
          const wiki = await fetchWikipediaSummary(candidate);
          if (wiki) {
            if (!normalized.description && wiki.extract) normalized.description = wiki.extract;
            if (!normalized.imageUrl && wiki.image) normalized.imageUrl = wiki.image;
          }
        }
  } catch { /* ignore wiki fallback errors */ }
    }

    // final small fallback
    if (!normalized.description) normalized.description = 'A fascinating place with rich culture, history and sights.';
    if (!normalized.imageUrl) normalized.imageUrl = null;

    // If coordinates missing, fall back to a random land location to avoid map errors
    if (!isFinite(Number(normalized.lat)) || !isFinite(Number(normalized.lon))) {
      try {
        const fallback = await findRandomLandLocation();
        normalized.lat = fallback.lat;
        normalized.lon = fallback.lon;
        // only fill in name/description if missing
        if (!normalized.name) normalized.name = fallback.name;
        if (!normalized.description || normalized.description.length < 20) normalized.description = fallback.description;
      } catch {
        // if even fallback fails, ensure coordinates to (0,0)
        normalized.lat = normalized.lat || 0;
        normalized.lon = normalized.lon || 0;
      }
    }

    setCurrentLocation(normalized);
  // record into recentHistoryRef inside pickNonRepeating; no-op here
    
    // compute rotation only from normalized coordinates to avoid undefined errors
    if (isFinite(Number(normalized.lat)) && isFinite(Number(normalized.lon))) {
      const THREE = window.THREE;
      const target = new THREE.Vector3();
      const phi = (90 - Number(normalized.lat)) * (Math.PI / 180);
      const theta = (Number(normalized.lon) + 180) * (Math.PI / 180);
      target.setFromSphericalCoords(1, phi, theta);
      const mx = new THREE.Matrix4().lookAt(target, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
      const finalRotation = new THREE.Quaternion().setFromRotationMatrix(mx);
      const spinQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 10);
      setTargetRotation(spinQuaternion.multiply(finalRotation));
    } else {
      // if coordinates missing, don't set a rotation — avoid three.js errors
      setTargetRotation(null);
    }
    triggerVortexAnimation();
    } finally {
      // don't immediately re-enable until cards animate; keep guard but ensure we clear on unexpected errors
      // prepared cards will clear isSpinning after animation via prepareTreasureCards
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

  // Utility: pick a random element that's not the same as recent history (if possible)
  const pickNonRepeating = (arr) => {
    if (!arr || arr.length === 0) return null;
    if (arr.length === 1) return arr[0];
    // Use a recent history buffer to avoid showing the same few places repeatedly
    const recent = recentHistoryRef.current || [];
    const pool = arr.filter(a => !recent.includes((a.name || a.itemLabel || (a.itemLabel && a.itemLabel.value))));
    const finalPool = pool.length ? pool : arr; // if everything is recent, allow full pool
    const pick = finalPool[Math.floor(Math.random() * finalPool.length)];
    // update history (keep last 8 entries)
    recent.unshift(pick.name || pick.itemLabel || (pick.itemLabel && pick.itemLabel.value) || '');
    recent.splice(8);
    recentHistoryRef.current = recent;
    return pick;
  };

  const prepareTreasureCards = async (location) => {
    const fallbackImage = 'https://images.unsplash.com/photo-1582098782928-1b225529a4a7';
    const locationName = location.name || "Random Discovery";
  // Prefer a real description; if missing synthesize a friendly brief using available metadata
  const rawDescription = location.description || location.desc || location.shortDescription || '';
  const metaHints = [];
  if (location.instance) metaHints.push(location.instance);
  if (location.country) metaHints.push(location.country);
  const description = rawDescription || (metaHints.length ? `${location.name} is located in ${metaHints.join(', ')}.` : 'A place of significant interest.');
    // Create a short, reader-friendly brief for the info card
    const briefDescription = (() => {
      if (!description) return '';
      // Prefer first sentence if it's short enough
      const firstSentence = description.split('. ')[0].trim();
      if (firstSentence.length >= 40 && firstSentence.length <= 160) return firstSentence + (firstSentence.endsWith('.') ? '' : '.');
      // Otherwise truncate to ~160 chars
      const trimmed = description.replace(/\s+/g, ' ').trim();
      if (trimmed.length <= 160) return trimmed;
      return trimmed.slice(0, 157).trim() + '...';
    })();
    const points = location.points || 50;
  // intentionally not using a separate imageUrl variable here; prefer photo selection logic below

  // Prefer the location's own image (from Wikidata), then Wikipedia image, then curated worldWonders image if available, then fallback
  let wikiImg = null;
      try {
      const candidate = (locationName || '').split(',')[0].trim();
  const okForWiki = candidate && candidate.length > 2 && candidate.length < 80 && /^[\w\s\-']+$/.test(candidate);
      if (okForWiki) {
        const wiki = await fetchWikipediaSummary(candidate);
        if (wiki && wiki.image) wikiImg = wiki.image;
      }
      } catch { /* ignore */ }

    // If this location is one of our curated worldWonders, try a loose match (allow 'Colosseum, Rome')
    const curated = worldWonders.find(w => {
      const wn = (w.name||'').toLowerCase();
      const ln = (locationName||'').toLowerCase();
      return wn === ln || ln.includes(wn) || wn.includes(ln);
    });

  // Prefer Unsplash (single curated photo) for the photo card if API key is available, otherwise fall back to Wikimedia
  let unsplash = [];
  try { unsplash = await fetchUnsplashImages(locationName, 1); } catch { /* ignore */ }
  let wmImages = [];
  try { wmImages = await fetchWikimediaImages(locationName, 2); } catch { /* ignore */ }

  // If Wikimedia search returned nothing and wikiImg is empty, try a broader query (add 'landmark')
  if ((!wmImages || wmImages.length === 0) && !wikiImg) {
    try {
      const extra = await fetchWikimediaImages(`${locationName} landmark`, 2);
      if (extra && extra.length) wmImages = (wmImages || []).concat(extra.filter(Boolean));
    } catch { /* ignore */ }
  }

  const firstCardImage = location.imageUrl || wikiImg || (wmImages[0]) || (curated && curated.imageUrl) || fallbackImage;

  // Debug logs to understand why images may be missing
  try {
    console.log('prepareTreasureCards:', { locationName, hasLocationImage: !!location.imageUrl, unsplashCount: (unsplash || []).length, wmCount: (wmImages || []).length, wikiImgPresent: !!wikiImg, curatedPresent: !!curated });
  } catch { /* ignore console issues */ }

  // If this is the jackpot KL University, force the jackpot image (user-provided)
  const isJackpot = (locationName && (locationName.toLowerCase().includes('kl university') || locationName.toLowerCase().includes('klu')));
  let photoCardImage = null;
  if (isJackpot && jackpotLocation && jackpotLocation.imageUrl) {
    photoCardImage = jackpotLocation.imageUrl;
  } else {
    // For second card prefer the location's own image first (e.g. KL University), then Unsplash, then wikiImg, then Wikimedia, then curated/fallback
    photoCardImage = location.imageUrl || (unsplash && unsplash.length ? unsplash[0] : (wikiImg || (wmImages[0] && wmImages[0] !== firstCardImage ? wmImages[0] : ((curated && curated.imageUrl) || fallbackImage))));
  }

    // Build a richer informational text for the info card (no photo)
  const metaParts = [];
  if (location.instance) metaParts.push(`Type: ${location.instance}`);
  if (location.country) metaParts.push(`Country: ${location.country}`);
  const lat = location.lat || location.latitude || (location.lat && location.lat.value) || (location.location && location.location.lat) || null;
  const lon = location.lon || location.longitude || (location.lon && location.lon.value) || (location.location && location.location.lon) || null;
  if (isFinite(Number(lat)) && isFinite(Number(lon))) metaParts.push(`Coordinates: ${Number(lat).toFixed(3)}, ${Number(lon).toFixed(3)}`);
  metaParts.push(`Points: ${points}`);

    const longInfo = `${briefDescription || description}\n\n${metaParts.join(' • ')}`;

    const cardsData = [
      { 
        type: 'info',
        name: locationName,
        fact: longInfo,
        imageUrl: null, // explicitly no image for the first card
      },
      { 
        type: 'photo',
        name: `Photo of ${locationName}`,
        imageUrl: photoCardImage,
      },
      { 
        type: 'points',
        name: 'Treasure Points',
        points: points,
      }
    ];

    // Note: points are added when the user reveals the points card
    setRevealedTreasures(cardsData);
    // allow spinning again after cards are prepared/animated
    setTimeout(() => setIsSpinning(false), 1400);
  };

  const handlePointsReveal = (points) => {
    setTotalPoints(prev => prev + (points || 0));
    // persist per-player score
    try {
      if (player && player.id) {
        const newScore = (player.score || 0) + (points || 0);
        const updated = { ...player, score: newScore, updatedAt: Date.now() };
        setPlayer(updated);
        playerService.setLocalPlayer(updated);
        playerService.savePlayerScore(player.id, player.username || 'player', newScore);
      }
    } catch (e) { console.warn('Failed to persist player score', e); }
  };

  const handleCreatePlayer = () => {
    const name = (usernameInput || '').trim();
    if (!name || name.length < 2) return alert('Please enter a username (2+ chars)');
    const id = playerService.generatePlayerId(name);
    const p = { id, username: name, score: totalPoints || 0, createdAt: Date.now() };
    playerService.setLocalPlayer(p);
    setPlayer(p);
    setUsernameInput('');
  };

  const handleSignOut = () => {
    playerService.setLocalPlayer(null);
    setPlayer(null);
  };

  const refreshLeaderboard = async () => {
    const rows = await playerService.fetchLeaderboard(12);
    setLeaders(rows || []);
  };

  return (
    <>
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
        <TreasureCard key={index} treasure={treasure} onPointsReveal={handlePointsReveal} />
      ))}
        </div>
      </div>
      <div className="vortex-container" />
      {/* Sidebar moved here so it's a top-level sibling and not inside the floating UI container */}
      <aside className="sidebar">
        <h3>Explorer Hub</h3>
        <div className="player-panel">
          {player && player.username ? (
            <>
              <div className="player-info"><div>{player.username}</div><div>{player.score || 0} pts</div></div>
              <div className="player-controls">
                <button className="btn ghost" onClick={() => { setUsernameInput(''); document.body.focus(); }}>Change</button>
                <button className="btn" onClick={handleSignOut}>Sign Out</button>
                <button className="btn primary" onClick={refreshLeaderboard}>Refresh</button>
              </div>
            </>
          ) : (
            <>
              <input className="username-input" placeholder="Enter username" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} />
              <div className="player-controls">
                <button className="btn primary" onClick={handleCreatePlayer}>Create Player</button>
                <button className="btn ghost" onClick={refreshLeaderboard}>Refresh LB</button>
              </div>
            </>
          )}
        </div>
        <div className="leaderboard">
          <h4>Leaderboard</h4>
          {leaders && leaders.length ? (
            <ol>
              {leaders.map((p, i) => (
                <li key={p.id || i}><span className="rank">#{i+1}</span> <strong>{p.username || 'player'}</strong> <span style={{marginLeft:'auto'}}>{p.score || 0} pts</span></li>
              ))}
            </ol>
          ) : (
            <div className="empty">No scores yet</div>
          )}
        </div>
      </aside>

      <div className="ui-container">
          <button 
            className="spin-button" 
            onClick={handleSpin} 
            disabled={isLoading || isSpinning} 
            style={{display: currentView === 'globe' ? 'block' : 'none'}}
          >
            {isLoading ? 'Loading Treasures...' : (isSpinning ? 'Spinning...' : 'Find Treasure!')}
          </button>
          <button 
            className="play-again-button" 
            onClick={handleReset} 
            style={{display: currentView === 'map' ? 'block' : 'none'}}
          >
            Spin Again!
          </button>
          
      </div>
    </>
  );
}