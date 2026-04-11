document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = params.get('type') || 'movie';
    
    // We store this globally in the script so the Form can use it
    let currentMongoId = null; 

    if (!id) {
        window.location.href = 'index.html';
        return;
    }

    const loadPageData = async () => {
        const titleEl = document.getElementById('item-title');
        const descEl = document.getElementById('item-description');
        const posterEl = document.getElementById('item-poster');
        const reviewsTitle = document.getElementById('reviews-section-title');

        // STEP 1: UI Placeholders
        titleEl.innerHTML = '<span class="placeholder col-6 bg-secondary"></span>';
        descEl.innerHTML = '<span class="placeholder col-12 bg-secondary"></span>';
        posterEl.style.opacity = '0.3';

        try {
            const res = await fetch(`/api/items/${type}/${id}?t=${Date.now()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const { item, reviews } = data;
            const meta = item.metadata || {};
            currentMongoId = item._id;

            // 2. Text & Description Rendering
            titleEl.textContent = item.title;
            descEl.textContent = meta.description || "No description provided.";

            if (reviewsTitle) reviewsTitle.textContent = "Reviews";

            // 3. Rating & Popularity Logic
            const avgRatingEl = document.getElementById('avg-rating');
            const totalReviewsEl = document.getElementById('total-reviews');
            const starIcon = document.getElementById('star-icon');

            if (item.averageRating > 0) {
                avgRatingEl.textContent = item.averageRating.toFixed(1);
                if (starIcon) starIcon.classList.remove('d-none');
                totalReviewsEl.textContent = `${reviews.length} reviews`;
            } else if (type === 'music') {
                avgRatingEl.textContent = "NEW";
                if (starIcon) starIcon.classList.add('d-none');
                const formattedListeners = Number(meta.listeners || 0).toLocaleString();
                totalReviewsEl.textContent = `${reviews.length} reviews • ${formattedListeners} Listeners`;
            } else {
                avgRatingEl.textContent = meta.apiRating ? meta.apiRating.toFixed(1) : "0.0";
                totalReviewsEl.textContent = `${reviews.length} reviews`;
            }

            // 4. Poster Image Rendering
            const img = new Image();
            img.src = meta.image || (type === 'music' ? 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?q=80&w=500' : 'https://placehold.co/400x600?text=No+Image');
            img.onload = () => {
                posterEl.src = img.src;
                posterEl.style.opacity = '1';
            };

            // 5. Inject Extended Info (Conditional Rendering)
            const infoEl = document.getElementById('item-info');
            let infoHTML = '';

            if (type === 'movie' || type === 'show') {
                const infoItems = [];

                // Only push to array if data exists and is not 'N/A'
                if (meta.director && meta.director !== 'N/A')
                    infoItems.push(`<div class="col-6"><strong>Director:</strong><br>${meta.director}</div>`);

                if (meta.runtime && meta.runtime !== 'N/A')
                    infoItems.push(`<div class="col-6"><strong>Runtime:</strong><br>${meta.runtime}</div>`);

                if (meta.genres && meta.genres !== 'N/A')
                    infoItems.push(`<div class="col-12"><strong>Genres:</strong><br>${meta.genres}</div>`);

                // Only set innerHTML if we actually found something to show
                if (infoItems.length > 0) {
                    infoHTML = `<div class="row g-3 small">${infoItems.join('')}</div>`;
                }
            } else if (type === 'book') {
                if (meta.author) infoHTML += `<p class="small"><strong>Author:</strong> ${meta.author}</p>`;
                if (meta.pageCount) infoHTML += `<p class="small"><strong>Pages:</strong> ${meta.pageCount}</p>`;
            }

            infoEl.innerHTML = infoHTML;

            const castSection = document.getElementById('cast-section');
            const castContainer = document.getElementById('cast-container');

            if ((type === 'movie' || type === 'show') && meta.castData && meta.castData.length > 0) {
                castSection.classList.remove('d-none');

                castContainer.innerHTML = meta.castData.map(actor => `
                    <div class="cast-card text-center" style="min-width: 100px; flex: 0 0 auto;">
                        <img src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path : 'https://placehold.co/100x150?text=No+Photo'}" 
                             class="rounded-3 mb-2 shadow-sm" 
                             style="width: 90px; height: 120px; object-fit: cover; transition: transform 0.2s;">
                        <p class="small fw-bold mb-0 text-truncate" style="width: 90px;">${actor.name}</p>
                        <p class="text-muted" style="font-size: 0.65rem; width: 90px; line-height: 1;">${actor.character}</p>
                    </div>
                `).join('');
            } else {
                castSection.classList.add('d-none');
            }
            renderReviews(reviews);

        } catch (err) {
            titleEl.textContent = "Error loading details.";
            console.error(err);
        }
    };

    const renderReviews = (reviews) => {
        const container = document.getElementById('reviews-container');
        container.innerHTML = '';
        if (reviews.length === 0) {
            container.innerHTML = `<div class="text-center py-4 text-muted">
                <i class="bi bi-chat-dots d-block h1"></i>
                <p>Be the first to share your thoughts!</p>
            </div>`;
            return;
        }

        container.innerHTML = reviews.map(rev => {
            const initial = rev.username ? rev.username.charAt(0).toUpperCase() : '?';
            
            // --- SAFE STAR LOGIC ---
            // Convert 10-point scale back to 5 stars for visual display
            const starCount = Math.round(rev.rating / 2); 
            const safeStars = Math.max(0, Math.min(5, starCount));
            const starsUI = '★'.repeat(safeStars) + '☆'.repeat(5 - safeStars);
            
            return `
                <div class="card border-0 shadow-sm mb-3 rounded-4 bg-body-tertiary">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-start gap-3">
                            <div class="avatar-sm flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle bg-primary text-dark fw-bold" 
                                style="width: 42px; height: 42px; font-size: 1.2rem;">
                                ${initial}
                            </div>
                            
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="fw-bold mb-0">${rev.username}</h6>
                                    <div class="text-warning small">
                                        ${starsUI}
                                    </div>
                                </div>
                                <p class="text-muted small mb-2" style="font-size: 0.75rem;">
                                    Published on ${new Date(rev.createdAt).toLocaleDateString()}
                                </p>
                                <p class="mb-0 text-secondary" style="font-size: 0.95rem;">${rev.comment}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // FORM SUBMISSION FIX
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Visual feedback
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    itemId: currentMongoId, // Using the MongoDB _id
                    rating: document.getElementById('ratingSelect').value, 
                    comment: document.getElementById('commentText').value 
                }),
                credentials: 'include'
            });

            if (res.ok) {
                document.getElementById('reviewForm').reset();
                loadPageData(); 
            } else {
                alert("Please log in to submit a review.");
            }
        } finally {
            btn.disabled = false;
            btn.textContent = 'Submit Review';
        }
    });

    loadPageData();
});