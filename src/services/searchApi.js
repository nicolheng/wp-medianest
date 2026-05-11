import { lastfmApiKey, tmdbToken, FALLBACK_BOOK, FALLBACK_MOVIE, FALLBACK_TV, FALLBACK_MUSIC, TMDB_IMAGE_BASE, API_ROUTES, APP_CONFIG } from "./config.js"

function buildTmdbImage(posterPath, fallback) {
  if (!posterPath) return fallback;
  return `${TMDB_IMAGE_BASE}${posterPath}`;
}

function sanitizeText(v) {
  return (v || '').toString();
}

const ITUNES_ENDPOINT = '/api/itunes/search';

function isLastFmPlaceholderImage(url) {
  if (!url) return true;
  const normalized = String(url).toLowerCase();
  return normalized.includes('2a96') || normalized.includes('default') || normalized.includes('noimage') || normalized.includes('last.fm');
}

async function getHighResArt(trackName, artistName) {
  const cleanTrack = (trackName || '').replace(/\s*[\(\[][^()\]]*[\)\]]/g, '').trim();
  const combinedQuery = encodeURIComponent(`${cleanTrack || trackName} ${artistName}`.trim());
  const artistOnlyQuery = encodeURIComponent((artistName || '').trim());

  const extractArtwork = (payload) => {
    const artwork = payload?.results?.[0]?.artworkUrl100;
    return artwork ? artwork.replace('100x100bb', '400x400bb') : null;
  };

  const firstRes = await fetch(`${ITUNES_ENDPOINT}?term=${combinedQuery}&entity=song&limit=1`);
  if (firstRes.ok) {
    const firstData = await firstRes.json();
    const firstArtwork = extractArtwork(firstData);
    if (firstArtwork) return firstArtwork;
  }

  if (!artistOnlyQuery) return null;
  const secondRes = await fetch(`${ITUNES_ENDPOINT}?term=${artistOnlyQuery}&entity=song&limit=1`);
  if (!secondRes.ok) return null;
  const secondData = await secondRes.json();
  return extractArtwork(secondData);
}

