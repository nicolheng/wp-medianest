const express = require('express');
const router = express.Router();
const axios = require('axios');
const EntertainmentItem = require('../models/EntertainmentItem');
const Review = require('../models/Review');

router.get('/:type/:id', async (req, res) => {
    try {
        let { type, id } = req.params;

        if (type === 'books') type = 'book';
        if (type === 'movies') type = 'movie';

        let item = await EntertainmentItem.findOne({ "metadata.externalId": id, type });
        let reviews = [];

        if (!item) {
            let apiData = {};

            // --- MOVIE & SHOW LOGIC ---
            if (type === 'movie' || type === 'show') {
                const tmdbType = type === 'movie' ? 'movie' : 'tv';
                const targetUrl = `https://api.themoviedb.org/3/${tmdbType}/${id}?append_to_response=credits`;

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

                apiData = {
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
            }

            // --- MUSIC LOGIC ---
            else if (type === 'music') {
                const artistName = id.includes('|') ? decodeURIComponent(id.split('|')[0]) : null;
                const trackName = id.includes('|') ? decodeURIComponent(id.split('|')[1]) : id;

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

                apiData = {
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
            }


            // --- BOOK LOGIC (WITH WATERFALL FALLBACK) ---
            else if (type === 'book') {
                try {
                    // Try by ISBN
                    let bookRes = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${id}&key=${process.env.GOOGLE_BOOKS_KEY}`);
                    let bookData = bookRes.data.items?.[0]?.volumeInfo;

                    // Fallback to Title if ISBN fails
                    if (!bookData) {
                        bookRes = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(id)}&key=${process.env.GOOGLE_BOOKS_KEY}`);
                        bookData = bookRes.data.items?.[0]?.volumeInfo;
                    }

                    if (bookData) {
                        let bookImage = bookData.imageLinks?.thumbnail;

                        // FIXED: Check for blurry/unavailable thumbnails (using ||)
                        if (!bookImage || bookImage.includes('printsec=frontcover') || bookImage.includes('img=1&zoom=5') || bookImage.includes('fife')) {
                            bookImage = "/images/book.png";
                        } else {
                            bookImage = bookImage.replace('http:', 'https:').replace('&zoom=1', '&zoom=2');
                        }

                        apiData = {
                            title: bookData.title,
                            releaseYear: bookData.publishedDate ? new Date(bookData.publishedDate).getFullYear() : "N/A",
                            image: bookImage,
                            description: bookData.description || "No description available.",
                            apiRating: bookData.averageRating ? (bookData.averageRating * 2) : 0,
                            extra: {
                                author: bookData.authors?.join(', ') || "Unknown Author",
                                genres: bookData.categories?.join(', ') || "N/A",
                                pageCount: bookData.pageCount ? `${bookData.pageCount} pages` : "N/A"
                            }
                        };
                    } else {
                        apiData = {
                            title: id.replace(/-/g, ' '),
                            image: "/images/book.png",
                            description: "Library details are currently unavailable for this specific edition.",
                            apiRating: 0,
                            extra: { author: "Various" }
                        };
                    }
                } catch (err) {
                    apiData = { title: "Library Entry", image: "/images/book.png", description: "Loading offline record..." };
                }
            }

            // Save the newly fetched item
            item = new EntertainmentItem({
                title: apiData.title,
                type: type,
                releaseYear: apiData.releaseYear,
                metadata: {
                    externalId: id,
                    image: apiData.image,
                    description: apiData.description,
                    apiRating: apiData.apiRating,
                    ...apiData.extra
                }
            });
            await item.save();
            reviews = [];
        } else {
            // Fetch reviews if item already exists in DB
            reviews = await Review.find({ itemId: item._id }).sort({ createdAt: -1 });
        }

        res.json({ item, reviews });

    } catch (err) {
        console.error("BACKEND ERROR:", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;