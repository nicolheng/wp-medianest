const Review = require('../models/Review');
const EntertainmentItem = require('../models/EntertainmentItem');
const mongoose = require('mongoose');

const addReview = async (req, res) => {
    try {
        const { itemId, rating, comment } = req.body;

        const userScore = Number(rating);
        const normalizedScore = userScore * 2; 

        const newReview = new Review({
            userId: req.user._id,
            username: req.user.username,
            itemId: new mongoose.Types.ObjectId(itemId),
            rating: normalizedScore, 
            comment
        });
        await newReview.save();

        const allReviews = await Review.find({ itemId });
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await EntertainmentItem.findByIdAndUpdate(itemId, { averageRating: avg });

        res.status(201).json({ message: "Review added", avg });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {addReview}
