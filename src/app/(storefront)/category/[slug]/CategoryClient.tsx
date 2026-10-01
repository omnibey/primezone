"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { pushPageView, pushViewItemList } from "@/lib/dataLayer";
import ProductCard from "@/components/storefront/ProductCard";

export default function CategoryClient({ categoryName, categorySlug, categoryData = null, initialProducts = [], initialPagination = {} as any }: any) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(initialPagination.page || 1);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages || 1);
  const [totalProducts, setTotalProducts] = useState(initialPagination.total || initialProducts.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [isMobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // Filter states
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derived filtered products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by stock
    if (inStockOnly) {
      result = result.filter(p => p.is_unlimited_stock || p.stock > 0);
    }

    // Filter by price
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min)) {
      result = result.filter(p => p.base_price >= min);
    }
    if (!isNaN(max)) {
      result = result.filter(p => p.base_price <= max);
    }

    // Sort
    if (sortBy === "price_asc") {
      result.sort((a, b) => a.base_price - b.base_price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.base_price - a.base_price);
    }

    return result;
  }, [products, sortBy, minPrice, maxPrice, inStockOnly]);

  // GTM Tracking
  useEffect(() => {
    const fullUrl = typeof window !== 'undefined' 
      ? window.location.href 
      : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    pushPageView("category", fullUrl, { category_name: categoryName });
  }, [categoryName, pathname, searchParams]);

  useEffect(() => {
    if (filteredProducts && filteredProducts.length > 0) {
      const fullUrl = typeof window !== 'undefined' 
        ? window.location.href 
        : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
      pushViewItemList(filteredProducts, `Category - ${categoryName}`, fullUrl);
    }
  }, [filteredProducts, categoryName, pathname, searchParams]);

  const handleReset = () => {
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
  };

  const hasMore = page < totalPages;
  const progressPercent = totalProducts > 0 
    ? Math.min(100, Math.round((products.length / totalProducts) * 100)) 
    : 100;

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const queryCat = categorySlug || categoryName;
      const res = await fetch(`/api/v1/products?category=${encodeURIComponent(queryCat)}&page=${nextPage}&limit=24`);
      if (!res.ok) throw new Error("Failed to load more products");
      const data = await res.json();

      if (data.success && data.data?.products) {
        const newBatch = data.data.products;
        setProducts(prev => [...prev, ...newBatch]);
        setPage(nextPage);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages);
          setTotalProducts(data.data.pagination.total);
        }

        if (typeof window !== "undefined") {
          pushViewItemList(newBatch, `Category - ${categoryName} (Load More)`, window.location.href);
        }
      }
    } catch (err) {
      console.error("Load more category products error:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, categorySlug, categoryName]);

  const scrollToTop = () => {
    const banner = document.querySelector(".category-hero-card");
    if (banner) {
      banner.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Category Hero Card */}
      <div className="container" style={{ marginTop: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="category-hero-card">
          <div className="category-hero-content">
            {categoryData?.image_url && (
              <div className="category-hero-img-box">
                <img 
                  src={categoryData.image_url} 
                  alt={categoryName} 
                  className="category-hero-img"
                  loading="eager"
                />
              </div>
            )}
            <div className="category-hero-text">
              <div className="category-hero-breadcrumb">
                <Link href="/" className="crumb-link"><i className="ph-fill ph-house"></i> Home</Link>
                <span className="crumb-sep"><i className="ph-bold ph-caret-right"></i></span>
                <span className="crumb-current">{categoryName}</span>
              </div>
              <h1 className="category-hero-title">{categoryName}</h1>
              {categoryData?.description && (
                <p className="category-hero-desc">{categoryData.description}</p>
              )}
              <div className="category-hero-badges">
                <span className="category-product-badge">
                  <i className="ph-bold ph-package"></i> {totalProducts} Products Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '0', paddingBottom: '3rem' }}>
          <div className="category-layout">
              {/* SIDEBAR FILTER */}
              <aside className={`filter-sidebar ${isMobileFilterOpen ? 'open' : ''}`} id="filterSidebar">
                  <div className="filter-header hide-desktop">
                      <h3>Filters</h3>
                      <button type="button" className="close-filter-btn" onClick={() => setMobileFilterOpen(false)}><i className="ph-bold ph-x"></i></button>
                  </div>
                  
                  <div className="filter-section">
                      <h4>Sort By</h4>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-input">
                          <option value="newest">Newest Arrivals</option>
                          <option value="price_asc">Price: Low to High</option>
                          <option value="price_desc">Price: High to Low</option>
                      </select>
                  </div>

                  <div className="filter-section">
                      <h4>Price Range</h4>
                      <div className="price-range-inputs">
                          <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="filter-input" placeholder="Min ৳" />
                          <span>-</span>
                          <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="filter-input" placeholder="Max ৳" />
                      </div>
                  </div>

                  <div className="filter-section">
                      <h4>Availability</h4>
                      <label className="checkbox-label">
                          <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} />
                          <span>In Stock Only</span>
                      </label>
                  </div>

                  <div className="filter-actions">
                      <button type="button" className="btn btn-primary hide-desktop" style={{width:'100%', marginBottom: '10px'}} onClick={() => setMobileFilterOpen(false)}>Apply Filters</button>
                      <button type="button" className="btn btn-secondary" style={{width:'100%', background:'var(--bg-light)', color:'var(--text-color)'}} onClick={handleReset}>Reset</button>
                  </div>
              </aside>

              {/* MAIN CONTENT */}
              <div className="category-main">
                  <div className="category-toolbar">
                      <div className="toolbar-left">
                          <button type="button" className="mobile-filter-btn hide-desktop" onClick={() => setMobileFilterOpen(true)}>
                              <i className="ph-bold ph-faders"></i> Filter
                          </button>
                          <span className="product-count">
                            {filteredProducts.length} of {totalProducts} Products
                          </span>
                      </div>
                      <div className="toolbar-right hide-mobile">
                          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                              <option value="newest">Sort by: Default</option>
                              <option value="price_asc">Price: Low to High</option>
                              <option value="price_desc">Price: High to Low</option>
                          </select>
                      </div>
                  </div>

                  <div className="product-grid" id="categoryProductGrid">
                      {filteredProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '3rem 1rem', color: 'var(--text-light)' }}>
                          No products found. Try adjusting your filters.
                        </div>
                      ) : (
                        filteredProducts.map((prod, index) => (
                          <ProductCard 
                            key={`${prod.id}-${index}`} 
                            prod={prod} 
                            index={index} 
                            listName={`Category - ${categoryName}`} 
                          />
                        ))
                      )}
                  </div>

                  {/* Load More & Progress Bar Section */}
                  {totalProducts > 0 && (
                    <div
                      className="load-more-wrapper"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "2.5rem",
                        gap: "12px",
                        textAlign: "center",
                      }}
                    >
                      {/* Action Button */}
                      {hasMore ? (
                          <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="btn"
                            style={{
                              backgroundColor: "var(--primary-color, #E6007E)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "30px",
                              padding: "12px 32px",
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              cursor: isLoadingMore ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              boxShadow: "0 4px 14px rgba(230, 0, 126, 0.25)",
                              transition: "all 0.2s ease",
                              opacity: isLoadingMore ? 0.75 : 1,
                            }}
                            onMouseOver={(e) => {
                              if (!isLoadingMore) e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseOut={(e) => {
                              if (!isLoadingMore) e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            {isLoadingMore ? (
                              <>
                                <i className="ph-bold ph-spinner ph-spin" style={{ fontSize: "1.1rem" }}></i>
                                <span>Loading Products...</span>
                              </>
                            ) : (
                              <>
                                <i className="ph-bold ph-arrow-circle-down" style={{ fontSize: "1.15rem" }}></i>
                                <span>Load More Products</span>
                              </>
                            )}
                          </button>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "8px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "0.9rem",
                              fontWeight: 600,
                              color: "#16a34a",
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              padding: "6px 16px",
                              borderRadius: "20px",
                            }}
                          >
                            <i className="ph-bold ph-check-circle"></i> You&apos;ve reached the end ({totalProducts} products)
                          </span>
                          <button
                            type="button"
                            onClick={scrollToTop}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-light)",
                              fontSize: "0.82rem",
                              cursor: "pointer",
                              textDecoration: "underline",
                              marginTop: "4px",
                            }}
                          >
                            Back to Top ↑
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
          </div>
      </div>
      
      {/* Drawer Overlay for Mobile Filter */}
      {isMobileFilterOpen && (
        <div className="drawer-overlay open show" onClick={() => setMobileFilterOpen(false)} style={{ display: 'block', opacity: 1, pointerEvents: 'auto', zIndex: 10001 }}></div>
      )}
    </>
  );
}
