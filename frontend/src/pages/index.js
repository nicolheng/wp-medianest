import '../scss/style.scss';
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;
import { fetchBooks } from '../api/book.js';
import { fetchMusic } from '../api/music.js';
import { fetchMovies, fetchTVShows } from '../api/tmdb.js';
import { renderRail, updateLiveSnapshot } from '../components/rail.js';
import { loadWatchlistAndHistory } from './library.js';
import { fetchFullLibrary } from '../api/libraryApi.js';
import { checkAuthStatus } from '../core/session.js';

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;

    htmlElement.setAttribute('data-bs-theme', 'dark');

    localStorage.setItem('theme', 'dark');
});

let cachedCharts = null;

window.loadCharts = async function () {
    await checkAuthStatus();
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
    try {
        console.log("Syncing with MongoDB...");
        await checkAuthStatus();
        if (window.currentUser) {
            await fetchFullLibrary();
        }
    } catch (err) {
        console.log(err);
        console.warn("Could not sync library, operating in offline mode.");
    }
    if (document.getElementById("top-charts")) {
        await window.loadCharts();
        setInterval(window.loadCharts, 10 * 60 * 1000);
    }
    if (document.getElementById("libraryTabContent")) {
        loadWatchlistAndHistory();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const libraryLink = document.getElementById("nav-library");
    if (libraryLink) {
        libraryLink.addEventListener('click', (e) => {
            if (!window.currentUser) {
                e.preventDefault();
                const modalEl = document.getElementById('auth-modal');
                if (modalEl) {
                    const authModal = new bootstrap.Modal(modalEl);
                    authModal.show();
                } else {
                    console.warn("Auth Modal not found on this page.");
                    alert("Please login to access your library.");
                }
            }
        });
    }
});