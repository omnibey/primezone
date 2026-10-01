"use client";

import useStore from "@/store/useStore";
import Link from "next/link";
import { useState, useEffect } from "react";
import { parseMenuItems } from "@/lib/parseMenu";
import { useWishlistStore } from "@/lib/wishlistStore";
import { ThemeToggle } from "@/components/storefront/ThemeToggle";

function getMenuIcon(title = '') {
  const t = title.toLowerCase();
  if (t.includes('home')) return 'ph-bold ph-house';
  if (t.includes('shop') || t.includes('all product') || t.includes('products')) return 'ph-bold ph-shopping-bag';
  if (t.includes('skin') || t.includes('serum') || t.includes('cream') || t.includes('moisturizer')) return 'ph-bold ph-sparkle';
  if (t.includes('cleanse') || t.includes('wash') || t.includes('foam')) return 'ph-bold ph-drop';
  if (t.includes('tone') || t.includes('essence')) return 'ph-bold ph-drop-half-bottom';
  if (t.includes('sun') || t.includes('spf') || t.includes('uv')) return 'ph-bold ph-sun';
  if (t.includes('hair') || t.includes('scalp') || t.includes('shampoo')) return 'ph-bold ph-scissors';
  if (t.includes('makeup') || t.includes('lip') || t.includes('cushion')) return 'ph-bold ph-palette';
  if (t.includes('offer') || t.includes('sale') || t.includes('deal') || t.includes('discount') || t.includes('flash')) return 'ph-fill ph-fire';
  if (t.includes('cat') || t.includes('collection')) return 'ph-bold ph-squares-four';
  if (t.includes('blog') || t.includes('article') || t.includes('news')) return 'ph-bold ph-newspaper';
  if (t.includes('track') || t.includes('order')) return 'ph-bold ph-package';
  if (t.includes('contact') || t.includes('about') || t.includes('help') || t.includes('faq')) return 'ph-bold ph-info';
  return 'ph-bold ph-caret-circle-right';
}

function isHotItem(title = '') {
  const t = title.toLowerCase();
  return t.includes('sale') || t.includes('offer') || t.includes('hot') || t.includes('flash') || t.includes('deal');
}

