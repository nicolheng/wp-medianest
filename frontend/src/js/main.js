import '../scss/style.scss'
import * as bootstrap from 'bootstrap'

console.log("Vite Config Root Check:", import.meta.env.MODE);
console.log("All Env Vars:", import.meta.env);

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // 1. Helper function to update the button's look
    const updateButtonUI = (theme) => {
        if (!themeToggleBtn || !themeIcon ) return;

        // Strip away both icons to create a blank slate
        themeIcon.classList.remove('bi-moon-stars-fill', 'bi-sun-fill');

        if (theme === 'dark') {
            // Add the sun icon for Dark Mode
            themeIcon.classList.add('bi-sun-fill');
        } else {
            // Add the moon icon for Light Mode
            themeIcon.classList.add('bi-moon-stars-fill');
        }
    };

    // 2. The Theme Detective
    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) return storedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // 3. Initialize
    const initialTheme = getPreferredTheme();
    htmlElement.setAttribute('data-bs-theme', initialTheme);
    updateButtonUI(initialTheme);

    // 4. Manual Toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateButtonUI(newTheme);
        });
    }

    // 5. System Change Listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            const systemTheme = e.matches ? 'dark' : 'light';
            htmlElement.setAttribute('data-bs-theme', systemTheme);
            updateButtonUI(systemTheme);
        }
    });
});

const tmdbToken = import.meta.env.VITE_TMDB_READ_TOKEN;
const lastfmApiKey = import.meta.env.VITE_LASTFM_API_KEY;
const nytBooksApiKey = import.meta.env.VITE_NYT_BOOKS_API_KEY;

async function fetchMovies() {
  if (!tmdbToken) {
    throw new Error('Missing VITE_TMDB_READ_TOKEN');
  }

  const res = await fetch('/api/tmdb/3/trending/movie/week', {
    headers: { Authorization: "Bearer " + tmdbToken }
  });
  if (!res.ok) throw new Error("Movies fetch failed");
  const data = await res.json();
  return (data.results || []).slice(0, 5).map((m, i) => ({
    rank: i + 1,
    title: m.title,
    sub: (m.release_date || "").slice(0, 4) || "Unknown year"
  }));
}

async function fetchBooks() {
  if (!nytBooksApiKey) {
    throw new Error('Missing VITE_NYT_BOOKS_API_KEY');
  }

  const res = await fetch(
    `/api/nyt/svc/books/v3/lists/current/hardcover-fiction.json?api-key=${nytBooksApiKey}`
  );
  if (!res.ok) throw new Error("Books fetch failed");
  const data = await res.json();
  return (data.results?.books || []).slice(0, 10).map((b, i) => ({
    rank: i + 1,
    title: b.title || "Untitled",
    sub: b.author || "Unknown author"
  }));
}

async function fetchMusic() {
  if (!lastfmApiKey) {
    throw new Error('Missing VITE_LASTFM_API_KEY');
  }

  const res = await fetch(
    `/api/lastfm/2.0/?method=chart.gettoptracks&api_key=${lastfmApiKey}&format=json&limit=10`
  );
  if (!res.ok) throw new Error("Music fetch failed");
  const data = await res.json();
  return (data.tracks?.track || []).slice(0, 10).map((s, i) => ({
    rank: i + 1,
    title: s.name || "Untitled",
    sub: s.artist?.name || "Unknown artist"
  }));
}

function renderList(containerId, items, emptyLabel) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.replaceChildren();

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'text-body-secondary small mb-0';
    empty.textContent = emptyLabel;
    el.append(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'd-flex align-items-start gap-2 py-2 border-bottom';

    const rank = document.createElement('span');
    rank.className = 'badge text-bg-primary';
    rank.textContent = String(item.rank);

    const content = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'fw-semibold';
    title.textContent = item.title;

    const sub = document.createElement('div');
    sub.className = 'small text-body-secondary';
    sub.textContent = item.sub;

    content.append(title, sub);
    row.append(rank, content);
    el.append(row);
  });
}

async function loadCharts() {
  const [moviesRes, booksRes, musicRes] = await Promise.allSettled([
    fetchMovies(),
    fetchBooks(),
    fetchMusic()
  ]);

  const movies = moviesRes.status === "fulfilled" ? moviesRes.value : [];
  const books = booksRes.status === "fulfilled" ? booksRes.value : [];
  const music = musicRes.status === "fulfilled" ? musicRes.value : [];

  renderList("movies-list", movies, "Could not load movies");
  renderList("books-list", books, "Could not load books");
  renderList("music-list", music, "Could not load music");

  if (moviesRes.status === "rejected") console.error("Movies error:", moviesRes.reason);
  if (booksRes.status === "rejected") console.error("Books error:", booksRes.reason);
  if (musicRes.status === "rejected") console.error("Music error:", musicRes.reason);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("top-charts")) return;
  loadCharts();
  setInterval(loadCharts, 10 * 60 * 1000);
});