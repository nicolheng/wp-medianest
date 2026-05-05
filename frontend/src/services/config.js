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