const VITE_PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY;

// Global variable definitions
export let indianTreasures = [];
export let internationalTreasures = [];
let _listsLoaded = false;

export const jackpotLocation = {
    name: "KL University, Vaddeswaram",
    lat: 16.4418,
    lon: 80.6221,
    imageUrl: 'https://images.hindustantimes.com/img/2021/04/08/1600x900/KL_University_HT_1617871537419_1617871542598.jpg',
    description: "The ultimate treasure! A hub of knowledge and innovation, said to hold the legendary lost library of ancient code.",
    points: 2000 // Special jackpot points
};

// A curated list of World Wonders for special probability
export const worldWonders = [
    { name: 'Taj Mahal, Agra', lat: 27.1751, lon: 78.0421, points: 1000, description: "An immense mausoleum of white marble, built in Agra between 1631 and 1648 by order of the Mughal emperor Shah Jahan." },
    { name: 'Great Wall of China', lat: 40.4319, lon: 116.5704, points: 1000, description: "A series of fortifications that were built across the historical northern borders of ancient Chinese states and Imperial China." },
    { name: 'Machu Picchu, Peru', lat: -13.1631, lon: -72.5450, points: 990, description: "An Incan citadel set high in the Andes Mountains in Peru, renowned for its sophisticated dry-stone walls." },
    { name: 'Colosseum, Rome', lat: 41.8902, lon: 12.4922, points: 990, description: "An oval amphitheatre in the centre of Rome, Italy. The largest ancient amphitheatre ever built." },
    { name: 'Christ the Redeemer, Brazil', lat: -22.9519, lon: -43.2105, points: 970, description: "An Art Deco statue of Jesus Christ in Rio de Janeiro, Brazil, created by French sculptor Paul Landowski." },
    { name: 'Chichen Itza, Mexico', lat: 20.6843, lon: -88.5678, points: 960, description: "A large pre-Columbian city built by the Maya people of the Terminal Classic period." },
    { name: 'Petra, Jordan', lat: 30.3285, lon: 35.4444, points: 960, description: "A famous archaeological site in Jordan's southwestern desert, dating to around 300 B.C." },
    { name: 'Great Pyramid of Giza', lat: 29.9792, lon: 31.1342, points: 1000, description: "The oldest and largest of the three pyramids in the Giza pyramid complex, and the oldest of the Seven Wonders of the Ancient World." }
];


// --- Pixabay Image Fetching & Caching ---
const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY;
const CACHE_PREFIX = 'pixabay_img_v2_'; // Updated cache version
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Fetches and returns an array of up to 2 image URLs
export async function fetchAndCacheImageUrls(query) {
    if (!query) return [];
    const cacheKey = `${CACHE_PREFIX}${query.replace(/\s/g, '_').toLowerCase()}`;

    // 1. Check for a valid cached item
    try {
        const cachedItem = localStorage.getItem(cacheKey);
        if (cachedItem) {
            const { urls, timestamp } = JSON.parse(cachedItem);
            if (Date.now() - timestamp < CACHE_DURATION_MS) {
                console.log(`Using cached images for "${query}"`);
                return urls;
            }
        }
    } catch (e) { console.warn("Cache read error:", e); }

    // 2. If no valid cache, fetch from Pixabay API
    const placeholderUrl = `https://placehold.co/1000x500/5C3D2E/E0C097?text=${encodeURIComponent(query)}`;
    if (!PIXABAY_API_KEY) {
        console.warn("Pixabay API Key is missing. Using placeholders.");
        return [placeholderUrl, placeholderUrl];
    }
    
    // --- OPTIMIZED QUERY ---
    const cleanQuery = query.split(',')[0].trim();
    const URL = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=5&order=popular`;
    
    try {
        console.log(`Fetching new images for "${query}" from Pixabay...`);
        const response = await fetch(URL);
        if (!response.ok) {
            console.error("Pixabay API request failed:", response.statusText);
            return [placeholderUrl, placeholderUrl];
        }
        const data = await response.json();
        
        const imageUrls = data.hits?.map(hit => hit.webformatURL).slice(0, 2) || [];

        if (imageUrls.length > 0) {
            // Fill remaining slots with placeholders if API returns less than 2 images
            while (imageUrls.length < 2) {
                imageUrls.push(placeholderUrl);
            }
            const newItem = { urls: imageUrls, timestamp: Date.now() };
            localStorage.setItem(cacheKey, JSON.stringify(newItem));
            return imageUrls;
        } else {
            return [placeholderUrl, placeholderUrl];
        }
    } catch (error) {
        console.error("Error fetching from Pixabay:", error);
        return [placeholderUrl, placeholderUrl];
    }
}


// Loads treasure data from local JSON files
export async function loadTreasureLists() {
    if (_listsLoaded) return;
    try {
        const [indianRes, internationalRes] = await Promise.all([
            fetch('./indian-treasures.json'),
            fetch('./international-treasures.json')
        ]);
        indianTreasures = await indianRes.json();
        internationalTreasures = await internationalRes.json();
        _listsLoaded = true;
        console.log(`Successfully loaded ${indianTreasures.length} Indian and ${internationalTreasures.length} International treasure locations!`);
    } catch (error) {
        console.error("Failed to load local treasure lists:", error);
    }
}

export async function findRandomLandLocation() {
    // This function is no longer used in the main probability but serves as a fallback
    if (internationalTreasures.length > 0) {
        const pick = internationalTreasures[Math.floor(Math.random() * internationalTreasures.length)];
        return {
            lat: pick.lat,
            lon: pick.lon,
            name: `A random location near ${pick.name}`,
            points: 50,
            description: 'An unexpected discovery on the globe.'
        };
    }
    return { lat: 0, lon: 0, name: 'The Middle of Nowhere', points: 10, description: 'An emergency coordinate fallback.' };
}

