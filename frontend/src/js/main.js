import '../scss/style.scss';
import 'bootstrap';
import { fetchMovies, fetchTVShows, fetchBooks, fetchMusic } from './api.js';
import { renderRail, updateLiveSnapshot } from './ui.js';
import { loadWatchlistAndHistory,  fetchFullLibrary } from './library.js';
import { checkAuthStatus } from './session.js';

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const updateButtonUI = (theme) => {
        if (!themeToggleBtn || !themeIcon ) return;
        themeIcon.classList.remove('bi-moon-stars-fill', 'bi-sun-fill');
        if (theme === 'dark') {
            themeIcon.classList.add('bi-sun-fill');
        } else {
            themeIcon.classList.add('bi-moon-stars-fill');
        }
    };

    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) return storedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const initialTheme = getPreferredTheme();
    htmlElement.setAttribute('data-bs-theme', initialTheme);
    updateButtonUI(initialTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateButtonUI(newTheme);
        });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            const systemTheme = e.matches ? 'dark' : 'light';
            htmlElement.setAttribute('data-bs-theme', systemTheme);
            updateButtonUI(systemTheme);
        }
    });
});

let cachedCharts = null;

window.loadCharts = async function() {
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