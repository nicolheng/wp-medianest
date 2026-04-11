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

        // STEP 1: Optimistic UI - Set placeholders
        titleEl.innerHTML = '<span class="placeholder col-6 bg-secondary"></span>';
        descEl.innerHTML = '<span class="placeholder col-12 bg-secondary"></span><span class="placeholder col-8 bg-secondary"></span>';
        posterEl.style.opacity = '0.3'; // Dim the poster while loading

        try {
            const res = await fetch(`/api/items/${type}/${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const { item, reviews } = data;
            const meta = item.metadata || {};

            // STEP 2: Render Text Immediately (Fastest)
            titleEl.textContent = item.title;
            descEl.textContent = meta.description || "No description provided.";
            document.getElementById('avg-rating').textContent = item.averageRating?.toFixed(1) || '0.0';
            document.getElementById('total-reviews').textContent = `${reviews.length} reviews`;

            // STEP 3: Handle Image with a "Fade-in"
            const img = new Image();
            img.src = meta.image || 'https://placehold.co/400x600?text=No+Image';
            img.onload = () => {
                posterEl.src = img.src;
                posterEl.style.opacity = '1';
                posterEl.classList.add('fade-in-animation');
            };

            renderReviews(reviews);

        } catch (err) {
            titleEl.textContent = "Error loading details.";
            console.error(err);
        }
    };

    const renderReviews = (reviews) => {
        const container = document.getElementById('reviews-container');
        if (reviews.length === 0) {
            container.innerHTML = `<p class="text-muted small">No reviews yet.</p>`;
            return;
        }
        container.innerHTML = reviews.map(rev => `
            <div class="card shadow-sm border-0 mb-3 rounded-4 bg-body-tertiary">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="fw-bold mb-0">${rev.username}</h6>
                        <span class="badge bg-warning text-dark">${rev.rating} ★</span>
                    </div>
                    <p class="small mb-1 mt-2">${rev.comment}</p>
                </div>
            </div>
        `).join('');
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