"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Splide from "@splidejs/splide";

export default function HeroSlider({ banners = [] }) {
  const sliderRef = useRef(null);
  const splideInstance = useRef(null);

  useEffect(() => {
    if (banners.length > 0 && sliderRef.current) {
      if (splideInstance.current) {
        splideInstance.current.destroy();
      }
      splideInstance.current = new Splide(sliderRef.current, {
        type: 'loop',
        autoplay: true,
        interval: 4000,
        speed: 800,
        arrows: true,
        pagination: true,
        pauseOnHover: true,
        flickMaxPages: 1, // Max 1 page per swipe
      }).mount();
    }
    
    return () => {
      if (splideInstance.current) {
        splideInstance.current.destroy();
      }
    };
  }, [banners]);

  // ── Custom Wheel Logic ──
  const wheelAccum = useRef(0);
  const wheelCooldown = useRef(false);

  useEffect(() => {
    const sliderEl = sliderRef.current as HTMLElement | null;
    if (!sliderEl) return;

    const handleWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (delta === 0) return;

      e.preventDefault();

      if (wheelCooldown.current) {
        wheelAccum.current = 0; // Ignore inertia during cooldown
        return;
      }

      wheelAccum.current += delta;

      if (Math.abs(wheelAccum.current) >= 120) {
        const direction = wheelAccum.current > 0 ? 1 : -1;
        
        if (splideInstance.current) {
          if (direction === 1) (splideInstance.current as any).go('>');
          else (splideInstance.current as any).go('<');
        }

        wheelAccum.current = 0;
        wheelCooldown.current = true;

        setTimeout(() => {
          wheelCooldown.current = false;
        }, 400);
      }
    };

    sliderEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      sliderEl.removeEventListener('wheel', handleWheel);
    };
  }, []);

  if (!banners || banners.length === 0) return null;

  const hasMobileBanner = banners.some((b: any) => b.mobile_image_url || b.mobile_image);

  return (
    <div id="homeHeroBanner" className={hasMobileBanner ? 'has-mobile-banners' : ''}>
      <div className="container">
        <div className="hero-wrapper-full" style={{ width: '100%', display: 'block', marginTop: '10px', marginBottom: '25px' }}>
            <div 
              ref={sliderRef}
              className="splide hero-viewport hero-slider-container" 
              id="bannerSlider" 
              style={{ borderRadius: 'var(--slider-radius)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', margin: '0 auto' }}
            >
                <div className="splide__track" style={{ height: '100%' }}>
                    <ul className="splide__list" style={{ height: '100%' }}>
                        {banners.map((banner, index) => (
                          <li key={index} className="splide__slide" style={{ height: '100%' }}>
                              <Link href={banner.url || banner.link || '#'} style={{ display: 'block', height: '100%' }}>
                                  <picture style={{ display: 'block', height: '100%' }}>
                                      <source media="(max-width: 768px)" srcSet={banner.mobile_image_url || banner.mobile_image || banner.image_url || banner.image} />
                                      <source media="(min-width: 769px)" srcSet={banner.image_url || banner.image} />
                                      <img src={banner.image_url || banner.image} alt={`Banner ${index}`} className="banner-img" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                                  </picture>
                              </Link>
                          </li>
                        ))}
                    </ul>
                </div>
                <div className="splide__arrows">
                    <button className="splide__arrow splide__arrow--prev hero-nav-btn nav-prev" style={{ opacity: 1, display: 'flex' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="24" height="24"><path d="m15.5 0.932-4.3 4.38 14.5 14.6-14.5 14.5 4.3 4.4 14.6-14.6 4.4-4.3-4.4-4.4-14.6-14.6z" transform="matrix(-1 0 0 1 40 0)"></path></svg>
                    </button>
                    <button className="splide__arrow splide__arrow--next hero-nav-btn nav-next" style={{ opacity: 1, display: 'flex' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="24" height="24"><path d="m15.5 0.932-4.3 4.38 14.5 14.6-14.5 14.5 4.3 4.4 14.6-14.6 4.4-4.3-4.4-4.4-14.6-14.6z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
