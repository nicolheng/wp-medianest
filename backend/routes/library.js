const mongoose = require('mongoose'); 
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { updateBadges } = require('../utils/badgeLogic');

// 1. Fetch entire library
router.get('/:userId', async (req, res) => {
    try {
        const foundUser = await User.findById(req.params.userId);
        if (!foundUser) return res.status(404).json({ message: "User not found" });

        // Send lists and badges in one go
        res.json({
            watchlist: foundUser.watchlist,
            history: foundUser.history,
            badges: foundUser.badges
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
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const itemIdStr = String(itemId);
        
        // Step 1: Remove from watchlist
        if (user.watchlist[itemType]) {
            user.watchlist[itemType] = user.watchlist[itemType].filter(id => id !== itemIdStr);
        }

        // Step 2: Add to history
        if (!user.history[itemType]) {
            user.history[itemType] = [];
        }
        if (!user.history[itemType].includes(itemIdStr)) {
            user.history[itemType].push(itemIdStr);
        }

        // Step 3: Update badges
        updateBadges(user);

        await user.save();

        res.json({ message: "Moved to history", badges: user.badges });
    } catch (error) {
        res.status(500).json({ message: "Error moving item" });
    }
});

// 4. Remove item entirely
router.delete('/remove', async (req, res) => {
    const { userId, itemId, itemType } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const itemIdStr = String(itemId);

        if (user.watchlist[itemType]) {
            user.watchlist[itemType] = user.watchlist[itemType].filter(id => id !== itemIdStr);
        }
        if (user.history[itemType]) {
            user.history[itemType] = user.history[itemType].filter(id => id !== itemIdStr);
        }

        // Update badges (in case count dropped)
        updateBadges(user);

        await user.save();

        res.json({ message: "Removed from library", badges: user.badges });
    } catch (error) {
        res.status(500).json({ message: "Error removing item" });
    }
});

module.exports = router;