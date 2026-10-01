"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import useStore from '@/store/useStore';
import LandingCheckout from '@/components/landing/LandingCheckout';

interface HtmlRendererProps {
  html: string;
  product: any;
  settings?: any;
}

export default function HtmlRenderer({ html, product, settings }: HtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<Element | null>(null);
  const [parsedHtml, setParsedHtml] = useState<string>("");

  const setCheckoutOpen = useStore((state: any) => state.setCheckoutOpen);
  const setCheckoutItems = useStore((state: any) => state.setCheckoutItems);
  const setCheckoutSource = useStore((state: any) => state.setCheckoutSource);

  // Parse HTML and replace shortcodes
  useEffect(() => {
    let processedHtml = html || "";
    
    if (product) {
      // Basic string replacements for product data
      processedHtml = processedHtml
        .replace(/{{product\.title}}/g, product.title || '')
        .replace(/{{product\.price}}/g, product.price || '')
        .replace(/{{product\.compare_at_price}}/g, product.compare_at_price || '')
        .replace(/{{product\.sku}}/g, product.sku || '')
        .replace(/{{product\.image}}/g, product.image || '')
        .replace(/{{product\.description}}/g, product.description || '');
    }
    
    setParsedHtml(processedHtml);
  }, [html, product]);

  // Handle mounting interactive widgets and event listeners after HTML is rendered
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // Attach Buy Now Button listeners
    const handleBuyNowClick = (e: Event) => {
      e.preventDefault();
      if (!product) return;
      
      setCheckoutItems([{
        ...product,
        quantity: 1,
        variantName: null
      }]);
      setCheckoutSource('buy_now');
      
      // Scroll to checkout — support both old and new ID
      const checkoutEl = document.getElementById('store-landing-checkout') 
        || document.getElementById('kothbel-landing-checkout');
      if (checkoutEl) checkoutEl.scrollIntoView({ behavior: 'smooth' });
    };
    
    const buyNowButtons = container.querySelectorAll('.store-buy-now');
    buyNowButtons.forEach(btn => {
      btn.addEventListener('click', handleBuyNowClick);
    });
    
    return () => {
      buyNowButtons.forEach(btn => {
        btn.removeEventListener('click', handleBuyNowClick);
      });
    };
  }, [parsedHtml, product, setCheckoutItems, setCheckoutSource]);

  // Pre-fill the checkout with the landing page product immediately
  useEffect(() => {
    if (product) {
       setCheckoutItems([{
         ...product,
         quantity: 1,
         variantName: null
       }]);
       setCheckoutSource('buy_now');
    }
  }, [product, setCheckoutItems, setCheckoutSource]);

  // Split HTML safely by checkout div — supports both 'store-landing-checkout' and legacy 'kothbel-landing-checkout'
  const CHECKOUT_IDS = ['store-landing-checkout', 'kothbel-landing-checkout'];
  let match: RegExpMatchArray | null = null;
  for (const cid of CHECKOUT_IDS) {
    const re = new RegExp(`<div[^>]*id=["']${cid}["'][^>]*>[\\s\\S]*?</div>`, 'i');
    match = parsedHtml.match(re);
    if (match) break;
  }

  if (match) {
    const parts = parsedHtml.split(match[0]);
    
    // Extract className if the AI generated any
    const classMatch = match[0].match(/class=["']([^"']+)["']/i);
    const className = classMatch ? classMatch[1] : "";

    return (
      <div ref={containerRef}>
        <div className="store-html-content" dangerouslySetInnerHTML={{ __html: parts[0] }} />
        <div id="store-landing-checkout" className={className}>
          <LandingCheckout initialSettings={settings} />
        </div>
        <div className="store-html-content" dangerouslySetInnerHTML={{ __html: parts.slice(1).join(match[0]) }} />
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <div className="store-html-content" dangerouslySetInnerHTML={{ __html: parsedHtml }} />
    </div>
  );
}
