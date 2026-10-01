"use client";
import Link from "next/link";
import { pushSelectItem, pushAddToCart } from "@/lib/dataLayer";
import { formatPrice } from "@/lib/formatPrice";
import { useWishlistStore } from "@/lib/wishlistStore";
import { useState, useEffect } from "react";
import useStore from "@/store/useStore";
import { flyToCartAnimation, flyToIconAnimation } from "@/lib/animation";

export default function ProductCard({ prod, index, listName = "Product List" }) {
    const image = prod.images && prod.images.length > 0 ? prod.images[0] : "https://placehold.co/400";
    const discountPercent = prod.original_price > prod.base_price 
      ? Math.round(((prod.original_price - prod.base_price) / prod.original_price) * 100)
      : null;

    const handleProductClick = () => {
        pushSelectItem(prod, listName, index);
    };

    const toggleWishlist = useWishlistStore((state: any) => state.toggleWishlist);
    const isInWishlist = useWishlistStore((state: any) => state.isInWishlist);
    const items = useWishlistStore((state: any) => state.items); // To trigger re-render on change
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
    }, []);

    const isWished = mounted ? isInWishlist(prod.id) : false;

    // Quick Add to Cart logic
    const addToCart = useStore((state: any) => state.addToCart);
    const addToast = useStore((state: any) => state.addToast);
    
    // Check if product has variants (if variants array is empty or missing, it has no variants)
    // Note: Depends on how the API returns data. Sometimes variants is an array, sometimes it's null.
    const parsedVariants = typeof prod.variants === 'string' && prod.variants !== '[]' && prod.variants !== 'null' ? JSON.parse(prod.variants) : prod.variants;
    const hasNoVariants = !parsedVariants || parsedVariants.length === 0;
    const isInStock = prod.is_unlimited_stock || prod.stock > 0;

    const handleQuickAdd = (e) => {
      flyToCartAnimation(e, image);
      
      const cartItem = {
          id: prod.id,
          title: prod.title,
          price: prod.base_price,
          image: image,
          quantity: 1,
          variantId: null,
          variantName: null,
          sku: prod.sku,
          category: prod.category
      };
      
      addToCart(cartItem);
      pushAddToCart([cartItem], "quick_add");
      // addToast("Added to Cart!", "success"); // Toast optional now that we have animation
    };

    return (
      <div className="product-card" onClick={handleProductClick}>
          <Link href={`/product/${prod.slug}`} className="full-link"></Link>

          {/* Top-Right Wishlist Button */}
          <button 
            type="button" 
            className={`wishlist-btn-card ${isWished ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isWished) {
                flyToIconAnimation(e, image, "wishlistIconTrigger");
              }
              toggleWishlist(prod);
            }}
            title={isWished ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <i className={isWished ? "ph-fill ph-heart" : "ph-bold ph-heart"}></i>
          </button>

          {/* QUICK ADD TO CART (Only for products without variants and in stock) */}
          {hasNoVariants && isInStock && (
            <button 
              type="button" 
              className="quick-add-btn-card"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickAdd(e);
              }}
              title="Add to Cart"
            >
              <i className="ph-bold ph-shopping-cart"></i>
            </button>
          )}

          <div className="product-image">
              <div className="img-skeleton-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div 
                    style={{
                      position: 'absolute',
                      inset: '-10%',
                      backgroundImage: `url(${image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'blur(15px)',
                      opacity: 0.85,
                      zIndex: 0
                    }} 
                  />
                  <img src={image} alt={prod.title} loading="lazy" style={{ position: 'relative', zIndex: 1 }} />
              </div>
          </div>
          <div className="product-info">
              <h3 className="product-title">
                  <Link href={`/product/${prod.slug}`}>{prod.title}</Link>
              </h3>
              <div className="product-price-home">
                  <span className="home-current-price">৳{formatPrice(prod.base_price)}</span> 
                  {prod.original_price > prod.base_price && (
                    <>
                      <span className="home-original-price">৳{formatPrice(prod.original_price)}</span>
                      <span className="home-discount-badge">{discountPercent}% OFF</span>
                    </>
                  )}
              </div>
          </div>
      </div>
    );
}
