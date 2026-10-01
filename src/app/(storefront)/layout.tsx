import Script from "next/script";
import "@phosphor-icons/web/regular";
import "@phosphor-icons/web/bold";
import "@phosphor-icons/web/fill";
import "./storefront.css";
import { siteConfig } from '@/config/site';

import { getSettings, getCategories } from "@/lib/api";
import HashManager from "@/components/common/HashManager";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import SearchOverlay from "@/components/storefront/SearchOverlay";
import FloatingWhatsApp from "@/components/storefront/FloatingWhatsApp";
import MobileNavDrawer from "@/components/storefront/MobileNavDrawer";
import CartDrawer from "@/components/storefront/CartDrawer";
import CheckoutUI from "@/components/common/CheckoutUI";
import ToastContainer from "@/components/common/ToastContainer";
import ProgressBar from "@/components/common/ProgressBar";
import { ThemeProvider } from "@/components/common/ThemeProvider";

export async function generateMetadata() {
  try {
    const settingsRes = await getSettings().catch(() => null);
    const settings = settingsRes?.data?.settings || settingsRes?.data || {};
    const layout = settings.layout || {};
    const storeName = layout.store_name || settings.store_name || "Store";
    
    const baseMetadata: any = {
      title: layout.seo_title || `${storeName}${layout.tagline ? ` - ${layout.tagline}` : ' - Online Shop'}`,
      description: layout.seo_description || layout.tagline || `Welcome to ${storeName}`,
    };

    if (layout.favicon_url) {
      baseMetadata.icons = {
        icon: layout.favicon_url,
        shortcut: layout.favicon_url,
        apple: layout.favicon_url,
      };
    }

    return baseMetadata;
  } catch (error) {
    return {
      title: "Store",
      description: "Welcome to our store",
    };
  }
}

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const [settingsRes, categoriesRes] = await Promise.all([
    getSettings().catch(() => null),
    getCategories().catch(() => null)
  ]);

  const initialSettings = settingsRes?.data?.settings || settingsRes?.data || {};
  const initialLogoUrl = initialSettings?.layout?.logo_url || "";
  const gtmId = initialSettings?.marketing?.ga4?.gtmContainerId || process.env.NEXT_PUBLIC_GTM_ID || "";
  const initialCategories = categoriesRes?.data || [];

  // Dynamic theme colors from admin settings
  const themeColor = initialSettings?.layout?.theme_color || '#ff6b35';
  const buyNowColor = initialSettings?.layout?.buy_now_color || '#06b6d4';
  const secondaryColor = initialSettings?.layout?.secondary_color || '#2e3440';

  // Dark mode specific colors (admin-configurable, with safe readable defaults)
  const darkPriceColor = initialSettings?.layout?.dark_price_color || '#e2e8f0';
  const darkAddCartColor = initialSettings?.layout?.dark_btn_add_cart || themeColor;
  const darkBuyNowColor = initialSettings?.layout?.dark_btn_buy_now || buyNowColor;

  const themeCSS = `
    :root {
      --primary-color: ${themeColor};
      --btn-add-cart: ${themeColor};
      --btn-add-cart-hover: color-mix(in srgb, ${themeColor} 85%, black);
      --flash-primary: ${themeColor};
      --flash-border: ${themeColor};
      --slider-color: ${themeColor};
      --btn-buy-now: ${buyNowColor};
      --btn-buy-now-hover: color-mix(in srgb, ${buyNowColor} 85%, black);
      --secondary-color: ${secondaryColor};
      --text-color: ${secondaryColor};
    }
    :root.dark {
      --price-color: ${darkPriceColor};
      --btn-add-cart: ${darkAddCartColor};
      --btn-add-cart-hover: color-mix(in srgb, ${darkAddCartColor} 85%, black);
      --btn-buy-now: ${darkBuyNowColor};
      --btn-buy-now-hover: color-mix(in srgb, ${darkBuyNowColor} 85%, black);
    }
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
          {/* Dynamic theme colors from admin settings */}
          <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
          <link rel="preconnect" href="https://unpkg.com" />
          <link rel="preconnect" href="https://cdn.jsdelivr.net" />
          <link rel="preconnect" href={siteConfig.apiUrl} />
          <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css" />
          <link rel="modelcontextprotocol" href="/api/v1/mcp" />
          <meta name="mcp-endpoint" content="/api/v1/mcp" />

          {/* GTM DataLayer Init & Consent Mode v2 (Default: Granted for COD sites) */}
          <Script id="gtm-init" strategy="beforeInteractive">
            {`
              window.__SERVER_TRACKING_ENABLED__ = ${Boolean(initialSettings?.marketing?.serverTracking)};
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'granted',
                'analytics_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
              });
            `}
          </Script>
          {/* GTM Script Loader */}
          {gtmId && (
            <Script
              id="gtm-script"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
            />
          )}

          {/* Custom Head Scripts */}
          {(initialSettings?.marketing?.customScripts?.filter((s: any) => s.enabled !== false && s.location === 'head').length > 0) ? (
            <head dangerouslySetInnerHTML={{ __html: initialSettings.marketing.customScripts.filter((s: any) => s.enabled !== false && s.location === 'head').map((s: any) => s.content).join('\n') }} suppressHydrationWarning />
          ) : initialSettings?.marketing?.custom_head_scripts ? (
            <head dangerouslySetInnerHTML={{ __html: initialSettings.marketing.custom_head_scripts }} suppressHydrationWarning />
          ) : null}
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
        {/* GTM NoScript Fallback */}
        {gtmId && (
          <noscript>
            <iframe 
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`} 
              height="0" 
              width="0" 
              style={{ display: "none", visibility: "hidden" }}
            ></iframe>
          </noscript>
        )}
        <HashManager />
        <SearchOverlay />
        <ProgressBar />
        <Header initialSettings={initialSettings} initialLogoUrl={initialLogoUrl} initialCategories={initialCategories} />
        <MobileNavDrawer initialSettings={initialSettings} />
        <CartDrawer />
        <CheckoutUI initialSettings={initialSettings} mode="drawer" />
        <ToastContainer />
        
        <main className="main-content" id="mainContent">
          {children}
        </main>
        
        <Footer initialSettings={initialSettings} />
        
        {/* GLOBAL WHATSAPP BUTTON */}
        <FloatingWhatsApp initialSettings={initialSettings} />
        
        {/* Custom Body Scripts */}
        {(initialSettings?.marketing?.customScripts?.filter((s: any) => s.enabled !== false && s.location === 'body').length > 0) ? (
          <div dangerouslySetInnerHTML={{ __html: initialSettings.marketing.customScripts.filter((s: any) => s.enabled !== false && s.location === 'body').map((s: any) => s.content).join('\n') }} suppressHydrationWarning />
        ) : initialSettings?.marketing?.custom_body_scripts ? (
          <div dangerouslySetInnerHTML={{ __html: initialSettings.marketing.custom_body_scripts }} suppressHydrationWarning />
        ) : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
