// Local-only player service (no Firebase/Firestore)

const LS_KEY = 'treasure_hunt_players_v2'; // Changed key to avoid conflicts with old structure

// --- Internal Store Helpers ---
function readStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { players: [], activeId: null };
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.players)) return parsed;
    return { players: [], activeId: null };
  } catch (e) { 
    console.warn('readStore error, resetting store', e); 
    return { players: [], activeId: null }; 
  }
}

function writeStore(store) {
  try { 
    localStorage.setItem(LS_KEY, JSON.stringify(store)); 
  } catch (e) { 
    console.warn('writeStore error', e); 
  }
}

// --- Event Dispatcher for Real-time Updates ---
function notifyLeaderboardChanged() {
  try {
    const event = new CustomEvent('leaderboard-changed');
    window.dispatchEvent(event);
  } catch (e) { /* ignore */ }
}

// --- Public API ---

export function getLocalPlayer() {
  const store = readStore();
  return store.players.find(p => p.id === store.activeId) || null;
}

export function setLocalPlayer(player) {
  const store = readStore();
  store.activeId = player ? player.id : null;
  if (player) {
    const idx = store.players.findIndex(p => p.id === player.id);
    if (idx < 0) store.players.push(player);
  }
  writeStore(store);
}

export function removeActivePlayer() {
  const store = readStore();
  store.activeId = null;
  writeStore(store);
}

export function clearAllLocalPlayers() {
    localStorage.removeItem(LS_KEY);
    notifyLeaderboardChanged();
}

export async function savePlayerScore(playerId, username, score) {
  try {
    const store = readStore();
    const playerIndex = store.players.findIndex(p => p.id === playerId);

    if (playerIndex > -1) {
      store.players[playerIndex].score = score;
      store.players[playerIndex].updatedAt = Date.now();
    } else {
      store.players.push({
        id: playerId,
        username: username,
        score: score,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    writeStore(store);
    notifyLeaderboardChanged();
  } catch (e) { console.warn('savePlayerScore failed', e); }
}

export async function fetchLeaderboard(limitN = 10) {
  const store = readStore();
  const sortedPlayers = (store.players || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0));
  return sortedPlayers.slice(0, limitN);
}

export function subscribeToLeaderboard(callback, limitN = 10) {
  let mounted = true;
  const update = async () => {
    if (!mounted) return;
    const rows = await fetchLeaderboard(limitN);
    callback(rows);
  };
  update();
  window.addEventListener('leaderboard-changed', update);
  return () => { 
    mounted = false; 
    window.removeEventListener('leaderboard-changed', update); 
  };
}

export function generatePlayerId(username) {
  const base = (username || 'guest').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const hash = Math.abs(s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)(username + Date.now())).toString(36).slice(0, 6);
  return `${base}-${hash}`;
}

export default {
  getLocalPlayer,
  setLocalPlayer,
  removeActivePlayer,
  clearAllLocalPlayers,
  savePlayerScore,
  fetchLeaderboard,
  subscribeToLeaderboard,
  generatePlayerId
};
