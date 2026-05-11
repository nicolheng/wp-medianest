export const tmdbToken = import.meta.env.VITE_TMDB_READ_TOKEN;
export const lastfmApiKey = import.meta.env.VITE_LASTFM_API_KEY;
export const nytBooksApiKey = import.meta.env.VITE_NYT_BOOKS_API_KEY;

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';
export const FALLBACK_MOVIE = '/images/book.png';
export const FALLBACK_TV = '/images/book.png';
export const FALLBACK_BOOK = '/images/book.png';
export const FALLBACK_MUSIC = '/images/music.png';
export const ITUNES_ENDPOINT = '/api/itunes/search';

export const buildTmdbImage = (posterPath, fallback) => {
  if (!posterPath) return fallback;
  return `${TMDB_IMAGE_BASE}${posterPath}`;
};

// --- NEW CENTRALIZED CONSTANTS ---

export const API_ROUTES = {
  TMDB: '/api/tmdb/3',
  LASTFM: '/api/lastfm/2.0',
  ITUNES: '/api/itunes',
  GOOGLE_BOOKS: '/api/googlebooks',
  OPEN_LIBRARY: 'https://openlibrary.org/api/books',
  NYT_BOOKS: '/api/nyt/svc/books/v3',
  AUTH: '/api/auth',
  LIBRARY: '/api/library',
  ITEMS: '/api/items',
  REVIEWS: '/api/reviews'
};

export const APP_CONFIG = {
  CHARTS_REFRESH_MS: 10 * 60 * 1000, // 10 minutes
  TOAST_DELAY_MS: 3500,
  SEARCH_LIMIT: 20
};

export const ITEM_STATES = {
  WATCHLIST: 'watchlist',
  HISTORY: 'history',
  NONE: 'none'
};
