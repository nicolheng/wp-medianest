import { itemCache } from '../core/cache.js';
import { API_ROUTES, lastfmApiKey, FALLBACK_MUSIC, ITUNES_ENDPOINT } from './config.js';

export async function fetchTrackById(combinedId) {
  if (itemCache[`music_${combinedId}`]) return itemCache[`music_${combinedId}`];
  if (!lastfmApiKey) throw new Error('Missing VITE_LASTFM_API_KEY');
  const [artist, track] = combinedId.split('|').map(decodeURIComponent);
  const res = await fetch(`${API_ROUTES.LASTFM}/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${lastfmApiKey}&format=json`);
  if (!res.ok) throw new Error(`Failed to fetch track: ${track}`);
  const rawData = await res.json();
  const t = rawData.track;
  let image = t?.album?.image?.find(img => img.size === 'extralarge')?.['#text'] || FALLBACK_MUSIC;
  const data = { id: combinedId, title: t?.name || 'Untitled', sub: t?.artist?.name || 'Unknown Artist', image: image };
  itemCache[`music_${combinedId}`] = data;
  return data;
}

export async function fetchMusic() {
  if (!lastfmApiKey) throw new Error('Missing VITE_LASTFM_API_KEY');
  const res = await fetch(`${API_ROUTES.LASTFM}?method=chart.gettoptracks&api_key=${lastfmApiKey}&format=json&limit=10`);
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
        const infoRes = await fetch(`${API_ROUTES.LASTFM}?method=track.getInfo&artist=${artist}&track=${track}&api_key=${lastfmApiKey}&format=json&autocorrect=1`);
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