"use client";
import { siteConfig } from '@/config/site';

// Helpers
declare global {
  interface Window {
    __SERVER_TRACKING_ENABLED__?: boolean;
    dataLayer: any[];
  }
}

export const generateEventId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

export const getSessionId = () => {
    if (typeof window === 'undefined') return null;
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
        sessionId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
};

// Persistent Visitor ID — survives IP changes, stored in localStorage
export const getVisitorId = () => {
    if (typeof window === 'undefined') return null;
    let visitorId = localStorage.getItem('store_vid');
    if (!visitorId) {
        visitorId = crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substr(2, 9));
        localStorage.setItem('store_vid', visitorId);
    }
    return visitorId;
};

export const getDeviceType = () => {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
    return 'desktop';
};

export const getFBCookies = () => {
    if (typeof document === 'undefined') return { fbp: null, fbc: null };
    const cookies = document.cookie.split(';');
    let fbp = null, fbc = null;
    cookies.forEach(c => {
        const [key, value] = c.trim().split('=');
        if (key === '_fbp') fbp = value;
        if (key === '_fbc') fbc = value;
    });
    return { fbp, fbc };
};

export const getUTMParams = (): Record<string, string | null> => {
    if (typeof window === 'undefined') return {};
    
    // Check URL first
    const urlParams = new URLSearchParams(window.location.search);
    const utm = {
        fbclid: urlParams.get('fbclid'),
        gclid: urlParams.get('gclid'),
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_content: urlParams.get('utm_content'),
    };
    
    // Save to session if present
    let cachedString = sessionStorage.getItem('utm_params');
    let cached: Record<string, string | null> = cachedString ? JSON.parse(cachedString) : {};
    
    let updated = false;
    Object.keys(utm).forEach(key => {
        if (utm[key]) {
            cached[key] = utm[key];
            updated = true;
        }
    });
    
    if (updated) {
        sessionStorage.setItem('utm_params', JSON.stringify(cached));
    }
    return cached;
};

export const getLandingPage = () => {
    if (typeof window === 'undefined') return null;
    let lp = sessionStorage.getItem('landing_page');
    if (!lp) {
        lp = window.location.href;
        sessionStorage.setItem('landing_page', lp);
    }
    return lp;
};

