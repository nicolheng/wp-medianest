const express = require('express');
const router = express.Router(); // This defines "router"
const axios = require('axios');
const EntertainmentItem = require('../models/EntertainmentItem');
const Review = require('../models/Review');

router.get('/:type/:id', async (req, res) => {
    try {
        let { type, id } = req.params;

        if (type === 'books') type = 'book';
        if (type === 'movies') type = 'movie';

        let [item, reviews] = await Promise.all([
            EntertainmentItem.findOne({ "metadata.externalId": id, type }),
            Review.find({}).populate('userId', 'username') 
        ]);

        if (!item) {
            let apiData = {};

            if (type === 'movie' || type === 'show') {
                // TMDB API

                const tmdbType = type === 'movie' ? 'movie' : 'tv';
                const targetUrl = `https://api.themoviedb.org/3/${tmdbType}/${id}`;

                console.log("SENDING REQUEST TO:", targetUrl); // This will show in your terminal

                const response = await axios.get(targetUrl, {
                    headers: {
                        Authorization: `Bearer ${process.env.TMDB_KEY}` // Use Bearer for long tokens
                    }
                });

                apiData = {
                    title: response.data.title || response.data.name,
                    releaseYear: new Date(response.data.release_date || response.data.first_air_date).getFullYear(),
                    image: `https://image.tmdb.org/t/p/w500${response.data.poster_path}`,
                    description: response.data.overview,
                    extra: { director: "" } 
                };
            } 
            else if (type === 'music') {
            // If the ID contains the pipe '|', we split it. 
            // Otherwise, we treat the whole ID as a search term.
            const artistName = id.includes('|') ? decodeURIComponent(id.split('|')[0]) : null;
            const trackName = id.includes('|') ? decodeURIComponent(id.split('|')[1]) : id;

            const queryParams = {
                method: 'track.getInfo',
                api_key: process.env.LASTFM_KEY,
                format: 'json',
                autocorrect: 1,
                track: trackName
            };
            if (artistName) queryParams.artist = artistName;

            const response = await axios.get(`https://ws.audioscrobbler.com/2.0/`, { params: queryParams });
            const track = response.data?.track;

            if (!track) {
                // Fallback: If no deep info, just return what we know so the page loads
                apiData = {
                    title: trackName,
                    image: "https://placehold.co/400x400?text=No+Cover",
                    description: "Detailed wiki for this track is currently unavailable.",
                    extra: { artist: artistName || "Various Artists" }
                };
            } else {
                apiData = {
                    title: track.name,
                    image: track.album?.image?.[3]?.['#text'] || "",
                    description: track.wiki?.summary || `A popular track by ${track.artist.name}.`,
                    extra: { artist: track.artist.name }
                };
            }
        }
            else if (type === 'book') {
                try {
                // Use Google Books API: It's faster and includes images!
                const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${id}`);
                const bookData = response.data.items?.[0]?.volumeInfo;

                if (!bookData) {
                    apiData = {
                        title: "Book Details",
                        releaseYear: 2026,
                        image: "https://placehold.co/400x600?text=No+Cover+Found",
                        description: "Synopsis unavailable.",
                        extra: { author: "Unknown Author" }
                    };
                } else {
                    apiData = {
                        title: bookData.title,
                        releaseYear: bookData.publishedDate ? new Date(bookData.publishedDate).getFullYear() : 2026,
                        // Google Books provides the image link here:
                        image: bookData.imageLinks?.thumbnail?.replace('http:', 'https:') || "", 
                        description: bookData.description || "No description available.",
                        extra: { author: bookData.authors?.join(', ') || "Unknown Author" }
                    };
                }
            } catch (bookErr) {
                throw new Error("Failed to fetch book from library.");
            }
            }

            // 3. Save to MongoDB
            item = new EntertainmentItem({
                title: apiData.title,
                type: type,
                releaseYear: apiData.releaseYear,
                metadata: {
                    externalId: id,
                    image: apiData.image,
                    description: apiData.description,
                    ...apiData.extra
                }
            });
            await item.save();
            reviews = [];
        } else {
            // STEP 2: If item was found, fetch its specific reviews
            // (Only needed if the first parallel search was too generic)
            reviews = await Review.find({ itemId: item._id }).sort({ createdAt: -1 });
        }

        console.log(`Found ${reviews.length} reviews. Sending response...`);
        res.json({ item, reviews });

    } catch (err) {
        console.error("DETAILED BACKEND ERROR:", err.response ? err.response.data : err.message);
        res.status(500).json({ 
            message: "Internal Server Error", 
            error: err.message,
            details: err.response ? err.response.data : null 
        });
    }
});

module.exports = router;