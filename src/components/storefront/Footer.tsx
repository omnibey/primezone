"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer({ initialSettings }) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState(initialSettings || null);

  // Only fetch settings if not provided by server (initialSettings)
  useEffect(() => {
    if (initialSettings && Object.keys(initialSettings).length > 0) return;
    fetch('/api/v1/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setSettings(data.data.settings);
        }
      })
      .catch(console.error);
  }, [initialSettings]);

  if (pathname === "/thank-you" || pathname === "/checkout") return null;

  const layout = settings?.layout || {};
  const footer = layout?.footer || settings?.footer || {};
  
  const logoUrl = layout?.logo_url || "";
  const phone = settings?.contact_phone || "";
  const whatsappNumber = settings?.whatsapp_number || phone || "";
  const email = settings?.contact_email || "";
  const address = settings?.store_address || "Dhaka, Bangladesh";
  const facebookUrl = footer?.facebook || "";
  const instagramUrl = footer?.instagram || "";
  const youtubeUrl = footer?.youtube || "";
  const tiktokUrl = footer?.tiktok || "";
  const copyright = footer?.copyright || layout?.store_name || "Store";

  const cleanWhatsapp = whatsappNumber ? String(whatsappNumber).replace(/[^0-9]/g, '') : '';
  const waUrl = cleanWhatsapp ? `https://wa.me/${cleanWhatsapp}` : '';

  return (
    <footer className="site-footer" id="siteFooter">
      {/* MAIN 4-COLUMN FOOTER GRID */}
      <div className="footer-main-section">
        <div className="footer-container">
          <div className="footer-grid-4col">
            
            {/* COL 1: Brand & Socials */}
            <div className="footer-col footer-col-brand">
              <div className="footer-brand-header">
                {logoUrl ? (
                  <img src={logoUrl} alt={`${layout?.store_name || "Store"} Logo`} className="footer-logo" />
                ) : (
                  <span className="footer-brand-title">{layout?.store_name || "Store"}</span>
                )}
              </div>
              <div 
                className="footer-about-text" 
                dangerouslySetInnerHTML={{ 
                  __html: footer?.about || `Your trusted destination for 100% authentic products. Quality products with guaranteed customer satisfaction.` 
                }}
              />
              
              {/* Clean Social Icons */}
              <div className="footer-social-row">
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Chat on WhatsApp" aria-label="WhatsApp">
                    <i className="ph-fill ph-whatsapp-logo"></i>
                  </a>
                )}
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Follow on Facebook" aria-label="Facebook">
                    <i className="ph-fill ph-facebook-logo"></i>
                  </a>
                )}
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Follow on Instagram" aria-label="Instagram">
                    <i className="ph-fill ph-instagram-logo"></i>
                  </a>
                )}
                {youtubeUrl && (
                  <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Subscribe on YouTube" aria-label="YouTube">
                    <i className="ph-fill ph-youtube-logo"></i>
                  </a>
                )}
                {tiktokUrl && (
                  <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Follow on TikTok" aria-label="TikTok">
                    <i className="ph-fill ph-tiktok-logo"></i>
                  </a>
                )}
                {!waUrl && !facebookUrl && !instagramUrl && (
                  <>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Facebook"><i className="ph-fill ph-facebook-logo"></i></a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Instagram"><i className="ph-fill ph-instagram-logo"></i></a>
                  </>
                )}
              </div>
            </div>

            {/* COL 2: Quick Explore (Dynamic from Admin) */}
            <div className="footer-col">
              <h3 className="footer-col-heading">Quick Explore</h3>
              <ul className="footer-nav-links">
                {footer?.explore_links && footer.explore_links.length > 0 ? (
                  footer.explore_links.map((link, idx) => (
                    <li key={idx}>
                      <Link href={link.url || '#'}>{link.title}</Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/category">All Categories</Link></li>
                    <li><Link href="/track-order">Track Your Order</Link></li>
                    <li><Link href="/wishlist">My Wishlist</Link></li>
                    <li><Link href="/#flash-sale">Special Offers</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* COL 3: Customer Care & Policies (Dynamic from Admin) */}
            <div className="footer-col">
              <h3 className="footer-col-heading">Customer Policies</h3>
              <ul className="footer-nav-links">
                {(footer?.policy_links && footer.policy_links.length > 0) || (footer?.links && footer.links.length > 0) ? (
                  (footer.policy_links || footer.links).map((link, idx) => (
                    <li key={idx}>
                      <Link href={link.url || '#'}>{link.title}</Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li><Link href="/refund">Return & Refund Policy</Link></li>
                    <li><Link href="/privacy">Privacy Policy</Link></li>
                    <li><Link href="/terms">Terms & Conditions</Link></li>
                    <li><Link href="/about">About Us</Link></li>
                    <li><Link href="/track-order">Help & Support</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* COL 4: Support & Helpline Card */}
            <div className="footer-col footer-col-support">
              <h3 className="footer-col-heading">Customer Helpline</h3>
              <div className="footer-support-box">
                {phone && (
                  <a href={`tel:${phone}`} className="support-action-item">
                    <div className="support-icon-wrap">
                      <i className="ph-bold ph-phone-call"></i>
                    </div>
                    <div className="support-info">
                      <span className="support-label">Direct Helpline</span>
                      <span className="support-value">{phone}</span>
                    </div>
                  </a>
                )}

                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="support-action-item support-action-whatsapp">
                    <div className="support-icon-wrap wa-icon">
                      <i className="ph-bold ph-whatsapp-logo"></i>
                    </div>
                    <div className="support-info">
                      <span className="support-label">WhatsApp Live Chat</span>
                      <span className="support-value">Instant Message</span>
                    </div>
                  </a>
                )}

                {email && (
                  <a href={`mailto:${email}`} className="support-action-item">
                    <div className="support-icon-wrap">
                      <i className="ph-bold ph-envelope-simple"></i>
                    </div>
                    <div className="support-info">
                      <span className="support-label">Support Email</span>
                      <span className="support-value">{email}</span>
                    </div>
                  </a>
                )}

                {address && (
                  <div className="support-action-item address-item">
                    <div className="support-icon-wrap">
                      <i className="ph-bold ph-map-pin"></i>
                    </div>
                    <div className="support-info">
                      <span className="support-label">Location / Address</span>
                      <span className="support-value">{address}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. FOOTER BOTTOM & PAYMENT BADGES */}
      <div className="footer-bottom-bar">
        <div className="footer-container footer-bottom-inner">
          <div className="footer-copyright-text">
            &copy; {currentYear} <strong>{copyright}</strong>. All Rights Reserved.
          </div>

          <div className="footer-payment-badges">
            <span className="payment-badge-label">Secured Payments:</span>
            <div className="payment-pills">
              <img src="/gateways/bkash.png" alt="bKash" />
              <img src="/gateways/nagad.svg" alt="Nagad" />
              <img src="/gateways/rocket.png" alt="Rocket" />
              <img src="/gateways/upay.svg" alt="Upay" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
