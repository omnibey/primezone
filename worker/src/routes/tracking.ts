// ============================================================
// Tracking Routes — Multi-Platform Server-Side Tracking (CAPI)
// Handles Meta CAPI, TikTok Events API, and GA4 Measurement Protocol
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const trackingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Helpers: SHA256 Hashing ──────────────────────────────────
async function sha256(str: string): Promise<string> {
  if (!str) return '';
  const enc = new TextEncoder().encode(str.trim().toLowerCase());
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeBDPhone(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('01') && digits.length === 11) return '88' + digits;
  if (digits.length === 10 && digits.startsWith('1')) return '880' + digits;
  return digits;
}

// ─── Type Definitions ─────────────────────────────────────────
export interface MarketingConfig {
  disabledEvents?: string[];
  analytics?: {
    enabled?: boolean;
  };
  meta?: {
    enabled?: boolean;
    pixelId?: string;
    accessToken?: string;
    testEventCode?: string;
  };
  tiktok?: {
    enabled?: boolean;
    pixelId?: string;
    accessToken?: string;
    testEventCode?: string;
  };
  ga4?: {
    enabled?: boolean;
    measurementId?: string;
    apiSecret?: string;
    gtmContainerId?: string;
  };
}

// Record Daily Analytics Summary (Non-blocking UPSERT)
export async function recordAnalyticsSummary(db: any, payload: any, clientIp: string = '', clientUserAgent: string = ''): Promise<void> {
  try {
    const eventName = payload.event_name || payload.event || '';
    if (!eventName || eventName === 'ecommerce') return;

    // Bangladesh Date (UTC+6)
    const now = new Date();
    const bdTime = new Date(now.getTime() + 6 * 3600 * 1000);
    const dateStr = bdTime.toISOString().slice(0, 10); // YYYY-MM-DD

    // Detect Source
    let source = 'direct';
    const utmSource = (payload.utm_source || '').toLowerCase();
    const referrer = (payload.page_referrer || '').toLowerCase();
    if (payload.fbclid || utmSource.includes('fb') || utmSource.includes('facebook') || referrer.includes('facebook.com') || referrer.includes('instagram.com')) {
      source = 'facebook';
    } else if (utmSource.includes('tiktok') || referrer.includes('tiktok.com')) {
      source = 'tiktok';
    } else if (payload.gclid || utmSource.includes('google') || referrer.includes('google.com')) {
      source = 'google';
    } else if (utmSource.includes('youtube') || referrer.includes('youtube.com')) {
      source = 'youtube';
    } else if (utmSource) {
      source = utmSource.slice(0, 30);
    }

    // Determine event counter increments
    let isView = 0;
    let isProductView = 0;
    let isCartAdd = 0;
    let isCheckout = 0;
    let isOrder = 0;
    let revenue = 0;
    let isUnique = 0;

    if (eventName === 'page_view') {
      isView = 1;
      // Deduplicate unique visitors daily
      // Priority: visitor_id (localStorage UUID) > IP+UA fallback
      const visitorKey = payload.visitor_id
        ? `${dateStr}-vid-${payload.visitor_id}`
        : (clientIp ? `${dateStr}-${clientIp}-${clientUserAgent}` : null);

      if (visitorKey) {
        const visitorHash = await sha256(visitorKey);
        if (visitorHash) {
          try {
            const res = await db.prepare(
              "INSERT INTO daily_visitor_hashes (date, visitor_hash) VALUES (?, ?)"
            ).bind(dateStr, visitorHash).run();
            if (res.success) {
              isUnique = 1;
              // Lightweight pruning of old hashes (async background)
              db.prepare("DELETE FROM daily_visitor_hashes WHERE date < date('now', '-3 days')").run().catch(() => { });
            }
          } catch (e) {
            // Unique constraint violation -> Not a new visitor today
          }
        }
      }
    } else if (eventName === 'view_item') {
      isProductView = 1;
    } else if (eventName === 'add_to_cart') {
      isCartAdd = 1;
    } else if (eventName === 'begin_checkout' || eventName === 'add_payment_info') {
      isCheckout = 1;
    } else if (eventName === 'purchase') {
      isOrder = 1;
      revenue = Number(payload.value || payload.total_amount || 0);
    }

    // Atomic Daily UPSERT
    await db.prepare(`
      INSERT INTO analytics_summary (date, views, product_views, cart_adds, checkouts, orders, revenue, unique_visitors, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(date) DO UPDATE SET
        views = views + excluded.views,
        product_views = product_views + excluded.product_views,
        cart_adds = cart_adds + excluded.cart_adds,
        checkouts = checkouts + excluded.checkouts,
        orders = orders + excluded.orders,
        revenue = revenue + excluded.revenue,
        unique_visitors = unique_visitors + excluded.unique_visitors,
        updated_at = datetime('now')
    `).bind(dateStr, isView, isProductView, isCartAdd, isCheckout, isOrder, revenue, isUnique).run();

  } catch (err) {
    console.error('[Analytics Summary Error]:', err);
  }
}

