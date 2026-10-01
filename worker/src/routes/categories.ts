import { Hono } from 'hono';
import { Env, Variables } from '../index';

export const categoryRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
export const adminCategoryRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── PUBLIC ROUTES ─────────────────────────────────────────────

// GET /api/v1/categories - Get all active categories
// Query: ?homepage=true → only show_on_homepage=1
categoryRoutes.get('/', async (c) => {
  try {
    const homepage = c.req.query('homepage');
    let sql = `SELECT * FROM categories WHERE is_active = 1`;
    if (homepage === 'true') {
      sql += ` AND show_on_homepage = 1`;
    }
    sql += ` ORDER BY sort_order ASC`;

    const { results } = await c.env.DB.prepare(sql).all();
    c.header('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return c.json({ success: true, data: results });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/v1/categories/:slug - Get a single category
categoryRoutes.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const category = await c.env.DB.prepare(
      `SELECT * FROM categories WHERE slug = ?`
    ).bind(slug).first();
    
    if (!category) return c.json({ success: false, message: 'Not found' }, 404);
    
    c.header('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return c.json({ success: true, data: category });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── ADMIN ROUTES ──────────────────────────────────────────────

// GET /api/v1/admin/categories - Get all categories (including inactive) with product counts
adminCategoryRoutes.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT c.*, 
              (SELECT COUNT(DISTINCT pc.product_id) FROM product_categories pc WHERE pc.category_id = c.id) AS product_count
       FROM categories c 
       ORDER BY c.sort_order ASC`
    ).all();
    return c.json({ success: true, data: results });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/v1/admin/categories - Create category
adminCategoryRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    
    await c.env.DB.prepare(
      `INSERT INTO categories (id, name, slug, parent_id, image_url, description, is_active, sort_order, show_on_homepage) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.name,
      body.slug,
      body.parent_id || null,
      body.image_url || '',
      body.description || '',
      body.is_active === undefined ? 1 : body.is_active,
      body.sort_order || 0,
      body.show_on_homepage ? 1 : 0
    ).run();
    
    return c.json({ success: true, message: 'Category created', id });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// PUT /api/v1/admin/categories/:id - Update category
adminCategoryRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    await c.env.DB.prepare(
      `UPDATE categories SET 
        name = ?, slug = ?, parent_id = ?, image_url = ?, description = ?, is_active = ?, sort_order = ?, show_on_homepage = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      body.name,
      body.slug,
      body.parent_id || null,
      body.image_url || '',
      body.description || '',
      body.is_active === undefined ? 1 : body.is_active,
      body.sort_order || 0,
      body.show_on_homepage ? 1 : 0,
      id
    ).run();
    
    return c.json({ success: true, message: 'Category updated' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// DELETE /api/v1/admin/categories/:id - Delete category
adminCategoryRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    // Also clean up product_categories links
    await c.env.DB.prepare(`DELETE FROM product_categories WHERE category_id = ?`).bind(id).run();
    await c.env.DB.prepare(`DELETE FROM categories WHERE id = ?`).bind(id).run();
    return c.json({ success: true, message: 'Category deleted' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// PATCH /api/v1/admin/categories/:id/toggle - Toggle specific boolean fields
adminCategoryRoutes.patch('/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id');
    const { field, value } = await c.req.json(); // field: 'is_active' | 'show_on_homepage', value: boolean
    
    if (field !== 'is_active' && field !== 'show_on_homepage') {
      return c.json({ success: false, message: 'Invalid field' }, 400);
    }

    await c.env.DB.prepare(
      `UPDATE categories SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(value ? 1 : 0, id).run();
    
    return c.json({ success: true, message: 'Category status toggled' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