export const hashValue = async (val) => {
    if (!val || typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) return val;
    try {
        const msgUint8 = new TextEncoder().encode(val.trim().toLowerCase());
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch(e) {
        return val;
    }
};

const buildCommonParams = (overrideUrl = null) => {
    const { fbp, fbc } = getFBCookies();
    const utms = getUTMParams();
    const currentUrl = overrideUrl || (typeof window !== 'undefined' ? window.location.href : '');
    
    return {
        event_id: generateEventId(),
        event_time: Math.floor(Date.now() / 1000),
        session_id: getSessionId(),
        device_type: getDeviceType(),
        page_url: currentUrl,
        page_location: currentUrl,
        event_source_url: currentUrl,
        page_referrer: typeof document !== 'undefined' ? document.referrer : '',
        page_title: typeof document !== 'undefined' ? document.title : '',
        landing_page: getLandingPage(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        fbp: fbp,
        fbc: fbc,
        fbclid: utms.fbclid,
        gclid: utms.gclid,
        utm_source: utms.utm_source,
        utm_medium: utms.utm_medium,
        utm_campaign: utms.utm_campaign,
        utm_content: utms.utm_content
    };
};

export const toGA4Item = (item, index = 0) => {
    return {
        item_id: String(item.id || item.product_id || item.item_id || item.sku || ''),
        item_name: item.title || item.product_name || item.item_name || '',
        item_brand: item.brand || item.item_brand || '',
        item_category: item.mapped_categories || item.category || item.item_category || 'General',
        price: Number(item.price || item.base_price || 0),
        quantity: Number(item.quantity || 1),
        item_variant: item.variantName || item.variant || item.item_variant || '',
        index: index
    };
};

const API_BASE = siteConfig.apiUrl;

// Server-Side CAPI Edge Dispatcher (Active unless explicitly disabled in Admin Marketing settings)
export const sendServerTrackingEvent = (obj: any) => {
    if (typeof window === 'undefined' || window.__SERVER_TRACKING_ENABLED__ === false) return;
    if (!obj || !obj.event || obj.event === 'ecommerce') return;
    try {
        const payload = {
            event_name: obj.event,
            event_id: obj.event_id || generateEventId(),
            event_time: obj.event_time || Math.floor(Date.now() / 1000),
            page_location: obj.page_location || obj.page_url || (typeof window !== 'undefined' ? window.location.href : ''),
            page_url: obj.page_url || obj.page_location || (typeof window !== 'undefined' ? window.location.href : ''),
            event_source_url: obj.event_source_url || obj.page_location || obj.page_url || (typeof window !== 'undefined' ? window.location.href : ''),
            page_title: obj.page_title || (typeof document !== 'undefined' ? document.title : ''),
            page_referrer: obj.page_referrer || (typeof document !== 'undefined' ? document.referrer : '') || '',
            landing_page: obj.landing_page || getLandingPage(),
            page_type: obj.page_type || undefined,
            user_agent: obj.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || undefined,
            session_id: obj.session_id || getSessionId(),
            device_type: obj.device_type || getDeviceType(),
            fbp: obj.fbp,
            fbc: obj.fbc,
            fbclid: obj.fbclid,
            gclid: obj.gclid,
            utm_source: obj.utm_source,
            utm_medium: obj.utm_medium,
            utm_campaign: obj.utm_campaign,
            utm_content: obj.utm_content,
            phone: obj.user_data?.phone_number || obj.user_properties?.phone_number || obj.customer_phone || obj.phone || undefined,
            email: obj.user_data?.email || obj.user_properties?.email || obj.customer_email || obj.email || undefined,
            first_name: obj.user_data?.first_name || obj.user_properties?.first_name || obj.customer_first_name || obj.firstName || undefined,
            last_name: obj.user_data?.last_name || obj.user_properties?.last_name || obj.customer_last_name || obj.lastName || undefined,
            city: obj.user_data?.city || obj.user_properties?.city || obj.customer_city || obj.city || undefined,
            address: obj.user_data?.address || obj.user_properties?.address || obj.customer_address || obj.address || undefined,
            country: obj.user_data?.country || obj.user_properties?.country || obj.customer_country || obj.country || 'bangladesh',
            internal_id: obj.user_data?.internal_id || obj.user_properties?.internal_id || undefined,
            currency: obj.ecommerce?.currency || 'BDT',
            value: typeof obj.ecommerce?.value === 'number' ? obj.ecommerce.value : (obj.cart_total || undefined),
            content_name: obj.content_name || obj.ecommerce?.items?.[0]?.item_name || undefined,
            content_category: obj.content_category || obj.ecommerce?.items?.[0]?.item_category || undefined,
            items: obj.ecommerce?.items || undefined,
            content_ids: obj.ecommerce?.items?.map(i => String(i.item_id || i.id || '')) || undefined,
            order_id: obj.ecommerce?.transaction_id || obj.order_id || undefined,
            payment_method: obj.payment_method || undefined,
            delivery_area: obj.delivery_area || undefined,
            order_status: obj.order_status || undefined,
            coupon: obj.ecommerce?.coupon || obj.coupon || undefined,
            discount: obj.ecommerce?.discount || obj.discount || undefined,
            shipping: obj.ecommerce?.shipping || obj.shipping || undefined,
            subtotal: obj.ecommerce?.subtotal || obj.subtotal || undefined,
            tax: obj.ecommerce?.tax || obj.tax || undefined,
            visitor_id: obj.visitor_id || getVisitorId(),
            search_string: obj.search_term || undefined,
            result_count: obj.result_count || undefined,
            contact_method: obj.contact_method || undefined
        };

        fetch(`${API_BASE}/tracking/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(() => {});
    } catch(e) {}
};

// Safe wrapper for dataLayer.push + Native Server CAPI Edge Dispatch
export const pushDataLayer = (obj: any) => {
    if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(obj);
        // Synchronously dispatch to Cloudflare Worker Server Tracking Hub
        if (obj && obj.event && obj.event !== 'ecommerce') {
            sendServerTrackingEvent(obj);
        }
    }
};

export const clearEcommerce = () => {
    if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ ecommerce: null });
    }
};

// --- Page Events ---

export const pushPageView = (pageType, overrideUrl = null, extra = {}) => {
    pushDataLayer({
        event: "page_view",
        ...buildCommonParams(overrideUrl),
        page_type: pageType,
        ...extra
    });
};

export const pushSearch = (term, resultCount, overrideUrl = null) => {
    pushDataLayer({
        event: "search",
        ...buildCommonParams(overrideUrl),
        search_term: term,
        result_count: resultCount
    });
};

// --- List Events ---

export const pushViewItemList = (products, listName, overrideUrl = null) => {
    if (!products || products.length === 0) return;
    clearEcommerce();
    pushDataLayer({
        event: "view_item_list",
        ...buildCommonParams(overrideUrl),
        ecommerce: {
            item_list_name: listName,
            items: products.map((p, i) => toGA4Item(p, i))
        }
    });
};

export const pushSelectItem = (product, listName, idx = 0, overrideUrl = null) => {
    clearEcommerce();
    pushDataLayer({
        event: "select_item",
        ...buildCommonParams(overrideUrl),
        ecommerce: {
            item_list_name: listName,
            items: [toGA4Item(product, idx)]
        }
    });
};

// --- Product Events ---

export const pushViewItem = (product, overrideUrl = null) => {
    clearEcommerce();
    const price = product.base_price || 0;
    const category = product.mapped_categories || product.category || 'General';
    pushDataLayer({
        event: "view_item",
        ...buildCommonParams(overrideUrl),
        content_name: product.title || product.product_name || '',
        content_category: category,
        ecommerce: {
            currency: "BDT",
            value: price,
            items: [toGA4Item(product)]
        },
        item_count: 1
    });
};

// --- Cart Events ---

export const pushAddToCart = (items, method = "add_to_cart", overrideUrl = null) => {
    clearEcommerce();
    const totalValue = items.reduce((sum, item) => sum + ((item.price || item.base_price || 0) * (item.quantity || 1)), 0);
    const mainItemName = items?.[0]?.title || items?.[0]?.product_name || items?.[0]?.item_name || '';
    const mainCategory = items?.[0]?.mapped_categories || items?.[0]?.category || items?.[0]?.item_category || 'General';
    pushDataLayer({
        event: "add_to_cart",
        ...buildCommonParams(overrideUrl),
        content_name: mainItemName,
        content_category: mainCategory,
        ecommerce: {
            currency: "BDT",
            value: totalValue,
            items: items.map((p, i) => toGA4Item(p, i))
        },
        add_method: method,
        buy_now_click: method === "buy_now",
        cart_total: totalValue,
        item_count: items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    });
};

export const pushRemoveFromCart = (item, overrideUrl = null) => {
    clearEcommerce();
    const mainCategory = item.mapped_categories || item.category || item.item_category || 'General';
    pushDataLayer({
        event: "remove_from_cart",
        ...buildCommonParams(overrideUrl),
        content_name: item.title || item.product_name || item.item_name || '',
        content_category: mainCategory,
        ecommerce: {
            currency: "BDT",
            value: (item.price || item.base_price || 0) * (item.quantity || 1),
            items: [toGA4Item(item)]
        }
    });
};

export const pushViewCart = (items, total, overrideUrl = null) => {
    clearEcommerce();
    const mainCategory = items?.[0]?.mapped_categories || items?.[0]?.category || items?.[0]?.item_category || 'General';
    pushDataLayer({
        event: "view_cart",
        ...buildCommonParams(overrideUrl),
        content_name: items?.[0]?.title || items?.[0]?.product_name || items?.[0]?.item_name || '',
        content_category: mainCategory,
        ecommerce: {
            currency: "BDT",
            value: total,
            items: items.map((p, i) => toGA4Item(p, i))
        },
        cart_total: total,
        item_count: items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    });
};

// --- Wishlist Events ---

export const pushAddToWishlist = (item, overrideUrl = null) => {
    clearEcommerce();
    const mainCategory = item.mapped_categories || item.category || item.item_category || 'General';
    pushDataLayer({
        event: "add_to_wishlist",
        ...buildCommonParams(overrideUrl),
        content_name: item.title || item.product_name || item.item_name || '',
        content_category: mainCategory,
        ecommerce: {
            currency: "BDT",
            value: item.price || item.base_price || 0,
            items: [toGA4Item(item)]
        }
    });
};

export const pushRemoveFromWishlist = (item, overrideUrl = null) => {
    clearEcommerce();
    const mainCategory = item.mapped_categories || item.category || item.item_category || 'General';
    pushDataLayer({
        event: "remove_from_wishlist",
        ...buildCommonParams(overrideUrl),
        content_name: item.title || item.product_name || item.item_name || '',
        content_category: mainCategory,
        ecommerce: {
            currency: "BDT",
            value: item.price || item.base_price || 0,
            items: [toGA4Item(item)]
        }
    });
};

// --- Checkout Events ---

export const pushBeginCheckout = (items, subtotal, source = "cart", overrideUrl = null) => {
    clearEcommerce();
    const mainItemName = items?.[0]?.title || items?.[0]?.product_name || items?.[0]?.item_name || '';
    const mainCategory = items?.[0]?.mapped_categories || items?.[0]?.category || items?.[0]?.item_category || 'General';
    pushDataLayer({
        event: "begin_checkout",
        ...buildCommonParams(overrideUrl),
        content_name: mainItemName,
        content_category: mainCategory,
        ecommerce: {
            currency: "BDT",
            value: subtotal,
            items: items.map((p, i) => toGA4Item(p, i)),
            subtotal: subtotal
        },
        checkout_step: 1,
        checkout_type: source,
        item_count: items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    });
};

export const pushAddShippingInfo = (items, shippingTier, fee, total, overrideUrl = null) => {
    clearEcommerce();
    const mainCategory = items?.[0]?.mapped_categories || items?.[0]?.category || items?.[0]?.item_category || 'General';
    pushDataLayer({
        event: "add_shipping_info",
        ...buildCommonParams(overrideUrl),
        content_name: items?.[0]?.title || items?.[0]?.product_name || items?.[0]?.item_name || '',
        content_category: mainCategory,
        ecommerce: {
            currency: "BDT",
            value: total,
            shipping: fee,
            items: items.map((p, i) => toGA4Item(p, i))
        },
        shipping_tier: shippingTier,
        checkout_step: 2
    });
};

export const pushAddPaymentInfo = (items, paymentType, total, overrideUrl = null) => {
    clearEcommerce();
    const mainItemName = items?.[0]?.title || items?.[0]?.product_name || items?.[0]?.item_name || '';
    const mainCategory = items?.[0]?.mapped_categories || items?.[0]?.category || items?.[0]?.item_category || 'General';
    pushDataLayer({
        event: "add_payment_info",
        ...buildCommonParams(overrideUrl),
        content_name: mainItemName,
        content_category: mainCategory,
        ecommerce: {
            currency: "BDT",
            value: total,
            items: items.map((p, i) => toGA4Item(p, i))
        },
        payment_method: paymentType,
        payment_type: paymentType,
        checkout_step: 3
    });
};

// --- Purchase Event ---

export const pushPurchase = async (orderData, items, total, subtotal, deliveryFee, paymentMethod, deliveryArea, user, overrideUrl = null) => {
    // Prevent duplicate purchase events
    if (typeof window !== 'undefined') {
        const dedupKey = `store_purchase_${orderData.order_id || orderData.id}`;
        if (sessionStorage.getItem(dedupKey)) {
            return; // Already fired
        }
        sessionStorage.setItem(dedupKey, 'true');
    }

    clearEcommerce();
    
    // Parse name
    let rawName = (user?.firstName || user?.name || '').trim();
    let parsedFirstName = undefined;
    let parsedLastName = undefined;
    if (rawName) {
        const parts = rawName.split(/\s+/);
        if (parts.length > 1) {
            parsedLastName = parts.pop();
            parsedFirstName = parts.join(' ');
        } else {
            parsedFirstName = rawName;
        }
    }

    // Hash user data
    const em = user?.email ? await hashValue(user.email) : undefined;
    const ph = user?.phone ? await hashValue(user.phone) : undefined;
    const fn = parsedFirstName ? await hashValue(parsedFirstName) : undefined;
    const ln = parsedLastName ? await hashValue(parsedLastName) : undefined;
    const ct = user?.city ? await hashValue(user.city) : undefined;

    const mainItemName = items?.[0]?.title || items?.[0]?.product_name || items?.[0]?.item_name || '';
    const mainCategory = items?.[0]?.mapped_categories || items?.[0]?.category || items?.[0]?.item_category || 'General';
    const orderId = orderData.order_id || orderData.id || '';
    const effectiveUrl = overrideUrl || (typeof window !== 'undefined'
        ? (window.location.pathname.includes('/thank-you') 
            ? window.location.href 
            : `${window.location.origin}/thank-you?order_id=${encodeURIComponent(orderId)}`)
        : '');

    pushDataLayer({
        event: "purchase",
        ...buildCommonParams(effectiveUrl),
        content_name: mainItemName,
        content_category: mainCategory,
        ecommerce: {
            currency: "BDT",
            value: total,
            transaction_id: orderId,
            items: items.map((p, i) => toGA4Item(p, i)),
            shipping: deliveryFee,
            subtotal: subtotal
        },
        payment_method: paymentMethod,
        delivery_area: deliveryArea,
        order_status: "confirmed",
        user_data: {
            email: user?.email,
            phone_number: user?.phone,
            first_name: parsedFirstName,
            last_name: parsedLastName,
            city: user?.city,
            address: user?.address,
            country: user?.country || "bangladesh",
            internal_id: orderData.order_id || orderData.id,
            em, ph, fn, ln, ct
        },
        user_properties: {
            email: user?.email,
            phone_number: user?.phone,
            first_name: parsedFirstName,
            last_name: parsedLastName,
            city: user?.city,
            address: user?.address,
            country: user?.country || "bangladesh",
            internal_id: orderData.order_id || orderData.id
        }
    });
};

export const pushTrackOrder = (phone, orderCount, overrideUrl = null) => {
    pushDataLayer({
        event: "track_order",
        ...buildCommonParams(overrideUrl),
        phone_last4: phone ? phone.slice(-4) : '',
        order_count: orderCount
    });
};

export const pushWhatsAppClick = (pageType = 'unknown', overrideUrl = null) => {
    pushDataLayer({
        event: "whatsapp_click",
        ...buildCommonParams(overrideUrl),
        contact_method: "whatsapp",
        page_type: pageType,
        page_location: overrideUrl || (typeof window !== 'undefined' ? window.location.href : ''),
        page_title: typeof document !== 'undefined' ? document.title : '',
    });
};
