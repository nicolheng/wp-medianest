// js/details.js
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    if (!itemId) {
        window.location.href = 'index.html';
        return;
    }

    const loadPageData = async () => {
        try {
            // Fetch item and its reviews from our internal API
            const res = await fetch(`/api/items/${itemId}`);
            const data = await res.json();

            const { item, reviews } = data;
            const meta = item.metadata || {};

            // 1. RENDER CORE INFO
            document.getElementById('item-title').textContent = item.title;
            document.getElementById('avg-rating').textContent = item.averageRating?.toFixed(1) || '0.0';
            document.getElementById('total-reviews').textContent = `${reviews.length} reviews`;

            // 2. RENDER FROM METADATA
            // Accessing the image and description stored inside metadata
            document.getElementById('item-poster').src = meta.image || 'https://placehold.co/400x600?text=No+Image';
            document.getElementById('item-description').textContent = meta.description || "No description provided for this title.";

            // 3. RENDER SUB-INFO BASED ON TYPE
            let subInfo = `${item.type.toUpperCase()} • ${item.releaseYear || 'Unknown Year'}`;
            if (item.genres && item.genres.length > 0) {
                subInfo += ` • ${item.genres.join(', ')}`;
            }
            
            // Add specific metadata details
            if (item.type === 'movie' || item.type === 'show') {
                if (meta.director) subInfo += ` • Dir: ${meta.director}`;
            } else if (item.type === 'music') {
                if (meta.artist) subInfo += ` • Artist: ${meta.artist}`;
            } else if (item.type === 'book') {
                if (meta.author) subInfo += ` • Author: ${meta.author}`;
            }
            document.getElementById('item-meta').textContent = subInfo;

            // 4. RENDER REVIEWS (Card Shadow-sm style 4.1)
            const container = document.getElementById('reviews-container');
            if (reviews.length === 0) {
                container.innerHTML = `<p class="text-muted small">No reviews yet. Be the first to share your thoughts!</p>`;
            } else {
                container.innerHTML = reviews.map(rev => `
                    <div class="card shadow-sm border-0 mb-3 rounded-4 bg-body-tertiary">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="fw-bold mb-0">${rev.username}</h6>
                                <span class="badge bg-warning text-dark">${rev.rating} ★</span>
                            </div>
                            <p class="small mb-1 mt-2">${rev.comment}</p>
                            <div class="text-muted" style="font-size: 0.7rem;">${new Date(rev.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error("Failed to load item details:", err);
        }
    };

    // FORM SUBMISSION (Rule 4.3 & 4.5)
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = document.getElementById('ratingSelect').value;
        const comment = document.getElementById('commentText').value;

        const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, rating, comment }),
            credentials: 'include'
        });

        if (res.ok) {
            document.getElementById('reviewForm').reset();
            loadPageData(); // Reload to show new review and updated average
        } else {
            alert("Please log in to submit a review.");
        }
    });

    loadPageData();
});