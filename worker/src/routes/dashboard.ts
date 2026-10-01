// ============================================================
// Dashboard Routes — Admin analytics stats
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const dashboardRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── ADMIN: Dashboard Stats ───────────────────────────────────
// GET /api/admin/dashboard
dashboardRoutes.get('/', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  try {
    // Total revenue (from Delivered orders)
    const revenueResult = await c.env.DB.prepare(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'Delivered'"
    ).first<{ total: number }>();

    // Total orders
    const totalOrdersResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM orders'
    ).first<{ total: number }>();

    // Pending orders
    const pendingResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM orders WHERE status = 'Pending'"
    ).first<{ total: number }>();

    // Processing orders
    const processingResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM orders WHERE status = 'Processing'"
    ).first<{ total: number }>();

    // Shipped orders
    const shippedResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM orders WHERE status = 'Shipped'"
    ).first<{ total: number }>();

    // Total products
    const productsResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM products WHERE status = 'active'"
    ).first<{ total: number }>();

    // Today's orders
    const today = new Date().toISOString().split('T')[0];
    const todayResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE created_at >= ?"
    ).bind(today).first<{ total: number; revenue: number }>();

    // Last 7 days revenue
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekResult = await c.env.DB.prepare(
      "SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status = 'Delivered' AND created_at >= ?"
    ).bind(weekAgo).first<{ revenue: number }>();

    // Recent orders (last 10)
    const recentOrders = await c.env.DB.prepare(
      `SELECT order_id, customer_name, total_amount, status, payment_method, created_at
       FROM orders ORDER BY created_at DESC LIMIT 10`
    ).all();

    // Orders by status breakdown
    const statusBreakdown = await c.env.DB.prepare(
      `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
    ).all();

    return c.json({
      success: true,
      data: {
        stats: {
          totalRevenue: revenueResult?.total || 0,
          totalOrders: totalOrdersResult?.total || 0,
          pendingOrders: pendingResult?.total || 0,
          processingOrders: processingResult?.total || 0,
          shippedOrders: shippedResult?.total || 0,
          totalProducts: productsResult?.total || 0,
          todayOrders: todayResult?.total || 0,
          todayRevenue: todayResult?.revenue || 0,
          weekRevenue: weekResult?.revenue || 0,
        },
        recentOrders: recentOrders.results,
        statusBreakdown: statusBreakdown.results,
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return c.json({ success: false, message: 'Failed to load dashboard', code: 500 }, 500);
  }
});
