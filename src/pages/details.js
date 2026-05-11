import '../core/globals.js';
import { initUserSession } from '../core/session.js';

window.loadDetailButton = (id, type) => {
    const actionContainer = document.getElementById('action-container');
    if (!actionContainer) return;

    // Map singular types to the plural keys used in window.userLibrary
    const typeMap = {
        'movie': 'movies',
        'show': 'tv',
        'tv': 'tv',
        'book': 'books',
        'music': 'music'
    };
    type = typeMap[type] || type;
    const library = window.userLibrary || { watchlist: { movies: [], tv: [], books: [], music: [] }, history: { movies: [], tv: [], books: [], music: [] } };
    const currentWatchlist = library.watchlist[type] || [];
    const currentHistory = library.history[type] || [];
    const idStr = String(id);

    console.log(library);
    console.log(currentHistory);
    console.log(currentWatchlist);

    actionContainer.replaceChildren();
    if (currentHistory.includes(idStr)) {
        const badge = document.createElement('span');
        badge.className = 'badge bg-dark bg-opacity-75 text-light rounded-4 border border-secondary align-self-start px-3 py-2';
        let label = 'Watched';
        if (type === 'books') label = 'Read';
        if (type === 'music') label = 'Listened';
        badge.innerHTML = `<i class="bi bi-check2-all me-1"></i> ${label}`;
        actionContainer.append(badge);

    } else if (currentWatchlist.includes(idStr)) {
        const watchBtn = document.createElement('button');
        watchBtn.className = 'btn btn-success rounded-2 shadow';
        let label = 'Watched';
        if (type === 'books') label = 'Read';
        if (type === 'music') label = 'Listened';
        watchBtn.innerHTML = `<i class="bi bi-check-lg"></i> Mark as ${label}`;
        watchBtn.title = "Mark as Done";
        watchBtn.onclick = (e) => { e.preventDefault(); window.moveToHistory(idStr, type); };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger rounded-2 shadow';
        removeBtn.innerHTML = '<i class="bi bi-trash"></i> Remove';
        removeBtn.title = "Remove";
        removeBtn.onclick = (e) => { e.preventDefault(); window.removeFromWatchlist(idStr, type); };

        actionContainer.append(watchBtn, removeBtn);

    } else {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary rounded-3 shadow align-items-center';
        addBtn.innerHTML = '<i class="bi bi-plus-lg"></i> Add to Watchlist';
        addBtn.title = "Add to Watchlist";
        addBtn.onclick = (e) => { e.preventDefault(); window.addToWatchlist(idStr, type); };
        actionContainer.append(addBtn);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await initUserSession();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const backupImg = sessionStorage.getItem(`poster_${id}`);
    let type = params.get('type') || 'movie';
    let currentMongoId = null;

    if (type === 'books') type = 'book';
    if (type === 'books') type = 'book';
    if (type === 'movies') type = 'movie';
    if (type === 'tracks') type = 'music';

    const posterEl = document.getElementById('item-poster');
    const titleEl = document.getElementById('item-title');
    const descEl = document.getElementById('item-description');

    if (!id) {
        window.location.href = 'index.html';
        return;
    }

    const sessionImg = sessionStorage.getItem(`poster_${id}`);
    if (sessionImg && posterEl) {
        posterEl.src = sessionImg;
        posterEl.style.opacity = '1';
    }

    const loadPageData = async () => {
        const infoEl = document.getElementById('item-info');
        const avgRatingEl = document.getElementById('avg-rating');
        const totalReviewsEl = document.getElementById('total-reviews');
        const starIcon = document.getElementById('star-icon');
        const castSection = document.getElementById('cast-section');
        const castContainer = document.getElementById('cast-container');
        let displayType = (type === 'books' || type === 'book') ? 'book' : type;

        try {
            // Standalone Mode: Fetch directly from services instead of /api/items
            let item = null;
            let meta = {};
            let reviews = [];

            if (type === 'movie') {
                const { fetchMovieById } = await import('../services/tmdb.js');
                item = await fetchMovieById(id);
                meta = { ...item, description: 'Direct from TMDB', genres: 'Trending' };
            } else if (type === 'show' || type === 'tv') {
                const { fetchTVShowById } = await import('../services/tmdb.js');
                item = await fetchTVShowById(id);
                meta = { ...item, description: 'Direct from TMDB', genres: 'Trending' };
            } else if (type === 'book') {
                const { fetchBookById } = await import('../services/book.js');
                item = await fetchBookById(id);
                meta = { ...item, description: 'Direct from Google Books/OpenLibrary', author: item.sub };
            } else if (type === 'music') {
                const { fetchTrackById } = await import('../services/music.js');
                item = await fetchTrackById(id);
                meta = { ...item, description: 'Direct from Last.fm', artist: item.sub };
            }

            if (!item) throw new Error("Item not found");

            // 1. Render Title and Description
            titleEl.textContent = item.title || "Untitled";
            descEl.textContent = meta.description || "No description provided.";

            if (item.image && !item.image.includes('placeholder')) {
                posterEl.src = item.image;
            }
            if (id && type) {
                window.loadDetailButton(id, type);
            }

            // 2. SMART RATING LOGIC
            avgRatingEl.textContent = "NEW";
            if (starIcon) starIcon.classList.add('d-none');
            totalReviewsEl.textContent = `0 reviews`;

            // 3. POSTER & FALLBACK
            const localPlaceholder = displayType === 'music' ? '/images/music.png' : '/images/book.png';
            posterEl.src = item.image || localPlaceholder;
            posterEl.style.opacity = '1';

            // 4. METADATA INFO
            let infoHTML = '';
            if (type === 'movie' || type === 'show' || type === 'tv') {
                if (meta.sub) infoHTML += `<div class="col-6"><strong>Release:</strong><br>${meta.sub}</div>`;
                if (meta.genres) infoHTML += `<div class="col-6"><strong>Category:</strong><br>${meta.genres}</div>`;
            } else if (type === 'music') {
                infoHTML = `<div class="col-6"><strong>Artist:</strong><br>${meta.artist || 'Unknown'}</div>`;
            } else if (type === 'book') {
                infoHTML = `<div class="col-6"><strong>Author:</strong><br>${meta.author || 'Unknown Author'}</div>`;
            }
            if (infoEl) infoEl.innerHTML = `<div class="row g-3 small">${infoHTML}</div>`;

            castSection?.classList.add('d-none');
            renderReviews([]);

        } catch (err) {
            console.error("Frontend Error:", err);
            titleEl.textContent = "Error loading details.";
        }
    };

    const renderReviews = (reviews) => {
        const container = document.getElementById('reviews-container');
        if (!container) return;

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-chat-dots d-block h1"></i>
                    <p>Be the first to share your thoughts!</p>
                </div>`;
            return;
        }

        container.innerHTML = reviews.map(rev => {
            // Get initial for avatar
            const initial = rev.username ? rev.username.charAt(0).toUpperCase() : '?';

            // Calculate Stars (Assuming rating is 1-10, we convert to 5 stars)
            const starCount = Math.round(rev.rating / 2);
            const safeStars = Math.max(0, Math.min(5, starCount));
            const starsUI = '★'.repeat(safeStars) + '☆'.repeat(5 - safeStars);

            // Format Date
            const date = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : "Recently";

            return `
                <div class="card border-0 shadow-sm mb-3 rounded-4 bg-body-tertiary">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-start gap-3">
                            <div class="avatar-sm flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle bg-primary text-dark fw-bold" 
                                 style="width: 42px; height: 42px; font-size: 1.1rem;">
                                ${initial}
                            </div>
                            
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="fw-bold mb-0">${rev.username}</h6>
                                    <div class="text-warning small">
                                        ${starsUI}
                                    </div>
                                </div>
                                <p class="text-muted mb-2" style="font-size: 0.75rem;">
                                    Published on ${date}
                                </p>
                                <p class="mb-0 text-secondary" style="font-size: 0.95rem;">
                                    ${rev.comment}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // --- SUBMIT REVIEW FORM ---
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentMongoId) {
                alert("Item not fully loaded. Please refresh.");
                return;
            }

            const btn = reviewForm.querySelector('button');
            btn.disabled = true;

            try {
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId: currentMongoId,
                        rating: document.getElementById('ratingSelect').value,
                        comment: document.getElementById('commentText').value
                    }),
                    credentials: 'include'
                });

                if (res.ok) {
                    reviewForm.reset();
                    await loadPageData();
                } else {
                    alert("Please log in to submit a review.");
                }
            } catch (err) {
                console.error("Review Error:", err);
            } finally {
                btn.disabled = false;
            }
        });
    }

    window.addEventListener('libraryUpdated', () => {
        window.loadDetailButton(id, type);
    });

    loadPageData();
});