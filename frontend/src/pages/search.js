import '../core/globals.js';
import { searchMovies, searchTVShows, searchBooks, searchMusic } from '../services/searchApi.js';
import { renderRail } from '../components/rail.js';
import { initUserSession } from '../core/session.js';

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
  window.renderSearchResults = async function () {
    const resultsPage = document.getElementById('search-results-page');
    if (resultsPage) {
      resultsPage.classList.add('loading-active');

      const params = new URLSearchParams(window.location.search);
      await initUserSession();
      const q = (params.get('q') || '').trim();
      const filters = (params.get('filters') || '').split(',').filter(Boolean);
      const isFilterActive = filters.length > 0; // Boolean to check if any filter is chosen

      const titleEl = document.getElementById('results-title');
      if (titleEl) titleEl.textContent = q ? `Results for "${q}"` : 'Results';

      // Helper to match query against result item fields
      const qLower = q.toLowerCase();
      const matchItem = (item) => {
        if (!qLower) return true;
        const title = (item.title || '').toString().toLowerCase();
        const sub = (item.sub || '').toString().toLowerCase();
        return title.includes(qLower) || sub.includes(qLower);
      };

      // 1. Fetch all categories using search_api (works for both query and non-query)
      const allPromises = {
        movies: searchMovies(q),
        tv: searchTVShows(q),
        books: searchBooks(q),
        music: searchMusic(q),
      };

      Promise.allSettled([allPromises.movies, allPromises.tv, allPromises.books, allPromises.music])
        .then((results) => {
          const [moviesRes, tvRes, booksRes, musicRes] = results;

          const moviesAll = moviesRes.status === 'fulfilled' ? moviesRes.value : [];
          const tvAll = tvRes.status === 'fulfilled' ? tvRes.value : [];
          const booksAll = booksRes.status === 'fulfilled' ? booksRes.value : [];
          const musicAll = musicRes.status === 'fulfilled' ? musicRes.value : [];

          // 2. Logic for "MATCHES" Section
          const typeMap = {
            movies: { matches: moviesAll.filter(matchItem), container: 'matches-movies', list: 'matches-movies-list', label: 'movies' },
            tv: { matches: tvAll.filter(matchItem), container: 'matches-tv', list: 'matches-tv-list', label: 'tv shows' },
            books: { matches: booksAll.filter(matchItem), container: 'matches-books', list: 'matches-books-list', label: 'books' },
            music: { matches: musicAll.filter(matchItem), container: 'matches-music', list: 'matches-music-list', label: 'tracks' }
          };

          Object.entries(typeMap).forEach(([type, info]) => {
            const containerEl = document.getElementById(info.container);
            const listEl = document.getElementById(info.list);
            if (!containerEl || !listEl) return;

            let shouldShow = false;

            if (isFilterActive) {
              // If filters are chosen, show only categories in filters (even if empty)
              shouldShow = filters.includes(type);
            } else {
              // If NO filters, show only if there are actual matches
              shouldShow = info.matches.length > 0;
            }

            if (shouldShow) {
              containerEl.classList.remove('d-none');
              listEl.replaceChildren();

              if (info.matches.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'text-body-secondary small mb-0 p-2';
                empty.textContent = `No ${info.label} found`;
                listEl.append(empty);
              } else {
                // Render matches using the shared rail renderer for consistency
                renderRail(info.list, info.matches, `No ${info.label} found`, type);
              }
            } else {
              containerEl.classList.add('d-none');
            }
          });
          // Decide whether there are any matches across all categories
          const totalMatches = Object.values(typeMap).reduce((sum, t) => sum + (t.matches?.length || 0), 0);

          const matchesSection = document.getElementById('matches-section');
          const otherSection = document.getElementById('other-section');

          // If there are no matches at all, hide Matches and show Others; otherwise hide Others
          if (totalMatches === 0) {
            if (matchesSection) matchesSection.classList.add('d-none');
            if (otherSection) otherSection.classList.remove('d-none');

            // Show central no-results message
            const noResultsEl = document.getElementById('no-results-msg');
            if (noResultsEl) {
              noResultsEl.classList.remove('d-none');
              const h2 = noResultsEl.querySelector('h2');
              if (h2) h2.textContent = 'no matches found';
            }

            // Render Others: show ALL categories and ALL items (randomized)
            const shuffleArray = (arr) => {
              const a = Array.isArray(arr) ? [...arr] : [];
              for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
              }
              return a;
            };

            // Fetch API-only lists (no query) and render them
            Promise.allSettled([
              searchMovies(''),
              searchTVShows(''),
              searchBooks(''),
              searchMusic('')
            ]).then((apiResults) => {
              const [mRes, tRes, bRes, muRes] = apiResults;
              const moviesApi = mRes.status === 'fulfilled' ? mRes.value : [];
              const tvApi = tRes.status === 'fulfilled' ? tRes.value : [];
              const booksApi = bRes.status === 'fulfilled' ? bRes.value : [];
              const musicApi = muRes.status === 'fulfilled' ? muRes.value : [];

              renderRail('movies-list', shuffleArray(moviesApi), 'No movies found', 'movies');
              renderRail('tv-list', shuffleArray(tvApi), 'No TV shows found', 'tv');
              renderRail('books-list', shuffleArray(booksApi), 'No books found', 'books');
              renderRail('music-list', shuffleArray(musicApi), 'No music found', 'music');
            });
          } else {
            if (matchesSection) matchesSection.classList.remove('d-none');
            if (otherSection) otherSection.classList.add('d-none');
            const noResultsEl = document.getElementById('no-results-msg');
            if (noResultsEl) noResultsEl.classList.add('d-none');
          }

        })
        .finally(() => {
          const loader = document.getElementById('results-loader');
          if (loader) loader.classList.add('d-none');
          resultsPage.classList.remove('loading-active');
        });
    }
  }
  if (document.getElementById('search-results-page')) {
    window.renderSearchResults();
  }

});