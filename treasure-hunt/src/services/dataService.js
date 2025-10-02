import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, where } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION & CORE VARIABLES (Must use provided globals) ---
// Set up global environment variables for Firebase (required for persistent multiplayer)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let firestore = null;
let app = null;

if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
    try {
        app = initializeApp(firebaseConfig);
        firestore = getFirestore(app);
        console.log('Firebase App and Firestore initialized.');
    } catch (e) {
        console.error('Firebase initialization failed:', e);
    }
} else {
    console.warn('Firebase configuration not found. Leaderboard will be disabled.');
}

// Global variable definitions
export let indianTreasures = [];
export let internationalTreasures = [];
let _listsLoaded = false;
export const jackpotLocation = { 
    name: "KL University, Vaddeswaram", 
    lat: 16.4418, 
    lon: 80.6221,
    imageUrl: 'https://images.hindustantimes.com/img/2021/04/08/1600x900/KL_University_HT_1617871537419_1617871542598.jpg',
    points: 1000 // Special jackpot points
};
export const worldWonders = [
    { name: 'Taj Mahal', lat: 27.1751, lon: 78.0421, points: 800 },
    { name: 'Great Wall of China', lat: 40.4319, lon: 116.5704, points: 900 },
    { name: 'Machu Picchu', lat: -13.1631, lon: -72.5450, points: 850 },
    { name: 'Colosseum, Rome', lat: 41.8902, lon: 12.4922, points: 800 },
    { name: 'Christ the Redeemer', lat: -22.9519, lon: -43.2105, points: 800 },
    { name: 'Chichen Itza', lat: 20.6843, lon: -88.5678, points: 750 },
    { name: 'Petra, Jordan', lat: 30.3285, lon: 35.4444, points: 850 },
    { name: 'Pyramids of Giza', lat: 29.9792, lon: 31.1342, points: 900 },
    { name: 'Sydney Opera House', lat: -33.8568, lon: 151.2153, points: 700 },
    { name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945, points: 700 },
    { name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, points: 750 },
    { name: 'Angkor Wat', lat: 13.4125, lon: 103.8670, points: 950 },
    { name: 'Hagia Sophia, Istanbul', lat: 41.0086, lon: 28.9801, points: 700 }
];

// Curated name-only lists (well-known places). Using name-only for more reliable geocoding.
export const indianCuratedNames = [
  'Taj Mahal, Agra', 'Qutub Minar, Delhi', 'Red Fort, Delhi', 'Gateway of India, Mumbai', 'Hampi, Karnataka', 'Khajuraho Group of Monuments', 'Konark Sun Temple', 'Meenakshi Temple', 'Sanchi Stupa', 'Golden Temple, Amritsar',
  'Mysore Palace', 'India Gate, Delhi', 'Humayun\'s Tomb', 'Jaisalmer Fort', 'Jantar Mantar, Jaipur', 'Mehrangarh Fort, Jodhpur', 'Victoria Memorial, Kolkata', 'Charminar, Hyderabad', 'Lotus Temple, Delhi', 'Ranakpur Jain Temple',
  'Dal Lake, Srinagar', 'Wagah Border, Amritsar', 'Kanha National Park', 'Kaziranga National Park', 'Periyar National Park', 'Ellora Caves', 'Ajanta Caves', 'Brihadeeswarar Temple', 'Mahabalipuram', 'Varkala Beach',
  'Rameshwaram Temple', 'Puri Jagannath Temple', 'Kedarnath Temple', 'Badrinath Temple', 'Tawang Monastery', 'Sundarbans National Park', 'Cellular Jail, Andaman', 'Baga Beach, Goa',
  'Old Goa Churches', 'Mount Abu', 'Guruvayur Temple', 'Thanjavur', 'Coorg', 'Ooty Lake', 'Kullu Manali', 'Shimla Ridge', 'Darjeeling', 'Pench National Park', 'Ranthambore National Park',
  'Udaipur City Palace', 'Chittorgarh Fort', 'Pushkar Lake', 'Varanasi Ghats', 'Leh Ladakh', 'Pangong Tso', 'Rumtek Monastery, Sikkim', 'Gangtok', 'Tirupati Temple', 'Hawa Mahal, Jaipur',
  'Akshardham, Delhi', 'Birla Mandir, Hyderabad', 'Sula Vineyards', 'Bhedaghat Marble Rocks', 'Pondicherry', 'Chembra Peak', 'Kashi Vishwanath Temple', 'Ganga Aarti, Haridwar', 'Vivekananda Rock Memorial'
];

