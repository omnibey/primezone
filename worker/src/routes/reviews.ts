// ============================================================
// Review Routes — Admin endpoints for reviews
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const reviewRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── ADMIN: List Reviews ──────────────────────────────────────
// GET /api/admin/reviews
reviewRoutes.get('/', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  try {
    const reviews = await c.env.DB.prepare(
      `SELECT r.id, p.slug as product_slug, r.rating, r.reviewer_name, r.body, r.verified, r.approved, r.created_at, p.title as product_title
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`
    ).all();

    return c.json({ success: true, data: reviews.results });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── ADMIN: Approve Review ────────────────────────────────────
// PUT /api/admin/reviews/:id/approve
reviewRoutes.put('/:id/approve', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = c.req.param('id');
  const body = await c.req.json();
  const approved = body.approved ? 1 : 0;

  try {
    const result = await c.env.DB.prepare(
      'UPDATE reviews SET approved = ? WHERE id = ?'
    ).bind(approved, id).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, message: 'Review not found' }, 404);
    }

    return c.json({ success: true, message: 'Review status updated' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── ADMIN: Delete Review ─────────────────────────────────────
// DELETE /api/admin/reviews/:id
reviewRoutes.delete('/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = c.req.param('id');

  try {
    const result = await c.env.DB.prepare(
      'DELETE FROM reviews WHERE id = ?'
    ).bind(id).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, message: 'Review not found' }, 404);
    }

    return c.json({ success: true, message: 'Review deleted successfully' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
