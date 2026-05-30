const User = require('../models/User');
const { updateBadges } = require('../utils/badgeLogic');

const getLibrary = async (req, res) => {
    res.json({
        watchlist: req.user.watchlist,
        history: req.user.history,
        badges: req.user.badges
    });
}

const addToWatchlist = async (req, res) => {
    const { itemId, itemType } = req.body; 
    try {
        const path = `watchlist.${itemType}`;
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { [path]: String(itemId) } // $addToSet prevents duplicates automatically
        });
        res.json({ message: "Added to watchlist" });
    } catch (error) {
        res.status(500).json({ message: "Error adding item" });
    }
}

const moveToHistory = async (req, res) => {
    const { itemId, itemType } = req.body;
    try {
        const user = req.user;
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
}

const removeFromWatchlist = async (req, res) => {
    const { itemId, itemType } = req.body;
    try {
        const user = req.user;
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
}

module.exports = {getLibrary, addToWatchlist, moveToHistory, removeFromWatchlist}