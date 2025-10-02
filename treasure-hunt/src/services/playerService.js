// Local-only player service (no Firebase/Firestore)

// --- Global Variable Setup ---
const LS_KEY = 'treasure_hunt_players';

export function getLocalPlayer() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migration: older versions may have stored a single player object
    if (parsed && parsed.id && parsed.username) {
      // convert to new shape
      const store = { players: [parsed], activeId: parsed.id };
      localStorage.setItem(LS_KEY, JSON.stringify(store));
      return parsed;
    }
    // Expected new shape: { players: [...], activeId }
    if (parsed && Array.isArray(parsed.players)) {
      return parsed.players.find(p => p.id === parsed.activeId) || null;
    }
    return null;
  } catch (e) { console.warn('getLocalPlayer parsing error', e); return null; }
}

export function setLocalPlayer(player) {
  try {
    // When called with null, clear the active player but keep stored players
    const raw = localStorage.getItem(LS_KEY);
    let store = raw ? JSON.parse(raw) : { players: [], activeId: null };

    // Migration: if raw contained a single player object, convert it
    if (store && store.id && store.username) {
      store = { players: [store], activeId: store.id };
    }

    if (!player) {
      store.activeId = null;
      localStorage.setItem(LS_KEY, JSON.stringify(store));
      return;
    }

    // Upsert player into players list and set as activeId
    const idx = store.players.findIndex(p => p.id === player.id);
    if (idx >= 0) {
      store.players[idx] = { ...store.players[idx], ...player };
    } else {
      store.players.push(player);
    }
    store.activeId = player.id;
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch (e) { console.warn('setLocalPlayer error', e); }
}

// Return the raw store object for internal use
function readStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { players: [], activeId: null };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.username) {
      return { players: [parsed], activeId: parsed.id };
    }
    if (parsed && Array.isArray(parsed.players)) return parsed;
    return { players: [], activeId: null };
  } catch (e) { console.warn('readStore error', e); return { players: [], activeId: null }; }
}

function writeStore(store) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) { console.warn('writeStore error', e); }
}

export function getAllPlayers() {
  const store = readStore();
  return (store.players || []).slice();
}

export function clearAllLocalPlayers() {
  try {
    localStorage.removeItem(LS_KEY);
    notifyLeaderboardChanged();
    console.log('Cleared local players store.');
  } catch (e) { console.warn('clearAllLocalPlayers failed', e); }
}

export function setActivePlayerById(id) {
  const store = readStore();
  if (!id) { store.activeId = null; writeStore(store); return null; }
  const p = store.players.find(pl => pl.id === id) || null;
  if (p) { store.activeId = id; writeStore(store); }
  return p;
}

export function removeActivePlayer() {
  const store = readStore();
  store.activeId = null; writeStore(store);
}

// --- Leaderboard Operations (Firestore) ---

export async function savePlayerScore(playerId, username, score) {
  // Update local store only
  try {
    const localPlayer = { id: playerId, username, score, updatedAt: Date.now() };
    setLocalPlayer(localPlayer);
  } catch (e) { console.warn('savePlayerScore local save failed', e); }
  notifyLeaderboardChanged();
}

// Dispatch a simple event to notify local-only listeners that leaderboard changed
function notifyLeaderboardChanged() {
  try {
    const ev = new CustomEvent('leaderboard-changed', { detail: { ts: Date.now() } });
    if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(ev);
  } catch (e) { /* ignore */ }
}

/**
 * Fetch leaderboard snapshot once. Falls back to local players if Firestore unavailable.
 */
export async function fetchLeaderboard(limitN = 12) {
  // Local-only leaderboard
  try {
    const players = getAllPlayers().slice().sort((a,b) => (b.score||0) - (a.score||0));
    return players.slice(0, limitN).map(p => ({ id: p.id, username: p.username || 'Player', score: p.score || 0, updatedAt: p.updatedAt || 0 }));
  } catch (e) {
    console.warn('fetchLeaderboard local error', e);
    return [];
  }
}

// No remote player fetching in local-only mode


/**
 * Sets up a real-time listener for the leaderboard.
 * @param {function} callback - Function to call with the updated list of leaders.
 * @param {number} limitN - Maximum number of results.
 * @returns {function} - Unsubscribe function.
 */
export function subscribeToLeaderboard(callback, limitN = 12) {
  // Local-only subscription: call callback with current leaderboard and listen for local changes
  let mounted = true;
  (async () => {
    const rows = await fetchLeaderboard(limitN);
    if (mounted) callback(rows);
  })();

  const listener = async () => {
    const rows = await fetchLeaderboard(limitN);
    if (mounted) callback(rows);
  };
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('leaderboard-changed', listener);
  }
  return () => { mounted = false; if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('leaderboard-changed', listener); };
}

// Utility to generate a unique ID based on username
export function generatePlayerId(username) {
  const base = (username || 'guest').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  // Append a unique-ish hash to ensure uniqueness even if multiple people pick the same name
  return base + '-' + Math.abs(hashCode((username || '') + Date.now())).toString(36).slice(0,6);
}

function hashCode(s) {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h<<5)-h + s.charCodeAt(i) | 0; return h;
}

export default {
  // players
  getLocalPlayer,
  setLocalPlayer,
  getAllPlayers,
  clearAllLocalPlayers,
  setActivePlayerById,
  removeActivePlayer,
  // leaderboard
  savePlayerScore,
  fetchLeaderboard,
  subscribeToLeaderboard,
  // (no remote firestore/auth in local-only mode)
  // utils
  generatePlayerId
};
