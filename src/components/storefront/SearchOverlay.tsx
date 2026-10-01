"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useLiveSearch from "@/lib/useLiveSearch";
import { formatPrice } from "@/lib/formatPrice";

export default function SearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef(null);

  const { results, isSearching, error } = useLiveSearch(searchQuery);

  useEffect(() => {
    // Listen for custom event to open search from Mobile Search Trigger in Header
    const handleOpenSearch = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    document.addEventListener("open-search-overlay", handleOpenSearch);
    
    return () => document.removeEventListener("open-search-overlay", handleOpenSearch);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className={`search-overlay ${isOpen ? 'open' : ''}`} id='searchOverlay'>
      <div className='search-overlay-header'>
        <input 
            className='search-overlay-input' 
            id='fullSearchInput' 
            placeholder='Search products...' 
            type='text' 
            autoComplete='off'
            value={searchQuery}
            ref={inputRef}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className='search-overlay-close' id='searchOverlayCloseBtn' type='button' onClick={() => setIsOpen(false)}>
          <i className="ph-bold ph-x"></i>
        </button>
      </div>
      <div className='search-overlay-body'>
          {searchQuery.trim() ? (
              <ul className='search-suggestions-list' id='searchSuggestionsList'>
                  {isSearching ? (
                      <li style={{padding: '15px', textAlign: 'center', color: 'var(--text-light)'}}>Searching...</li>
                  ) : error ? (
                      <li style={{padding: '15px', textAlign: 'center', color: 'red'}}>Error fetching results</li>
                  ) : results.length > 0 ? (
                      <>
                          {results.map(item => (
                              <li key={item.id}>
                                  <Link href={`/product/${item.slug}`} className="search-suggestion-item" onClick={() => setIsOpen(false)}>
                                      <img src={item.images && item.images.length > 0 ? item.images[0] : "https://placehold.co/100x100"} alt={item.title} className="search-suggestion-img" />
                                      <div className="search-suggestion-details">
                                          <div className="search-suggestion-title">{item.title}</div>
                                          <div className="search-suggestion-meta">SKU: {item.sku || "N/A"} • {item.category || "Uncategorized"}</div>
                                          <div className="search-suggestion-price-row">
                                              <span className="search-suggestion-price">৳{formatPrice(item.base_price)}</span>
                                              {item.original_price > item.base_price && (
                                                  <span className="search-suggestion-original">৳{formatPrice(item.original_price)}</span>
                                              )}
                                          </div>
                                      </div>
                                      <div className="search-suggestion-stock">
                                          {item.stock > 0 || item.is_unlimited_stock ? (
                                              <span style={{color: '#16a34a'}}>In Stock</span>
                                          ) : (
                                              <span style={{color: '#dc2626'}}>Out of Stock</span>
                                          )}
                                      </div>
                                  </Link>
                              </li>
                          ))}
                          <li style={{ textAlign: 'center', padding: '15px', background: 'var(--bg-light)' }}>
                              <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} onClick={() => setIsOpen(false)} style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
                                  View All Results
                              </Link>
                          </li>
                      </>
                  ) : (
                      <li style={{padding: '15px', textAlign: 'center', color: 'var(--text-light)'}}>No products found</li>
                  )}
              </ul>
          ) : null}
      </div>
    </div>
  );
}
