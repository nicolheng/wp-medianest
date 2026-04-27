import { fetchMovieById, fetchTVShowById, fetchBookById, fetchTrackById, itemCache } from './api.js';
import { renderRail } from './ui.js';
import { checkAuthStatus } from './session.js';

const refreshUI = () => {
    if (document.getElementById("libraryTabContent")) {
        loadWatchlistAndHistory();
    }
    if (window.loadCharts && document.getElementById("top-charts")) {
        window.loadCharts();
    }
    if (window.renderSearchResults && document.getElementById('search-results-page')) {
        window.renderSearchResults();
    }
    if(window.loadDetailButton && document.getElementById('action-container')){
        const params = new URLSearchParams(window.location.search);
        window.loadDetailButton(params.get('id'), params.get('type'));
    }
};

const API_URL = 'http://localhost:5000/api/library';

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
        return data;
    } catch (error) {
        console.error("Library Error:", error);
        // Fallback so the app doesn't crash
        return { watchlist: {movies: [], tv: [], books: [], music: []}, history: {movies: [], tv: [], books: [], music: []} };
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
    const userId = window.currentUser.id;

    try {
        const response = await fetch(`${API_URL}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, itemId: id, itemType: type }),
            credentials: 'include'
        });

        if (response.ok) {
            await fetchFullLibrary();
            refreshUI();
        }
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
    const userId = window.currentUser.id;

    try {
        const response = await fetch(`${API_URL}/remove`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, itemId: id, itemType: type }),
            credentials: 'include'
        });

        if (response.ok) {
            await fetchFullLibrary();
            refreshUI();
        }
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
    const userId = window.currentUser.id;

    try {
        const response = await fetch(`${API_URL}/watched`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, itemId: id, itemType: type }),
            credentials: 'include'
        });

        if (response.ok) {
            await fetchFullLibrary();
            refreshUI();
        }
    } catch (err) {
        console.error("Failed to move item:", err);
    }
};
 async function getSafeData(idArray, fetchFunction) {
    if (!idArray || !Array.isArray(idArray)) return [];

    const results = await Promise.allSettled(idArray.map(fetchFunction));

    return results
        .filter(res => res.status === 'fulfilled' && res.value)
        .map(res => res.value);
}

export async function loadWatchlistAndHistory() {
    await checkAuthStatus(); 

    // 2. If no user is found, kick them out immediately
    if (!window.currentUser) {
        window.location.href = 'login.html'; 
        return;
    }
    const library = window.userLibrary || { watchlist: {}, history: {} };
    const watchlist = library.watchlist;
    const history = library.history;
    
    try {
        const [
            movieData, tvData, bookData, trackData,
            historyMovieData, historyTvData, historyBookData, historyTrackData
        ] = await Promise.all([
            getSafeData(watchlist?.movies, fetchMovieById),
            getSafeData(watchlist?.tv, fetchTVShowById),
            getSafeData(watchlist?.books, fetchBookById),
            getSafeData(watchlist?.music, fetchTrackById),
            getSafeData(history?.movies, fetchMovieById),
            getSafeData(history?.tv, fetchTVShowById),
            getSafeData(history?.books, fetchBookById),
            getSafeData(history?.music, fetchTrackById)
        ]);

        renderRail('watchlist-movies-list', movieData, 'Your movie watchlist is empty.', 'movies');
        renderRail('watchlist-tv-list', tvData, 'Your TV show watchlist is empty.', 'tv');
        renderRail('watchlist-books-list', bookData, 'Your book watchlist is empty.', 'books');
        renderRail('watchlist-music-list', trackData, 'Your music watchlist is empty.', 'music');

        renderRail('history-movies-list', historyMovieData, 'You have no watched movies.', 'movies');
        renderRail('history-tv-list', historyTvData, 'You have no watched TV shows.', 'tv');
        renderRail('history-books-list', historyBookData, 'You have no read books.', 'books');
        renderRail('history-music-list', historyTrackData, 'You have no listened tracks.', 'music');

    } catch (error) {
        console.error("Error loading library:", error);
    }
}