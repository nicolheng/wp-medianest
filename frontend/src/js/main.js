import '../scss/style.scss'
import 'bootstrap'

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

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';
const FALLBACK_MOVIE = 'https://placehold.co/342x513/1b1f24/f8f9fa?text=No+Poster';
const FALLBACK_TV = 'https://placehold.co/342x513/1b1f24/f8f9fa?text=No+Poster';
const FALLBACK_BOOK = 'https://placehold.co/300x450/1b1f24/f8f9fa?text=No+Cover';
const FALLBACK_MUSIC = 'https://placehold.co/300x300/1b1f24/f8f9fa?text=No+Art';
const ITUNES_ENDPOINT = '/api/itunes/search';

const buildTmdbImage = (posterPath, fallback) => {
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
  return normalized.includes('2a96')
    || normalized.includes('default')
    || normalized.includes('noimage')
    || normalized.includes('last.fm');
}

function buildMusicFallback(title) {
  if (!title) return FALLBACK_MUSIC;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&size=500&font-size=0.33`;
}

export async function fetchMovies() {
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');

  const res = await fetch('/api/tmdb/3/trending/movie/week', {
    headers: { Authorization: 'Bearer ' + tmdbToken }
  });
  if (!res.ok) throw new Error('Movies fetch failed');

  const data = await res.json();
  return (data.results || []).slice(0, 10).map((m, i) => ({
    id: m.id,
    rank: i + 1,
    title: m.title || 'Untitled',
    sub: (m.release_date || '').slice(0, 4) || 'Unknown year',
    image: buildTmdbImage(m.poster_path, FALLBACK_MOVIE)
  }));
}

export async function fetchTVShows() {
  if (!tmdbToken) throw new Error('Missing VITE_TMDB_READ_TOKEN');

  const res = await fetch('/api/tmdb/3/trending/tv/week', {
    headers: { Authorization: 'Bearer ' + tmdbToken }
  });
  if (!res.ok) throw new Error('TV fetch failed');

  const data = await res.json();
  return (data.results || []).slice(0, 10).map((show, i) => ({
    id: show.id,
    rank: i + 1,
    title: show.name || 'Untitled',
    sub: (show.first_air_date || '').slice(0, 4) || 'Unknown year',
    image: buildTmdbImage(show.poster_path, FALLBACK_TV)
  }));
}

export async function fetchBooks() {
  if (!nytBooksApiKey) throw new Error('Missing VITE_NYT_BOOKS_API_KEY');

  const res = await fetch(
    `/api/nyt/svc/books/v3/lists/current/hardcover-fiction.json?api-key=${nytBooksApiKey}`
  );
  if (!res.ok) throw new Error('Books fetch failed');

  const data = await res.json();
  return (data.results?.books || []).slice(0, 10).map((b, i) => ({
    id: b.primary_isbn13 || b.primary_isbn10,
    rank: i + 1,
    title: b.title || 'Untitled',
    sub: b.author || 'Unknown author',
    image: b.book_image || FALLBACK_BOOK
  }));
}

export async function fetchMusic() {
  if (!lastfmApiKey) throw new Error('Missing VITE_LASTFM_API_KEY');

  const res = await fetch(
    `/api/lastfm/2.0/?method=chart.gettoptracks&api_key=${lastfmApiKey}&format=json&limit=10`
  );
  if (!res.ok) throw new Error('Music fetch failed');

  const data = await res.json();
  const topTracks = (data.tracks?.track || []).slice(0, 10);

  const tracksWithImages = await Promise.all(
    topTracks.map(async (s, i) => {
      const trackTitle = s.name || 'Untitled';
      const artistName = s.artist?.name || 'Unknown artist';
      const lastfmImage = s.image?.[3]?.['#text'] || s.image?.find((img) => img.size === 'large')?.['#text'] || '';
      const placeholderFromChart = isLastFmPlaceholderImage(lastfmImage);
      let image = placeholderFromChart ? '' : lastfmImage;

      try {
        const artist = encodeURIComponent(s.artist?.name || '');
        const track = encodeURIComponent(s.name || '');
        const infoRes = await fetch(
          `/api/lastfm/2.0/?method=track.getInfo&artist=${artist}&track=${track}&api_key=${lastfmApiKey}&format=json&autocorrect=1`
        );

        if (infoRes.ok) {
          const infoData = await infoRes.json();
          const albumImage = infoData?.track?.album?.image
            ?.find((img) => img.size === 'extralarge')?.['#text']
            || infoData?.track?.album?.image?.find((img) => img.size === 'large')?.['#text']
            || '';

          if (!isLastFmPlaceholderImage(albumImage)) {
            image = albumImage;
          }
        }

        if (!image || isLastFmPlaceholderImage(image)) {
          const itunesArt = await getHighResArt(trackTitle, artistName);
          if (itunesArt) image = itunesArt;
        }
      } catch {
        const itunesArt = await getHighResArt(trackTitle, artistName).catch(() => null);
        if (itunesArt) image = itunesArt;
      }

      if (!image || isLastFmPlaceholderImage(image)) {
        image = buildMusicFallback(trackTitle);
      }

      const combinedId = `${encodeURIComponent(s.artist.name)}|${encodeURIComponent(s.name)}`;

      return {
        id: combinedId,
        rank: i + 1,
        title: trackTitle,
        sub: artistName,
        image,
      };
    })
  );

  return tracksWithImages.map((item) => ({
    ...item,
    image: item.image || FALLBACK_MUSIC,
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

function updateSnapshotItem(prefix, item, fallbackImage) {
  const titleEl = document.getElementById(`${prefix}-title`);
  const imageEl = document.getElementById(`${prefix}-image`);

  if (titleEl) {
    titleEl.textContent = item?.title || 'Not available';
  }

  if (imageEl) {
    imageEl.src = item?.image || fallbackImage;
  }
}

function updateLiveSnapshot(movies, tvShows, books, music) {
  updateSnapshotItem('snapshot-movie', movies[0], FALLBACK_MOVIE);
  updateSnapshotItem('snapshot-tv', tvShows[0], FALLBACK_TV);
  updateSnapshotItem('snapshot-book', books[0], FALLBACK_BOOK);
  updateSnapshotItem('snapshot-music', music[0], FALLBACK_MUSIC);
}

async function loadCharts() {
  const [moviesRes, tvRes, booksRes, musicRes] = await Promise.allSettled([
    fetchMovies(),
    fetchTVShows(),
    fetchBooks(),
    fetchMusic()
  ]);

  const movies = moviesRes.status === "fulfilled" ? moviesRes.value : [];
  const tvShows = tvRes.status === "fulfilled" ? tvRes.value : [];
  const books = booksRes.status === "fulfilled" ? booksRes.value : [];
  const music = musicRes.status === "fulfilled" ? musicRes.value : [];

  renderRail('movies-list', movies, 'Could not load movies', 'movies');
  renderRail('tv-list', tvShows, 'Could not load TV shows', 'tv');
  renderRail('books-list', books, 'Could not load books', 'books');
  renderRail('music-list', music, 'Could not load music', 'music');
  updateLiveSnapshot(movies, tvShows, books, music);

  if (moviesRes.status === "rejected") console.error("Movies error:", moviesRes.reason);
  if (tvRes.status === "rejected") console.error("TV error:", tvRes.reason);
  if (booksRes.status === "rejected") console.error("Books error:", booksRes.reason);
  if (musicRes.status === "rejected") console.error("Music error:", musicRes.reason);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("top-charts")) return;
  loadCharts();
  setInterval(loadCharts, 10 * 60 * 1000);
});

// Search form handling and search-result page logic
// Search logic has been moved to ./search.js