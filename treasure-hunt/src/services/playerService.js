import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, query, onSnapshot, orderBy, limit, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';

// --- Global Variable Setup (MANDATORY) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const LS_KEY = 'treasure_hunt_player';

let firestore = null;
let auth = null;
let firebaseEnabled = false;

// Collection path for public/shared data (Leaderboard)
const LEADERBOARD_PATH = `artifacts/${appId}/public/data/leaderboard`;

function tryInitFirebase() {
  if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
    try {
      const app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      auth = getAuth(app);
      firebaseEnabled = true;
      console.log('Firebase enabled for leaderboard and auth.');
    } catch (e) {
      console.error('Firebase init failed:', e);
      firebaseEnabled = false;
    }
  } else {
    console.warn('Firebase config missing. Leaderboard will be disabled.');
  }
}

tryInitFirebase();

// --- Authentication and User Management ---

export async function ensureAuth() {
  if (!auth) return null;
  try {
    if (initialAuthToken) {
      // Use custom token if available (standard Canvas authentication)
      await signInWithCustomToken(auth, initialAuthToken);
    } else {
      // Fallback to anonymous sign-in if no token is provided
      await signInAnonymously(auth);
    }
    const userId = auth.currentUser?.uid || crypto.randomUUID();
    console.log(`User authenticated. UID: ${userId}`);
    return userId;
  } catch (e) {
    console.error('Firebase Auth failed:', e);
    return null;
  }
}

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

// --- Leaderboard Operations (Firestore) ---

export async function savePlayerScore(playerId, username, score) {
  if (!firebaseEnabled || !firestore) return;
  // Save locally
  const p = { id: playerId, username, score, updatedAt: Date.now() };
  setLocalPlayer(p);

  try {
    const leaderDocRef = doc(firestore, LEADERBOARD_PATH, playerId);
    // Use setDoc with merge:true to update score and username fields.
    await setDoc(leaderDocRef, {
      username: username,
      score: score,
      updatedAt: serverTimestamp(),
      userId: playerId // Store userId in the public document for querying
    }, { merge: true });
    console.log(`Score saved to Firestore for ${username}`);
  } catch (e) {
    console.warn('Failed to write score to Firestore:', e);
  }
}

export async function getPlayerFromFirestore(playerId) {
    if (!firebaseEnabled || !firestore) return null;
    try {
        const docRef = doc(firestore, LEADERBOARD_PATH, playerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...(docSnap.data()) };
        }
    } catch (e) {
        console.error('Failed to fetch player from Firestore:', e);
    }
    return null;
}

/**
 * Sets up a real-time listener for the leaderboard.
 * @param {function} callback - Function to call with the updated list of leaders.
 * @param {number} limitN - Maximum number of results.
 * @returns {function} - Unsubscribe function.
 */
export function subscribeToLeaderboard(callback, limitN = 12) {
    if (!firebaseEnabled || !firestore) {
        // Fallback or error state
        return () => {}; // Return no-op unsubscribe
    }

    const q = query(collection(firestore, LEADERBOARD_PATH), orderBy('score', 'desc'), limit(limitN));
    
    // onSnapshot provides real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach(d => {
            const data = d.data();
            items.push({ 
                id: d.id, 
                username: data.username || 'Player', 
                score: data.score || 0,
                updatedAt: data.updatedAt ? data.updatedAt.toDate().getTime() : 0 
            });
        });
        callback(items);
    }, (error) => {
        console.error("Leaderboard subscription failed:", error);
    });

    return unsubscribe;
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
  getLocalPlayer, setLocalPlayer, savePlayerScore, getPlayerFromFirestore, subscribeToLeaderboard, ensureAuth, generatePlayerId
};