export const internationalCuratedNames = [
  'Eiffel Tower, Paris', 'Statue of Liberty, New York', 'Sydney Opera House, Sydney', 'Big Ben, London', 'Buckingham Palace', 'Mount Fuji, Japan', 'Angkor Wat, Cambodia', 'Petra, Jordan', 'Borobudur Temple', 'Great Pyramid of Giza',
  'Grand Canyon National Park', 'Yellowstone National Park', 'Niagara Falls', 'Santorini, Greece', 'Prague Old Town Square', 'Berlin Brandenburg Gate', 'Louvre Museum, Paris', 'Sagrada Familia, Barcelona', 'Seine River, Paris',
  'Acropolis of Athens', 'Stonehenge', 'Alhambra, Granada', 'Hagia Sophia, Istanbul', 'Moscow Kremlin', 'St. Petersburg Hermitage Museum', 'Mont-Saint-Michel', 'Neuschwanstein Castle', 'Loch Ness, Scotland', 'Table Mountain, South Africa',
  'Victoria Falls', 'Banff National Park', 'Galapagos Islands', 'Easter Island', 'Iguazu Falls', 'Pamukkale, Turkey', 'Blue Lagoon, Iceland', 'Prague Castle', 'Dubrovnik Old Town', 'Bruges, Belgium',
  'Fushimi Inari Shrine, Kyoto', 'Himeji Castle', 'Nara Park', 'Osaka Castle', 'Mount Kilimanjaro', 'Serengeti National Park', 'Masai Mara National Reserve', 'Sahara Desert', 'Plitvice Lakes National Park', 'Sistine Chapel', 
  'Venice Grand Canal', 'Florence Duomo', 'Rome Colosseum', 'Lisbon Belem Tower', 'Madrid Prado Museum', 'Barcelona Gothic Quarter', 'Oia, Santorini', 'Mykonos', 'Rhodes Old Town', 'Athens Parthenon',
  'Times Square, New York', 'The Shard, London', 'Burj Khalifa, Dubai', 'Great Barrier Reef, Australia', 'Mount Everest Base Camp', 'Forbidden City, Beijing', 'Mount Rushmore', 'Golden Gate Bridge', 'Christ the Redeemer, Brazil'
];


// Geographic bounds for India to validate geocoding results and prevent errors like "Statue of Liberty in India"
const INDIA_BOUNDS = { minLat: 6.5, maxLat: 35.5, minLon: 68.0, maxLon: 97.5 };

let unsplashUnavailableUntil = 0;

// Resolve a place name into a minimal treasure object: try Wikipedia summary for image/description and Nominatim for coords
export async function resolvePlaceByName(name, countryHint) {
    if (!name) return null;
    const shortTitle = name.split(',')[0].trim();
    
    // 1. Fetch data from Wikipedia for text/image (high priority for info card)
    let wiki = null;
    try {
        wiki = await fetchWikipediaSummary(shortTitle);
    } catch { /* ignore */ }

    let lat = null, lon = null, imageUrl = wiki?.image || null, description = wiki?.extract || null;
    let points = 60; // Default points

    // 2. Geocoding helper function
    const tryGeocode = async (q, countryCode) => {
        try {
            let api = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
            if (countryCode) api += `&countrycodes=${encodeURIComponent(countryCode)}`;
            // Add custom user-agent header to avoid blocking by some APIs
            const geoRes = await fetch(api, { headers: { 'User-Agent': 'GlobetrotterApp/1.0 (Canvas Environment)' } });
            if (geoRes && geoRes.ok) {
                const places = await geoRes.json();
                if (places && places.length) {
                    return { lat: parseFloat(places[0].lat), lon: parseFloat(places[0].lon) };
                }
            }
        } catch (e) { console.warn('Nominatim Geocoding failed:', e.message); }
        return null;
    };

    // 3. Perform Geocoding
    let geo = null;
    // Prefer geocoding with a country hint if provided
    if (countryHint) {
        // Use 'in' for India explicitly
        const countryCode = countryHint.toLowerCase() === 'india' ? 'in' : null;
        geo = await tryGeocode(name, countryCode);
    }
    // Fallback geocoding without country hint
    if (!geo) {
        geo = await tryGeocode(name);
    }
    
    if (geo) {
        lat = geo.lat; 
        lon = geo.lon;

        // 4. Sanity Check for Indian Locations
        if (countryHint && countryHint.toLowerCase() === 'india') {
            const isOutsideIndia = !isFinite(lat) || !isFinite(lon) || 
                                   lat < INDIA_BOUNDS.minLat || lat > INDIA_BOUNDS.maxLat || 
                                   lon < INDIA_BOUNDS.minLon || lon > INDIA_BOUNDS.maxLon;

            if (isOutsideIndia) {
                console.warn(`Geo-fence triggered: "${name}" resolved to (lat:${lat}, lon:${lon}) outside India's bounds. Rejecting coordinate.`);
                lat = null;
                lon = null; // Invalidate bad coordinate
            }
        }
    }

    // 5. Final image fallback if still missing
    if (!imageUrl) {
        try {
            const imgs = await fetchWikimediaImages(shortTitle, 1);
            if (imgs && imgs.length) imageUrl = imgs[0];
        } catch { /* ignore */ }
    }

    return { name, lat, lon, imageUrl, description, points };
}

