"use client";

// Keys
const VIEWED_KEY = "store_viewed_products";
const CAT_KEY = "store_viewed_categories";

// Safely get from local storage
const getStorage = (key, defaultVal) => {
    if (typeof window === "undefined") return defaultVal;
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
};

const setStorage = (key, val) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
};

/**
 * Call this when a product is viewed or added to cart
 */
export const trackProductView = (productId, category) => {
    if (!productId) return;

    // 1. Update Viewed Products (Max 20)
    let viewed = getStorage(VIEWED_KEY, []);
    // Remove if already exists so we can push to front
    viewed = viewed.filter(id => id !== productId);
    viewed.unshift(productId);
    if (viewed.length > 20) viewed.pop();
    setStorage(VIEWED_KEY, viewed);

    // 2. Update Category Interests
    if (category) {
        let cats = getStorage(CAT_KEY, {});
        // Parse comma-separated categories (if product has multiple)
        const catList = category.split(',').map(c => c.trim()).filter(Boolean);
        
        catList.forEach(c => {
            cats[c] = (cats[c] || 0) + 1;
        });

        // Decay logic (keep it relevant by slowly reducing old counts)
        // If the object gets too big, scale everything down
        const totalViews = (Object.values(cats) as number[]).reduce((a, b) => a + b, 0);
        if (totalViews > 50) {
            Object.keys(cats).forEach(k => {
                cats[k] = Math.floor(cats[k] * 0.8); // 20% decay
                if (cats[k] <= 0) delete cats[k];
            });
        }
        
        setStorage(CAT_KEY, cats);
    }
};

/**
 * Returns data formatted for API calls
 */
export const getRecommendationData = () => {
    const viewed = getStorage(VIEWED_KEY, []);
    const cats = getStorage(CAT_KEY, {});

    // Get top 3 categories by view count
    const topInterests = Object.entries(cats)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(entry => entry[0]);

    return {
        viewed_ids: viewed.join(','),
        interests: topInterests.join(',')
    };
};
