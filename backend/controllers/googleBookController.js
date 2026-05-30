const {searchBooks, fetchVolumeById} = require('../services/BookService')

const search = async (req, res) => {
    try {
        const q = req.query.q || 'subject:fiction';
        const maxResults = Math.min(parseInt(req.query.maxResults) || 20, 40);
    
        const data = await searchBooks(q, maxResults);
    
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Google Books proxy error' });
    }
}

const getVolume = async (req, res) => {
    try {
        const volumeId = req.params.id;
        const data = await fetchVolumeById(volumeId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Google Books volume proxy error' });
    }
}

module.exports = {search, getVolume}