// Map DataLayer / Standard Event Names to Meta Event Names
function mapToMetaEvent(name: string): string {
  const map: Record<string, string> = {
    'page_view': 'PageView',
    'view_item': 'ViewContent',
    'view_item_list': 'ViewItemList',
    'select_item': 'SelectItem',
    'add_to_cart': 'AddToCart',
    'view_cart': 'ViewCart',
    'remove_from_cart': 'CustomEvent',
    'add_to_wishlist': 'AddToWishlist',
    'begin_checkout': 'InitiateCheckout',
    'add_payment_info': 'AddPaymentInfo',
    'add_shipping_info': 'AddShippingInfo',
    'purchase': 'Purchase',
    'search': 'Search',
    'whatsapp_click': 'Contact',
    'track_order': 'CustomEvent'
  };
  return map[name] || name;
}

// Map to TikTok Event Names
function mapToTikTokEvent(name: string): string {
  const map: Record<string, string> = {
    'page_view': 'Pageview',
    'view_item': 'ViewContent',
    'view_item_list': 'ViewItemList',
    'add_to_cart': 'AddToCart',
    'add_to_wishlist': 'AddToWishlist',
    'begin_checkout': 'InitiateCheckout',
    'add_payment_info': 'AddPaymentInfo',
    'purchase': 'CompletePayment',
    'search': 'Search',
    'whatsapp_click': 'Contact'
  };
  return map[name] || name;
}

