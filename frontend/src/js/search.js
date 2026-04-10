import { fetchMovies, fetchTVShows, fetchBooks, fetchMusic, renderRail } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  // Submit from search.html -> navigate to search_result.html with query params
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = (document.getElementById('search-input')?.value || '').trim();
      const filters = [];
      if (document.getElementById('filter-movies')?.checked) filters.push('movies');
      if (document.getElementById('filter-tv')?.checked) filters.push('tv');
      if (document.getElementById('filter-books')?.checked) filters.push('books');
      if (document.getElementById('filter-music')?.checked) filters.push('music');

      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (filters.length) params.set('filters', filters.join(','));
      // If no filters selected we treat as 'all' by omitting filters param
      const qs = params.toString();
      window.location.href = `search_result.html${qs ? ('?' + qs) : ''}`;
    });
  }

  // On search_result.html: parse params and fetch/render selected items
  const resultsPage = document.getElementById('search-results-page');
  if (resultsPage) {
    // indicate loading state while we fetch
    resultsPage.classList.add('loading-active');
    // If user clicks the search form container (but not the input or submit), go back to search.html
    if (searchForm) {
      searchForm.addEventListener('click', (e) => {
        try {
          if (e.target && e.target.closest && (e.target.closest('#search-input') || e.target.closest('button[type="submit"]'))) {
            return; // allow interacting with input/button
          }
        } catch (err) {
          // ignore
        }
        window.location.href = 'search.html';
      });
    }
    const params = new URLSearchParams(window.location.search);
    const q = (params.get('q') || '').trim();
    const filters = (params.get('filters') || '').split(',').filter(Boolean);
    const showAll = filters.length === 0;

    const titleEl = document.getElementById('results-title');
    if (titleEl) titleEl.textContent = q ? `Results for "${q}"` : 'Results';

    const sections = {
      movies: document.getElementById('movies-section'),
      tv: document.getElementById('tv-section'),
      books: document.getElementById('books-section'),
      music: document.getElementById('music-section')
    };

    Object.entries(sections).forEach(([key, el]) => {
      if (!el) return;
      if (showAll || filters.includes(key)) el.classList.remove('d-none'); else el.classList.add('d-none');
    });

    const loader = document.getElementById('results-loader');
    if (loader) loader.classList.remove('d-none');

    // Helper to match query against result item fields
    const qLower = q.toLowerCase();
    const matchItem = (item) => {
      if (!qLower) return true;
      const title = (item.title || '').toString().toLowerCase();
      const sub = (item.sub || '').toString().toLowerCase();
      return title.includes(qLower) || sub.includes(qLower);
    };

    // Local renderer for combined/mixed-type results into #matches-list
    function renderCombined(containerId, items) {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.replaceChildren();
      el.classList.add('media-rail');

      if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'text-body-secondary small mb-0';
        empty.textContent = 'No matches found';
        el.append(empty);
        return;
      }

      items.forEach((item) => {
        const link = document.createElement('a');
        const id = item._id || item.id || item.rank;
        link.href = `item_details.html?id=${id}`;
        link.style.display = 'contents'; 
        link.classList.add('text-decoration-none');
        
        const card = document.createElement('article');
        card.className = 'media-card';
        if (item.type === 'music') card.classList.add('media-card--square');

        const img = document.createElement('img');
        img.className = 'media-thumb';
        img.src = item.image || '';
        img.alt = item.title;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.onerror = () => {
          const fallbackByType = {
            movies: 'https://placehold.co/342x513/1b1f24/f8f9fa?text=No+Poster',
            tv: 'https://placehold.co/342x513/1b1f24/f8f9fa?text=No+Poster',
            books: 'https://placehold.co/300x450/1b1f24/f8f9fa?text=No+Cover',
            music: 'https://placehold.co/300x300/1b1f24/f8f9fa?text=No+Art',
          };
          img.src = fallbackByType[item.type] || fallbackByType.music;
        };

        const overlay = document.createElement('div');
        overlay.className = 'media-card-overlay';

        const title = document.createElement('div');
        title.className = 'media-title';
        title.textContent = item.title;

        const sub = document.createElement('div');
        sub.className = 'media-sub';
        sub.textContent = item.sub;

        // Badge: show type label or rank if available
        const badge = document.createElement('span');
        badge.className = 'badge text-bg-primary position-absolute top-0 start-0 m-2';
        badge.textContent = item.rank ? `#${item.rank}` : (item.type || '');

        overlay.append(title, sub);
        card.append(badge, img, overlay);
        link.append(card);
        el.append(link);
      });
    }

    // We'll fetch all categories, keep both full lists and filtered lists.
    const allPromises = {
      movies: fetchMovies(),
      tv: fetchTVShows(),
      books: fetchBooks(),
      music: fetchMusic(),
    };

    Promise.allSettled([allPromises.movies, allPromises.tv, allPromises.books, allPromises.music])
      .then((results) => {
        const [moviesRes, tvRes, booksRes, musicRes] = results;

        const moviesAll = moviesRes.status === 'fulfilled' ? moviesRes.value : [];
        const tvAll = tvRes.status === 'fulfilled' ? tvRes.value : [];
        const booksAll = booksRes.status === 'fulfilled' ? booksRes.value : [];
        const musicAll = musicRes.status === 'fulfilled' ? musicRes.value : [];

        // Build matched lists only for visible categories (showAll || in filters)
        const matches = [];
        if (showAll || filters.includes('movies')) {
          moviesAll.filter(matchItem).forEach((it) => matches.push({ ...it, type: 'movies' }));
        }
        if (showAll || filters.includes('tv')) {
          tvAll.filter(matchItem).forEach((it) => matches.push({ ...it, type: 'tv' }));
        }
        if (showAll || filters.includes('books')) {
          booksAll.filter(matchItem).forEach((it) => matches.push({ ...it, type: 'books' }));
        }
        if (showAll || filters.includes('music')) {
          musicAll.filter(matchItem).forEach((it) => matches.push({ ...it, type: 'music' }));
        }

        // Render combined matches into the top section
        renderCombined('matches-list', matches);

        // Render the full lists under Other (per-type)
        renderRail('movies-list', moviesAll, 'No movies found', 'movies');
        renderRail('tv-list', tvAll, 'No TV shows found', 'tv');
        renderRail('books-list', booksAll, 'No books found', 'books');
        renderRail('music-list', musicAll, 'No music found', 'music');

        // Log any errors
        if (moviesRes.status === 'rejected') console.error('Movies error:', moviesRes.reason);
        if (tvRes.status === 'rejected') console.error('TV error:', tvRes.reason);
        if (booksRes.status === 'rejected') console.error('Books error:', booksRes.reason);
        if (musicRes.status === 'rejected') console.error('Music error:', musicRes.reason);
      })
      .finally(() => {
        if (loader) loader.classList.add('d-none');
        // remove loading state when finished
        resultsPage.classList.remove('loading-active');
      });
  }
});