const EntertainmentItem = require('../models/EntertainmentItem');
const Review = require('../models/Review');
const fetchFromTmdb = require('../services/tmdbService');
const fetchFromLastFm = require('../services/lastFmService');
const { fetchBook } = require('../services/BookService');

const getItem = async (req,res) => {
    try {
        let { type, id } = req.params;

        if (type === 'books') type = 'book';
        if (type === 'movies') type = 'movie';
        if (type === 'tracks') type = 'music';

        let item = await EntertainmentItem.findOne({ "metadata.externalId": id, type });
        let reviews = [];

        if (!item) {
            let apiData = {};

            // --- MOVIE & SHOW LOGIC ---
            if (type === 'movie' || type === 'show') {
                apiData = await fetchFromTmdb(id, type);
            }

            // --- MUSIC LOGIC ---
            else if (type === 'music') {
                apiData = await fetchFromLastFm(id);
            }

            // --- BOOK LOGIC (WITH WATERFALL FALLBACK) ---
            else if (type === 'book') {
                apiData = await fetchBook(id);   
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
}

module.exports = {getItem}