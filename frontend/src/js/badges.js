// 1. Configuration matching your image
const BADGE_DATA = {
    books: {
        bronze: { count: 5,  img: './assets/badges/books-bronze.png' },
        silver: { count: 10, img: './assets/badges/books-silver.png' },
        gold:   { count: 25, img: './assets/badges/books-gold.png' },
        diamond:{ count: 50, img: './assets/badges/books-diamond.png' }
    },
    movies: {
        bronze: { count: 10,  img: './assets/badges/movies-bronze.png' },
        silver: { count: 25, img: './assets/badges/movies-silver.png' },
        gold:   { count: 50, img: './assets/badges/movies-gold.png' },
        diamond:{ count: 100, img: './assets/badges/movies-diamond.png' }
    },
    tv: {
        bronze: { count: 5,  img: './assets/badges/tv-bronze.png' },
        silver: { count: 10, img: './assets/badges/tv-silver.png' },
        gold:   { count: 20, img: './assets/badges/tv-gold.png' },
        diamond:{ count: 40, img: './assets/badges/tv-diamond.png' }
    },
    music: {
        bronze: { count: 20,  img: './assets/badges/music-bronze.png' },
        silver: { count: 50, img: './assets/badges/music-silver.png' },
        gold:   { count: 100, img: './assets/badges/music-gold.png' },
        diamond:{ count: 200, img: './assets/badges/music-diamond.png' }
    }
};

// Mock data for presentation
const MOCK_STATS = { books: 3, movies: 53, tv: 52, music: 25 };

function getBestBadge(category, currentCount) {
    const tiers = BADGE_DATA[category];
    // Sort tiers by count so we check lowest to highest
    const sortedTiers = Object.values(tiers).sort((a, b) => a.count - b.count);
    
    let bestBadge = tiers.bronze; // Default to Bronze
    let isLocked = true;

    // Find the highest tier reached
    for (let tier of sortedTiers) {
        if (currentCount >= tier.count) {
        bestBadge = tier;
        isLocked = false; // We reached this level!
        }
    }

    // Special Case: If user hasn't reached Bronze, show Bronze but LOCKED
    if (currentCount < tiers.bronze.count) {
        bestBadge = tiers.bronze;
        isLocked = true;
    }

    return { ...bestBadge, isLocked };
    }

function renderBadges() {
    const container = document.getElementById('badge-grid');
    container.innerHTML = '';

    // Loop through categories
    Object.keys(BADGE_DATA).forEach(category => {
        const count = MOCK_STATS[category] || 0;
        const result = getBestBadge(category, count);

        // Create Card
        const el = document.createElement('div');
        el.className = 'badge-item';
        
        // Note: if isLocked is true, CSS will turn it grey automatically
        el.innerHTML = `
        <div class="badge-icon-circle">
            <img src="${result.img}" alt="${category}" class="badge-img ${result.isLocked ? 'locked' : ''}">
        </div>
        <div class="badge-label">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
        <div class="badge-progress">${count} / ${result.count}</div>
        `;
        
        container.appendChild(el);
    });
}

document.addEventListener('DOMContentLoaded', renderBadges);