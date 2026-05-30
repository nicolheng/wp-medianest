const axios = require('axios');

async function fetchBook(id){
    let apiData;
    try {
        // Try by ISBN
        let bookRes = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${id}&key=${process.env.GOOGLE_BOOKS_KEY}`);
        let bookData = bookRes.data.items?.[0]?.volumeInfo;

        // Fallback to Title if ISBN fails
        if (!bookData) {
            bookRes = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(id)}&key=${process.env.GOOGLE_BOOKS_KEY}`);
            bookData = bookRes.data.items?.[0]?.volumeInfo;
        }

        if (bookData) {
            let bookImage = bookData.imageLinks?.thumbnail;

            // FIXED: Check for blurry/unavailable thumbnails (using ||)
            if (!bookImage || bookImage.includes('printsec=frontcover') || bookImage.includes('img=1&zoom=5') || bookImage.includes('fife')) {
                bookImage = "/images/book.png";
            } else {
                bookImage = bookImage.replace('http:', 'https:').replace('&zoom=1', '&zoom=2');
            }

            apiData = {
                title: bookData.title,
                releaseYear: bookData.publishedDate ? new Date(bookData.publishedDate).getFullYear() : "N/A",
                image: bookImage,
                description: bookData.description || "No description available.",
                apiRating: bookData.averageRating ? (bookData.averageRating * 2) : 0,
                extra: {
                    author: bookData.authors?.join(', ') || "Unknown Author",
                    genres: bookData.categories?.join(', ') || "N/A",
                    pageCount: bookData.pageCount ? `${bookData.pageCount} pages` : "N/A"
                }
            };
        } else {
            apiData = {
                title: id.replace(/-/g, ' '),
                image: "/images/book.png",
                description: "Library details are currently unavailable for this specific edition.",
                apiRating: 0,
                extra: { author: "Various" }
            };
        }
    } catch (err) {
        apiData = { title: "Library Entry", image: "/images/book.png", description: "Loading offline record..." };
    }
    return apiData;
}

async function searchBooks(q, maxResults) {
    try {
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
        params: {
            q,
            maxResults,
            key: process.env.GOOGLE_BOOKS_KEY
        }
        });
        return response.data;
    } catch (err) {
        console.error('Google Books proxy error:', err.message);
        throw err;
    }
}

async function fetchVolumeById(volumeId) {
    try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(volumeId)}`, {
            params: { key: process.env.GOOGLE_BOOKS_KEY }
        });
        return response.data;
    } catch (err) {
        console.error('Google Books volume proxy error:', err.message);
        throw err;
    }
}

module.exports = {fetchBook, searchBooks, fetchVolumeById}