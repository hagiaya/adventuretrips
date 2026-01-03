export const addToRecentlyViewed = (productId) => {
    if (!productId) return;

    try {
        const STORAGE_KEY = 'recently_viewed_products';
        const MAX_ITEMS = 10;

        // 1. Get current list
        let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

        // 2. Remove if already exists to move it to top
        history = history.filter(id => id !== productId);

        // 3. Add to front
        history.unshift(productId);

        // 4. Limit items
        history = history.slice(0, MAX_ITEMS);

        // 5. Save back
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        console.error("Recently Viewed Error:", e);
    }
};

export const getRecentlyViewedIds = () => {
    try {
        return JSON.parse(localStorage.getItem('recently_viewed_products') || '[]');
    } catch (e) {
        return [];
    }
};
