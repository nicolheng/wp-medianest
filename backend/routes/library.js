const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth'); 
const libraryController = require('../controllers/libraryController')

// 1. Fetch entire library
router.get('/:userId', protect, libraryController.getLibrary);

// 2. Add item to watchlist
router.post('/add', protect, libraryController.addToWatchlist);

// 3. Move from watchlist to history
router.put('/watched', protect, libraryController.moveToHistory);

// 4. Remove item entirely
router.delete('/remove', protect, libraryController.removeFromWatchlist);

module.exports = router;