// Unsplash helper: returns an array of image URLs (regular) for a given query
export async function fetchUnsplashImages(query, count = 2) {
    try {
        const now = Date.now();
        if (unsplashUnavailableUntil && now < unsplashUnavailableUntil) return [];
        // NOTE: In a Canvas environment, using a public, rate-limited API key often fails or hits limits quickly. 
        // We will mock the rate-limit check but rely on the environment's ability to handle network requests.
        const key = import.meta.env.VITE_UNSPLASH_API_KEY; 
        if (!key) {
            // For reliable images, we'll try to use a high-quality placeholder if API key is missing.
            const placeholder = `https://placehold.co/1000x500/101827/fff?text=${encodeURIComponent(query)}`;
            return [placeholder];
        }
        
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}`;
        const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
        
        if (!res.ok) {
            if (res.status === 429) {
                unsplashUnavailableUntil = Date.now() + (60 * 60 * 1000);
                console.warn('Unsplash rate-limited. Falling back.');
            } else {
                console.warn('Unsplash request failed', res.statusText);
            }
            return [];
        }
        
        const json = await res.json();
        return (json.results || []).map(r => r.urls && (r.urls.regular || r.urls.small)).filter(Boolean);
    } catch (e) {
        console.error('fetchUnsplashImages error:', e);
        return [];
    }
}

// Fetch 500 top-ranking places from Wikidata with an image and coordinates
async function fetchWikidata(query) {
    const endpointUrl = 'https://query.wikidata.org/sparql';
    const doFetch = async (timeoutMs) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/sparql-results+json',
                    'User-Agent': 'GlobetrotterApp/1.0 (Canvas Environment)' // Identify client
                },
                body: `query=${encodeURIComponent(query)}`,
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!response.ok) {
                console.warn('Wikidata returned non-OK status', response.status);
                return [];
            }
            const data = await response.json();
            if (!data.results || !data.results.bindings) return [];
            return data.results.bindings.map(item => {
                if (!item.coord || !item.itemLabel) return null;
                const [lon, lat] = item.coord.value.replace('Point(', '').replace(')', '').split(' ');
                const points = item.sitelinks ? 10 + (parseInt(item.sitelinks.value, 10) * 2) : 50;
                return {
                    name: item.itemLabel.value,
                    lat: parseFloat(lat),
                    lon: parseFloat(lon),
                    description: item.description?.value || "A place of significant interest.",
                    // Use a more direct Wikimedia URL for better image compatibility
                    imageUrl: item.image ? `https://commons.wikimedia.org/w/index.php?title=Special:FilePath/${encodeURIComponent(item.image.value.split('/').pop())}&width=600` : null,
                    points: points
                };
            }).filter(Boolean);
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    };

    try {
        // Try a medium fetch first, then a longer one if it fails
        return await doFetch(5000);
    } catch (error) {
        if (error && error.name === 'AbortError') {
            console.warn('Wikidata query aborted (timeout), retrying...');
            try {
                return await doFetch(8000);
            } catch {
                console.warn('Second Wikidata attempt failed');
                return [];
            }
        }
        console.warn("Wikidata query failed:", error && error.name);
        return [];
    }
}