export async function searchMovies(q) {
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');

  // If no query provided, use discover endpoint to return a broad set (not just trending)
  const endpoint = q
    ? `${API_ROUTES.TMDB}/search/movie?query=${encodeURIComponent(q)}&page=1`
    : `${API_ROUTES.TMDB}/discover/movie?sort_by=popularity.desc&page=1`;

  const res = await fetch(endpoint, { headers: { Authorization: 'Bearer ' + tmdbToken } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map((m) => ({
    id: m.id,
    title: sanitizeText(m.title || m.name),
    sub: (m.release_date || '').slice(0, 4) || '',
    image: buildTmdbImage(m.poster_path, FALLBACK_MOVIE),
    type: 'movies'
  }));
}

export async function searchTVShows(q) {
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');

  const endpoint = q
    ? `${API_ROUTES.TMDB}/search/tv?query=${encodeURIComponent(q)}&page=1`
    : `${API_ROUTES.TMDB}/discover/tv?sort_by=popularity.desc&page=1`;

  const res = await fetch(endpoint, { headers: { Authorization: 'Bearer ' + tmdbToken } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map((s) => ({
    id: s.id,
    title: sanitizeText(s.name || s.title),
    sub: (s.first_air_date || '').slice(0, 4) || '',
    image: buildTmdbImage(s.poster_path, FALLBACK_TV),
    type: 'tv'
  }));
}

export async function searchBooks(q) {
  // Use Google Books public endpoint. If no query specified, fetch a broad subject list.
  const qParam = q ? encodeURIComponent(q) : 'subject:fiction';
  console.log('📚 Fetching books:', `${API_ROUTES.GOOGLE_BOOKS}?q=${qParam}&maxResults=${APP_CONFIG.SEARCH_LIMIT}`);

  const res = await fetch(`${API_ROUTES.GOOGLE_BOOKS}?q=${qParam}&maxResults=${APP_CONFIG.SEARCH_LIMIT}`);
  console.log('📚 Response status:', res.status);

  if (!res.ok) {
    const errText = await res.text();
    console.error('📚 API Error:', errText);
    return [];
  }

  const data = await res.json();
  console.log('📚 Raw response:', data);

  const items = data.items || [];
  return items.map((it) => {
    const info = it.volumeInfo || {};
    const image = info.imageLinks?.thumbnail ? info.imageLinks.thumbnail.replace('http:', 'https:') : FALLBACK_BOOK;
    return {
      id: it.id,
      title: sanitizeText(info.title),
      sub: sanitizeText((info.authors || []).join(', ')),
      image,
      type: 'books'
    };
  });
}

export async function searchMusic(q) {
  // If no query provided, use Last.fm chart.gettoptracks to return a broad set
  if (!q) {
    if (lastfmApiKey) {
      try {
        const res = await fetch(`${API_ROUTES.LASTFM}/?method=chart.gettoptracks&api_key=${lastfmApiKey}&format=json&limit=${APP_CONFIG.SEARCH_LIMIT}`);
        if (res.ok) {
          const data = await res.json();
          const top = data.tracks?.track || [];
          return top.map((s, i) => ({
            id: `${encodeURIComponent(s.artist?.name || '')}|${encodeURIComponent(s.name || '')}`,
            title: sanitizeText(s.name || s.title),
            sub: sanitizeText(s.artist?.name || ''),
            image: s.image?.[3]?.['#text'] || FALLBACK_MUSIC,
            type: 'music'
          }));
        }
      } catch (e) {
        // ignore and fallback to iTunes
      }
    }
    // fallback to iTunes popular search
    const itRes = await fetch(`${API_ROUTES.ITUNES}/search?term=top&entity=song&limit=${APP_CONFIG.SEARCH_LIMIT}`);
    if (!itRes.ok) return [];
    const itData = await itRes.json();
    const results = itData.results || [];
    return results.map((r) => ({
      id: `${encodeURIComponent(r.artistName)}|${encodeURIComponent(r.trackName)}`,
      title: sanitizeText(r.trackName),
      sub: sanitizeText(r.artistName),
      image: (r.artworkUrl100 || '').replace('100x100bb', '400x400bb') || FALLBACK_MUSIC,
      type: 'music'
    }));
  }

  // Prefer Last.fm search (proxied via backend) if key available
  if (lastfmApiKey) {
    try {
      const res = await fetch(`${API_ROUTES.LASTFM}/?method=track.search&track=${encodeURIComponent(q)}&api_key=${lastfmApiKey}&format=json&limit=${APP_CONFIG.SEARCH_LIMIT}`);
      if (res.ok) {
        const data = await res.json();
        const tracks = data.results?.trackmatches?.track || [];

        // Enrich images: prefer Last.fm album art, but fall back to iTunes high-res artwork when missing
        const processed = await Promise.all(tracks.map(async (t) => {
          const artistName = t.artist || '';
          const trackName = t.name || '';
          let image = t.image?.[2]?.['#text'] || '';
          if (!image || isLastFmPlaceholderImage(image)) {
            try {
              const itunesArt = await getHighResArt(trackName, artistName);
              if (itunesArt) image = itunesArt;
            } catch (err) {
              // ignore and keep fallback
            }
          }
          return {
            id: `${encodeURIComponent(artistName)}|${encodeURIComponent(trackName)}`,
            title: sanitizeText(trackName),
            sub: sanitizeText(artistName),
            image: image || FALLBACK_MUSIC,
            type: 'music'
          };
        }));

        return processed;
      }
    } catch (e) {
      // fallback to iTunes below
    }
  }

  // Fallback: use iTunes search via backend proxy
  const itRes = await fetch(`${API_ROUTES.ITUNES}/search?term=${encodeURIComponent(q)}&entity=song&limit=${APP_CONFIG.SEARCH_LIMIT}`);
  if (!itRes.ok) return [];
  const itData = await itRes.json();
  const results = itData.results || [];
  return results.map((r) => ({
    id: `${encodeURIComponent(r.artistName)}|${encodeURIComponent(r.trackName)}`,
    title: sanitizeText(r.trackName),
    sub: sanitizeText(r.artistName),
    image: (r.artworkUrl100 || '').replace('100x100bb', '400x400bb') || FALLBACK_MUSIC,
    type: 'music'
  }));
}

export function renderRail(containerId, items, emptyLabel, type) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.replaceChildren();
  el.classList.add('media-rail');

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'text-body-secondary small mb-0';
    empty.textContent = emptyLabel;
    el.append(empty);
    return;
  }

  items.forEach((item) => {
    const link = document.createElement('a');
    const id = item._id || item.id || item.rank;

    let urlType = type;
    if (type === 'movies') urlType = 'movie';
    if (type === 'tv') urlType = 'show';

    const itemImg = encodeURIComponent(item.image || '');
    link.href = `item_details.html?type=${urlType}&id=${id}&img=${itemImg}`;
    link.style.display = 'contents';
    link.classList.add('text-decoration-none');

    const card = document.createElement('article');
    card.className = 'media-card';
    if (type === 'music') card.classList.add('media-card--square');

    const img = document.createElement('img');
    img.className = 'media-thumb';
    img.src = item.image || FALLBACK_MUSIC;
    img.alt = item.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      const fallbackByType = {
        movies: FALLBACK_MOVIE,
        tv: FALLBACK_TV,
        books: FALLBACK_BOOK,
        music: FALLBACK_MUSIC,
      };
      img.src = fallbackByType[type] || FALLBACK_MUSIC;
    };


    const overlay = document.createElement('div');
    overlay.className = 'media-card-overlay';

    const title = document.createElement('div');
    title.className = 'media-title';
    title.textContent = item.title;

    const sub = document.createElement('div');
    sub.className = 'media-sub';
    sub.textContent = item.sub;

    const badge = document.createElement('span');
    badge.className = 'badge text-bg-primary position-absolute top-0 start-0 m-2';
    badge.textContent = `#${item.rank}`;

    overlay.append(title, sub);
    card.append(badge, img, overlay);
    link.append(card);
    el.append(link);
  });
}

export default {
  searchMovies,
  searchTVShows,
  searchBooks,
  searchMusic
};
