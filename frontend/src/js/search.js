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

  // On search_result.html: parse params and fetch/render selected genres
  const resultsPage = document.getElementById('search-results-page');
  if (resultsPage) {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
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

    const promises = [];
    if (showAll || filters.includes('movies')) promises.push(fetchMovies().then(r => renderRail('movies-list', r, 'No movies found', 'movies')));
    if (showAll || filters.includes('tv')) promises.push(fetchTVShows().then(r => renderRail('tv-list', r, 'No TV shows found', 'tv')));
    if (showAll || filters.includes('books')) promises.push(fetchBooks().then(r => renderRail('books-list', r, 'No books found', 'books')));
    if (showAll || filters.includes('music')) promises.push(fetchMusic().then(r => renderRail('music-list', r, 'No music found', 'music')));

    Promise.allSettled(promises).finally(() => {
      if (loader) loader.classList.add('d-none');
    });
  }
});