export async function loadTreasureLists() {
    if (_listsLoaded) {
        console.log('Treasure lists already loaded; skipping duplicate load.');
        return;
    }
    console.log("Loading high-ranking treasure lists from Wikidata...");
    try {
        // Increased LIMIT to 500 for more locations
        const indianQuery = `
            SELECT ?item ?itemLabel ?coord ?description ?image (COUNT(?sitelink) AS ?sitelinks) WHERE {
              ?item wdt:P17 wd:Q668; wdt:P18 ?image; wdt:P625 ?coord.
              { ?item wdt:P31/wdt:P279* wd:Q839954 } UNION { ?item wdt:P31/wdt:P279* wd:Q16560 }
              ?sitelink schema:about ?item.
              OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description) = "en"). }
              SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            } GROUP BY ?item ?itemLabel ?coord ?description ?image ORDER BY DESC(?sitelinks) LIMIT 500`;

        const internationalQuery = `
            SELECT ?item ?itemLabel ?coord ?description ?image (COUNT(?sitelink) AS ?sitelinks) WHERE {
                            ?item wdt:P18 ?image; wdt:P625 ?coord.
                            # Include World Heritage sites (Q9259), monuments (Q4989906), tourist attractions (Q570116), natural landmarks (Q17351651)
                            { ?item wdt:P31/wdt:P279* wd:Q9259 } UNION { ?item wdt:P31/wdt:P279* wd:Q4989906 } UNION { ?item wdt:P31/wdt:P279* wd:Q570116 } UNION { ?item wdt:P31/wdt:P279* wd:Q17351651 }
                            ?sitelink schema:about ?item.
              OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description) = "en"). }
              SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            } GROUP BY ?item ?itemLabel ?coord ?description ?image ORDER BY DESC(?sitelinks) LIMIT 500`;

        let indianData = [];
        let internationalData = [];
        try {
            [indianData, internationalData] = await Promise.all([
                fetchWikidata(indianQuery),
                fetchWikidata(internationalQuery)
            ]);
            } catch {
                console.warn('Wikidata fetch failed.');
            }

        indianTreasures = (indianData || []).filter(t => 
            isFinite(t.lat) && isFinite(t.lon) && 
            t.lat >= INDIA_BOUNDS.minLat && t.lat <= INDIA_BOUNDS.maxLat && 
            t.lon >= INDIA_BOUNDS.minLon && t.lon <= INDIA_BOUNDS.maxLon
        );
        internationalTreasures = (internationalData || []);

        // Fallback: If the fetched data is small, supplement with curated names.
        if (indianTreasures.length < 100) {
            const need = 100 - indianTreasures.length;
            const toResolve = indianCuratedNames.slice(0, need);
            const resolved = await Promise.all(toResolve.map(n => resolvePlaceByName(n, 'India')));
            indianTreasures = indianTreasures.concat(resolved.filter(t => t && t.lat !== null && t.lon !== null));
        }
        if (internationalTreasures.length < 100) {
            const need = 100 - internationalTreasures.length;
            const toResolve = internationalCuratedNames.slice(0, need);
            const resolved = await Promise.all(toResolve.map(n => resolvePlaceByName(n)));
            internationalTreasures = internationalTreasures.concat(resolved.filter(t => t && t.lat !== null && t.lon !== null));
        }

        _listsLoaded = true;
        console.log(`Successfully loaded ${indianTreasures.length} Indian and ${internationalTreasures.length} International treasures!`);
    } catch (error) { console.error("Failed to load treasure lists:", error); }
}

// Wikimedia helper: search pages and return image URLs for a query (works with CORS via origin=*)
export async function fetchWikimediaImages(query, count = 2) {
    if (!query) return [];
    try {
        const api = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=pageimages&piprop=original`;
        const res = await fetch(api, { headers: { 'User-Agent': 'GlobetrotterApp/1.0 (Canvas Environment)' } });
        if (!res.ok) return [];
        const json = await res.json();
        const pages = json.query && json.query.pages ? Object.values(json.query.pages) : [];
        const images = pages.map(p => (p.original && p.original.source) || null).filter(Boolean);
        const unique = [...new Set(images)];
        return unique.slice(0, count);
    } catch {
        return [];
    }
}
  
export async function findRandomLandLocation() {
    // Fallback to a place from the international list for guaranteed coordinates
    if (internationalTreasures.length > 0) {
         const pick = internationalTreasures[Math.floor(Math.random() * internationalTreasures.length)];
         return { 
            lat: pick.lat, 
            lon: pick.lon, 
            name: `A random location near ${pick.name}`, 
            points: 50, 
            description: 'An unexpected discovery on the globe.', 
            imageUrl: pick.imageUrl || null 
        };
    }

    // Default emergency fallback
    return { lat: 0, lon: 0, name: 'The Middle of Nowhere', points: 10, description: 'An emergency coordinate fallback.', imageUrl: null };
}

// Try fetching a Wikipedia page summary for a title. Returns { extract, image } or null on failure.
export async function fetchWikipediaSummary(title) {
    if (!title) return null;
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'GlobetrotterApp/1.0 (Canvas Environment)' } });
        if (!res.ok) return null;
        const json = await res.json();
        const extract = json.extract || null;
        const image = (json.originalimage && json.originalimage.source) || (json.thumbnail && json.thumbnail.source) || null;
        return { extract, image };
    } catch {
        return null;
    }
}
