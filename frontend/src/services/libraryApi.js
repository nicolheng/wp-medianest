import { API_ROUTES } from './config.js';
import { itemCache } from '../core/cache.js';
import { updateCardButtons } from '../components/rail.js';

const API_URL = API_ROUTES.LIBRARY;

export async function fetchFullLibrary() {
    if (!window.currentUser) {
        console.error("User data missing! Please log in.");
        const authModal = new bootstrap.Modal(document.getElementById('auth-modal'));
        authModal.show();
        return;
    }
    const userId = window.currentUser.id;
    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) throw new Error("DB Fetch Failed");

        const data = await response.json();
        window.userLibrary = data;
        window.dispatchEvent(new Event('libraryUpdated'));
        return data;
    } catch (error) {
        console.error("Library Error:", error);
        // Fallback so the app doesn't crash
        return { watchlist: { movies: [], tv: [], books: [], music: [] }, history: { movies: [], tv: [], books: [], music: [] } };
    }
}

window.addToWatchlist = async (id, type, itemData) => {
    if (itemData) itemCache[`${type === 'movie' || type === 'movies' ? 'movie' : type === 'show' || type === 'tv' ? 'tv' : type === 'book' || type === 'books' ? 'book' : 'music'}_${id}`] = itemData;

    if (!window.currentUser) {
        console.error("User data missing! Please log in.");
        const authModal = new bootstrap.Modal(document.getElementById('auth-modal'));
        authModal.show();
        return;
    }

    if (!window.userLibrary) window.userLibrary = { watchlist: {}, history: {} };
    if (!window.userLibrary.watchlist[type]) window.userLibrary.watchlist[type] = [];
    window.userLibrary.watchlist[type].push(String(id));

    // 2. FAST UI UPDATE: Change only the buttons
    updateCardButtons(id, type, 'watchlist', itemData);
    window.dispatchEvent(new Event('libraryUpdated'));

    try {
        const response = await fetch(`${API_URL}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: window.currentUser.id, itemId: id, itemType: type }),
            credentials: 'include'
        });
    } catch (err) {
        console.error("Failed to add item:", err);
    }
};

window.removeFromWatchlist = async (id, type) => {
    if (!window.currentUser) {
        console.error("User data missing! Please log in.");
        const authModal = new bootstrap.Modal(document.getElementById('authModal'));
        authModal.show();
        return;
    }
    if (window.userLibrary && window.userLibrary.watchlist[type]) {
        window.userLibrary.watchlist[type] = window.userLibrary.watchlist[type].filter(itemId => itemId !== String(id));
    }
    updateCardButtons(id, type, 'none');
    window.dispatchEvent(new Event('libraryUpdated'));
    try {
        const response = await fetch(`${API_URL}/remove`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: window.currentUser.id, itemId: id, itemType: type }),
            credentials: 'include'
        });

    } catch (err) {
        console.error("Failed to remove item:", err);
    }
};

window.moveToHistory = async (id, type) => {
    if (!window.currentUser) {
        console.error("User data missing! Please log in.");
        const authModal = new bootstrap.Modal(document.getElementById('authModal'));
        authModal.show();
        return;
    }
    if (window.userLibrary) {
        if (window.userLibrary.watchlist[type]) {
            window.userLibrary.watchlist[type] = window.userLibrary.watchlist[type].filter(itemId => itemId !== String(id));
        }
        if (!window.userLibrary.history[type]) window.userLibrary.history[type] = [];
        window.userLibrary.history[type].push(String(id));
    }
    updateCardButtons(id, type, 'history');
    window.dispatchEvent(new Event('libraryUpdated'));
    try {
        const response = await fetch(`${API_URL}/watched`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: window.currentUser.id, itemId: id, itemType: type }),
            credentials: 'include'
        });
    } catch (err) {
        console.error("Failed to move item:", err);
    }
};