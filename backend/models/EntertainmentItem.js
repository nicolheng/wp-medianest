const mongoose = require('mongoose');

const EntertainmentItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['movie', 'book', 'music', 'show'], required: true },
    genres: { type: [String], default: [] },
    releaseYear: { type: Number },
    averageRating: { type: Number, default: 0 },
    metadata: {
        externalId: { type: String, required: true, index: true },
        image: { type: String, default: "" }, 
        description: { type: String, default: "" }, 
        director: String,
        cast: [String],
        artist: String,
        author: String,
        publisher: String
    }
});

module.exports = mongoose.model('EntertainmentItem', EntertainmentItemSchema);