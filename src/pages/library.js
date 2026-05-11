import '../core/globals.js';
import { fetchBookById } from '../services/book.js';
import { fetchTrackById } from '../services/music.js';
import { fetchMovieById, fetchTVShowById } from '../services/tmdb.js';
import { renderRail } from '../components/rail.js';
import { initUserSession } from '../core/session.js';

async function getSafeData(idArray, fetchFunction) {
    if (!idArray || !Array.isArray(idArray)) return [];

    const results = await Promise.allSettled(idArray.map(fetchFunction));

    return results
        .filter(res => res.status === 'fulfilled' && res.value)
        .map(res => res.value);
}

export async function loadWatchlistAndHistory() {
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

document.addEventListener("DOMContentLoaded", async () => {
    await initUserSession({ requireAuth: false });

    loadWatchlistAndHistory();
});
