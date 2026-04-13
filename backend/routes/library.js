const mongoose = require('mongoose'); 
const express = require('express');
const router = express.Router();
const User = require('../models/User')

// 1. Fetch entire library
router.get('/:userId', async (req, res) => {
    try {
        const foundUser = await User.findById(req.params.userId);
        if (!foundUser) return res.status(404).json({ message: "User not found" });

        // Send both lists in one go (Method 2)
        res.json({
            watchlist: foundUser.watchlist,
            history: foundUser.history
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching library" });
    }
});

// 2. Add item to watchlist
// We use req.body instead of URL params for cleaner data transfer
router.post('/add', async (req, res) => {
    const { userId, itemId, itemType } = req.body; 
    try {
        const path = `watchlist.${itemType}`;
        await User.findByIdAndUpdate(userId, {
            $addToSet: { [path]: String(itemId) } // $addToSet prevents duplicates automatically
        });
        res.json({ message: "Added to watchlist" });
    } catch (error) {
        res.status(500).json({ message: "Error adding item" });
    }
});

// 3. Move from watchlist to history
router.put('/watched', async (req, res) => {
    const { userId, itemId, itemType } = req.body;
    try {
        const watchPath = `watchlist.${itemType}`;
        const historyPath = `history.${itemType}`;

        // Step 1: Remove from watchlist
        // Step 2: Add to history
        await User.findByIdAndUpdate(userId, {
            $pull: { [watchPath]: String(itemId) },
            $addToSet: { [historyPath]: String(itemId) }
        });

        res.json({ message: "Moved to history" });
    } catch (error) {
        res.status(500).json({ message: "Error moving item" });
    }
});

// 4. Remove item entirely
router.delete('/remove', async (req, res) => {
    const { userId, itemId, itemType } = req.body;
    try {
        const watchPath = `watchlist.${itemType}`;
        const historyPath = `history.${itemType}`;

        await User.findByIdAndUpdate(userId, {
            $pull: { 
                [watchPath]: String(itemId),
                [historyPath]: String(itemId) 
            }
        });

        res.json({ message: "Removed from library" });
    } catch (error) {
        res.status(500).json({ message: "Error removing item" });
    }
});

module.exports = router;