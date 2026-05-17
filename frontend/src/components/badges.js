// Badge configuration with exact thresholds from your design
const BADGE_DATA = {
    books: {
        bronze: { count: 5,  img: './assets/badges/books-bronze.png', name: 'Bronze' },
        silver: { count: 10, img: './assets/badges/books-silver.png', name: 'Silver' },
        gold:   { count: 25, img: './assets/badges/books-gold.png', name: 'Gold' },
        diamond:{ count: 50, img: './assets/badges/books-diamond.png', name: 'Diamond' }
    },
    movies: {
        bronze: { count: 10,  img: './assets/badges/movies-bronze.png', name: 'Bronze' },
        silver: { count: 25, img: './assets/badges/movies-silver.png', name: 'Silver' },
        gold:   { count: 50, img: './assets/badges/movies-gold.png', name: 'Gold' },
        diamond:{ count: 100, img: './assets/badges/movies-diamond.png', name: 'Diamond' }
    },
    tv: {
        bronze: { count: 10,  img: './assets/badges/tv-bronze.png', name: 'Bronze' },
        silver: { count: 20, img: './assets/badges/tv-silver.png', name: 'Silver' },
        gold:   { count: 30, img: './assets/badges/tv-gold.png', name: 'Gold' },
        diamond:{ count: 40, img: './assets/badges/tv-diamond.png', name: 'Diamond' }
    },
    music: {
        bronze: { count: 20,  img: './assets/badges/music-bronze.png', name: 'Bronze' },
        silver: { count: 50, img: './assets/badges/music-silver.png', name: 'Silver' },
        gold:   { count: 100, img: './assets/badges/music-gold.png', name: 'Gold' },
        diamond:{ count: 200, img: './assets/badges/music-diamond.png', name: 'Diamond' }
    }
};

function getBadgeInfo(category, currentCount) {
    const tiers = BADGE_DATA[category];
    const sortedTiers = Object.values(tiers).sort((a, b) => a.count - b.count);
    
    let currentTier = null;
    let nextTier = null;
    let isLocked = true;
    
    // Find highest unlocked tier
    for (let i = 0; i < sortedTiers.length; i++) {
        if (currentCount >= sortedTiers[i].count) {
            currentTier = sortedTiers[i];
            isLocked = false;
            // Set next tier if exists
            if (i + 1 < sortedTiers.length) {
                nextTier = sortedTiers[i + 1];
            }
        }
    }
    
    // If no tier unlocked, show Bronze as locked
    if (!currentTier) {
        currentTier = sortedTiers[0]; // Bronze
        nextTier = sortedTiers[0];    // Target is Bronze
        isLocked = true;
    }
    
    // Determine display values
    const targetCount = nextTier ? nextTier.count : currentTier.count; 
    
    return {
        img: currentTier.img,
        name: currentTier.name,
        target: targetCount,
        isLocked: isLocked
    };
}

export function renderBadges() {
    const container = document.getElementById('badge-grid');
    if (!container) return;
    
    const library = window.userLibrary || { history: {} };
    const history = library.history || {};
    
    container.innerHTML = '';
    
    Object.keys(BADGE_DATA).forEach(category => {
        const count = history[category]?.length || 0;
        const badge = getBadgeInfo(category, count);
        
        const el = document.createElement('div');
        el.className = 'badge-item';
        
        el.innerHTML = `
            <div class="badge-icon-circle">
                <img src="${badge.img}" alt="${category}" class="badge-img ${badge.isLocked ? 'locked' : ''}">
            </div>
            <div class="badge-label">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            <div class="badge-progress">${count} / ${badge.target}</div>
        `;
        
        container.appendChild(el);
    });
}

// Listen for library updates to re-render badges
window.addEventListener('libraryUpdated', renderBadges);

// Initial render if data already exists
if (window.userLibrary) {
    renderBadges();
}
