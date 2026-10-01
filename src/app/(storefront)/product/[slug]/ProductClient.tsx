"use client";

import React, { Fragment, useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import useStore from "@/store/useStore";
import Splide from "@splidejs/splide";
import { pushPageView, pushViewItem, pushAddToCart } from "@/lib/dataLayer";
import { usePathname, useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/formatPrice";
import ProductCard from "@/components/storefront/ProductCard";
import { useWishlistStore } from "@/lib/wishlistStore";
import CheckoutUI from "@/components/common/CheckoutUI";
import { trackProductView, getRecommendationData } from "@/lib/recommendation";
import { flyToCartAnimation, flyToIconAnimation } from "@/lib/animation";

export default function ProductClient({ product, variants }) {
  const addToCartAction = useStore((state: any) => state.addToCart);
  const openCheckout = useStore((state: any) => state.openCheckout);
  const addToast = useStore((state: any) => state.addToast);
  const isCartOpen = useStore((state: any) => state.isCartOpen);
  const isCheckoutOpen = useStore((state: any) => state.isCheckoutOpen);

  const toggleWishlist = useWishlistStore((state: any) => state.toggleWishlist);
  const isInWishlist = useWishlistStore((state: any) => state.isInWishlist);
  const wishlistItems = useWishlistStore((state: any) => state.items); // For reactivity
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWished = mounted ? isInWishlist(product.id) : false;

  const images = useMemo(() => {
    let baseImages = product.images && product.images.length > 0 ? [...product.images] : [];
    if (variants && variants.length > 0) {
      variants.forEach(v => {
        if (v.image_url && !baseImages.includes(v.image_url)) {
          baseImages.push(v.image_url);
        }
      });
    }
    return baseImages.length > 0 ? baseImages : ["https://placehold.co/600x600/E5E7EB/A1A1AA?text=No+Image"];
  }, [product.images, variants]);
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  const [relatedPage, setRelatedPage] = useState(1);
  const [hasMoreRelated, setHasMoreRelated] = useState(false);
  const [isFetchingMoreRelated, setIsFetchingMoreRelated] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // GTM Tracking for Page View and View Item
  useEffect(() => {
    if (product) {
      const fullUrl = typeof window !== 'undefined'
        ? window.location.href
        : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
      pushPageView("product", fullUrl);
      pushViewItem(product, fullUrl);
    }
  }, [product, pathname, searchParams]);

  // Review State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewDesc, setReviewDesc] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const REVIEWS_PER_PAGE = 5;
  const [visibleReviewCount, setVisibleReviewCount] = useState(REVIEWS_PER_PAGE);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Custom Slider Logic
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const dotsRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const goToRef = useRef(null);
  const isApiMoveRef = useRef(false);

  const hasMultiple = images.length > 1;

  const splideRef = useRef(null);
  const splideInstance = useRef(null);

  useEffect(() => {
    if (!splideRef.current) return;

    splideInstance.current = new Splide(splideRef.current, {
      type: 'loop',
      autoplay: hasMultiple,
      interval: 4000,
      speed: 800,
      arrows: false,
      pagination: true,
      pauseOnHover: true,
      heightRatio: 1,
      drag: true,
    });

    if (hasMultiple) {
      splideInstance.current.on('move', (newIndex) => {
        if (isApiMoveRef.current) return;
        setSelectedImage(images[newIndex]);
      });
    }

    splideInstance.current.mount();

    return () => {
      if (splideInstance.current) {
        splideInstance.current.destroy();
      }
    };
  }, [images, hasMultiple]);

  // Sync Variant selection TO Custom Slider
  useEffect(() => {
    const idx = images.indexOf(selectedImage);
    if (idx !== -1 && splideInstance.current && splideInstance.current.index !== idx) {
      isApiMoveRef.current = true;
      splideInstance.current.go(idx);
      isApiMoveRef.current = false;
    }
  }, [selectedImage, images]);

  useEffect(() => {
    if (product.id) {
      trackProductView(product.id, product.category);
    }
  }, [product.id, product.category]);

  useEffect(() => {
    if (!product.category) {
      setIsLoadingRelated(false);
      return;
    }

    // Fetch smart recommendations
    const { viewed_ids, interests } = getRecommendationData();
    const queryParams = new URLSearchParams({
      page: '1',
      limit: '9',
      sort: 'recommendation',
      viewed_ids: viewed_ids,
      interests: interests || product.category // Fallback to current category if no history
    });

    fetch(`/api/v1/products?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.products) {
          const filtered = data.data.products.filter(p => p.id !== product.id).slice(0, 8);
          setRelatedProducts(filtered);
          if (data.data.pagination) {
            setHasMoreRelated(data.data.pagination.page < data.data.pagination.totalPages);
          }
        }
      })
      .catch(err => console.error("Failed to fetch related products", err))
      .finally(() => setIsLoadingRelated(false));
  }, [product.category, product.id]);

  const loadMoreRelated = useCallback(async () => {
    if (isFetchingMoreRelated || !hasMoreRelated) return;
    setIsFetchingMoreRelated(true);
    const nextPage = relatedPage + 1;

    try {
      const { viewed_ids, interests } = getRecommendationData();
      const queryParams = new URLSearchParams({
        page: nextPage.toString(),
        limit: '25', // Fetch 24 items next time
        sort: 'recommendation',
        viewed_ids: viewed_ids,
        interests: interests || product.category
      });

      const res = await fetch(`/api/v1/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      if (data.success && data.data.products) {
        const filtered = data.data.products.filter(p => p.id !== product.id);
        setRelatedProducts(prev => {
          // Avoid duplicates
          const newItems = filtered.filter(f => !prev.some(p => p.id === f.id));
          return [...prev, ...newItems].slice(0, prev.length + 8);
        });
        setRelatedPage(nextPage);
        if (data.data.pagination) {
          setHasMoreRelated(data.data.pagination.page < data.data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error("Failed to load more related products", err);
    } finally {
      setIsFetchingMoreRelated(false);
    }
  }, [isFetchingMoreRelated, hasMoreRelated, relatedPage, product.id, product.category]);

  const triggerShake = () => {
    const el = document.getElementById("variantsContainer");
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove("co-field-error");
      void el.offsetWidth;
      el.classList.add("co-field-error");
      setTimeout(() => el.classList.remove("co-field-error"), 700);
    }
  };

  // Basic & Separated Mode state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  // Bulk Mode state
  const [variantBulkState, setVariantBulkState] = useState({});

  // Parse options for all variants safely
  const parsedVariants = useMemo(() => {
    if (!variants) return [];
    return variants.map(v => {
      let opts = {};
      if (typeof v.options === 'string') {
        try { opts = JSON.parse(v.options); } catch (e) { }
      } else if (v.options) {
        opts = v.options;
      }
      return { ...v, parsedOptions: opts };
    });
  }, [variants]);

  const { mode, primaryKey, secondaryKey, primaryValues, secondaryValues, optionKeys, groupedOptions } = useMemo(() => {
    if (!parsedVariants || parsedVariants.length === 0) return { mode: 'none' };

    const opts = parsedVariants[0].parsedOptions;
    const keys = Object.keys(opts || {});

    if (product.is_variant_bulk_mode && keys.length >= 1) {
      // BULK MODE
      const pk = keys.find(s => ["color", "colour", "rong", "রঙ"].includes(s.toLowerCase())) || keys[0];
      const sk = keys.find(s => s !== pk) || keys[1];
      const pVals = Array.from(new Set<string>(parsedVariants.map(v => v.parsedOptions[pk]).filter(Boolean)));
      const sVals = sk ? Array.from(new Set<string>(parsedVariants.map(v => v.parsedOptions[sk]).filter(Boolean))) : [];
      return { mode: 'variant_bulk_mode', primaryKey: pk, secondaryKey: sk, primaryValues: pVals, secondaryValues: sVals, optionKeys: keys };
    } else if (!product.is_variant_bulk_mode && keys.length > 0) {
      // SEPARATED MODE
      const gOptions: any = {};
      keys.forEach(k => {
        gOptions[k] = Array.from(new Set<string>(parsedVariants.map(v => v.parsedOptions[k]).filter(Boolean)));
      });
      return { mode: 'variant', optionKeys: keys, groupedOptions: gOptions };
    } else {
      // BASIC MODE
      return { mode: 'non_variant' };
    }
  }, [parsedVariants, product.is_variant_bulk_mode]);

  // Handle Separated Mode Selection
  useEffect(() => {
    if (mode === 'variant' && Object.keys(selectedOptions).length > 0) {
      const match = parsedVariants.find(v => {
        return optionKeys.every(k => v.parsedOptions[k] === selectedOptions[k]);
      });
      setSelectedVariant(match || null);
      if (match && match.image_url) setSelectedImage(match.image_url);
    }
  }, [selectedOptions, mode, parsedVariants, optionKeys]);

  const displayPrice = selectedVariant ? selectedVariant.price : product.base_price;
  const displayOrigPrice = selectedVariant && selectedVariant.original_price > selectedVariant.price
    ? selectedVariant.original_price
    : (product.original_price > product.base_price ? product.original_price : null);
  const stockLimit = selectedVariant ? selectedVariant.stock : product.stock;
  const isUnlimited = selectedVariant ? selectedVariant.is_unlimited_stock : product.is_unlimited_stock;
  const isInStock = isUnlimited || stockLimit > 0;

  // Out of stock warning toast logic
  useEffect(() => {
    if (!isInStock && (mode === 'non_variant' || selectedVariant)) {
      const timer = setTimeout(() => {
        addToast("এই প্রোডাক্টটি স্টকে নেই, অর্ডার করলে স্টক আসলে দেওয়া হবে", "warning", 5000);
      }, mode === 'non_variant' ? 2000 : 0);
      return () => clearTimeout(timer);
    }
  }, [isInStock, mode, selectedVariant, addToast]);

  const handleBulkCheckboxChange = (pVal: string) => {
    setVariantBulkState(prev => {
      const newState = { ...prev };
      if (newState[pVal] && (newState[pVal] as any).active) {
        newState[pVal] = { ...newState[pVal], active: false, selectedSize: null };
      } else {
        const isSingleOption = optionKeys.length === 1;
        const variant = isSingleOption ? parsedVariants.find(v => v.parsedOptions[primaryKey] === pVal) : null;

        newState[pVal] = {
          ...newState[pVal],
          active: true,
          quantity: (newState[pVal] as any)?.quantity || 1,
          selectedSize: isSingleOption ? 'SINGLE_OPTION' : null,
          price: variant ? variant.price : product.base_price,
          sku: variant ? variant.sku : product.sku,
          variantName: variant ? variant.name : null,
          variantId: variant ? variant.id : null,
        };

        // Update selectedImage if this primary value has a variant with an image
        const variantWithImg = parsedVariants.find(v => v.parsedOptions[primaryKey] === pVal && v.image_url);
        if (variantWithImg) {
          setSelectedImage(variantWithImg.image_url);
        }
      }
      return newState;
    });
  };

  const handleBulkSizeSelect = (pVal, sVal, price, sku, variantName, variantId, outOfStock) => {
    // Update selectedImage if this exact variant has an image
    const variantWithImg = parsedVariants.find(v => v.parsedOptions[primaryKey] === pVal && v.parsedOptions[secondaryKey] === sVal && v.image_url);
    if (variantWithImg) {
      setSelectedImage(variantWithImg.image_url);
    }

    setVariantBulkState(prev => {
      const isAlreadySelected = prev[pVal]?.selectedSize === sVal;

      if (isAlreadySelected) {
        // Toggle off
        return {
          ...prev,
          [pVal]: {
            ...prev[pVal],
            selectedSize: null,
            active: false
          }
        };
      }

      // Select new
      return {
        ...prev,
        [pVal]: {
          ...prev[pVal],
          selectedSize: sVal,
          price,
          sku,
          variantName,
          variantId,
          active: true,
          quantity: prev[pVal]?.quantity || 1
        }
      };
    });
  };

  const handleBulkQuantity = (pVal: string, delta: number) => {
    setVariantBulkState(prev => {
      const row = (prev[pVal] as any) || {};
      const current = row.quantity || 1;
      const next = Math.max(1, current + delta);

      let newRow = { ...row, quantity: next };

      // Auto-activate if not active
      if (!row.active) {
        const isSingleOption = optionKeys.length === 1;
        const variant = isSingleOption ? parsedVariants.find(v => v.parsedOptions[primaryKey] === pVal) : null;
        newRow = {
          ...newRow,
          active: true,
          selectedSize: isSingleOption ? 'SINGLE_OPTION' : null,
          price: variant ? variant.price : product.base_price,
          sku: variant ? variant.sku : product.sku,
          variantName: variant ? variant.name : null,
          variantId: variant ? variant.id : null,
        };

        const variantWithImg = parsedVariants.find(v => v.parsedOptions[primaryKey] === pVal && v.image_url);
        if (variantWithImg) setSelectedImage(variantWithImg.image_url);
      }

      return { ...prev, [pVal]: newRow };
    });
  };

  const getSelectedItems = () => {
    if (mode === 'variant_bulk_mode') {
      const items: any[] = [];
      let missingSize = false;

      Object.keys(variantBulkState).forEach(pVal => {
        const row = variantBulkState[pVal] as any;
        if (row.active) {
          if (!row.selectedSize) {
            missingSize = true;
          } else {
            const isSingleOption = optionKeys.length === 1;
            const variant = isSingleOption
              ? parsedVariants.find(v => v.parsedOptions[primaryKey] === pVal)
              : parsedVariants.find(v => v.parsedOptions[primaryKey] === pVal && v.parsedOptions[secondaryKey] === row.selectedSize);
            const vStock = variant ? (variant.is_unlimited_stock ? 9999 : variant.stock) : 0;
            const is_preorder = vStock <= 0;

            items.push({
              id: product.id,
              slug: product.slug,
              title: product.title,
              price: row.price,
              image: images[0],
              quantity: row.quantity,
              variantId: row.variantId,
              variantName: row.variantName,
              sku: row.sku || product.sku,
              is_preorder
            });
          }
        }
      });

      if (missingSize) {
        addToast(`Please select a ${secondaryKey || 'size'} for all checked options.`, "error");
        triggerShake();
        return null;
      }

      if (items.length === 0) {
        addToast(`Please select at least one row and ${secondaryKey || 'size'}.`, "error");
        triggerShake();
        return null;
      }
      return items;
    } else {
      if (mode === 'variant' && (!selectedVariant || Object.keys(selectedOptions).length !== optionKeys.length)) {
        addToast("Please select all options.", "error");
        triggerShake();
        return null;
      }
      if (mode === 'non_variant' && !selectedVariant) {
        addToast("Please select a variant.", "error");
        triggerShake();
        return null;
      }
      const vStock = selectedVariant ? (selectedVariant.is_unlimited_stock ? 9999 : selectedVariant.stock) : (product.is_unlimited_stock ? 9999 : product.stock);
      const is_preorder = vStock <= 0;

      return [{
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: displayPrice,
        image: (selectedVariant && selectedVariant.image_url) ? selectedVariant.image_url : images[0],
        quantity: quantity,
        variantId: selectedVariant ? selectedVariant.id : null,
        variantName: selectedVariant ? selectedVariant.name : null,
        sku: selectedVariant ? (selectedVariant.sku || product.sku) : product.sku,
        is_preorder
      }];
    }
  };

  const handleAddToCart = (e) => {
    const items = getSelectedItems();
    if (!items) return;

    if (items.some(item => item.is_preorder)) {
      addToast("এই প্রোডাক্টটি স্টকে নেই, অর্ডার করলে স্টক আসলে দেওয়া হবে", "warning", 5000);
    }

    // Trigger flying animation
    if (e && items.length > 0) {
      flyToCartAnimation(e, items[0].image);
    }

    pushAddToCart(items, "add_to_cart");
    items.forEach(item => {
      addToCartAction(item, item.quantity, item.variantName);
    });
    // const shortTitle = product.title.length > 25 ? product.title.substring(0, 25) + '...' : product.title;
    // addToast(`${shortTitle} added to cart!`); // Optional since we have animation
  };

  const handleBuyNow = () => {
    const items = getSelectedItems();
    if (!items) return;

    if (items.some(item => item.is_preorder)) {
      addToast("এই প্রোডাক্টটি স্টকে নেই, অর্ডার করলে স্টক আসলে দেওয়া হবে", "warning", 5000);
    }

    pushAddToCart(items, "buy_now");
    openCheckout('buy_now', items);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) {
      addToast("Please select a star rating.", "error");
      return;
    }
    if (!reviewName.trim()) {
      addToast("Please enter your name.", "error");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/v1/products/${product.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, reviewer_name: reviewName, review_body: reviewDesc }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Thank you for your review! It will be visible after moderation.");
        setIsReviewModalOpen(false);
        setReviewRating(0);
        setReviewDesc("");
        setReviewName("");
      } else {
        addToast(data.message || "Failed to submit review", "error");
      }
    } catch (err) {
      addToast("Error submitting review", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = product.title;
    let shareUrl = "";

    switch (platform) {
      case "copy":
        navigator.clipboard.writeText(url);
        addToast("Link copied to clipboard!");
        setIsShareModalOpen(false);
        return;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "messenger":
        shareUrl = `fb-messenger://share/?link=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "sms":
        shareUrl = `sms:?body=${encodeURIComponent(title + " " + url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  // Compute visual category breadcrumbs (Home > Product > Main Category > Sub Category)
  const visualBreadcrumbs: { name: string; url?: string; isStatic?: boolean; slug?: string }[] = (() => {
    const base: { name: string; url?: string; isStatic?: boolean; slug?: string }[] = [{ name: 'Products', url: '/product', isStatic: true }];
    if (product.breadcrumbs && Array.isArray(product.breadcrumbs) && product.breadcrumbs.length > 0) {
      return base.concat(product.breadcrumbs);
    }
    if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
      const crumbs: { name: string; slug: string }[] = [];
      const primary = product.categories[0];
      if (primary.parent_name && primary.parent_slug) {
        crumbs.push({ name: primary.parent_name, slug: primary.parent_slug });
      }
      crumbs.push({ name: primary.name, slug: primary.slug });
      return base.concat(crumbs);
    }
    if (product.category) {
      return base.concat([{
        name: product.category,
        slug: product.category.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-+|-+$/g, '')
      }]);
    }
    return base;
  })();

  return (
    <div className="product-page">
      <nav aria-label="Breadcrumb" className="breadcrumb-nav">
        <Link href="/" title="Home" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <i className="ph-fill ph-house"></i> Home
        </Link>
        {visualBreadcrumbs.map((crumb, idx) => (
          <Fragment key={idx}>
            <span className="breadcrumb-separator"><i className="ph-bold ph-caret-right"></i></span>
            <Link href={crumb.isStatic ? crumb.url : `/category/${crumb.slug}`}>{crumb.name}</Link>
          </Fragment>
        ))}
      </nav>

      <div className="product-layout">
        <div className="product-gallery" id="productGallery">
          <div className="splide pg-viewport product-gallery-viewport" id="productGallerySplide" ref={splideRef}>
            <div className="splide__track" style={{ height: '100%' }}>
              <ul className="splide__list" style={{ height: '100%' }}>
                {images.map((img, idx) => (
                  <li className="splide__slide" key={idx} style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div 
                      style={{
                        position: 'absolute',
                        inset: '-10%',
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(20px)',
                        opacity: 0.85,
                        zIndex: 0
                      }} 
                    />
                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} alt={`slide-${idx}`} />
                  </li>
                ))}
              </ul>
            </div>
            {hasMultiple && (
              <>
                <button
                  className="hero-nav-btn nav-prev"
                  type="button"
                  style={{ display: 'flex', zIndex: 100 }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); splideInstance.current?.go('<'); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="20" height="20"><path d="m15.5 0.932-4.3 4.38 14.5 14.6-14.5 14.5 4.3 4.4 14.6-14.6 4.4-4.3-4.4-4.4-14.6-14.6z" transform="matrix(-1 0 0 1 40 0)"></path></svg>
                </button>
                <button
                  className="hero-nav-btn nav-next"
                  type="button"
                  style={{ display: 'flex', zIndex: 100 }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); splideInstance.current?.go('>'); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="20" height="20"><path d="m15.5 0.932-4.3 4.38 14.5 14.6-14.5 14.5 4.3 4.4 14.6-14.6 4.4-4.3-4.4-4.4-14.6-14.6z"></path></svg>
                </button>
              </>
            )}

            <style dangerouslySetInnerHTML={{
              __html: `
                      #productGallerySplide:hover .hero-nav-btn { opacity: 1; }
                      #productGallerySplide .splide__pagination { bottom: 10px; z-index: 10; }
                      #productGallerySplide .splide__pagination__page { background: #cbd5e1; width: 8px; height: 8px; border-radius: 50%; margin: 0 4px; border: none; opacity: 1; transition: all 0.2s; }
                      #productGallerySplide .splide__pagination__page.is-active { background: var(--primary-color); transform: scale(1.2); }
                      @media (max-width: 767px) {
                          #productGallerySplide .hero-nav-btn { display: none !important; }
                      }
                    `}} />
          </div>
        </div>

        <div className="product-details">
          <h1 className="product-title">{product.title}</h1>

          <div className="product-meta-info" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            {(selectedVariant?.sku || product.sku) && <div className="meta-badge"><strong>SKU:</strong> {selectedVariant?.sku || product.sku}</div>}
            {product.brand && (
              <Link
                href={`/search?brand=${encodeURIComponent(product.brand)}`}
                className="meta-badge"
                style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                title={`View all ${product.brand} products`}
              >
                <strong>Brand:</strong> <span style={{ color: 'var(--primary-color, #059669)', fontWeight: 600 }}>{product.brand}</span>
              </Link>
            )}
            <div className={`stock-badge ${isInStock ? "in-stock" : "out-of-stock"}`} id="displayStock">
              {isInStock ? "✓ In Stock" : "✕ Out of Stock"}
            </div>
            {/* Inline rating badge — only if there are reviews */}
            {product.reviews && product.reviews.length > 0 && (() => {
              const avg = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
              return (
                <button
                  type="button"
                  onClick={() => document.querySelector('.daraz-review-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-color)', cursor: 'pointer', marginLeft: '4px' }}
                >
                  <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>★</span>
                  <span>{avg.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>({product.reviews.length})</span>
                </button>
              );
            })()}

            {/* WISHLIST BUTTON */}
            <button
              type="button"
              className={`product-share-trigger wishlist-btn-single ${isWished ? 'active' : ''}`}
              style={{ marginLeft: 'auto', width: '32px', height: '32px', fontSize: '1rem', flexShrink: 0, marginRight: '8px', color: isWished ? '#ef4444' : 'inherit' }}
              onClick={(e) => {
                if (!isWished) {
                  flyToIconAnimation(e, images[0], "wishlistIconTrigger");
                }
                toggleWishlist(product);
              }}
              title={isWished ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <i className={isWished ? "ph-fill ph-heart" : "ph-bold ph-heart"}></i>
            </button>

            <button type="button" className="product-share-trigger" style={{ width: '32px', height: '32px', fontSize: '1rem', flexShrink: 0 }} onClick={() => setIsShareModalOpen(true)} title="Share Product">
              <i className="ph-bold ph-share-network"></i>
            </button>
          </div>

          <div className="product-price-container">
            <div className="product-price">
              <span className="current-price" id="displayPrice">৳{formatPrice(displayPrice)}</span>
              {displayOrigPrice && (
                <>
                  <span className="original-price" id="displayOrigPrice" style={{ textDecoration: 'line-through', color: 'var(--text-light)' }}>৳{formatPrice(displayOrigPrice)}</span>
                  <span className="discount-badge" id="displayDiscount">{Math.round(((displayOrigPrice - displayPrice) / displayOrigPrice) * 100)}% OFF</span>
                </>
              )}
            </div>
          </div>

          {/* BULK MATRIX MODE */}
          {mode === 'variant_bulk_mode' && (
            <>
              <div className="form-group" style={{ marginTop: '1.5rem' }} id="variantsContainer">
                <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Select {primaryKey}{secondaryKey ? ` & ${secondaryKey}` : ''}</label>
                <div className="mv-combo-list" id="mvComboList">
                  {primaryValues.map(pVal => {
                    const isActive = (variantBulkState[pVal] as any)?.active;
                    const rowSelectedSize = (variantBulkState[pVal] as any)?.selectedSize;

                    return (
                      <div key={pVal} className={`mv-combo-row ${!isActive ? 'mv-row-inactive' : ''}`}>
                        <label className="mv-row-check-label">
                          <input
                            type="checkbox"
                            className="mv-custom-checkbox"
                            checked={!!isActive}
                            onChange={() => handleBulkCheckboxChange(pVal)}
                          />
                          <span className="mv-row-colour">{pVal}</span>
                        </label>

                        <div className="mv-size-group">
                          {secondaryValues.filter(sVal => parsedVariants.some(v => v.parsedOptions[primaryKey] === pVal && v.parsedOptions[secondaryKey] === sVal)).map(sVal => {
                            const variant = parsedVariants.find(v => v.parsedOptions[primaryKey] === pVal && v.parsedOptions[secondaryKey] === sVal);
                            const vPrice = variant ? variant.price : product.base_price;
                            const vStock = variant ? (variant.is_unlimited_stock ? 9999 : variant.stock) : 0;
                            const isOos = vStock <= 0;
                            const isSelected = rowSelectedSize === sVal;

                            return (
                              <span
                                key={sVal}
                                className={`mv-size-btn ${isOos ? 'mv-size-oos' : ''} ${isSelected ? 'selected' : ''}`}
                                style={isSelected ? { background: 'var(--primary-color)', color: '#fff', borderColor: 'var(--primary-color)' } : {}}
                                onClick={() => handleBulkSizeSelect(pVal, sVal, vPrice, variant?.sku, variant?.name, variant?.id, isOos)}
                              >
                                {sVal}
                              </span>
                            );
                          })}
                        </div>

                        <div className={`mv-qty-ctrl ${!isActive ? 'mv-qty-hidden' : ''}`}>
                          <button type="button" className="mv-btn mv-decrease" onClick={() => handleBulkQuantity(pVal, -1)}>-</button>
                          <input type="number" className="mv-qty-input" value={(variantBulkState[pVal] as any)?.quantity || 1} readOnly />
                          <button type="button" className="mv-btn mv-increase" onClick={() => handleBulkQuantity(pVal, 1)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BULK MODE SUMMARY */}
              <div className="bulk-summary-box" style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: 'var(--bg-light)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>
                  Total Selected: <span style={{ color: 'var(--primary-color)' }}>{(Object.values(variantBulkState) as any[]).filter(s => s.active && s.selectedSize).reduce((sum, s) => sum + (s.quantity || 1), 0)}</span> items
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                  ৳{formatPrice((Object.values(variantBulkState) as any[]).filter(s => s.active && s.selectedSize).reduce((sum, s) => sum + (s.price * (s.quantity || 1)), 0))}
                </div>
              </div>
            </>
          )}

          {/* SEPARATED MODE */}
          {mode === 'variant' && (
            <div className="form-group" style={{ marginTop: '1.5rem' }} id="variantsContainer">
              {optionKeys.map(key => (
                <div key={key} className="variant-option-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    {key}: <span className="selected-option-label" style={{ color: 'var(--text-color)', fontWeight: 700 }}>{selectedOptions[key]}</span>
                  </div>
                  <div className="variant-chip-list">
                    {groupedOptions[key].map(val => {
                      const isSelected = selectedOptions[key] === val;
                      // Check if this option combination is actually available
                      // A real implementation would filter dynamically, but for simplicity we show all unique options
                      const variant = parsedVariants.find(v => v.parsedOptions[key] === val);
                      const isOos = variant && !variant.is_unlimited_stock && variant.stock <= 0;

                      return (
                        <div
                          key={val}
                          className={`variant-chip option-btn ${isOos ? 'oos' : ''} ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedOptions(prev => ({ ...prev, [key]: val }));
                          }}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BASIC VARIANTS */}
          {mode === 'non_variant' && parsedVariants.length > 0 && (
            <div className="form-group" style={{ marginTop: '1.5rem' }} id="variantsContainer">
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.5rem' }}>Select Option:</div>
              <div className="variant-chip-list" id="variantSelector">
                {parsedVariants.map(variant => {
                  const available = variant.is_unlimited_stock || variant.stock > 0;
                  const active = selectedVariant?.id === variant.id;
                  return (
                    <div
                      key={variant.id}
                      className={`variant-chip ${!available ? 'oos' : ''} ${active ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedVariant(variant);
                        if (variant.image_url) setSelectedImage(variant.image_url);
                      }}
                    >
                      {variant.name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mode !== 'variant_bulk_mode' && (
            <div className="quantity-selector" id="mainQtySelector">
              <span>Quantity</span>
              <div className="quantity-controls">
                <button type="button" className="qty-btn" id="btnQtyMinus" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <input type="number" className="qty-input" id="inputQty" value={quantity} readOnly />
                <button type="button" className="qty-btn" id="btnQtyPlus" onClick={() => {
                  const max = isUnlimited ? 999 : stockLimit;
                  if (quantity < max) setQuantity(quantity + 1);
                }}>+</button>
              </div>
            </div>
          )}

          <div className="product-actions-grid">
            <button type="button" className="btn btn-secondary-blue" id="btnBuyNowPc" onClick={handleBuyNow}>
              {!isInStock ? "Pre Order" : "Buy Now"}
            </button>
            <button type="button" className="btn btn-primary-orange" id="btnAddToCartPc" onClick={(e) => handleAddToCart(e)}>
              <i className="ph-bold ph-shopping-cart" style={{ marginRight: '8px' }}></i> Add to Cart
            </button>
          </div>

          <div className="product-info-sections">
            <div className="info-section-row">
              <i className="ph-bold ph-truck info-section-icon"></i>
              <div className="info-section-content">
                <span className="info-section-label">Delivery</span>
                <span className="info-section-value">Inside Dhaka ৳70, Outside ৳120</span>
              </div>
            </div>
            <div className="info-section-row">
              <i className="ph-bold ph-money info-section-icon"></i>
              <div className="info-section-content">
                <span className="info-section-label">Payment</span>
                <span className="info-section-value">Cash on Delivery Available</span>
              </div>
            </div>
            <div className="info-section-row">
              <i className="ph-bold ph-arrow-u-up-left info-section-icon"></i>
              <div className="info-section-content">
                <span className="info-section-label">Return</span>
                <span className="info-section-value">7 Days Easy Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="product-description-container">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Product Details</h2>
        <div style={{ lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: product.description ? product.description.replace(/\n/g, "<br>") : "No description available." }}>
        </div>
      </div>

      {/* Daraz Style Reviews */}
      <div className="daraz-review-section daraz-review-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-light)', paddingBottom: '15px', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-color)', fontWeight: 700 }}>Ratings & Reviews</h2>
          <button type="button" onClick={() => setIsReviewModalOpen(true)} style={{ background: 'var(--primary-color)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', padding: '8px 16px', borderRadius: '4px', fontSize: '0.9rem', transition: 'background 0.2s' }} onMouseOver={(e) => (e.target as HTMLElement).style.background = 'color-mix(in srgb, var(--primary-color) 80%, black)'} onMouseOut={(e) => (e.target as HTMLElement).style.background = 'var(--primary-color)'}>Write a Review</button>
        </div>

        {(() => {
          const reviews = product.reviews || [];
          const totalRatings = reviews.length;
          const avgRating = totalRatings > 0 ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings : 0;

          const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          reviews.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) {
              starCounts[Math.floor(r.rating)]++;
            }
          });

          // No reviews — return null, header button is enough
          if (totalRatings === 0) {
            return null;
          }

          return (
            <div style={{ padding: '5px 0 15px 0', borderBottom: '1px solid var(--bg-light)', marginBottom: '15px' }}>
              <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                  <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                    <span style={{ fontSize: '3.5rem', fontWeight: 500, color: 'var(--text-color)', lineHeight: 1 }}>{avgRating.toFixed(1)}</span>
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginLeft: '2px' }}>/5</span>
                  </div>
                  <div style={{ color: '#f59e0b', fontSize: '1.25rem', letterSpacing: '2px', marginBottom: '6px' }}>
                    {'★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating))}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{totalRatings} Ratings</div>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = starCounts[star];
                    const percent = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        <div style={{ width: '40px', textAlign: 'right' }}>{star} Star</div>
                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-light)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '3px' }}></div>
                        </div>
                        <div style={{ width: '20px', textAlign: 'right' }}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {(!product.reviews || product.reviews.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            No reviews yet. Be the first!
          </div>
        ) : (
          <div className="review-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {product.reviews.slice(0, visibleReviewCount).map((r, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--bg-light)', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ color: '#f59e0b', fontSize: '1rem', marginBottom: '4px' }}>
                      {"\u2605".repeat(r.rating) + "\u2606".repeat(5 - r.rating)}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>
                      {r.reviewer_name}
                      {r.verified && <span style={{ color: '#10b981', fontSize: '0.75rem', marginLeft: '5px', fontWeight: 'normal' }}><i className="ph-fill ph-check-circle"></i> Verified Purchase</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-light)', lineHeight: 1.5 }}>{r.body || r.review_body}</div>
              </div>
            ))}

            {/* Show More / Show Less buttons */}
            {product.reviews.length > REVIEWS_PER_PAGE && (
              <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                {visibleReviewCount < product.reviews.length ? (
                  <button
                    type="button"
                    onClick={() => setVisibleReviewCount(v => v + REVIEWS_PER_PAGE)}
                    style={{
                      background: 'none',
                      border: '1.5px solid var(--primary-color)',
                      color: 'var(--primary-color)',
                      fontWeight: 600,
                      padding: '8px 22px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-color)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--primary-color)'; }}
                  >
                    See More Reviews ({product.reviews.length - visibleReviewCount} remaining)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVisibleReviewCount(REVIEWS_PER_PAGE)}
                    style={{
                      background: 'none',
                      border: '1.5px solid #d1d5db',
                      color: 'var(--text-light)',
                      fontWeight: 600,
                      padding: '8px 22px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    Show Less
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related Products Section */}
      <div className="related-products-section">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>You Might Also Like</h2>
        <div className="product-grid" id="relatedProductsGrid">
          {isLoadingRelated ? (
            Array(4).fill(0).map((_, idx) => (
              <div key={idx} className="product-card-skeleton" style={{ background: '#f0f0f0', borderRadius: '6px', height: '280px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
            ))
          ) : relatedProducts.length > 0 ? (
            relatedProducts.map((prod, index) => (
              <ProductCard
                key={prod.id}
                prod={prod}
                index={index}
                listName="Related Products"
              />
            ))
          ) : (
            <p style={{ textAlign: 'center', gridColumn: '1/-1', padding: '2rem', color: '#888' }}>No related products found.</p>
          )}
        </div>

        {hasMoreRelated && relatedProducts.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button
              className="btn"
              onClick={loadMoreRelated}
              disabled={isFetchingMoreRelated}
              style={{
                backgroundColor: "var(--primary-color, #E6007E)",
                color: "#ffffff",
                border: "none",
                borderRadius: "30px",
                padding: "12px 32px",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: isFetchingMoreRelated ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(230, 0, 126, 0.25)",
                transition: "all 0.2s ease",
                opacity: isFetchingMoreRelated ? 0.7 : 1
              }}
            >
              {isFetchingMoreRelated ? (
                <i className="ph-bold ph-spinner" style={{ animation: "spin 1s linear infinite" }}></i>
              ) : null}
              {isFetchingMoreRelated ? 'Loading...' : 'Load More Products'}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Sticky Footer */}
      {(!isCartOpen && !isCheckoutOpen) && (
        <div className="sticky-product-bar backdrop-blur-xl">
          <button type="button" className="sticky-btn sticky-buy" id="btnBuyNowMobile" onClick={handleBuyNow}>
            <i className="ph-bold ph-lightning"></i> {!isInStock ? "Pre Order" : "Buy Now"}
          </button>
          <button type="button" className="sticky-btn sticky-cart" id="btnAddToCartMobile" onClick={(e) => handleAddToCart(e)}>
            <i className="ph-bold ph-shopping-cart"></i> Add to Cart
          </button>
        </div>
      )}

      {isReviewModalOpen && (
        <div className="review-modal-overlay active" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10005, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="review-modal-box custom-modal-box">
            <div className="review-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Write a Review</h3>
              <button type="button" className="review-modal-close" onClick={() => setIsReviewModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>&times;</button>
            </div>
            <div className="review-modal-body">
              <form onSubmit={handleReviewSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Your Rating</label>
                  <div className="star-rating-input" id="starRatingInput" style={{ display: 'flex', gap: '5px', fontSize: '2rem', cursor: 'pointer' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setReviewRating(star)}
                        style={{ color: star <= reviewRating ? 'var(--star-gold, #FACA51)' : '#ddd', transition: 'color 0.2s' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Review Description</label>
                  <textarea className="modal-input" rows={4} placeholder="What did you like or dislike about this product?" value={reviewDesc} onChange={(e) => setReviewDesc(e.target.value)} style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontFamily: 'inherit' }}></textarea>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Your Name</label>
                  <input type="text" className="modal-input" placeholder="John Doe" value={reviewName} onChange={(e) => setReviewName(e.target.value)} style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontFamily: 'inherit' }} />
                </div>
                <button type="submit" className="btn btn-primary-orange" disabled={isSubmittingReview} style={{ width: '100%', padding: '0.9rem', background: 'var(--primary-color)', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Share Modal / Bottom Sheet */}
      <div className={`share-modal-overlay ${isShareModalOpen ? 'open' : ''}`} onClick={() => setIsShareModalOpen(false)}>
        <div className="share-modal-content" onClick={e => e.stopPropagation()}>
          <div className="share-modal-header">
            <h3>Share Product</h3>
            <button className="share-modal-close" onClick={() => setIsShareModalOpen(false)}><i className="ph-bold ph-x"></i></button>
          </div>
          <div className="share-grid">
            <button className="share-btn-item share-copy" onClick={() => handleShare('copy')}>
              <div className="share-icon-circle"><i className="ph-bold ph-copy" style={{ fontSize: '1.5rem' }}></i></div>
              <span>Copy Link</span>
            </button>
            <button className="share-btn-item share-fb" onClick={() => handleShare('facebook')}>
              <div className="share-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0C5.373 0 0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24V15.562H7.078V12.073H10.125V9.413C10.125 6.388 11.916 4.717 14.657 4.717C15.97 4.717 17.344 4.953 17.344 4.953V7.925H15.83C14.34 7.925 13.875 8.855 13.875 9.808V12.073H17.203L16.671 15.562H13.875V24C19.612 23.094 24 18.1 24 12.073Z" />
                </svg>
              </div>
              <span>Facebook</span>
            </button>
            <button className="share-btn-item share-msg" onClick={() => handleShare('messenger')}>
              <div className="share-icon-circle">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.373 0 0 5.076 0 11.341C0 14.869 1.701 18.005 4.385 19.986V24L8.337 21.841C9.508 22.164 10.732 22.341 12 22.341C18.627 22.341 24 17.265 24 11.001C24 4.736 18.627 0 12 0ZM13.313 14.64L10.355 11.488L4.611 14.64L10.916 7.828L13.874 10.981L19.389 7.828L13.313 14.64Z" />
                </svg>
              </div>
              <span>Messenger</span>
            </button>
            <button className="share-btn-item share-wa" onClick={() => handleShare('whatsapp')}>
              <div className="share-icon-circle">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.012 2.006c-5.506 0-9.982 4.478-9.982 9.984 0 1.761.458 3.483 1.332 5.004L2.013 22l5.14-1.349a9.948 9.948 0 004.859 1.258c5.503 0 9.98-4.476 9.98-9.983 0-5.504-4.477-9.92-9.98-9.92zm5.498 14.341c-.234.658-1.347 1.229-1.859 1.288-.475.053-1.092.175-3.528-.838-2.923-1.221-4.796-4.238-4.94-4.432-.143-.194-1.182-1.575-1.182-3.003 0-1.428.74-2.13 1.003-2.399.262-.269.571-.336.762-.336.19 0 .38.001.547.008.175.008.41-.067.643.504.238.583.785 1.921.857 2.064.07.144.119.313.023.504-.095.192-.142.313-.285.48-.143.167-.297.36-.428.496-.143.143-.292.3-.131.576.161.277.714 1.182 1.536 1.916 1.061.948 1.936 1.24 2.222 1.383.286.143.452.12.619-.047.167-.168.714-.833.905-1.12.191-.289.381-.24.643-.144.262.096 1.666.786 1.952.929.286.144.476.216.548.337.071.12.071.696-.163 1.354z" />
                </svg>
              </div>
              <span>WhatsApp</span>
            </button>
            <button className="share-btn-item share-tg" onClick={() => handleShare('telegram')}>
              <div className="share-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.666 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </div>
              <span>Telegram</span>
            </button>
            <button className="share-btn-item share-x" onClick={() => handleShare('twitter')}>
              <div className="share-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
              </div>
              <span>X (Twitter)</span>
            </button>
            <button className="share-btn-item share-sms" onClick={() => handleShare('sms')}>
              <div className="share-icon-circle"><i className="ph-bold ph-chat-text" style={{ fontSize: '1.5rem' }}></i></div>
              <span>SMS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
