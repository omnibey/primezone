document.addEventListener('DOMContentLoaded', () => {
    // Determine page type
    const isCategoryPage = window.location.pathname.startsWith('/category');
    const isSearchPage = window.location.pathname.startsWith('/search');

    if (!isCategoryPage && !isSearchPage) return;

    // Elements
    const productGrid = document.getElementById('productGrid');
    const productCount = document.getElementById('productCount');
    const pageTitle = document.getElementById('pageTitle');
    const pageDescription = document.getElementById('pageDescription');
    
    const sortSelect = document.getElementById('sortSelect');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const inStockCheckbox = document.getElementById('inStockCheckbox');
    const keywordInput = document.getElementById('keywordInput'); // Search page only
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    
    // Mobile Drawer elements
    const filterSidebar = document.getElementById('filterSidebar');
    const mobileFilterBtn = document.getElementById('mobileFilterBtn');
    const closeFilterBtn = document.getElementById('closeFilterBtn');
    const drawerOverlay = document.getElementById('drawerOverlay');

    let currentCategorySlug = '';
    let currentSearchQuery = '';

    // Initialize state from URL params
    const urlParams = new URLSearchParams(window.location.search);
    
    if (isCategoryPage) {
        const pathParts = window.location.pathname.split('/');
        currentCategorySlug = pathParts[pathParts.length - 1];
        if (currentCategorySlug.endsWith('.html')) {
            currentCategorySlug = currentCategorySlug.replace('.html', '');
        }
    } else if (isSearchPage) {
        currentSearchQuery = urlParams.get('q') || '';
        if (keywordInput) keywordInput.value = currentSearchQuery;
    }

    if (sortSelect && urlParams.has('sort')) sortSelect.value = urlParams.get('sort');
    if (minPriceInput && urlParams.has('min_price')) minPriceInput.value = urlParams.get('min_price');
    if (maxPriceInput && urlParams.has('max_price')) maxPriceInput.value = urlParams.get('max_price');
    if (inStockCheckbox && urlParams.has('in_stock') && urlParams.get('in_stock') === 'true') {
        inStockCheckbox.checked = true;
    }

    // Build URL for API
    function buildQueryUrl() {
        const params = new URLSearchParams();
        if (isCategoryPage && currentCategorySlug) params.append('category', currentCategorySlug);
        
        let q = '';
        if (isSearchPage && keywordInput) {
            q = keywordInput.value.trim();
        } else if (currentSearchQuery) {
            q = currentSearchQuery;
        }
        if (q) params.append('q', q);

        if (sortSelect && sortSelect.value && sortSelect.value !== 'newest') {
            params.append('sort', sortSelect.value);
        }

        if (minPriceInput && minPriceInput.value) params.append('min_price', minPriceInput.value);
        if (maxPriceInput && maxPriceInput.value) params.append('max_price', maxPriceInput.value);
        if (inStockCheckbox && inStockCheckbox.checked) params.append('in_stock', 'true');
        
        params.append('limit', '50');

        return params;
    }

    // Render Skeletons
    function renderSkeletons() {
        if (!productGrid) return;
        productGrid.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            productGrid.innerHTML += `
                <div class="product-card-skeleton">
                    <div class="sk-image"></div>
                    <div class="sk-info">
                        <div class="sk-title-1"></div>
                        <div class="sk-title-2"></div>
                        <div class="sk-price"></div>
                    </div>
                </div>
            `;
        }
        if (productCount) productCount.textContent = 'Updating results...';
    }

    // Generate Card HTML
    function createCard(p) {
        const imageUrl = p.images && p.images.length > 0 ? p.images[0] : 'https://placehold.co/400x400/E5E7EB/A1A1AA?text=No+Image';

        let priceHTML = '';
        if (p.original_price > p.base_price) {
            const discount = Math.round(((p.original_price - p.base_price) / p.original_price) * 100);
            priceHTML = `
                <span class="home-current-price">৳${p.base_price}</span> 
                <span class="home-original-price" style="display:inline-block;">৳${p.original_price}</span>
                <span class="home-discount-badge" style="display:inline-block;">${discount}% OFF</span>
            `;
        } else {
            priceHTML = `<span class="home-current-price">৳${p.base_price}</span>`;
        }
            
        return `
        <div class="product-card">
            <a href="/product/${p.slug}" class="full-link"></a>
            <div class="product-image">
                <div class="img-skeleton-wrap">
                    <img src="${imageUrl}" alt="${p.title}" loading="lazy" decoding="async"
                         onload="this.closest('.img-skeleton-wrap').classList.add('loaded')"
                         onerror="this.closest('.img-skeleton-wrap').classList.add('loaded')">
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title"><a href="/product/${p.slug}">${p.title}</a></h3>
                <div class="product-price-home">${priceHTML}</div>
            </div>
        </div>
        `;
    }

    // Fetch products from API
    async function fetchProducts() {
        renderSkeletons();
        
        const params = buildQueryUrl();
        const apiUrl = `https://whitelevel-api.bayazidzaman.workers.dev/api/v1/products?${params.toString()}`;
        
        // Update URL state
        const browserParams = new URLSearchParams(params);
        browserParams.delete('limit');
        if (isCategoryPage) browserParams.delete('category');
        
        const newUrl = window.location.pathname + (browserParams.toString() ? '?' + browserParams.toString() : '');
        window.history.pushState({path: newUrl}, '', newUrl);

        try {
            const res = await fetch(apiUrl);
            const data = await res.json();

            if (data.success && productGrid) {
                const products = data.data.products || [];
                productGrid.innerHTML = '';
                
                if (products.length === 0) {
                    productGrid.innerHTML = '<div style="text-align:center; grid-column: 1 / -1; padding: 4rem 1rem; color: #64748b;">No products found matching your criteria.</div>';
                    if (productCount) productCount.textContent = '0 products found';
                } else {
                    productGrid.innerHTML = products.map(createCard).join('');
                    if (productCount) productCount.textContent = `${data.data.pagination.total || products.length} products found`;
                }

                // Update Titles
                if (isCategoryPage && currentCategorySlug && pageTitle) {
                    const title = currentCategorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    pageTitle.textContent = title;
                    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
                    if (breadcrumbCurrent) breadcrumbCurrent.textContent = title;
                    if (pageDescription) pageDescription.textContent = `Explore our collection of ${title}`;
                } else if (isSearchPage) {
                    const sqd = document.getElementById('searchQueryDisplay');
                    if (sqd) sqd.textContent = keywordInput ? keywordInput.value : currentSearchQuery;
                }
            } else if (productGrid) {
                productGrid.innerHTML = '<div style="text-align:center; grid-column: 1 / -1; color: red;">Failed to load products.</div>';
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            if (productGrid) productGrid.innerHTML = '<div style="text-align:center; grid-column: 1 / -1; color: red;">An error occurred while fetching.</div>';
        }
    }

    // Listeners
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            fetchProducts();
            closeMobileFilter();
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (sortSelect) sortSelect.value = 'newest';
            if (minPriceInput) minPriceInput.value = '';
            if (maxPriceInput) maxPriceInput.value = '';
            if (inStockCheckbox) inStockCheckbox.checked = false;
            if (keywordInput) keywordInput.value = '';
            fetchProducts();
            closeMobileFilter();
        });
    }

    if (keywordInput) {
        keywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchProducts();
                closeMobileFilter();
            }
        });
    }

    // Trigger Initial Fetch
    fetchProducts();

    // Mobile Sidebar Logic
    function openMobileFilter() {
        if (filterSidebar) filterSidebar.classList.add('open');
        if (drawerOverlay) drawerOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileFilter() {
        if (filterSidebar) filterSidebar.classList.remove('open');
        if (drawerOverlay) drawerOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (mobileFilterBtn) mobileFilterBtn.addEventListener('click', openMobileFilter);
    if (closeFilterBtn) closeFilterBtn.addEventListener('click', closeMobileFilter);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeMobileFilter);
});
