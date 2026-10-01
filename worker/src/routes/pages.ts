import { Hono } from 'hono';
import { Env } from '../index';

export const publicPageRoutes = new Hono<{ Bindings: Env }>();
export const adminPageRoutes = new Hono<{ Bindings: Env }>();

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
    let query = `SELECT id, title FROM pages WHERE slug = ?`;
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
publicPageRoutes.get('/check-slug/:slug', handleCheckSlug);

// GET all pages
publicPageRoutes.get('/', async (c) => {
  const { DB } = c.env;
  try {
    const { results } = await DB.prepare(
      `SELECT id, slug, title, content, status, created_at, updated_at FROM pages WHERE status = 'published' ORDER BY created_at DESC`
    ).all();
    c.header('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET single page by slug
publicPageRoutes.get('/:slug', async (c) => {
  const { DB } = c.env;
  const slug = c.req.param('slug');
  try {
    const page = await DB.prepare(`SELECT * FROM pages WHERE slug = ? AND status = 'published'`).bind(slug).first();
    if (!page) return c.json({ success: false, error: 'Page not found' }, 404);
    c.header('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return c.json({ success: true, data: page });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});


// --- ADMIN ROUTES ---

// Check slug availability in real-time
adminPageRoutes.get('/check-slug/:slug', handleCheckSlug);

// GET all pages (including drafts)
adminPageRoutes.get('/', async (c) => {
  const { DB } = c.env;
  try {
    const { results } = await DB.prepare(
      `SELECT id, slug, title, status, created_at, updated_at FROM pages ORDER BY created_at DESC`
    ).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET single page by id
adminPageRoutes.get('/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  try {
    const page = await DB.prepare(`SELECT * FROM pages WHERE id = ?`).bind(id).first();
    if (!page) return c.json({ success: false, error: 'Page not found' }, 404);
    return c.json({ success: true, data: page });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST new page
adminPageRoutes.post('/', async (c) => {
  const { DB } = c.env;
  try {
    const body = await c.req.json();
    let { slug, title, content, status = 'published' } = body;
    
    if (!slug || !title) return c.json({ success: false, error: 'Slug and title are required' }, 400);

    slug = normalizeSlug(slug);

    if (RESERVED_SLUGS.has(slug)) {
      return c.json({ success: false, error: `"${slug}" is a reserved system route. Please choose a different slug.` }, 400);
    }

    const existing = await DB.prepare(`SELECT id FROM pages WHERE slug = ?`).bind(slug).first();
    if (existing) {
      return c.json({ success: false, error: `Slug "${slug}" already exists. Please choose a unique slug.` }, 400);
    }

    const { success } = await DB.prepare(
      `INSERT INTO pages (slug, title, content, status) VALUES (?, ?, ?, ?)`
    ).bind(slug, title, content || '', status).run();

    if (!success) throw new Error('Failed to create page');
    
    return c.json({ success: true, message: 'Page created successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT update page
adminPageRoutes.put('/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    let { slug, title, content, status } = body;
    
    if (!slug || !title) return c.json({ success: false, error: 'Slug and title are required' }, 400);

    slug = normalizeSlug(slug);

    if (RESERVED_SLUGS.has(slug)) {
      return c.json({ success: false, error: `"${slug}" is a reserved system route. Please choose a different slug.` }, 400);
    }

    const existing = await DB.prepare(`SELECT id FROM pages WHERE slug = ? AND id != ?`).bind(slug, id).first();
    if (existing) {
      return c.json({ success: false, error: `Slug "${slug}" is already in use by another page.` }, 400);
    }
    
    const { success } = await DB.prepare(
      `UPDATE pages SET slug = ?, title = ?, content = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(slug, title, content || '', status || 'published', id).run();

    if (!success) throw new Error('Failed to update page');
    
    return c.json({ success: true, message: 'Page updated successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE page
adminPageRoutes.delete('/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  try {
    const { success } = await DB.prepare(`DELETE FROM pages WHERE id = ?`).bind(id).run();
    if (!success) throw new Error('Failed to delete page');
    return c.json({ success: true, message: 'Page deleted successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
