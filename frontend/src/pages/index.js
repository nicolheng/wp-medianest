import '../core/globals.js';
import { fetchBooks } from '../services/book.js';
import { fetchMusic } from '../services/music.js';
import { fetchMovies, fetchTVShows } from '../services/tmdb.js';
import { renderRail, updateLiveSnapshot } from '../components/rail.js';
import { initUserSession } from '../core/session.js';
import { APP_CONFIG } from '../services/config.js';

let cachedCharts = null;

window.loadCharts = async function () {
    await initUserSession();
    if (!cachedCharts) {
        const [moviesRes, tvRes, booksRes, musicRes] = await Promise.allSettled([
            fetchMovies(), fetchTVShows(), fetchBooks(), fetchMusic()
        ]);

        cachedCharts = {
            movies: moviesRes.status === "fulfilled" ? moviesRes.value : [],
            tv: tvRes.status === "fulfilled" ? tvRes.value : [],
            books: booksRes.status === "fulfilled" ? booksRes.value : [],
            music: musicRes.status === "fulfilled" ? musicRes.value : []
        };
    }

    renderRail('movies-list', cachedCharts.movies, 'Could not load movies', 'movies');
    renderRail('tv-list', cachedCharts.tv, 'Could not load TV shows', 'tv');
    renderRail('books-list', cachedCharts.books, 'Could not load books', 'books');
    renderRail('music-list', cachedCharts.music, 'Could not load music', 'music');
    updateLiveSnapshot(cachedCharts.movies, cachedCharts.tv, cachedCharts.books, cachedCharts.music);

    if (cachedCharts.movies.length === 0) console.error("Movies error");
};

document.addEventListener("DOMContentLoaded", async () => {
    await initUserSession();
    if (document.getElementById("top-charts")) {
        await window.loadCharts();
        setInterval(window.loadCharts, APP_CONFIG.CHARTS_REFRESH_MS);
    }
});