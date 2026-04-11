const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const EntertainmentItem = require('../models/EntertainmentItem');

router.post('/', async (req, res) => {
    try {
        const { itemId, rating, comment } = req.body;
        // Check if user is logged in (session check)
        if (!req.session.userId) return res.status(401).json({ message: "Login required" });

        // 1. Save new review
        const newReview = new Review({
            userId: req.session.userId,
            username: req.session.username,
            itemId,
            rating: Number(rating),
            comment
        });
        await newReview.save();

        // 2. Recalculate Average Rating for the Item
        const allReviews = await Review.find({ itemId });
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await EntertainmentItem.findByIdAndUpdate(itemId, { averageRating: avg });

        res.status(201).json({ message: "Review added", avg });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;