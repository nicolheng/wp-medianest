const BADGE_CONFIG = {
    books: [
        { tier: 'diamond', count: 50 },
        { tier: 'gold', count: 25 },
        { tier: 'silver', count: 10 },
        { tier: 'bronze', count: 5 }
    ],
    movies: [
        { tier: 'diamond', count: 100 },
        { tier: 'gold', count: 50 },
        { tier: 'silver', count: 25 },
        { tier: 'bronze', count: 10 }
    ],
    tv: [
        { tier: 'diamond', count: 40 },
        { tier: 'gold', count: 30 },
        { tier: 'silver', count: 20 },
        { tier: 'bronze', count: 10 }
    ],
    music: [
        { tier: 'diamond', count: 200 },
        { tier: 'gold', count: 100 },
        { tier: 'silver', count: 50 },
        { tier: 'bronze', count: 20 }
    ]
};

/**
 * Calculates the current badge tier for a given category and count.
 * @param {string} category - books, movies, tv, or music
 * @param {number} count - number of items in history
 * @returns {string} - the tier name (none, bronze, silver, gold, diamond)
 */
function calculateTier(category, count) {
    const configs = BADGE_CONFIG[category];
    if (!configs) return 'none';

    for (const config of configs) {
        if (count >= config.count) {
            return config.tier;
        }
    }
    return 'none';
}

/**
 * Updates the badges object for a user based on their history counts.
 * @param {object} user - the Mongoose user document
 * @returns {boolean} - true if any badge was updated
 */
function updateBadges(user) {
    let updated = false;
    const categories = ['movies', 'tv', 'books', 'music'];

    categories.forEach(cat => {
        const historyCount = user.history[cat]?.length || 0;
        const newTier = calculateTier(cat, historyCount);

        if (user.badges[cat] !== newTier) {
            user.badges[cat] = newTier;
            updated = true;
        }
    });

    return updated;
}

module.exports = {
    updateBadges,
    BADGE_CONFIG
};
