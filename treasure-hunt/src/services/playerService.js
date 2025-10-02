// Player service: manages current player identity and leaderboard persistence.
// Uses Firebase Firestore if Firebase config is provided via import.meta.env; otherwise falls back to localStorage.
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const LS_KEY = 'treasure_hunt_player';

let firestore = null;
let firebaseEnabled = false;

function tryInitFirebase() {
  try {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    if (apiKey && projectId) {
      const app = initializeApp({ apiKey, authDomain, projectId });
      firestore = getFirestore(app);
      firebaseEnabled = true;
      console.log('Firebase enabled for leaderboard');
    }
  } catch {
    console.warn('Firebase init failed or not configured');
    firebaseEnabled = false;
  }
}

tryInitFirebase();

export function getLocalPlayer() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setLocalPlayer(player) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(player));
  } catch { /* ignore */ }
}

export async function savePlayerScore(playerId, username, score) {
  // Save locally
  const p = { id: playerId, username, score, updatedAt: Date.now() };
  setLocalPlayer(p);
  // Also push to Firestore if available
  if (firebaseEnabled && firestore) {
    try {
      const ref = doc(collection(firestore, 'leaderboard'), playerId);
      await setDoc(ref, { username, score, updatedAt: Date.now() }, { merge: true });
    } catch {
      console.warn('Failed to write score to Firestore');
    }
  }
}

export async function fetchLeaderboard(limitN = 20) {
  // Prefer Firestore remote leaderboard when enabled
  if (firebaseEnabled && firestore) {
    try {
      const q = query(collection(firestore, 'leaderboard'), orderBy('score', 'desc'), limit(limitN));
      const snap = await getDocs(q);
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...(d.data()) }));
      return items;
    } catch {
      console.warn('Failed to fetch remote leaderboard, falling back to local');
    }
  }
  // Local fallback: return saved player only (can't aggregate across devices without server)
  const p = getLocalPlayer();
  return p ? [p] : [];
}

export function generatePlayerId(username) {
  const base = (username || 'guest').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base + '-' + Math.abs(hashCode((username || '') + Date.now())).toString(36).slice(0,6);
}

function hashCode(s) {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h<<5)-h + s.charCodeAt(i) | 0; return h;
}

export default {
  getLocalPlayer, setLocalPlayer, savePlayerScore, fetchLeaderboard, generatePlayerId
};
