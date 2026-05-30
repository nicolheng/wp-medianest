const axios = require('axios');

async function fetchFromLastFm(id){
    const artistName = id.includes('|') ? decodeURIComponent(id.split('|')[0]) : null;
    const trackName = id.includes('|') ? decodeURIComponent(id.split('|')[1]) : id;

    try {
        const response = await axios.get(`https://ws.audioscrobbler.com/2.0/`, {
            params: {
                method: 'track.getInfo',
                api_key: process.env.LASTFM_KEY,
                format: 'json',
                autocorrect: 1,
                track: trackName,
                artist: artistName
            }
        });

        const track = response.data?.track;
        const trackWiki = track?.wiki?.summary;
        const cleanDescription = trackWiki
            ? trackWiki.replace(/<[^>]*>?/gm, '').split('Read more on Last.fm')[0].trim()
            : `"${trackName}" is a standout track by ${artistName || "this artist"}. Check the community feedback below!`;

        let musicImage = track?.album?.image?.[3]?.['#text'] || track?.image?.[3]?.['#text'];

        // Check for empty or Last.fm default placeholders
        if (!musicImage || musicImage.includes('default_album') || musicImage === "" || musicImage.includes('2a96') || musicImage.includes('noimage')) {
            musicImage = "/images/music.png";
        }

        const apiData = {
            title: track?.name || trackName,
            image: musicImage,
            description: cleanDescription,
            apiRating: 0,
            extra: {
                artist: track?.artist?.name || artistName,
                album: track?.album?.title || "Single",
                genres: track?.toptags?.tag?.slice(0, 3).map(t => t.name).join(', ') || "N/A"
            }
        };
        return apiData;
    } catch (err){
        console.error("LastFm fetching error:", err.message);
        throw err;
    }
    
}

module.exports = fetchFromLastFm