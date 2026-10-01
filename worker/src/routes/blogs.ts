import { Hono } from 'hono';
import { Env } from '../index';

export const publicBlogRoutes = new Hono<{ Bindings: Env }>();
export const adminBlogRoutes = new Hono<{ Bindings: Env }>();

// System reserved slugs to prevent collisions with essential eCommerce routes
export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'login',
  'dashboard',
  'cart',
  'checkout',
  'product',
  'category',
  'search',
  'track-order',
  'thank-you',
  'wishlist',
  'profile',
  'blog',
  'p',
  'auth',
  'orders',
  'users',
  'sitemap.xml',
  'robots.txt',
  'favicon.ico',
  'settings',
  'reviews',
  'tracking',
  'manifest.json'
]);

// Helper to normalize slugs
function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Shared Slug Check Logic
async function handleCheckSlug(c: any) {
  const { DB } = c.env;
  const rawSlug = c.req.param('slug');
  const excludeId = c.req.query('excludeId');
  const slug = normalizeSlug(rawSlug || '');

  if (!slug) {
    return c.json({ success: true, available: false, reason: 'empty', message: 'Slug cannot be empty' });
  }

  if (RESERVED_SLUGS.has(slug)) {
    return c.json({
      success: true,
      available: false,
      reason: 'reserved',
      message: `"${slug}" is a reserved system route (login, admin, cart, etc.) and cannot be used.`
    });
  }

  try {
    let query = `SELECT id, title FROM blogs WHERE slug = ?`;
    let params: any[] = [slug];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const existing: any = await DB.prepare(query).bind(...params).first();

    if (existing) {
      return c.json({
        success: true,
        available: false,
        reason: 'taken',
        existingTitle: existing.title,
        message: `Slug "${slug}" is already in use by "${existing.title}".`
      });
    }

    return c.json({
      success: true,
      available: true,
      slug,
      message: 'Slug is available!'
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
}

// --- PUBLIC ROUTES ---

// Check slug availability in real-time (Must be BEFORE /:slug)
publicBlogRoutes.get('/check-slug/:slug', handleCheckSlug);

// GET all blogs
publicBlogRoutes.get('/', async (c) => {
  const { DB } = c.env;
  try {
    const { results } = await DB.prepare(
      `SELECT id, slug, title, content, category, status, created_at, updated_at FROM blogs WHERE status = 'published' ORDER BY created_at DESC`
    ).all();
    c.header('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET single blog by slug
publicBlogRoutes.get('/:slug', async (c) => {
  const { DB } = c.env;
  const slug = c.req.param('slug');
  try {
    const blog = await DB.prepare(`SELECT * FROM blogs WHERE slug = ? AND status = 'published'`).bind(slug).first();
    if (!blog) return c.json({ success: false, error: 'Blog not found' }, 404);
    c.header('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return c.json({ success: true, data: blog });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});


// --- ADMIN ROUTES ---

// Check slug availability in real-time
adminBlogRoutes.get('/check-slug/:slug', handleCheckSlug);

// GET all blogs (including drafts)
adminBlogRoutes.get('/', async (c) => {
  const { DB } = c.env;
  try {
    const { results } = await DB.prepare(
      `SELECT id, slug, title, category, status, created_at, updated_at FROM blogs ORDER BY created_at DESC`
    ).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET single blog by id
adminBlogRoutes.get('/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  try {
    const blog = await DB.prepare(`SELECT * FROM blogs WHERE id = ?`).bind(id).first();
    if (!blog) return c.json({ success: false, error: 'Blog not found' }, 404);
    return c.json({ success: true, data: blog });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST new blog
adminBlogRoutes.post('/', async (c) => {
  const { DB } = c.env;
  try {
    const body = await c.req.json();
    let { slug, title, content, category = 'General', status = 'published' } = body;
    
    if (!slug || !title) return c.json({ success: false, error: 'Slug and title are required' }, 400);

    slug = normalizeSlug(slug);

    if (RESERVED_SLUGS.has(slug)) {
      return c.json({ success: false, error: `"${slug}" is a reserved system route. Please choose a different slug.` }, 400);
    }

    const existing = await DB.prepare(`SELECT id FROM blogs WHERE slug = ?`).bind(slug).first();
    if (existing) {
      return c.json({ success: false, error: `Slug "${slug}" already exists. Please choose a unique slug.` }, 400);
    }

    const { success } = await DB.prepare(
      `INSERT INTO blogs (slug, title, content, category, status) VALUES (?, ?, ?, ?, ?)`
    ).bind(slug, title, content || '', category || 'General', status).run();

    if (!success) throw new Error('Failed to create blog');
    
    return c.json({ success: true, message: 'Blog created successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT update blog
adminBlogRoutes.put('/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    let { slug, title, content, category, status } = body;
    
    if (!slug || !title) return c.json({ success: false, error: 'Slug and title are required' }, 400);

    slug = normalizeSlug(slug);

    if (RESERVED_SLUGS.has(slug)) {
      return c.json({ success: false, error: `"${slug}" is a reserved system route. Please choose a different slug.` }, 400);
    }

    const existing = await DB.prepare(`SELECT id FROM blogs WHERE slug = ? AND id != ?`).bind(slug, id).first();
    if (existing) {
      return c.json({ success: false, error: `Slug "${slug}" is already in use by another blog.` }, 400);
    }
    
    const { success } = await DB.prepare(
      `UPDATE blogs SET slug = ?, title = ?, content = ?, category = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(slug, title, content || '', category || 'General', status || 'published', id).run();

    if (!success) throw new Error('Failed to update blog');
    
    return c.json({ success: true, message: 'Blog updated successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE blog
adminBlogRoutes.delete('/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  try {
    const { success } = await DB.prepare(`DELETE FROM blogs WHERE id = ?`).bind(id).run();
    if (!success) throw new Error('Failed to delete blog');
    return c.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
