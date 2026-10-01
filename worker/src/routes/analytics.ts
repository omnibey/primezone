// ============================================================
// Analytics Routes — In-House First-Party Daily Summary Analytics
// Ultra-lightweight aggregation from analytics_summary table
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';
import type { MarketingConfig } from './tracking';

export const analyticsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── ADMIN: Get Analytics Overview ────────────────────────────
// GET /api/v1/admin/analytics/overview?days=7
analyticsRoutes.get('/overview', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) {
    return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);
  }

  try {
    const daysParam = parseInt(c.req.query('days') || '7', 10);
    const days = Math.min(Math.max(isNaN(daysParam) ? 7 : daysParam, 1), 90);

    // Calculate start date (in BD Time UTC+6)
    const now = new Date();
    const startDateObj = new Date(now.getTime() + 6 * 3600 * 1000 - (days - 1) * 24 * 3600 * 1000);
    const startDateStr = startDateObj.toISOString().slice(0, 10);

    // Fetch daily rows from D1
    const rowsResult = await c.env.DB.prepare(`
      SELECT date, views, product_views, cart_adds, checkouts, orders, revenue, unique_visitors
      FROM analytics_summary
      WHERE date >= ?
      ORDER BY date ASC
    `).bind(startDateStr).all<{
      date: string;
      views: number;
      product_views: number;
      cart_adds: number;
      checkouts: number;
      orders: number;
      revenue: number;
      unique_visitors: number;
      updated_at: string;
    }>();

    const rows = rowsResult.results || [];

    // Aggregate totals
    let totalViews = 0;
    let totalProductViews = 0;
    let totalCartAdds = 0;
    let totalCheckouts = 0;
    let totalOrders = 0;
    let totalRevenue = 0;
    let totalUniqueVisitors = 0;

    for (const r of rows) {
      totalViews += r.views || 0;
      totalProductViews += r.product_views || 0;
      totalCartAdds += r.cart_adds || 0;
      totalCheckouts += r.checkouts || 0;
      totalOrders += r.orders || 0;
      totalRevenue += r.revenue || 0;
      totalUniqueVisitors += r.unique_visitors || 0;
    }

    const conversionRate = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(2) : '0.00';
    const uniqueConversionRate = totalUniqueVisitors > 0 ? ((totalOrders / totalUniqueVisitors) * 100).toFixed(2) : '0.00';
    const avgPagesPerVisitor = totalUniqueVisitors > 0 ? (totalViews / totalUniqueVisitors).toFixed(1) : '0.0';
    const cartToOrderRate = totalCartAdds > 0 ? ((totalOrders / totalCartAdds) * 100).toFixed(2) : '0.00';
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Check marketing settings for analytics toggle state
    const settingRow = await c.env.DB.prepare(
      "SELECT value FROM store_settings WHERE key = 'marketing'"
    ).first<{ value: string }>();

    let analyticsEnabled = true;
    if (settingRow?.value) {
      try {
        const parsed: MarketingConfig = JSON.parse(settingRow.value);
        if (parsed.analytics?.enabled === false) {
          analyticsEnabled = false;
        }
      } catch {}
    }

    return c.json({
      success: true,
      data: {
        enabled: analyticsEnabled,
        days,
        summary: {
          totalViews,
          totalProductViews,
          totalCartAdds,
          totalCheckouts,
          totalOrders,
          totalRevenue,
          totalUniqueVisitors,
          conversionRate: Number(conversionRate),
          uniqueConversionRate: Number(uniqueConversionRate),
          avgPagesPerVisitor: Number(avgPagesPerVisitor),
          cartToOrderRate: Number(cartToOrderRate),
          aov
        },
        funnel: [
          { stage: 'Page Views', count: totalViews, dropPercent: 0 },
          { stage: 'Product Views', count: totalProductViews, dropPercent: totalViews > 0 ? Math.round(((totalViews - totalProductViews) / totalViews) * 100) : 0 },
          { stage: 'Add to Cart', count: totalCartAdds, dropPercent: totalProductViews > 0 ? Math.round(((totalProductViews - totalCartAdds) / totalProductViews) * 100) : 0 },
          { stage: 'Checkouts', count: totalCheckouts, dropPercent: totalCartAdds > 0 ? Math.round(((totalCartAdds - totalCheckouts) / totalCartAdds) * 100) : 0 },
          { stage: 'Orders (Purchases)', count: totalOrders, dropPercent: totalCheckouts > 0 ? Math.round(((totalCheckouts - totalOrders) / totalCheckouts) * 100) : 0 }
        ],
        daily: rows
      }
    });
  } catch (error: any) {
    console.error('[Analytics Overview Error]:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─── ADMIN: Toggle In-House Analytics ON / OFF ────────────────
// POST /api/v1/admin/analytics/toggle
analyticsRoutes.post('/toggle', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) {
    return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);
  }

  try {
    const body = await c.req.json();
    const enable = Boolean(body.enabled);

    // Fetch existing marketing config
    const settingRow = await c.env.DB.prepare(
      "SELECT value FROM store_settings WHERE key = 'marketing'"
    ).first<{ value: string }>();

    let config: MarketingConfig = {};
    if (settingRow?.value) {
      try {
        config = JSON.parse(settingRow.value);
      } catch {}
    }

    if (!config.analytics) {
      config.analytics = {};
    }
    config.analytics.enabled = enable;

    // Save back to store_settings
    await c.env.DB.prepare(
      "INSERT INTO store_settings (key, value) VALUES ('marketing', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).bind(JSON.stringify(config)).run();

    return c.json({
      success: true,
      message: `In-House Analytics has been ${enable ? 'enabled' : 'disabled'}`,
      enabled: enable
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
