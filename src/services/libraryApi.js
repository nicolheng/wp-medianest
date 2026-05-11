import { API_ROUTES } from './config.js';
import { itemCache } from '../core/cache.js';
import { updateCardButtons } from '../components/rail.js';

const STORAGE_KEY = 'medianest_library';

function getEmptyLibrary() {
    return {
        watchlist: { movies: [], tv: [], books: [], music: [] },
        history: { movies: [], tv: [], books: [], music: [] }
    };
}

function saveLibrary(library) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export async function fetchFullLibrary() {
    // In standalone mode, we don't strictly need a user, 
    // but we'll use the STORAGE_KEY to simulate persistence.
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const data = stored ? JSON.parse(stored) : getEmptyLibrary();
        
        // Ensure structure is correct (backward compatibility)
        if (!data.watchlist) data.watchlist = { movies: [], tv: [], books: [], music: [] };
        if (!data.history) data.history = { movies: [], tv: [], books: [], music: [] };

        window.userLibrary = data;
        return data;
    } catch (error) {
        console.error("Local Library Error:", error);
        window.userLibrary = getEmptyLibrary();
        return window.userLibrary;
    }
}

window.addToWatchlist = async (id, type, itemData) => {
    // Normalize type
    const normalizedType = type === 'movie' || type === 'movies' ? 'movies' 
                         : type === 'show' || type === 'tv' ? 'tv' 
                         : type === 'book' || type === 'books' ? 'books' 
                         : 'music';

    if (itemData) itemCache[`${normalizedType === 'movies' ? 'movie' : normalizedType === 'books' ? 'book' : normalizedType}_${id}`] = itemData;

    if (!window.userLibrary) await fetchFullLibrary();
    
    if (!window.userLibrary.watchlist[normalizedType]) {
        window.userLibrary.watchlist[normalizedType] = [];
    }
    
    const idStr = String(id);
    if (!window.userLibrary.watchlist[normalizedType].includes(idStr)) {
        window.userLibrary.watchlist[normalizedType].push(idStr);
        saveLibrary(window.userLibrary);
    }

    // 2. FAST UI UPDATE: Change only the buttons
    updateCardButtons(id, normalizedType, 'watchlist', itemData);
    window.dispatchEvent(new Event('libraryUpdated'));
};

window.removeFromWatchlist = async (id, type) => {
    const normalizedType = type === 'movie' || type === 'movies' ? 'movies' 
                         : type === 'show' || type === 'tv' ? 'tv' 
                         : type === 'book' || type === 'books' ? 'books' 
                         : 'music';

    if (!window.userLibrary) await fetchFullLibrary();

    if (window.userLibrary.watchlist[normalizedType]) {
        window.userLibrary.watchlist[normalizedType] = window.userLibrary.watchlist[normalizedType].filter(itemId => itemId !== String(id));
        saveLibrary(window.userLibrary);
    }

    updateCardButtons(id, normalizedType, 'none');
    window.dispatchEvent(new Event('libraryUpdated'));
};

window.moveToHistory = async (id, type) => {
    const normalizedType = type === 'movie' || type === 'movies' ? 'movies' 
                         : type === 'show' || type === 'tv' ? 'tv' 
                         : type === 'book' || type === 'books' ? 'books' 
                         : 'music';

    if (!window.userLibrary) await fetchFullLibrary();

    const idStr = String(id);
    
    // Remove from watchlist
    if (window.userLibrary.watchlist[normalizedType]) {
        window.userLibrary.watchlist[normalizedType] = window.userLibrary.watchlist[normalizedType].filter(itemId => itemId !== idStr);
    }
    
    // Add to history
    if (!window.userLibrary.history[normalizedType]) {
        window.userLibrary.history[normalizedType] = [];
    }
    
    if (!window.userLibrary.history[normalizedType].includes(idStr)) {
        window.userLibrary.history[normalizedType].push(idStr);
    }

    saveLibrary(window.userLibrary);
    updateCardButtons(id, normalizedType, 'history');
    window.dispatchEvent(new Event('libraryUpdated'));
};