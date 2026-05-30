const express = require('express');
const router = express.Router();
const googleBookController = require('../controllers/googleBookController')

// Simple proxy to Google Books API to use server-side API key and avoid CORS/quota issues
router.get('/', googleBookController.search);

// Proxy to fetch a single volume by its Google Books volume ID
router.get('/volume/:id', googleBookController.getVolume);

module.exports = router;
