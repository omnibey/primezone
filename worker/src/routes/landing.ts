import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const publicLandingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
export const adminLandingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================
// PUBLIC ROUTES
// ============================================================

// GET /api/v1/landing/:slug
// Fetch standalone landing page by slug
publicLandingRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  try {
    // Fetch landing page
    const landing = await c.env.DB.prepare(
      `SELECT * FROM landing_pages WHERE slug = ?`
    ).bind(slug).first();

    if (!landing) {
      return c.json({ success: false, message: 'Landing page not found', code: 404 }, 404);
    }

    if (!landing.is_active) {
      return c.json({ success: false, message: 'Landing page is inactive', code: 403 }, 403);
    }

    // If it's linked to a product, fetch the live product data to override
    if (landing.linked_product_id) {
      const liveProduct = await c.env.DB.prepare(
        `SELECT stock, is_unlimited_stock, is_variant_bulk_mode, requires_shipping 
         FROM products WHERE id = ?`
      ).bind(landing.linked_product_id).first();
      
      if (liveProduct) {
        // ONLY sync stock and shipping config, do not overwrite the landing page's custom base_price or original_price
        landing.stock = liveProduct.stock;
        landing.is_unlimited_stock = liveProduct.is_unlimited_stock;
        landing.is_variant_bulk_mode = liveProduct.is_variant_bulk_mode;
        landing.requires_shipping = liveProduct.requires_shipping;
      }
    }

    // Fetch Digital Assets
    let digitalAssets: any[] = [];
    if (landing.requires_shipping === 0) {
      // If linked, fetch from standard product, else fetch from landing page
      if (landing.linked_product_id) {
        const assetsResult = await c.env.DB.prepare(`SELECT * FROM digital_assets WHERE product_id = ?`).bind(landing.linked_product_id).all();
        digitalAssets = assetsResult.results;
      } else {
        const assetsResult = await c.env.DB.prepare(`SELECT * FROM digital_assets WHERE landing_id = ?`).bind(landing.id).all();
        digitalAssets = assetsResult.results;
      }
    }

    // Fetch variants
    const variants = await c.env.DB.prepare(
      `SELECT * FROM landing_page_variants WHERE landing_page_id = ? ORDER BY sort_order ASC`
    ).bind(landing.id).all();

    // Parse JSON
    let images = [];
    let settings = {};
    let category = [];
    try { images = JSON.parse(landing.images as string || '[]'); } catch {}
    let sections: string = landing.sections as string || '';
    try { settings = JSON.parse(landing.settings as string || '{}'); } catch {}
    try { category = JSON.parse(landing.category as string || '[]'); } catch {
      category = typeof landing.category === 'string' && landing.category ? [landing.category] : [];
    }

    const parsedVariants = await Promise.all(variants.results.map(async (v) => {
      let options = {};
      try { options = JSON.parse(v.options as string || '{}'); } catch {}
      
      // Sync variant if linked
      if (v.linked_variant_id) {
        const liveVariant = await c.env.DB.prepare(
          `SELECT stock, is_unlimited_stock, requires_shipping FROM product_variants WHERE id = ?`
        ).bind(v.linked_variant_id).first();
        if (liveVariant) {
          // ONLY sync stock and shipping, do not overwrite custom variant prices set in the landing builder
          v.stock = liveVariant.stock;
          v.is_unlimited_stock = liveVariant.is_unlimited_stock;
          v.requires_shipping = liveVariant.requires_shipping;
        }
      }
      return { ...v, options };
    }));

    // Format like the old response so the frontend builder doesn't break immediately
    const simulatedProduct = {
      id: landing.id,
      title: landing.title,
      slug: landing.slug,
      base_price: landing.base_price,
      original_price: landing.original_price,
      images: images,
      category: category,
      brand: landing.brand,
      stock: landing.stock,
      is_unlimited_stock: landing.is_unlimited_stock,
      is_variant_bulk_mode: landing.is_variant_bulk_mode,
      requires_shipping: landing.requires_shipping,
      digital_assets: digitalAssets,
      variants: parsedVariants,
      is_landing_product: true // Custom flag just in case
    };

    c.header('Cache-Control', 'public, max-age=3600');
    return c.json({
      success: true,
      data: {
        product: simulatedProduct,
        landing: {
          sections,
          settings,
          is_active: Boolean(landing.is_active)
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching landing page:', error);
    return c.json({ success: false, message: 'Internal Server Error' }, 500);
  }
});


// ============================================================
// ADMIN ROUTES (Protected by JWT)
// ============================================================

// GET /api/v1/admin/landing
// List all landing pages
adminLandingRoutes.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, title, slug, description, base_price, is_active, created_at, linked_product_id 
       FROM landing_pages 
       ORDER BY created_at DESC`
    ).all();
    return c.json({ success: true, data: { landing_pages: results } });
  } catch (error: any) {
    console.error('Error listing landing pages:', error);
    return c.json({ success: false, message: 'Internal Server Error' }, 500);
  }
});

// POST /api/v1/admin/landing
// Create a new landing page
adminLandingRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { title, slug, description, base_price, linked_product_id } = body;

    if (!title || !slug) {
      return c.json({ success: false, message: 'Title and Slug are required', code: 400 }, 400);
    }

    // Check slug uniqueness
    const existing = await c.env.DB.prepare('SELECT id FROM landing_pages WHERE slug = ?').bind(slug).first();
    if (existing) {
      return c.json({ success: false, message: 'Slug already exists', code: 400 }, 400);
    }

    const imagesJson = body.images ? JSON.stringify(body.images) : '[]';
    
    const isActive = body.is_active !== undefined ? (body.is_active ? 1 : 0) : (body.status === 'active' ? 1 : 0);

    const result = await c.env.DB.prepare(
      `INSERT INTO landing_pages (
         title, slug, description, sku, category, brand, images, 
         base_price, original_price, stock, is_unlimited_stock, is_variant_bulk_mode, 
         linked_product_id, is_active, requires_shipping, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      title, 
      slug, 
      description || '',
      body.sku || '', 
      body.category || '', 
      body.brand || '', 
      imagesJson, 
      base_price || 0, 
      body.original_price === '' ? null : (body.original_price ?? null),
      body.stock ?? 0,
      body.is_unlimited_stock ? 1 : 0,
      body.is_variant_bulk_mode ? 1 : 0,
      linked_product_id || null,
      isActive,
      body.requires_shipping !== undefined ? (body.requires_shipping ? 1 : 0) : 1
    ).run();

    const newId = result.meta.last_row_id;

    // Process variants
    if (body.variants && Array.isArray(body.variants)) {
      for (let i = 0; i < body.variants.length; i++) {
        const v = body.variants[i];
        await c.env.DB.prepare(
          `INSERT INTO landing_page_variants (
            landing_page_id, name, sku, image_url, price, original_price, 
            stock, is_unlimited_stock, options, sort_order, linked_variant_id, requires_shipping, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
          newId,
          v.name || '',
          v.sku || '',
          v.image_url || '',
          v.price || 0,
          v.original_price === '' ? null : (v.original_price ?? null),
          v.stock ?? 0,
          v.is_unlimited_stock ? 1 : 0,
          v.options ? JSON.stringify(v.options) : '{}',
          v.sort_order ?? i,
          v.linked_variant_id || null,
          body.requires_shipping !== undefined ? (body.requires_shipping ? 1 : 0) : 1
        ).run();
      }
    }

    // Insert Digital Assets if requires_shipping is false
    if (body.requires_shipping === 0 && Array.isArray(body.digital_assets)) {
      for (const asset of body.digital_assets) {
        if (asset.name && asset.file_url) {
          await c.env.DB.prepare(
            `INSERT INTO digital_assets (landing_id, name, file_url) VALUES (?, ?, ?)`
          ).bind(newId, asset.name, asset.file_url).run();
        }
      }
    }

    return c.json({ success: true, message: 'Landing page created successfully', id: newId });
  } catch (error: any) {
    console.error('Error creating landing page:', error);
    return c.json({ success: false, message: 'Failed to create landing page', error: error.message }, 500);
  }
});

// GET /api/v1/admin/landing/:id
// Fetch single landing page for admin builder & editor
adminLandingRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const landing = await c.env.DB.prepare(
      `SELECT * FROM landing_pages WHERE id = ?`
    ).bind(id).first();

    if (!landing) {
      return c.json({ success: false, message: 'Landing page not found', code: 404 }, 404);
    }

    // Fetch variants
    const variantResult = await c.env.DB.prepare(
      `SELECT * FROM landing_page_variants WHERE landing_page_id = ? ORDER BY sort_order ASC`
    ).bind(landing.id).all();
    const variants = variantResult.results.map(v => ({
      ...v,
      options: JSON.parse(v.options as string || '{}'),
    }));

    // Fetch digital assets
    const digitalAssetsResult = await c.env.DB.prepare(
      `SELECT * FROM digital_assets WHERE landing_id = ?`
    ).bind(landing.id).all();
    const digital_assets = digitalAssetsResult.results;

    let sections: string = landing.sections as string || '';
    let settings: any = {};
    try { 
      const parsed = JSON.parse(landing.settings as string || '{}'); 
      settings = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch {}

    return c.json({
      success: true,
      data: {
        ...landing,
        images: JSON.parse(landing.images as string || '[]'),
        sections,
        settings,
        is_active: Boolean(landing.is_active),
        variants,
        digital_assets
      }
    });

  } catch (error: any) {
    console.error('Error fetching admin landing page:', error);
    return c.json({ success: false, message: 'Internal Server Error' }, 500);
  }
});

// PUT /api/v1/admin/landing/:id
// Update landing page details, sections, settings, and variants
adminLandingRoutes.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  try {
    const body = await c.req.json();
    
    // We conditionally update fields so that the builder (which only sends sections/settings) 
    // doesn't wipe out other fields, and the editor (which sends everything) works too.
    
    const sectionsJson = body.sections ? (typeof body.sections === 'string' ? body.sections : JSON.stringify(body.sections)) : undefined;
    const settingsJson = body.settings ? (typeof body.settings === 'string' ? body.settings : JSON.stringify(body.settings)) : undefined;
    const imagesJson = body.images ? (typeof body.images === 'string' ? body.images : JSON.stringify(body.images)) : undefined;
    
    let isActiveToBind = null;
    if (body.is_active !== undefined) {
      isActiveToBind = body.is_active ? 1 : 0;
    } else if (body.status !== undefined) {
      isActiveToBind = body.status === 'active' ? 1 : 0;
    }
    
    await c.env.DB.prepare(
      `UPDATE landing_pages SET 
         title = COALESCE(?, title),
         slug = COALESCE(?, slug),
         description = COALESCE(?, description),
         sku = COALESCE(?, sku),
         category = COALESCE(?, category),
         brand = COALESCE(?, brand),
         images = COALESCE(?, images),
         base_price = COALESCE(?, base_price),
         original_price = ?,
         stock = COALESCE(?, stock),
         is_unlimited_stock = COALESCE(?, is_unlimited_stock),
         is_variant_bulk_mode = COALESCE(?, is_variant_bulk_mode),
         sections = COALESCE(?, sections),
         settings = COALESCE(?, settings),
         is_active = COALESCE(?, is_active),
         linked_product_id = ?,
         requires_shipping = COALESCE(?, requires_shipping),
         updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      body.title ?? null,
      body.slug ?? null,
      body.description ?? null,
      body.sku ?? null,
      body.category ?? null,
      body.brand ?? null,
      imagesJson ?? null,
      body.base_price ?? null,
      body.original_price === '' ? null : (body.original_price ?? null), // Handle clearing
      body.stock ?? null,
      body.is_unlimited_stock !== undefined ? (body.is_unlimited_stock ? 1 : 0) : null,
      body.is_variant_bulk_mode !== undefined ? (body.is_variant_bulk_mode ? 1 : 0) : null,
      sectionsJson ?? null,
      settingsJson ?? null,
      isActiveToBind,
      body.linked_product_id || null,
      body.requires_shipping !== undefined ? (body.requires_shipping ? 1 : 0) : null,
      id
    ).run();

    // Manage variants if provided in the payload
    if (body.variants !== undefined) {
      const existingVariantsResult = await c.env.DB.prepare(
        `SELECT id FROM landing_page_variants WHERE landing_page_id = ?`
      ).bind(id).all();
      const existingVariantIds = existingVariantsResult.results.map((r: any) => r.id);
      
      const updatedVariantIds: number[] = [];

      for (let i = 0; i < body.variants.length; i++) {
        const v = body.variants[i];
        if (v.id && typeof v.id === 'number') {
          // Update existing
          await c.env.DB.prepare(
            `UPDATE landing_page_variants SET 
              name = ?, sku = ?, image_url = ?, price = ?, original_price = ?, 
              stock = ?, is_unlimited_stock = ?, options = ?, sort_order = ?, linked_variant_id = ?, requires_shipping = ?
             WHERE id = ? AND landing_page_id = ?`
          ).bind(
            v.name || '', v.sku || '', v.image_url || '', v.price || 0, v.original_price === '' ? null : (v.original_price ?? null),
            v.stock ?? 0, v.is_unlimited_stock ? 1 : 0, JSON.stringify(v.options || {}), i, v.linked_variant_id || null,
            body.requires_shipping !== undefined ? (body.requires_shipping ? 1 : 0) : 1,
            v.id, id
          ).run();
          updatedVariantIds.push(v.id);
        } else {
          // Insert new
          await c.env.DB.prepare(
            `INSERT INTO landing_page_variants (landing_page_id, name, sku, image_url, price, original_price, stock, is_unlimited_stock, options, sort_order, linked_variant_id, requires_shipping)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id, v.name || '', v.sku || '', v.image_url || '', v.price || 0, v.original_price === '' ? null : (v.original_price ?? null),
            v.stock ?? 0, v.is_unlimited_stock ? 1 : 0, JSON.stringify(v.options || {}), i, v.linked_variant_id || null,
            body.requires_shipping !== undefined ? (body.requires_shipping ? 1 : 0) : 1
          ).run();
        }
      }

      // Delete removed variants
      const variantsToDelete = existingVariantIds.filter(vid => !updatedVariantIds.includes(vid));
      if (variantsToDelete.length > 0) {
        const placeholders = variantsToDelete.map(() => '?').join(',');
        await c.env.DB.prepare(`DELETE FROM landing_page_variants WHERE id IN (${placeholders})`).bind(...variantsToDelete).run();
      }
    }

    // Update Digital Assets
    if (body.digital_assets !== undefined && Array.isArray(body.digital_assets)) {
      await c.env.DB.prepare('DELETE FROM digital_assets WHERE landing_id = ?').bind(id).run();
      if (body.requires_shipping === 0) {
        for (const asset of body.digital_assets) {
          if (asset.name && asset.file_url) {
            await c.env.DB.prepare(
              `INSERT INTO digital_assets (landing_id, name, file_url) VALUES (?, ?, ?)`
            ).bind(id, asset.name, asset.file_url).run();
          }
        }
      }
    }

    return c.json({ success: true, message: 'Landing page saved successfully' });

  } catch (error: any) {
    console.error('Error saving landing page:', error);
    return c.json({ success: false, message: 'Failed to save landing page', error: error.message }, 500);
  }
});

// DELETE /api/v1/admin/landing/:id/variants/:variantId
adminLandingRoutes.delete('/:id/variants/:variantId', async (c) => {
  const variantId = parseInt(c.req.param('variantId'));
  try {
    await c.env.DB.prepare('DELETE FROM landing_page_variants WHERE id = ?').bind(variantId).run();
    return c.json({ success: true, message: 'Variant deleted' });
  } catch (err: any) {
    return c.json({ success: false, message: 'Failed to delete variant' }, 500);
  }
});

// DELETE /api/v1/admin/landing/:id
adminLandingRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  try {
    await c.env.DB.prepare('DELETE FROM landing_pages WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Landing page deleted successfully' });
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to delete landing page' }, 500);
  }
});

// POST /api/v1/admin/landing/:id/toggle
adminLandingRoutes.post('/:id/toggle', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  try {
    const body = await c.req.json();
    const isActive = body.is_active ? 1 : 0;

    const result = await c.env.DB.prepare(
      'UPDATE landing_pages SET is_active = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(isActive, id).run();

    if (result.meta.changes === 0) {
        return c.json({ success: false, message: 'Landing page not found.' }, 404);
    }

    return c.json({ success: true, message: `Landing page ${isActive ? 'published' : 'unpublished'}` });
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to toggle status' }, 500);
  }
});
