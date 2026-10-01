"use client";
export const runtime = 'edge';

import { useWishlistStore } from "@/lib/wishlistStore";
import { pushPageView, pushViewItemList } from "@/lib/dataLayer";
import ProductCard from "@/components/storefront/ProductCard";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function WishlistContent() {
  const items = useWishlistStore(state => state.items);
  const clearWishlist = useWishlistStore(state => state.clearWishlist);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    const fullUrl = typeof window !== 'undefined' 
      ? window.location.href 
      : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    pushPageView("wishlist", fullUrl);
    if (items.length > 0) {
      pushViewItemList(items, "Wishlist", fullUrl);
    }
  }, [pathname, searchParams, items.length]);

  if (!mounted) {
    return <div className="wishlist-page-container" style={{ minHeight: '60vh' }}></div>;
  }

  return (
    <div className="wishlist-page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-color)' }}>My Wishlist</h1>
        {items.length > 0 && (
          <button 
            className="btn" 
            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}
            onClick={clearWishlist}
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="wishlist-empty-state">
          <i className="ph-fill ph-heart-break wishlist-empty-icon"></i>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Your wishlist is empty</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
            Save items you like in your wishlist. Review them anytime and easily move them to cart.
          </p>
          <Link href="/" className="btn btn-primary-orange" style={{ display: 'inline-flex', padding: '0.8rem 2rem' }}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="product-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '15px'
        }}>
          {items.map((prod, index) => (
            <ProductCard 
              key={prod.id} 
              prod={prod} 
              index={index} 
              listName="Wishlist" 
            />
          ))}
        </div>
      )}

      {/* Add specific grid styles for larger screens if not covered globally */}
      <style>{`
        @media (min-width: 768px) {
          .wishlist-page-container .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <Suspense fallback={<div className="wishlist-page-container" style={{ minHeight: '60vh' }}></div>}>
      <WishlistContent />
    </Suspense>
  );
}
