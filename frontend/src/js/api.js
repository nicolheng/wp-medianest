const tmdbToken = import.meta.env.VITE_TMDB_READ_TOKEN;
const lastfmApiKey = import.meta.env.VITE_LASTFM_API_KEY;
const nytBooksApiKey = import.meta.env.VITE_NYT_BOOKS_API_KEY;

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';
export const FALLBACK_MOVIE = '/images/book.png';
export const FALLBACK_TV = '/images/book.png';
export const FALLBACK_BOOK = '/images/book.png';
export const FALLBACK_MUSIC = '/images/music.png';
const ITUNES_ENDPOINT = '/api/itunes/search';

export const buildTmdbImage = (posterPath, fallback) => {
  if (!posterPath) return fallback;
  return `${TMDB_IMAGE_BASE}${posterPath}`;
};

async function getHighResArt(trackName, artistName) {
  const cleanTrack = (trackName || '').replace(/\s*[\(\[][^(\)\]]*[\)\]]/g, '').trim();
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

function isLastFmPlaceholderImage(url) {
  if (!url) return true;
  const normalized = String(url).toLowerCase();
  return normalized.includes('2a96') || normalized.includes('default') || normalized.includes('noimage') || normalized.includes('last.fm');
}

function buildMusicFallback(title) {
  if (!title) return FALLBACK_MUSIC;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&size=500&font-size=0.33`;
}

export async function fetchMovies() {
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');
  const res = await fetch('/api/tmdb/3/trending/movie/week', { headers: { Authorization: 'Bearer ' + tmdbToken } });
  if (!res.ok) throw new Error('Movies fetch failed');
  const data = await res.json();
  return (data.results || []).slice(0, 10).map((m, i) => ({
    id: m.id, rank: i + 1, title: m.title || 'Untitled', sub: (m.release_date || '').slice(0, 4) || 'Unknown year', image: buildTmdbImage(m.poster_path, FALLBACK_MOVIE)
  }));
}

export async function fetchTVShows() {
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');
  const res = await fetch('/api/tmdb/3/trending/tv/week', { headers: { Authorization: 'Bearer ' + tmdbToken } });
  if (!res.ok) throw new Error('TV fetch failed');
  const data = await res.json();
  return (data.results || []).slice(0, 10).map((show, i) => ({
    id: show.id, rank: i + 1, title: show.name || 'Untitled', sub: (show.first_air_date || '').slice(0, 4) || 'Unknown year', image: buildTmdbImage(show.poster_path, FALLBACK_TV)
  }));
}

export async function fetchBooks() {
  if (!nytBooksApiKey) throw new Error('Missing VITE_NYT_BOOKS_API_KEY');
  const res = await fetch(`/api/nyt/svc/books/v3/lists/current/hardcover-fiction.json?api-key=${nytBooksApiKey}`);
  if (!res.ok) throw new Error('Books fetch failed');
  const data = await res.json();
  return (data.results?.books || []).slice(0, 10).map((b, i) => ({
    id: b.primary_isbn13 || b.primary_isbn10, rank: i + 1, title: b.title || 'Untitled', sub: b.author || 'Unknown author', image: b.book_image || FALLBACK_BOOK
  }));
}

export async function fetchMusic() {
  if (!lastfmApiKey) throw new Error('Missing VITE_LASTFM_API_KEY');
  const res = await fetch(`/api/lastfm/2.0/?method=chart.gettoptracks&api_key=${lastfmApiKey}&format=json&limit=10`);
  if (!res.ok) throw new Error('Music fetch failed');
  const data = await res.json();
  const topTracks = (data.tracks?.track || []).slice(0, 10);

  const tracksWithImages = await Promise.all(
    topTracks.map(async (s, i) => {
      const trackTitle = s.name || 'Untitled';
      const artistName = s.artist?.name || 'Unknown artist';
      const lastfmImage = s.image?.[3]?.['#text'] || s.image?.find((img) => img.size === 'large')?.['#text'] || '';
      let image = isLastFmPlaceholderImage(lastfmImage) ? '' : lastfmImage;

      try {
        const artist = encodeURIComponent(s.artist?.name || '');
        const track = encodeURIComponent(s.name || '');
        const infoRes = await fetch(`/api/lastfm/2.0/?method=track.getInfo&artist=${artist}&track=${track}&api_key=${lastfmApiKey}&format=json&autocorrect=1`);
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          const albumImage = infoData?.track?.album?.image?.find((img) => img.size === 'extralarge')?.['#text'] || infoData?.track?.album?.image?.find((img) => img.size === 'large')?.['#text'] || '';
          if (!isLastFmPlaceholderImage(albumImage)) image = albumImage;
        }
        if (!image || isLastFmPlaceholderImage(image)) {
          const itunesArt = await getHighResArt(trackTitle, artistName);
          if (itunesArt) image = itunesArt;
        }
      } catch {
        const itunesArt = await getHighResArt(trackTitle, artistName).catch(() => null);
        if (itunesArt) image = itunesArt;
      }
      if (!image || isLastFmPlaceholderImage(image)) image = buildMusicFallback(trackTitle);
      return { id: `${encodeURIComponent(s.artist.name)}|${encodeURIComponent(s.name)}`, rank: i + 1, title: trackTitle, sub: artistName, image };
    })
  );
  return tracksWithImages.map((item) => ({ ...item, image: item.image || FALLBACK_MUSIC }));
}

const itemCache = {};

export async function fetchMovieById(movieId) {
  if (itemCache[`movie_${movieId}`]) return itemCache[`movie_${movieId}`];
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');
  const res = await fetch(`/api/tmdb/3/movie/${movieId}`, { headers: { Authorization: 'Bearer ' + tmdbToken } });
  if (!res.ok) throw new Error(`Failed to fetch movie ID: ${movieId}`);
  const m = await res.json();
  const data = { id: m.id, title: m.title || 'Untitled', sub: (m.release_date || '').slice(0, 4) || 'Unknown year', image: buildTmdbImage(m.poster_path, FALLBACK_MOVIE) };
  itemCache[`movie_${movieId}`] = data;
  return data;
}

export async function fetchTVShowById(tvId) {
  if (itemCache[`tv_${tvId}`]) return itemCache[`tv_${tvId}`];
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');
  const res = await fetch(`/api/tmdb/3/tv/${tvId}`, { headers: { Authorization: 'Bearer ' + tmdbToken } });
  if (!res.ok) throw new Error(`Failed to fetch TV ID: ${tvId}`);
  const s = await res.json();
  const data = { id: s.id, title: s.name || 'Untitled', sub: (s.first_air_date || '').slice(0, 4) || 'Unknown year', image: buildTmdbImage(s.poster_path, FALLBACK_TV) };
  itemCache[`tv_${tvId}`] = data;
  return data;
}

export async function fetchBookById(isbn) {
  if (itemCache[`book_${isbn}`]) return itemCache[`book_${isbn}`];
  
  // Try OpenLibrary first
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    if (res.ok) {
      const rawData = await res.json();
      const book = rawData[`ISBN:${isbn}`];
      if (book) {
        const data = { 
          id: isbn, 
          title: book.title || 'Untitled', 
          sub: book.authors?.[0]?.name || 'Unknown Author', 
          image: book.cover?.medium || FALLBACK_BOOK 
        };
        itemCache[`book_${isbn}`] = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("OpenLibrary fetch failed, trying Google Books proxy...");
  }

  // Fallback to Google Books proxy using search (ISBN lookup)
  try {
    const volRes = await fetch(`/api/googlebooks?q=isbn:${encodeURIComponent(isbn)}`);
    if (volRes.ok) {
      const volData = await volRes.json();
      const item = volData.items?.[0];
      const info = item?.volumeInfo || {};
      const img = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
      const image = img ? String(img).replace(/^http:/, 'https:') : FALLBACK_BOOK;
      
      const data = {
        id: isbn,
        title: info.title || 'Untitled',
        sub: (info.authors || []).join(', ') || 'Unknown Author',
        image
      };
      itemCache[`book_${isbn}`] = data;
      return data;
    }
  } catch (err) {
    console.error("Google Books fallback failed:", err);
  }

  // Absolute fallback
  const finalFallback = { id: isbn, title: 'Untitled Book', sub: 'Unknown Author', image: FALLBACK_BOOK };
  itemCache[`book_${isbn}`] = finalFallback;
  return finalFallback;
}

export async function fetchTrackById(combinedId) {
  if (itemCache[`music_${combinedId}`]) return itemCache[`music_${combinedId}`];
  if (!lastfmApiKey) throw new Error('Missing VITE_LASTFM_API_KEY');
  const [artist, track] = combinedId.split('|').map(decodeURIComponent);
  const res = await fetch(`/api/lastfm/2.0/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${lastfmApiKey}&format=json`);
  if (!res.ok) throw new Error(`Failed to fetch track: ${track}`);
  const rawData = await res.json();
  const t = rawData.track;
  let image = t?.album?.image?.find(img => img.size === 'extralarge')?.['#text'] || FALLBACK_MUSIC;
  const data = { id: combinedId, title: t?.name || 'Untitled', sub: t?.artist?.name || 'Unknown Artist', image: image };
  itemCache[`music_${combinedId}`] = data;
  return data;
}