// Map to GA4 Measurement Protocol Event Names
function mapToGA4Event(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

// ─── Core Dispatcher Function ─────────────────────────────────
async function dispatchServerEvents(
  config: MarketingConfig,
  payload: any,
  clientIp: string,
  clientUserAgent: string
): Promise<{ meta?: any; tiktok?: any; ga4?: any }> {
  const results: { meta?: any; tiktok?: any; ga4?: any } = {};

  const eventName = payload.event_name || payload.event || 'page_view';

  // 🛑 Block event if it's disabled in the Admin UI config
  if (config.disabledEvents && Array.isArray(config.disabledEvents) && config.disabledEvents.includes(eventName)) {
    console.log(`[Tracking Blocked]: Event '${eventName}' is disabled in the Admin UI.`);
    return results;
  }

  const eventId = payload.event_id || crypto.randomUUID();
  const eventTime = payload.event_time || Math.floor(Date.now() / 1000);
  const pageUrl = payload.event_source_url || payload.page_location || payload.page_url || payload.url || '';

  // Normalize and hash user data
  let hashedPhone = '';
  if (payload.phone || payload.customer_phone) {
    hashedPhone = await sha256(normalizeBDPhone(payload.phone || payload.customer_phone));
  }

  let hashedEmail = '';
  if (payload.email || payload.customer_email) {
    hashedEmail = await sha256(payload.email || payload.customer_email);
  }

  let hashedFirstName = '';
  if (payload.first_name) {
    hashedFirstName = await sha256(payload.first_name);
  }

  let hashedLastName = '';
  if (payload.last_name) {
    hashedLastName = await sha256(payload.last_name);
  }

  let hashedCity = '';
  if (payload.city) {
    hashedCity = await sha256(payload.city);
  }

  let hashedCountry = '';
  if (payload.country) {
    hashedCountry = await sha256(payload.country);
  }

  let hashedInternalId = '';
  if (payload.internal_id || payload.order_id || payload.transaction_id) {
    hashedInternalId = await sha256(String(payload.internal_id || payload.order_id || payload.transaction_id));
  }

  const fbp = payload.fbp || undefined;
  const fbc = payload.fbc || undefined;

  // Build clean, strictly standard Meta CAPI & TikTok eCommerce custom_data
  const metaCustomData: Record<string, any> = {
    currency: payload.currency || (payload.ecommerce?.currency || 'BDT'),
    value: typeof payload.value === 'number' 
      ? payload.value 
      : (typeof payload.ecommerce?.value === 'number' ? payload.ecommerce.value : undefined),
    content_name: payload.content_name || payload.product_name || (payload.items?.[0]?.item_name || payload.items?.[0]?.title) || undefined,
    content_category: payload.content_category || payload.category || (payload.items?.[0]?.item_category || payload.items?.[0]?.category) || undefined,
    content_type: (payload.items?.length || payload.content_ids?.length || payload.content_name) ? 'product' : undefined,
    content_ids: payload.content_ids || (payload.items ? payload.items.map((i: any) => String(i.item_id || i.id || '')) : undefined),
    contents: payload.items ? payload.items.map((i: any) => ({
      id: String(i.item_id || i.id || ''),
      quantity: Number(i.quantity || 1),
      item_price: Number(i.price || 0)
    })) : undefined,
    num_items: payload.items ? payload.items.reduce((sum: number, i: any) => sum + Number(i.quantity || 1), 0) : (typeof payload.result_count === 'number' ? payload.result_count : undefined),
    search_string: payload.search_string || payload.search_term || undefined,
    order_id: payload.order_id || payload.transaction_id || payload.ecommerce?.transaction_id || undefined,
    payment_method: payload.payment_method || undefined,
    delivery_area: payload.delivery_area || undefined,
    shipping_cost: payload.shipping || payload.shipping_cost || payload.ecommerce?.shipping || undefined,
    subtotal: payload.subtotal || payload.ecommerce?.subtotal || undefined,
    tax: payload.tax || payload.ecommerce?.tax || undefined,
    coupon: payload.coupon || payload.ecommerce?.coupon || undefined,
    discount: payload.discount || payload.ecommerce?.discount || undefined,
    status: payload.order_status || payload.status || undefined,
    contact_method: payload.contact_method || undefined
  };

  // Clean undefined keys from metaCustomData
  Object.keys(metaCustomData).forEach(k => metaCustomData[k] === undefined && delete metaCustomData[k]);

  const dispatchPromises: Promise<void>[] = [];

  // 1. 🟣 Dispatch to Meta Conversions API
  const meta = config.meta;
  if (meta?.enabled && meta.pixelId && meta.accessToken) {
    const pixelId = meta.pixelId;
    const accessToken = meta.accessToken;
    const testEventCode = meta.testEventCode;

    const metaPromise = async () => {
      const metaEventName = mapToMetaEvent(eventName);
      const metaBody: any = {
        data: [
          {
            event_name: metaEventName,
            event_time: eventTime,
            event_id: eventId,
            event_source_url: pageUrl,
            action_source: 'website',
            user_data: {
              client_ip_address: clientIp || undefined,
              client_user_agent: payload.user_agent || clientUserAgent || undefined,
              fbp: fbp,
              fbc: fbc,
              ph: hashedPhone ? [hashedPhone] : undefined,
              em: hashedEmail ? [hashedEmail] : undefined,
              fn: hashedFirstName ? [hashedFirstName] : undefined,
              ln: hashedLastName ? [hashedLastName] : undefined,
              ct: hashedCity ? [hashedCity] : undefined,
              country: hashedCountry ? [hashedCountry] : undefined,
              external_id: hashedInternalId ? [hashedInternalId] : undefined
            },
            custom_data: Object.keys(metaCustomData).length > 0 ? metaCustomData : undefined,
            opt_out: false
          }
        ]
      };

      if (testEventCode) {
        metaBody.test_event_code = testEventCode;
      }

      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metaBody)
          }
        );
        const resJson = await metaRes.json();
        results.meta = { status: metaRes.status, response: resJson };
      } catch (err: any) {
        results.meta = { status: 500, error: err.message };
      }
    };
    dispatchPromises.push(metaPromise());
  }

  // 2. 🎵 Dispatch to TikTok Events API
  const tiktok = config.tiktok;
  if (tiktok?.enabled && tiktok.pixelId && tiktok.accessToken) {
    const pixelId = tiktok.pixelId;
    const accessToken = tiktok.accessToken;
    const testEventCode = tiktok.testEventCode;

    const tiktokPromise = async () => {
      const ttEventName = mapToTikTokEvent(eventName);
      const tiktokBody: any = {
        event_source: 'web',
        event_source_id: pixelId,
        data: [
          {
            event: ttEventName,
            event_time: eventTime,
            event_id: eventId,
            user: {
              ip: clientIp || undefined,
              user_agent: payload.user_agent || clientUserAgent || undefined,
              phone: hashedPhone || undefined,
              email: hashedEmail || undefined,
              external_id: hashedInternalId || undefined
            },
            properties: Object.keys(metaCustomData).length > 0 ? metaCustomData : undefined
          }
        ]
      };

      if (testEventCode) {
        tiktokBody.test_event_code = testEventCode;
      }

      try {
        const ttRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
          method: 'POST',
          headers: {
            'Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tiktokBody)
        });
        const resJson = await ttRes.json();
        results.tiktok = { status: ttRes.status, response: resJson };
      } catch (err: any) {
        results.tiktok = { status: 500, error: err.message };
      }
    };
    dispatchPromises.push(tiktokPromise());
  }

  // 3. 🔵 Dispatch to GA4 Measurement Protocol
  const ga4 = config.ga4;
  if (ga4?.enabled && ga4.measurementId && ga4.apiSecret) {
    const measurementId = ga4.measurementId;
    const apiSecret = ga4.apiSecret;

    const ga4Promise = async () => {
      const ga4EventName = mapToGA4Event(eventName);
      const ga4Params: Record<string, any> = {
        ...metaCustomData,
        session_id: payload.session_id || undefined,
        page_location: pageUrl,
        page_title: payload.page_title || undefined,
        page_referrer: payload.page_referrer || undefined,
        landing_page: payload.landing_page || undefined,
        device_type: payload.device_type || undefined,
        utm_source: payload.utm_source || undefined,
        utm_medium: payload.utm_medium || undefined,
        utm_campaign: payload.utm_campaign || undefined,
        utm_content: payload.utm_content || undefined,
        engagement_time_msec: 100
      };
      Object.keys(ga4Params).forEach(k => ga4Params[k] === undefined && delete ga4Params[k]);

      const ga4Body = {
        client_id: payload.session_id || eventId || 'client_anonymous',
        events: [
          {
            name: ga4EventName,
            params: ga4Params
          }
        ]
      };

      try {
        const ga4Res = await fetch(
          `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ga4Body)
          }
        );
        results.ga4 = { status: ga4Res.status, ok: ga4Res.ok };
      } catch (err: any) {
        results.ga4 = { status: 500, error: err.message };
      }
    };
    dispatchPromises.push(ga4Promise());
  }

  await Promise.allSettled(dispatchPromises);
  return results;
}

// ─── PUBLIC: Ingest Client DataLayer Event ────────────────────
// POST /api/v1/tracking/events
trackingRoutes.post('/events', async (c) => {
  try {
    const payload = await c.req.json();

    // Client Telemetry
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || c.req.header('x-forwarded-for') || '';
    const clientUserAgent = c.req.header('user-agent') || '';

    // Fetch marketing config from D1
    const settingRow = await c.env.DB.prepare(
      "SELECT value FROM store_settings WHERE key = 'marketing'"
    ).first<{ value: string }>();

    let config: MarketingConfig = {};
    if (settingRow && settingRow.value) {
      try {
        config = JSON.parse(settingRow.value);
      } catch (e) {
        console.warn('[Marketing Config Parse Error]:', e);
      }
    }

    // Fire-and-forget server dispatch & in-house analytics (don't block client response)
    c.executionCtx.waitUntil(
      (async () => {
        try {
          await dispatchServerEvents(config, payload, clientIp, clientUserAgent);
          if (config.analytics?.enabled !== false) {
            await recordAnalyticsSummary(c.env.DB, payload, clientIp, clientUserAgent);
          }
        } catch (dispatchErr) {
          console.error('[Async Dispatch / Analytics Error]:', dispatchErr);
        }
      })()
    );

    return c.json({ success: true, event_id: payload.event_id || null });
  } catch (error: any) {
    console.error('[Tracking Ingest Error]:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─── ADMIN: Live Diagnostic / Test Event Trigger ───────────────
// POST /api/v1/admin/tracking/test
trackingRoutes.post('/test', async (c) => {
  try {
    const adminId = c.get('adminId');
    if (!adminId) {
      return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);
    }

    const body = await c.req.json();
    const configOverride: MarketingConfig = body.config;

    const testPayload = {
      event_name: body.event_name || 'PageView',
      event_id: 'test_' + Date.now(),
      event_time: Math.floor(Date.now() / 1000),
      page_location: c.req.header('referer') || 'https://example.com/test',
      phone: '01700000000',
      email: 'test@example.com',
      currency: 'BDT',
      value: 1250,
      content_name: 'Test Product',
      items: [{ item_id: 'test_1', title: 'Test Item', price: 1250, quantity: 1 }]
    };

    const clientIp = c.req.header('cf-connecting-ip') || '103.230.104.1';
    const clientUserAgent = c.req.header('user-agent') || 'ServerTrackingTester/1.0';

    const results = await dispatchServerEvents(configOverride, testPayload, clientIp, clientUserAgent);

    return c.json({
      success: true,
      message: 'Test event dispatched',
      results
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
