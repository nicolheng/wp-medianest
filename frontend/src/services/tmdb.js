import { itemCache } from '../core/cache.js';
import { 
  tmdbToken, 
  buildTmdbImage, 
  FALLBACK_MOVIE, 
  FALLBACK_TV,
  API_ROUTES 
} from './config.js';

export async function fetchMovies() {
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');
  const res = await fetch(`${API_ROUTES.TMDB}/trending/movie/week`, { headers: { Authorization: 'Bearer ' + tmdbToken } });
  if (!res.ok) throw new Error('Movies fetch failed');
  const data = await res.json();
  return (data.results || []).slice(0, 10).map((m, i) => ({
    id: m.id, rank: i + 1, title: m.title || 'Untitled', sub: (m.release_date || '').slice(0, 4) || 'Unknown year', image: buildTmdbImage(m.poster_path, FALLBACK_MOVIE)
  }));
}

export async function fetchTVShows() {
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');
  const res = await fetch(`${API_ROUTES.TMDB}/trending/tv/week`, { headers: { Authorization: 'Bearer ' + tmdbToken } });
  if (!res.ok) throw new Error('TV fetch failed');
  const data = await res.json();
  return (data.results || []).slice(0, 10).map((show, i) => ({
    id: show.id, rank: i + 1, title: show.name || 'Untitled', sub: (show.first_air_date || '').slice(0, 4) || 'Unknown year', image: buildTmdbImage(show.poster_path, FALLBACK_TV)
  }));
}

export async function fetchMovieById(movieId) {
  if (itemCache[`movie_${movieId}`]) return itemCache[`movie_${movieId}`];
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');
  const res = await fetch(`${API_ROUTES.TMDB}/movie/${movieId}`, { headers: { Authorization: 'Bearer ' + tmdbToken } });
  if (!res.ok) throw new Error(`Failed to fetch movie ID: ${movieId}`);
  const m = await res.json();
  const data = { id: m.id, title: m.title || 'Untitled', sub: (m.release_date || '').slice(0, 4) || 'Unknown year', image: buildTmdbImage(m.poster_path, FALLBACK_MOVIE) };
  itemCache[`movie_${movieId}`] = data;
  return data;
}

export async function fetchTVShowById(tvId) {
  if (itemCache[`tv_${tvId}`]) return itemCache[`tv_${tvId}`];
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');
  const res = await fetch(`${API_ROUTES.TMDB}/tv/${tvId}`, { headers: { Authorization: 'Bearer ' + tmdbToken } });
  if (!res.ok) throw new Error(`Failed to fetch TV ID: ${tvId}`);
  const s = await res.json();
  const data = { id: s.id, title: s.name || 'Untitled', sub: (s.first_air_date || '').slice(0, 4) || 'Unknown year', image: buildTmdbImage(s.poster_path, FALLBACK_TV) };
  itemCache[`tv_${tvId}`] = data;
  return data;
}