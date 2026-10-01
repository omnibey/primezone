// ============================================================
// Coupon Routes — Public validation + Admin CRUD
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const couponRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── PUBLIC: Validate Coupon ──────────────────────────────────
// GET /api/coupons/validate?code=X&amount=Y
couponRoutes.get('/validate', async (c) => {
  const code = (c.req.query('code') || '').trim().toUpperCase();
  const orderAmount = parseFloat(c.req.query('amount') || '0');

  if (!code) {
    return c.json({ success: false, message: 'Coupon code is required', code: 400 }, 400);
  }

  const coupon = await c.env.DB.prepare(
    'SELECT * FROM coupons WHERE code = ? AND active = 1'
  ).bind(code).first<{
    id: number;
    code: string;
    type: string;
    value: number;
    min_order: number;
    max_uses: number;
    used_count: number;
    expires_at: string | null;
  }>();

  if (!coupon) {
    return c.json({ success: false, message: 'Invalid coupon code', code: 404 }, 404);
  }

  // Check expiry
  if (coupon.expires_at) {
    const expiryDate = new Date(coupon.expires_at);
    if (new Date() > expiryDate) {
      return c.json({ success: false, message: 'This coupon has expired', code: 400 }, 400);
    }
  }

  // Check max uses
  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
    return c.json({ success: false, message: 'This coupon has reached its usage limit', code: 400 }, 400);
  }

  // Check minimum order amount
  if (coupon.min_order > 0 && orderAmount < coupon.min_order) {
    return c.json({
      success: false,
      message: `Minimum order amount is ৳${coupon.min_order}`,
      code: 400
    }, 400);
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.type === 'Fixed') {
    discountAmount = coupon.value;
  } else {
    // Percentage
    discountAmount = Math.round(orderAmount * coupon.value / 100);
  }

  // Don't exceed order amount
  if (discountAmount > orderAmount) discountAmount = orderAmount;

  return c.json({
    success: true,
    data: {
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount_amount: discountAmount,
      }
    }
  });
});

// ─── ADMIN: List Coupons ──────────────────────────────────────
// GET /api/admin/coupons
couponRoutes.get('/', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const result = await c.env.DB.prepare(
    'SELECT * FROM coupons ORDER BY created_at DESC'
  ).all();

  return c.json({ success: true, data: { coupons: result.results } });
});

// ─── ADMIN: Create Coupon ─────────────────────────────────────
// POST /api/admin/coupons
couponRoutes.post('/', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const body = await c.req.json();

  if (!body.code || !body.value) {
    return c.json({ success: false, message: 'Code and value are required', code: 400 }, 400);
  }

  const code = body.code.trim().toUpperCase();

  // Check uniqueness
  const existing = await c.env.DB.prepare(
    'SELECT id FROM coupons WHERE code = ?'
  ).bind(code).first();
  if (existing) {
    return c.json({ success: false, message: 'Coupon code already exists', code: 409 }, 409);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO coupons (code, type, value, min_order, max_uses, active, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    code,
    body.type || 'Fixed',
    body.value,
    body.min_order || 0,
    body.max_uses || 0,
    body.active !== false ? 1 : 0,
    body.expires_at || null
  ).run();

  return c.json({ success: true, data: { id: result.meta.last_row_id, code, message: 'Coupon created' } }, 201);
});

// ─── ADMIN: Update Coupon ─────────────────────────────────────
// PUT /api/admin/coupons/:id
couponRoutes.put('/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE coupons SET
      type = COALESCE(?, type),
      value = COALESCE(?, value),
      min_order = COALESCE(?, min_order),
      max_uses = COALESCE(?, max_uses),
      active = COALESCE(?, active),
      expires_at = ?
     WHERE id = ?`
  ).bind(
    body.type ?? null,
    body.value ?? null,
    body.min_order ?? null,
    body.max_uses ?? null,
    body.active !== undefined ? (body.active ? 1 : 0) : null,
    body.expires_at ?? null,
    id
  ).run();

  return c.json({ success: true, data: { message: 'Coupon updated' } });
});

// ─── ADMIN: Delete Coupon ─────────────────────────────────────
// DELETE /api/admin/coupons/:id
couponRoutes.delete('/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = parseInt(c.req.param('id'));
  await c.env.DB.prepare('DELETE FROM coupons WHERE id = ?').bind(id).run();

  return c.json({ success: true, data: { message: 'Coupon deleted' } });
});
