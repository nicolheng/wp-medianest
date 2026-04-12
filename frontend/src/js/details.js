document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const backupImg = params.get('img');
    const id = params.get('id');
    const type = params.get('type') || 'movie';
    let currentMongoId = null;

    if (!id) {
        window.location.href = 'index.html';
        return;
    }

    const loadPageData = async () => {
        const titleEl = document.getElementById('item-title');
        const descEl = document.getElementById('item-description');
        const posterEl = document.getElementById('item-poster');
        const infoEl = document.getElementById('item-info');
        const avgRatingEl = document.getElementById('avg-rating');
        const totalReviewsEl = document.getElementById('total-reviews');
        const starIcon = document.getElementById('star-icon');
        const castSection = document.getElementById('cast-section');
        const castContainer = document.getElementById('cast-container');
        let displayType = type === 'books' ? 'book' : type;
        try {
            const res = await fetch(`/api/items/${type}/${id}?t=${Date.now()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch");

            const { item, reviews } = data;
            const meta = item.metadata || {};
            currentMongoId = item._id;

            // 1. Render Title and Description
            titleEl.textContent = item.title || "Untitled";
            descEl.textContent = meta.description || "No description provided.";

            // 2. SMART RATING LOGIC
            // Priority: App averageRating -> API Rating -> "NEW"
            if (item.averageRating > 0) {
                avgRatingEl.textContent = item.averageRating.toFixed(1);
                if (starIcon) starIcon.classList.remove('d-none');
                totalReviewsEl.textContent = `${reviews.length} reviews`;
            } else if (meta.apiRating > 0) {
                avgRatingEl.textContent = meta.apiRating.toFixed(1);
                if (starIcon) starIcon.classList.remove('d-none');
                totalReviewsEl.textContent = `${reviews.length} reviews`;
            } else {
                avgRatingEl.textContent = "NEW";
                if (starIcon) starIcon.classList.add('d-none');
                totalReviewsEl.textContent = `${reviews.length} reviews`;
            }

            // 3. POSTER & FALLBACK
            const localPlaceholder = displayType === 'music' ? '/images/music.png' : '/images/book.png';
            const isLocalPlaceholder = meta.image === '/images/book.png' || meta.image === '/images/music.png';
            const img = new Image();
            img.src = (meta.image && !meta.image.includes('images/book.png') && !meta.image.includes('placeholder') && !isLocalPlaceholder)
                ? meta.image
                : (backupImg || localPlaceholder);
            cd..
            img.onload = () => {
                posterEl.src = img.src;
                posterEl.style.opacity = '1';
            };
            img.onerror = () => {
                posterEl.src = localPlaceholder;
                posterEl.style.opacity = '1';
            };

            // 4. METADATA INFO (Director, Runtime, Artist, Author)
            let infoHTML = '';
            if (type === 'movie' || type === 'show') {
                if (meta.director && meta.director !== 'N/A') infoHTML += `<div class="col-6"><strong>Director:</strong><br>${meta.director}</div>`;
                if (meta.runtime && meta.runtime !== 'N/A') infoHTML += `<div class="col-6"><strong>Runtime:</strong><br>${meta.runtime}</div>`;
                if (meta.genres) infoHTML += `<div class="col-12"><strong>Genres:</strong><br>${meta.genres}</div>`;
            } else if (type === 'music') {
                infoHTML = `<div class="col-6"><strong>Artist:</strong><br>${meta.artist || 'Unknown'}</div>
                            <div class="col-6"><strong>Album:</strong><br>${meta.album || 'Single'}</div>`;
            } else if (type === 'book') {
                infoHTML = `<div class="col-6"><strong>Author:</strong><br>${meta.author || 'Unknown Author'}</div>
                            <div class="col-6"><strong>Pages:</strong><br>${meta.pageCount || 'N/A'}</div>`;
            }
            if (infoEl) infoEl.innerHTML = `<div class="row g-3 small">${infoHTML}</div>`;

            // 5. RESTORE CAST CAROUSEL
            if ((type === 'movie' || type === 'show') && meta.castData && meta.castData.length > 0) {
                castSection.classList.remove('d-none');
                castContainer.innerHTML = meta.castData.map(actor => `
                    <div class="cast-card text-center" style="min-width: 100px; flex: 0 0 auto;">
                        <img src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path : '/images/music.png'}" 
                             class="rounded-3 mb-2 shadow-sm" style="width: 90px; height: 120px; object-fit: cover; border: none;">
                        <p class="small fw-bold mb-0 text-truncate" style="width: 90px;">${actor.name}</p>
                        <p class="text-muted small" style="font-size: 0.65rem; width: 90px; line-height: 1;">${actor.character}</p>
                    </div>
                `).join('');
            } else {
                castSection?.classList.add('d-none');
            }

            renderReviews(reviews);

        } catch (err) {
            console.error("Frontend Error:", err);
            titleEl.textContent = "Error loading details."; // This triggers if an ID is missing or fetch fails
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

    loadPageData();
});