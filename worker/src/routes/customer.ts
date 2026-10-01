import { Hono } from 'hono';
import { customerAuthMiddleware } from './customerAuth';
import type { Env, Variables } from '../index';

export const customerRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// All customer routes require authentication
customerRoutes.use('*', customerAuthMiddleware);

// ─── GET /api/v1/customer/profile ─────────────────────────
customerRoutes.get('/profile', async (c) => {
  const customerId = c.get('customerId');
  
  try {
    const customer = await c.env.DB.prepare(
      'SELECT id, name, email, phone, created_at FROM customers WHERE id = ?'
    ).bind(customerId).first();

    if (!customer) {
      return c.json({ success: false, message: 'Customer not found', code: 404 }, 404);
    }

    // Fetch addresses
    const addresses = await c.env.DB.prepare(
      'SELECT * FROM customer_addresses WHERE customer_id = ?'
    ).bind(customerId).all();

    // Fetch order history
    const orders = await c.env.DB.prepare(
      'SELECT id, total_amount, status, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC'
    ).bind(customerId).all();

    // Fetch digital downloads
    // Join order_downloads with digital_assets and products
    const downloads = await c.env.DB.prepare(`
      SELECT 
        od.token, od.downloads_count, od.download_limit, od.created_at,
        da.name as asset_name, p.title as product_title, p.slug as product_slug, p.images
      FROM order_downloads od
      JOIN digital_assets da ON od.digital_asset_id = da.id
      JOIN products p ON da.product_id = p.id
      JOIN orders o ON od.order_id = o.id
      WHERE o.customer_id = ?
      ORDER BY od.created_at DESC
    `).bind(customerId).all();

    return c.json({
      success: true,
      data: {
        customer,
        addresses: addresses.results,
        orders: orders.results,
        downloads: downloads.results,
      }
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return c.json({ success: false, message: 'Failed to fetch profile', code: 500 }, 500);
  }
});

// ─── POST /api/v1/customer/addresses ─────────────────────────
customerRoutes.post('/addresses', async (c) => {
  const customerId = c.get('customerId');
  try {
    const body = await c.req.json<{ name: string; phone: string; street: string; city: string; postal_code?: string; is_default?: boolean }>();
    
    // If setting as default, remove default from others
    if (body.is_default) {
      await c.env.DB.prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?').bind(customerId).run();
    }

    await c.env.DB.prepare(`
      INSERT INTO customer_addresses (customer_id, name, phone, street, city, postal_code, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      customerId, body.name, body.phone, body.street, body.city, body.postal_code || null, body.is_default ? 1 : 0
    ).run();

    return c.json({ success: true, message: 'Address added' });
  } catch (err) {
    return c.json({ success: false, message: 'Failed to add address', code: 500 }, 500);
  }
});
