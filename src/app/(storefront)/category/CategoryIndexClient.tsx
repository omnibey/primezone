"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function CategoryIndexClient({ categories = [] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(cat => 
      cat.name?.toLowerCase().includes(q) || 
      cat.slug?.toLowerCase().includes(q) ||
      cat.description?.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  return (
    <div className="container" style={{ marginTop: '0.75rem', paddingBottom: '3.5rem' }}>
      {/* Category Index Hero */}
      <div className="category-index-hero">
        <div className="static-page-breadcrumb">
          <Link href="/" className="crumb-link"><i className="ph-fill ph-house"></i> Home</Link>
          <span className="crumb-sep"><i className="ph-bold ph-caret-right"></i></span>
          <span className="crumb-current">All Categories</span>
        </div>

        <div className="category-index-hero-main">
          <div>
            <h1 className="category-index-title">Explore All Categories</h1>
            <p className="category-index-subtitle">
              Browse authentic products and collections curated for you.
            </p>
            <div className="category-index-badges">
              <span className="category-product-badge">
                <i className="ph-bold ph-squares-four"></i> {categories.length} Categories
              </span>
            </div>
          </div>

          {/* Quick Search */}
          <div className="category-search-box">
            <i className="ph-bold ph-magnifying-glass search-icon"></i>
            <input 
              type="text"
              placeholder="Search category (e.g. Skin Care, Cleanser)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="category-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery("")} 
                className="category-search-clear"
                title="Clear search"
              >
                <i className="ph-bold ph-x"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="category-empty-state">
          <div className="empty-icon"><i className="ph-bold ph-magnifying-glass"></i></div>
          <h3>No categories found matching &quot;{searchQuery}&quot;</h3>
          <p>Try searching with another keyword or browse all collections.</p>
          <button 
            type="button" 
            onClick={() => setSearchQuery("")} 
            className="btn btn-primary"
            style={{ marginTop: '1rem', borderRadius: '20px', padding: '8px 20px' }}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="category-browse-grid">
          {filteredCategories.map((cat, index) => (
            <Link 
              key={cat.id || cat.slug || index} 
              href={`/category/${cat.slug}`}
              className="category-browse-card"
            >
              <div className="category-browse-img-wrapper">
                <img 
                  src={cat.image_url || "https://placehold.co/300x300?text=" + encodeURIComponent(cat.name)} 
                  alt={cat.name} 
                  loading="lazy"
                  className="category-browse-img"
                />
                <div className="category-browse-overlay">
                  <span>Explore <i className="ph-bold ph-arrow-right"></i></span>
                </div>
              </div>
              <div className="category-browse-info">
                <h3 className="category-browse-name">{cat.name}</h3>
                {cat.products_count !== undefined && cat.products_count !== null && (
                  <span className="category-browse-count">{cat.products_count} Products</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
