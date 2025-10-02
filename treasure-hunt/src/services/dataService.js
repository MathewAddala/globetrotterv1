export let indianTreasures = [];
export let internationalTreasures = [];
// Guard to avoid double-loading lists (React StrictMode may mount components twice in dev)
let _listsLoaded = false;
export const jackpotLocation = { 
    name: "KL University, Vaddeswaram", 
    lat: 16.4418, 
    lon: 80.6221,
    imageUrl: 'https://images.hindustantimes.com/img/2021/04/08/1600x900/KL_University_HT_1617871537419_1617871542598.jpg',
    points: 1000 // Special jackpot points
};

// Curated world wonders / famous places (high points)
export const worldWonders = [
    { name: 'Taj Mahal', lat: 27.1751, lon: 78.0421, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Taj-Mahal.jpg', points: 800 },
    { name: 'Great Wall of China', lat: 40.4319, lon: 116.5704, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/GreatWallChain.jpg', points: 900 },
    { name: 'Machu Picchu', lat: -13.1631, lon: -72.5450, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Machu_Picchu%2C_Peru.jpg', points: 850 },
    { name: 'Colosseum', lat: 41.8902, lon: 12.4922, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Colosseo_2020.jpg', points: 800 },
    { name: 'Christ the Redeemer', lat: -22.9519, lon: -43.2105, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Cristo_Redentor_-_Rio_de_Janeiro%2C_Brasil.jpg', points: 800 },
    { name: 'Chichen Itza', lat: 20.6843, lon: -88.5678, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Chichen_Itza_3.jpg', points: 750 }
];

// Curated name-only lists (well-known places). We'll resolve coordinates/images lazily when needed.
export const indianCuratedNames = [
  'Taj Mahal', 'Qutub Minar', 'Red Fort', 'Gateway of India', 'Hampi', 'Khajuraho', 'Konark Sun Temple', 'Meenakshi Temple', 'Sanchi Stupa', 'Golden Temple',
  'Mysore Palace', 'India Gate', 'Humayun\'s Tomb', 'Jaisalmer Fort', 'Jantar Mantar, Jaipur', 'Mehrangarh Fort', 'Victoria Memorial', 'Charminar', 'Lotus Temple', 'Ranakpur Jain Temple',
  'Srinagar Dal Lake', 'Amritsar Wagah Border', 'Kanha National Park', 'Kaziranga National Park', 'Periyar National Park', 'Ellora Caves', 'Ajanta Caves', 'Brihadeeswarar Temple', 'Mahabalipuram', 'Varkala',
  'Rameshwaram', 'Madurai Meenakshi Amman', 'Puri Jagannath Temple', 'Kedarnath', 'Badrinath', 'Tawang Monastery', 'Zonal Museum', 'Sundarbans', 'Andaman Cellular Jail', 'Baga Beach',
  'Goa Old Goa Churches', 'Goa Baga Beach', 'Sanchi', 'Ajmer Sharif', 'Mount Abu', 'Guruvayur Temple', 'Thanjavur', 'Coorg', 'Ooty', 'Kullu Manali',
  'Shimla Ridge', 'Darjeeling', 'Kolkata Victoria Memorial', 'Pench National Park', 'Sariska', 'Ranthambore', 'Jodhpur Mehrangarh', 'Udaipur City Palace', 'Chittorgarh Fort', 'Pushkar',
  'Lucknow Bara Imambara', 'Varanasi Ghats', 'Allahabad Sangam', 'Leh Pangong Tso', 'Zanskar Valley', 'Sikkim Rumtek Monastery', 'Gangtok', 'Tirupati', 'Vijayanagara', 'Hawa Mahal',
  'Akshardham Delhi', 'Birla Mandir Hyderabad', 'Sula Vineyards', 'Bhedaghat Marble Rocks', 'Ladakh Gompa', 'Nandan Kanan', 'Sanchi Stupa', 'Karni Mata Temple', 'Ranthambore Tiger Reserve', 'Khajjiar'
];

export const internationalCuratedNames = [
  'Eiffel Tower', 'Statue of Liberty', 'Sydney Opera House', 'Big Ben', 'Buckingham Palace', 'Mount Fuji', 'Angkor Wat', 'Petra, Jordan', 'Borobudur', 'Great Pyramid of Giza',
  'Christ the Redeemer', 'Grand Canyon', 'Yellowstone National Park', 'Niagara Falls', 'Santorini', 'Prague Old Town', 'Berlin Brandenburg Gate', 'Louvre Museum', 'Sagrada Familia', 'Seine River',
  'Acropolis Athens', 'Stonehenge', 'Alhambra', 'Istanbul Hagia Sophia', 'Moscow Kremlin', 'St. Petersburg Hermitage', 'Mont-Saint-Michel', 'Neuschwanstein Castle', 'Loch Ness', 'Table Mountain',
  'Victoria Falls', 'Banff National Park', 'Galapagos Islands', 'Easter Island', 'Angkor', 'Petra', 'Machu Picchu', 'Chichen Itza', 'Iguazu Falls', 'Pamukkale',
  'Blue Lagoon Iceland', 'Prague Castle', 'Dubrovnik Old Town', 'Bruges', 'Ghent', 'Fushimi Inari Shrine', 'Himeji Castle', 'Nara', 'Kyoto Fushimi', 'Osaka Castle',
  'Mount Kilimanjaro', 'Serengeti', 'Masai Mara', 'Sahara Desert', 'Atlas Mountains', 'Plitvice Lakes', 'Sistine Chapel', 'Vatican City', 'Glenfinnan Viaduct', 'Bora Bora',
  'Maldives', 'Bali Uluwatu', 'Ha Long Bay', 'Angkor Thom', 'Bagan Temples', 'Tikal', 'Cappadocia', 'Pamukkale', 'Cinque Terre', 'Amalfi Coast',
  'Venice Grand Canal', 'Florence Duomo', 'Rome Colosseum', 'Lisbon Belem', 'Madrid Prado', 'Barcelona Gothic Quarter', 'Santorini Oia', 'Mykonos', 'Rhodes', 'Athens Parthenon'
];

// Helpful country hints for ambiguous international names
export const internationalPlaceHints = {
    'Chichen Itza': 'Mexico',
    'Statue of Liberty': 'United States',
    'Eiffel Tower': 'France',
    'Christ the Redeemer': 'Brazil',
    'Great Pyramid of Giza': 'Egypt',
    'Machu Picchu': 'Peru',
    'Colosseum': 'Italy'
};

// Expand hints for more ambiguous or commonly problematic names
Object.assign(internationalPlaceHints, {
    'Grand Canyon': 'United States',
    'Yellowstone National Park': 'United States',
    'Niagara Falls': 'United States',
    'Chichen Itza': 'Mexico',
    'Taj Mahal': 'India',
    'Great Wall of China': 'China',
    'Machu Picchu': 'Peru',
    'Angkor Wat': 'Cambodia'
});

// Unsplash availability/backoff tracking — when rate-limited, avoid repeated requests
let unsplashUnavailableUntil = 0;

// Resolve a place name into a minimal treasure object: try Wikipedia summary for image/description and Nominatim for coords
export async function resolvePlaceByName(name, countryHint) {
    if (!name) return null;
    try {
        const shortTitle = name.split(',')[0].trim();
        const wiki = await fetchWikipediaSummary(shortTitle);
        let lat = null, lon = null, imageUrl = null, description = null;
        if (wiki) {
            imageUrl = wiki.image || null;
            description = wiki.extract || null;
        }
        // Try nominatim geocoding. If a country hint is provided (e.g., 'India') prefer that first to avoid local replicas.
        const tryGeocode = async (q, countryCode) => {
            try {
                let api = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
                if (countryCode) api += `&countrycodes=${encodeURIComponent(countryCode)}`;
                const geoRes = await fetch(api);
                if (geoRes && geoRes.ok) {
                    const places = await geoRes.json();
                    if (places && places.length) {
                        return { lat: parseFloat(places[0].lat), lon: parseFloat(places[0].lon) };
                    }
                }
            } catch { /* ignore */ }
            return null;
        };

        let geo = null;
        if (countryHint) {
            if (countryHint.toLowerCase() === 'india' || countryHint.toLowerCase() === 'in') {
                geo = await tryGeocode(shortTitle, 'in');
            } else {
                geo = await tryGeocode(`${shortTitle}, ${countryHint}`);
            }
        }
        if (!geo) {
            geo = await tryGeocode(shortTitle);
        }
        if (geo) {
            lat = geo.lat; lon = geo.lon;
        }

        // If no image found from wiki, try Wikimedia images search as fallback
        if (!imageUrl) {
            try {
                const imgs = await fetchWikimediaImages(shortTitle, 1);
                if (imgs && imgs.length) imageUrl = imgs[0];
            } catch { /* ignore */ }
        }

        return { name, lat, lon, imageUrl, description, points: 60 };
    } catch {
        console.warn('resolvePlaceByName error');
        return { name, lat: null, lon: null, imageUrl: null, description: null, points: 50 };
    }
}

// Unsplash helper: returns an array of image URLs (regular) for a given query
export async function fetchUnsplashImages(query, count = 2) {
    try {
        const now = Date.now();
        if (unsplashUnavailableUntil && now < unsplashUnavailableUntil) return [];
        const key = import.meta.env.VITE_UNSPLASH_API_KEY;
        if (!key) {
            // don't spam the console
            return [];
        }
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}`;
        const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
        if (!res.ok) {
            if (res.status === 429) {
                // rate limited — back off for one hour
                unsplashUnavailableUntil = Date.now() + (60 * 60 * 1000);
                console.warn('Unsplash rate-limited — falling back to Wikimedia for the next hour');
            } else {
                console.warn('Unsplash request failed', res.statusText);
            }
            return [];
        }
        const json = await res.json();
        return (json.results || []).map(r => r.urls && (r.urls.regular || r.urls.small)).filter(Boolean);
    } catch {
        console.error('fetchUnsplashImages error');
        return [];
    }
}

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
                    'Accept': 'application/sparql-results+json'
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
                    imageUrl: item.image ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(item.image.value.split('/').pop())}` : null,
                    points: points
                };
            }).filter(Boolean);
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    };

    try {
        // Try a quick fetch first to fail fast in case of CORS/timeouts.
        return await doFetch(3000);
    } catch (error) {
        // If aborted due to timeout, retry once with a longer timeout before giving up
        if (error && error.name === 'AbortError') {
            console.warn('Wikidata query aborted (timeout), retrying with longer timeout...');
            try {
                return await doFetch(6000);
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
    // prevent duplicate loads in development (React StrictMode mounts twice)
    if (_listsLoaded) {
        console.log('Treasure lists already loaded; skipping duplicate load.');
        return;
    }
    console.log("Loading high-ranking treasure lists from Wikidata...");
    try {
        const indianQuery = `
            SELECT ?item ?itemLabel ?coord ?description ?image (COUNT(?sitelink) AS ?sitelinks) WHERE {
              ?item wdt:P17 wd:Q668; wdt:P18 ?image; wdt:P625 ?coord.
              { ?item wdt:P31/wdt:P279* wd:Q839954 } UNION { ?item wdt:P31/wdt:P279* wd:Q16560 }
              ?sitelink schema:about ?item.
              OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description) = "en"). }
              SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            } GROUP BY ?item ?itemLabel ?coord ?description ?image ORDER BY DESC(?sitelinks) LIMIT 200`;

        const internationalQuery = `
            SELECT ?item ?itemLabel ?coord ?description ?image (COUNT(?sitelink) AS ?sitelinks) WHERE {
                            ?item wdt:P18 ?image; wdt:P625 ?coord.
                            # Include widely-known entities (World Heritage sites, monuments, landmarks)
                            { ?item wdt:P31/wdt:P279* wd:Q9259 } UNION { ?item wdt:P31/wdt:P279* wd:Q811979 } UNION { ?item wdt:P31/wdt:P279* wd:Q4989906 }
                            ?sitelink schema:about ?item.
              OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description) = "en"). }
              SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            } GROUP BY ?item ?itemLabel ?coord ?description ?image ORDER BY DESC(?sitelinks) LIMIT 800`;

        let indianData = [];
        let internationalData = [];
        try {
            [indianData, internationalData] = await Promise.all([
                fetchWikidata(indianQuery),
                fetchWikidata(internationalQuery)
            ]);
            } catch {
                console.warn('Wikidata fetch failed, falling back to curated sets');
            }

        indianTreasures = indianData && indianData.length ? indianData : [];
        internationalTreasures = (internationalData && internationalData.length) ? internationalData : [];

        // Ensure at least 100 curated entries for both lists by resolving names lazily
        if ((!indianTreasures || indianTreasures.length < 100) && indianCuratedNames && indianCuratedNames.length) {
            const need = 100 - (indianTreasures ? indianTreasures.length : 0);
            const toResolve = indianCuratedNames.slice(0, need);
            // pass country hint to favor locations in India and avoid foreign replicas
            const resolved = await Promise.all(toResolve.map(n => resolvePlaceByName(n, 'India')));
            indianTreasures = (indianTreasures || []).concat(resolved.filter(Boolean));

            // Sanity check: ensure resolved Indian treasures fall within India's approximate bounding box.
            // India's lat roughly between 6.5 and 35.5, lon between 68.0 and 97.5
            const INDIA = { minLat: 6.5, maxLat: 35.5, minLon: 68.0, maxLon: 97.5 };
            for (let i = 0; i < indianTreasures.length; i++) {
                const t = indianTreasures[i];
                const lat = parseFloat(t.lat);
                const lon = parseFloat(t.lon);
                if (!isFinite(lat) || !isFinite(lon) || lat < INDIA.minLat || lat > INDIA.maxLat || lon < INDIA.minLon || lon > INDIA.maxLon) {
                    console.warn(`Indian curated item '${t.name}' resolved outside India (lat:${t.lat}, lon:${t.lon}), retrying geocode with explicit India country code`);
                    const retried = await resolvePlaceByName(t.name, 'India');
                    if (retried) {
                        indianTreasures[i] = retried;
                    }
                }
            }
        }
        if ((!internationalTreasures || internationalTreasures.length < 100) && internationalCuratedNames && internationalCuratedNames.length) {
            const need = 100 - (internationalTreasures ? internationalTreasures.length : 0);
            const toResolve = internationalCuratedNames.slice(0, need);
            const resolved = await Promise.all(toResolve.map(n => resolvePlaceByName(n)));
            internationalTreasures = (internationalTreasures || []).concat(resolved.filter(Boolean));
        }
        _listsLoaded = true;
        console.log(`Successfully loaded ${indianTreasures.length} Indian and ${internationalTreasures.length} International treasures!`);
    } catch (error) { console.error("Failed to load treasure lists from Wikidata:", error); }
}

// Wikimedia helper: search pages and return image URLs for a query (works with CORS via origin=*)
export async function fetchWikimediaImages(query, count = 2) {
    if (!query) return [];
    try {
        // Use MediaWiki API to search pages and request pageimages original
        const api = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=pageimages&piprop=original`;
        const res = await fetch(api);
        if (!res.ok) return [];
        const json = await res.json();
        const pages = json.query && json.query.pages ? Object.values(json.query.pages) : [];
        const images = pages.map(p => (p.original && p.original.source) || null).filter(Boolean);
        // dedupe and limit
        const unique = [...new Set(images)];
        return unique.slice(0, count);
    } catch {
        console.warn('fetchWikimediaImages error');
        return [];
    }
}
  
export async function findRandomLandLocation() {
    let attempts = 0;
    while (attempts < 10) {
        const lat = (Math.random() * 180) - 90;
        const lon = (Math.random() * 360) - 180;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        if (data && data.address && data.address.country_code) {
             const name = data.display_name;
             const points = 50; // Standard points for a random discovery
             const description = `An unexpected discovery in ${data.address.country || ''}.`;
             return { lat, lon, name, points, description, imageUrl: null };
        }
        attempts++;
    }
    return internationalTreasures[0]; // Fallback to a famous place
}

// Try fetching a Wikipedia page summary for a title. Returns { extract, image } or null on failure.
export async function fetchWikipediaSummary(title) {
    if (!title) return null;
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return null;
        const json = await res.json();
        const extract = json.extract || null;
        // thumbnail or original image
        const image = (json.originalimage && json.originalimage.source) || (json.thumbnail && json.thumbnail.source) || null;
        return { extract, image };
    } catch {
        console.warn('fetchWikipediaSummary error');
        return null;
    }
}