const express = require('express');
const router = express.Router();
const axios = require('axios');

// Simple proxy to Google Books API to use server-side API key and avoid CORS/quota issues
router.get('/', async (req, res) => {
  try {
    const q = req.query.q || 'subject:fiction';
    const maxResults = Math.min(parseInt(req.query.maxResults) || 20, 40);

    const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
      params: {
        q,
        maxResults,
        key: process.env.GOOGLE_BOOKS_KEY
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('Google Books proxy error:', err.message);
    res.status(500).json({ message: 'Google Books proxy error' });
  }
});

module.exports = router;
