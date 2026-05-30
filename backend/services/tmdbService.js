const axios = require('axios');

async function fetchFromTmdb(id, type){
    const tmdbType = type === 'movie' ? 'movie' : 'tv';
    const targetUrl = `https://api.themoviedb.org/3/${tmdbType}/${id}?append_to_response=credits`;

    try {
        const response = await axios.get(targetUrl, {
            headers: { Authorization: `Bearer ${process.env.TMDB_KEY}` }
        });

        const data = response.data;
        const director = data.credits?.crew?.find(p => p.job === 'Director')?.name;
        const castArray = data.credits?.cast?.slice(0, 8).map(actor => ({
            name: actor.name,
            character: actor.character,
            profile_path: actor.profile_path
        }));

        const apiData = {
            title: data.title || data.name,
            releaseYear: new Date(data.release_date || data.first_air_date).getFullYear(),
            image: data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : "/images/movie.png",
            description: data.overview,
            apiRating: data.vote_average || 0,
            extra: {
                director: director || "N/A",
                castData: castArray,
                genres: data.genres?.map(g => g.name).join(', '),
                runtime: data.runtime ? `${data.runtime} mins` : "N/A"
            }
        };
        return apiData;
    } catch (err){
        console.error("TMDB fetching error:", err.message);
        throw err;
    }
}

module.exports = fetchFromTmdb;