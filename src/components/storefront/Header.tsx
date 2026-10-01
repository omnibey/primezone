"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import useStore from "@/store/useStore";
import useLiveSearch from "@/lib/useLiveSearch";
import { useWishlistStore } from "@/lib/wishlistStore";
import { formatPrice } from "@/lib/formatPrice";
import { ThemeToggle } from "@/components/storefront/ThemeToggle";

function WishlistBadge() {
  const [mounted, setMounted] = useState(false);
  const items = useWishlistStore(state => state.items);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted || items.length === 0) return null;
  return (
    <span className="wishlist-badge" style={{ display: 'flex' }}>
      {items.length}
    </span>
  );
}

export default function Header({ initialSettings, initialLogoUrl, initialCategories }) {
  const router = useRouter();
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || null);
  const [searchQuery, setSearchQuery] = useState("");
  const cartItems = useStore((state) => state.cartItems);
  const setCartOpen = useStore((state) => state.setCartOpen);
  const isMobileNavOpen = useStore((state) => state.isMobileNavOpen);
  const setMobileNavOpen = useStore((state) => state.setMobileNavOpen);
  const storeSettings = useStore((state) => state.settings);
  const settings = storeSettings?.layout 
    ? { ...initialSettings, ...storeSettings, layout: { ...(initialSettings?.layout || {}), ...(storeSettings?.layout || {}) } } 
    : initialSettings;
  const setSettings = useStore((state) => state.setSettings);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBarRef = useRef(null);
  
  const { results, isSearching, error } = useLiveSearch(searchQuery);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    
    // Use initialSettings from server; only fetch if truly missing
    if (!settings?.layout?.logo_url && !settings?.fetchedLogo && !initialSettings?.layout?.logo_url) {
      fetch('/api/v1/settings')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.settings) {
             setSettings({ ...settings, ...data.data.settings, fetchedLogo: true });
             setLogoUrl(data.data.settings.layout?.logo_url);
          }
        })
        .catch(err => console.error(err));
    } else if (settings?.layout?.logo_url) {
      setLogoUrl(settings.layout.logo_url);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [settings, setSettings]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (pathname === "/thank-you" || pathname === "/checkout") {
    return (
      <div className="fixed-group-wrapper">
        {(settings?.layout?.announcement_enabled === true || settings?.layout?.announcement_enabled === 'true') && settings?.layout?.announcement_text && (
          <div className="announcement-bar" style={{ pointerEvents: 'auto', background: settings?.layout?.theme_color || 'var(--primary-color, #FF6B35)', color: '#fff', padding: '8px 0', margin: 0, fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', lineHeight: 'normal' }}>
            <div style={{ display: 'inline-block', paddingLeft: '100%', animation: 'announcement-marquee 35s linear infinite' }}>
              {settings?.layout?.announcement_link ? (
                <Link href={settings.layout.announcement_link} style={{ color: '#fff', textDecoration: 'none' }}>
                  {settings.layout.announcement_text}
                </Link>
              ) : (
                <span>{settings.layout.announcement_text}</span>
              )}
            </div>
          </div>
        )}
        <div className="sticky-header-wrapper">
          <header className="site-header backdrop-blur-md">
            <div className="container">
              <div className="header-content" style={{ display: 'flex', justifyContent: 'center' }}>
                {/* LOGO */}
                <Link className="site-logo" href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt={`${settings?.layout?.store_name || "Store"} Logo`} style={{ height: '40px', objectFit: 'contain' }} />
                  ) : (
                    <span className="logo-text">{settings?.layout?.store_name || "Store"}</span>
                  )}
                  {pathname === '/checkout' && <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-dark)', borderLeft: '1px solid #ddd', paddingLeft: '10px' }}>Checkout</span>}
                </Link>
              </div>
            </div>
          </header>
        </div>
      </div>
    );
  }

  return (
    <>


      <div className="fixed-group-wrapper">
        {(settings?.layout?.announcement_enabled === true || settings?.layout?.announcement_enabled === 'true') && settings?.layout?.announcement_text && (
          <div className="announcement-bar" style={{ pointerEvents: 'auto', background: settings?.layout?.theme_color || 'var(--primary-color, #FF6B35)', color: '#fff', padding: '8px 0', margin: 0, fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.3px', overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', lineHeight: 'normal' }}>
            <div style={{ display: 'inline-block', paddingLeft: '100%', animation: 'announcement-marquee 35s linear infinite' }}>
              {settings?.layout?.announcement_link ? (
                <Link href={settings.layout.announcement_link} style={{ color: '#fff', textDecoration: 'none' }}>
                  {settings.layout.announcement_text}
                </Link>
              ) : (
                <span>{settings.layout.announcement_text}</span>
              )}
            </div>
          </div>
        )}
        <div className='sticky-header-wrapper'>
            <header className='site-header backdrop-blur-md'>
                <div className='container'>
                    <div className='header-content'>
                        {/* MENU & LOGO GROUP */}
                        <div className="header-left-group" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button 
                                className='header-icon-btn mobile-menu-trigger' 
                                type='button'
                                onClick={() => setMobileNavOpen(true)}
                                aria-label="Menu"
                            >
                                <i className="ph-bold ph-list" style={{ fontSize: '1.5rem' }}></i>
                            </button>

                            <Link className='site-logo' href='/'>
                                {logoUrl ? (
                                    <img src={logoUrl} alt={`${settings?.layout?.store_name || "Store"} Logo`} style={{ height: '40px', objectFit: 'contain', margin: '0 auto' }} />
                                ) : (
                                    <span className='logo-text'>{settings?.layout?.store_name || "Store"}</span>
                                )}
                            </Link>
                        </div>
                        
                        {/* DESKTOP SEARCH */}
                        <div className='search-bar hide-mobile' ref={searchBarRef}>
                            <input 
                                id='searchInput' 
                                placeholder='Search products...' 
                                type='text' 
                                autoComplete='off'
                                value={searchQuery}
                                onChange={(e) => {
                                  setSearchQuery(e.target.value);
                                  setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button className='search-btn' id='searchGoBtn' type='button' onClick={handleSearch}>Search</button>
                            
                            {showSuggestions && searchQuery.trim() && (
                                <div className="desktop-search-suggestions active">
                                    {isSearching ? (
                                        <div className="search-loading-text" style={{padding: '15px', textAlign: 'center', color: 'var(--text-light)'}}>Searching...</div>
                                    ) : error ? (
                                        <div className="search-loading-text" style={{padding: '15px', textAlign: 'center', color: 'red'}}>Error fetching results</div>
                                    ) : results.length > 0 ? (
                                        <>
                                            <ul className='search-suggestions-list'>
                                                {results.map(item => (
                                                    <li key={item.id}>
                                                        <Link href={`/product/${item.slug}`} className="search-suggestion-item" onClick={() => setShowSuggestions(false)}>
                                                            <img src={item.images && item.images.length > 0 ? item.images[0] : "https://placehold.co/100x100"} alt={item.title} className="search-suggestion-img" />
                                                            <div className="search-suggestion-details">
                                                                <div className="search-suggestion-title">{item.title}</div>
                                                                <div className="search-suggestion-meta">SKU: {item.sku || "N/A"} • {item.category || "Uncategorized"}</div>
                                                                <div className="search-suggestion-prices">
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
                                            </ul>
                                            <div style={{ textAlign: 'center', padding: '10px', borderTop: '1px solid #e2e8f0', background: 'var(--bg-light)', borderRadius: '0 0 8px 8px' }}>
                                                <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} onClick={() => setShowSuggestions(false)} style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                                                    View All Results
                                                </Link>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="search-loading-text" style={{padding: '15px', textAlign: 'center', color: 'var(--text-light)'}}>No products found</div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* HEADER ACTIONS (INCLUDING MOBILE SEARCH) */}
                        <div className='header-actions'>
                            {/* MOBILE SEARCH TRIGGER */}
                            <button 
                                className='header-icon-btn hide-desktop' 
                                id='mobileSearchTrigger' 
                                type='button'
                                onClick={() => document.dispatchEvent(new CustomEvent('open-search-overlay'))}
                                aria-label="Search"
                            >
                                <i className="ph-bold ph-magnifying-glass"></i>
                            </button>
                            

                            <div className='header-icon-btn cart-icon' id="cartIconTrigger" onClick={() => setCartOpen(true)}>
                                <i className="ph-bold ph-shopping-cart"></i>
                                {cartCount > 0 && (
                                  <span className='cart-badge' id="cartBadgeCount" style={{ display: 'flex' }}>
                                    {cartCount}
                                  </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </div> 
      </div>
    </>
  );
}