export default function MobileNavDrawer({ initialSettings = {} }) {
  const isMobileNavOpen = useStore((state) => state.isMobileNavOpen);
  const setMobileNavOpen = useStore((state) => state.setMobileNavOpen);
  const storeSettings = useStore((state) => state.settings);

  // Wishlist count
  const wishlistItems = useWishlistStore((state: any) => state.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Settings & Menu
  const settings = storeSettings?.layout ? storeSettings : initialSettings;
  const layout = settings?.layout || {};
  const footer = layout?.footer || settings?.footer || {};
  const rawMenu = layout?.menu || [];
  const logoUrl = layout?.logo_url || "";
  const phone = settings?.contact_phone || "";
  const whatsappNumber = settings?.whatsapp_number || phone || "";
  const facebookUrl = footer?.facebook || "";
  const instagramUrl = footer?.instagram || "";
  const youtubeUrl = footer?.youtube || "";
  const tiktokUrl = footer?.tiktok || "";

  const showTrackOrder = layout?.show_quick_track_order ?? true;
  const showWishlist = layout?.show_quick_wishlist ?? true;
  const showCategories = layout?.show_quick_categories ?? true;

  // Parse flat array with _ prefix convention into nested tree (up to 3 levels)
  const parsedMenu = parseMenuItems(rawMenu);

  // Accordion open state — track by stringified path
  const [openPaths, setOpenPaths] = useState({});

  const toggle = (path, e) => {
    if (e) e.stopPropagation();
    setOpenPaths((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const close = () => setMobileNavOpen(false);

  // Level 3 (Deepest sub-items)
  const renderLevel3 = (items) =>
    items.map((item, idx) => (
      <li key={idx} className="nav-sub-item-l3">
        <Link href={item.url} className="nav-sub-link-l3" onClick={close}>
          <span className="sub-dot"></span>
          <span>{item.title}</span>
        </Link>
      </li>
    ));

  // Level 2 (Sub-categories)
  const renderLevel2 = (items, parentPath) =>
    items.map((item, idx) => {
      const path = `${parentPath}-${idx}`;
      const hasChildren = item.children && item.children.length > 0;
      const isOpen = Boolean(openPaths[path]);

      return (
        <li key={idx} className="nav-sub-item-l2">
          {hasChildren ? (
            <>
              <div
                className={`nav-sub-accordion-header ${isOpen ? 'active' : ''}`}
                onClick={(e) => toggle(path, e)}
              >
                <span className="sub-dot"></span>
                <span className="sub-title">{item.title}</span>
                <i className={`ph-bold ph-caret-right nav-chevron-sub ${isOpen ? "rotated" : ""}`}></i>
              </div>
              {isOpen && (
                <ul className="nav-sub-list-l3">
                  {renderLevel3(item.children)}
                </ul>
              )}
            </>
          ) : (
            <Link href={item.url} className="nav-sub-link-l2" onClick={close}>
              <span className="sub-dot"></span>
              <span>{item.title}</span>
            </Link>
          )}
        </li>
      );
    });

  // Level 1 (Top Level Navigation Items)
  const renderLevel1 = () =>
    parsedMenu.map((item, idx) => {
      const path = `${idx}`;
      const hasChildren = item.children && item.children.length > 0;
      const iconClass = getMenuIcon(item.title);
      const isHot = isHotItem(item.title);
      const isOpen = Boolean(openPaths[path]);

      return (
        <li className={`nav-menu-item-wrapper ${isOpen ? 'active-accordion' : ''}`} key={idx}>
          {hasChildren ? (
            <>
              <div
                className={`nav-menu-parent-btn ${isOpen ? 'open' : ''}`}
                onClick={(e) => toggle(path, e)}
              >
                <div className="nav-menu-left">
                  <div className={`nav-menu-icon-box ${isHot ? 'hot' : ''}`}>
                    <i className={iconClass}></i>
                  </div>
                  <span className="nav-menu-title-text">{item.title}</span>
                  {isHot && <span className="nav-badge-hot">HOT</span>}
                </div>
                <div className="nav-menu-right">
                  <span className="nav-count-badge">{item.children.length}</span>
                  <i className={`ph-bold ph-caret-right nav-chevron-main ${isOpen ? "rotated" : ""}`}></i>
                </div>
              </div>
              {isOpen && (
                <ul className="nav-sub-list-l2">
                  {renderLevel2(item.children, path)}
                </ul>
              )}
            </>
          ) : (
            <Link href={item.url} className="nav-menu-direct-link" onClick={close}>
              <div className="nav-menu-left">
                <div className={`nav-menu-icon-box ${isHot ? 'hot' : ''}`}>
                  <i className={iconClass}></i>
                </div>
                <span className="nav-menu-title-text">{item.title}</span>
                {isHot && <span className="nav-badge-hot">HOT</span>}
              </div>
              <i className="ph-bold ph-arrow-up-right nav-direct-arrow"></i>
            </Link>
          )}
        </li>
      );
    });

  return (
    <>
      <div
        className={`fixed inset-0 z-[10002] bg-black/50 backdrop-blur-[2px] transition-opacity duration-400 ease-in-out ${isMobileNavOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        id="drawerOverlay"
        onClick={close}
      ></div>

      <div className={`modern-mobile-nav-drawer ${isMobileNavOpen ? "open" : ""}`} id="mobileNavDrawer">
        {/* Drawer Header */}
        <div className="modern-nav-header" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '1rem' }}>
          <div style={{ justifySelf: 'start' }}>
            <button 
              className="modern-nav-close-btn" 
              id="closeMobileNav" 
              type="button" 
              onClick={close}
              aria-label="Close Menu"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
          
          <Link href="/" className="modern-nav-logo" onClick={close} style={{ justifySelf: 'center' }}>
            {logoUrl ? (
              <img src={logoUrl} alt={`${layout?.store_name || "Store"} Logo`} />
            ) : (
              <span className="logo-brand-name">{layout?.store_name || "Store"}</span>
            )}
          </Link>
          
          <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle />
            <Link href="/profile" onClick={close} style={{
               display: 'flex', alignItems: 'center', justifyContent: 'center', 
               width: '36px', height: '36px', borderRadius: '50%', 
               background: 'var(--bg-light)', color: 'var(--text-color)',
               border: '1px solid var(--border-color)'
            }}>
                <i className="ph-bold ph-user" style={{fontSize: '1.2rem'}}></i>
            </Link>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="modern-nav-body">
          {/* Quick Action Shortcut Cards */}
          {(showTrackOrder || showWishlist || showCategories) && (() => {
            const visibleCount = [showTrackOrder, showWishlist, showCategories].filter(Boolean).length;
            return (
              <div className="modern-nav-quick-grid" style={{ gridTemplateColumns: `repeat(${visibleCount}, 1fr)` }}>
                {showTrackOrder && (
                <Link href="/track-order" className="nav-quick-card" onClick={close}>
                  <div className="nav-quick-icon" style={{ background: 'color-mix(in srgb, #3b82f6 12%, var(--bg-color))', color: '#2563eb' }}>
                    <i className="ph-fill ph-package"></i>
                  </div>
                  <div className="nav-quick-info">
                    <span className="nav-quick-title">Track Order</span>
                    <span className="nav-quick-subtitle">Live Status</span>
                  </div>
                </Link>
              )}

              {showWishlist && (
                <Link href="/wishlist" className="nav-quick-card" onClick={close}>
                  <div className="nav-quick-icon" style={{ background: 'color-mix(in srgb, #ec4899 12%, var(--bg-color))', color: '#db2777' }}>
                    <i className="ph-fill ph-heart"></i>
                    {mounted && wishlistItems.length > 0 && (
                      <span className="nav-wish-badge">{wishlistItems.length}</span>
                    )}
                  </div>
                  <div className="nav-quick-info">
                    <span className="nav-quick-title">Wishlist</span>
                    <span className="nav-quick-subtitle">{mounted && wishlistItems.length > 0 ? `${wishlistItems.length} items` : 'Saved items'}</span>
                  </div>
                </Link>
              )}

              {showCategories && (
                <Link href="/category" className="nav-quick-card" onClick={close}>
                  <div className="nav-quick-icon" style={{ background: 'color-mix(in srgb, var(--primary-color) 12%, var(--bg-color))', color: 'var(--primary-color)' }}>
                    <i className="ph-fill ph-squares-four"></i>
                  </div>
                  <div className="nav-quick-info">
                    <span className="nav-quick-title">Categories</span>
                    <span className="nav-quick-subtitle">All Brands</span>
                  </div>
                </Link>
              )}
            </div>
            );
          })()}

          {/* Section Divider */}
          <div className="modern-nav-section-label">
            <span>EXPLORE MENU</span>
          </div>

          {/* Main Navigation Menu */}
          {parsedMenu.length > 0 ? (
            <ul className="modern-nav-menu-list" id="mobile-menu-target">
              {renderLevel1()}
            </ul>
          ) : (
            <div className="modern-nav-empty">
              <i className="ph-bold ph-list-dashes"></i>
              <p>No menu items configured.</p>
            </div>
          )}
        </div>

        {/* Drawer Footer with clean Social Icons only */}
        <div className="modern-nav-footer">
          <div className="nav-social-icons-centered">
            {whatsappNumber && (
              <a
                href={`https://wa.me/${String(whatsappNumber).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-social-btn"
                title="WhatsApp"
              >
                <i className="ph-fill ph-whatsapp-logo"></i>
              </a>
            )}
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-social-btn"
                title="Facebook"
              >
                <i className="ph-fill ph-facebook-logo"></i>
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-social-btn"
                title="Instagram"
              >
                <i className="ph-fill ph-instagram-logo"></i>
              </a>
            )}
            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-social-btn"
                title="YouTube"
              >
                <i className="ph-fill ph-youtube-logo"></i>
              </a>
            )}
            {tiktokUrl && (
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-social-btn"
                title="TikTok"
              >
                <i className="ph-fill ph-tiktok-logo"></i>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="nav-social-btn"
                title="Call Helpline"
              >
                <i className="ph-fill ph-phone-call"></i>
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
