// ============================================================
// Product Routes — Public listing + Admin CRUD
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const productRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── PUBLIC: List Products ────────────────────────────────────
// GET /api/products
productRoutes.get('/', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '24')));
  const category = c.req.query('category') || '';
  const brand = c.req.query('brand') || '';
  const search = c.req.query('q') || c.req.query('search') || ''; // Support both q and search
  const sort = c.req.query('sort') || 'newest'; // newest, oldest, price_low, price_high, price_asc, price_desc
  const status = c.req.query('status') || 'active';
  const flashSale = c.req.query('flash_sale') === 'true';
  const inStock = c.req.query('in_stock') === 'true';
  const minPrice = parseFloat(c.req.query('min_price') || '');
  const maxPrice = parseFloat(c.req.query('max_price') || '');
  const mode = c.req.query('mode') || '';
  
  // Personalization Parameters
  const viewedIdsRaw = c.req.query('viewed_ids') || '';
  const interestsRaw = c.req.query('interests') || '';
  
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];
  if (status && status !== 'all') {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (flashSale) {
    whereClause += ' AND is_flash_sale = 1';
  }

  if (category) {
    whereClause += ' AND (LOWER(category) = LOWER(?) OR id IN (SELECT product_id FROM product_categories JOIN categories ON product_categories.category_id = categories.id WHERE LOWER(categories.slug) = LOWER(?)))';
    params.push(category, category);
  }

  if (brand) {
    whereClause += ' AND LOWER(brand) = LOWER(?)';
    params.push(brand);
  }

  if (search) {
    whereClause += ` AND (
      title LIKE ? 
      OR description LIKE ? 
      OR sku LIKE ? 
      OR tags LIKE ?
      OR id IN (SELECT product_id FROM product_variants WHERE sku LIKE ? OR name LIKE ?)
    )`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (!isNaN(minPrice)) {
    whereClause += ' AND base_price >= ?';
    params.push(minPrice);
  }

  if (!isNaN(maxPrice)) {
    whereClause += ' AND base_price <= ?';
    params.push(maxPrice);
  }

  if (inStock) {
    whereClause += ' AND (stock > 0 OR is_unlimited_stock = 1)';
  }

  if (mode === 'variant_bulk_mode') {
    whereClause += ' AND is_variant_bulk_mode = 1';
  } else if (mode === 'variant') {
    whereClause += ' AND is_variant_bulk_mode = 0 AND id IN (SELECT product_id FROM product_variants)';
  } else if (mode === 'non_variant') {
    whereClause += ' AND is_variant_bulk_mode = 0 AND id NOT IN (SELECT product_id FROM product_variants)';
  }

  let orderClause = 'ORDER BY created_at DESC';
  switch (sort) {
    case 'oldest': orderClause = 'ORDER BY created_at ASC'; break;
    case 'price_low':
    case 'price_asc': orderClause = 'ORDER BY base_price ASC'; break;
    case 'price_high':
    case 'price_desc': orderClause = 'ORDER BY base_price DESC'; break;
    case 'stock_low': orderClause = 'ORDER BY stock ASC'; break;
    case 'stock_high': orderClause = 'ORDER BY stock DESC'; break;
    case 'recommendation':
      // The Golden Ratio - Smart Scoring Algorithm
      let scoreParts = [];
      
      // 1. High Intent (+30 points for viewed items)
      if (viewedIdsRaw) {
        const ids = viewedIdsRaw.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
        if (ids.length > 0) {
          scoreParts.push(`(CASE WHEN id IN (${ids.join(',')}) THEN 30 ELSE 0 END)`);
        }
      }
      
      // 2. Interest Match (+15 points for matched categories)
      if (interestsRaw) {
        const interests = interestsRaw.split(',').map(i => i.trim()).filter(Boolean);
        if (interests.length > 0) {
          // SQL Injection safe way using explicit string literal replacement
          const safeInterests = interests.map(i => `'${i.replace(/'/g, "''")}'`).join(',');
          scoreParts.push(`(CASE WHEN category IN (${safeInterests}) THEN 15 ELSE 0 END)`);
        }
      }
      
      // 3. Store Best Sellers/Trending (+10 points) (We use is_flash_sale as a proxy for featured/trending for now)
      scoreParts.push(`(CASE WHEN is_flash_sale = 1 THEN 10 ELSE 0 END)`);
      
      // 4. In Stock (+5 points)
      scoreParts.push(`(CASE WHEN stock > 0 OR is_unlimited_stock = 1 THEN 5 ELSE 0 END)`);

      const scoreCalculation = scoreParts.length > 0 ? scoreParts.join(' + ') : '0';
      
      // Order by Score DESC, then randomize slightly for exploration, then newest
      orderClause = `ORDER BY (${scoreCalculation}) DESC, RANDOM(), created_at DESC`;
      break;
  }

  // Count total
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM products ${whereClause}`
  ).bind(...params).first<{ total: number }>();

  // Fetch products
  const products = await c.env.DB.prepare(
    `SELECT id, title, slug, sku, category, brand, tags, images,
            base_price, original_price, stock, is_unlimited_stock,
            is_variant_bulk_mode, free_delivery, free_delivery_min_qty,
            free_delivery_min_amount, is_flash_sale, status, created_at,
            (SELECT GROUP_CONCAT(c.name, ', ') FROM product_categories pc JOIN categories c ON pc.category_id = c.id WHERE pc.product_id = products.id) as mapped_categories,
            (SELECT COUNT(id) FROM product_variants WHERE product_id = products.id) as variant_count
     FROM products ${whereClause} ${orderClause} LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  const includeVariants = c.req.query('include_variants') === 'true';
  let allVariants: any[] = [];
  if (includeVariants && products.results.length > 0) {
    const productIds = products.results.map((p: any) => p.id);
    const placeholders = productIds.map(() => '?').join(',');
    const variantsResult = await c.env.DB.prepare(
      `SELECT * FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY sort_order ASC`
    ).bind(...productIds).all();
    allVariants = variantsResult.results;
  }

  c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
  return c.json({
    success: true,
    data: {
      products: products.results.map((p: any) => {
        const productVariants = includeVariants ? allVariants.filter(v => v.product_id === p.id).map(v => ({
          ...v,
          options: safeJsonParse(v.options as string, {})
        })) : undefined;

        return {
          ...p,
          tags: safeJsonParse(p.tags as string, []),
          images: safeJsonParse(p.images as string, []),
          ...(includeVariants ? { variants: productVariants } : {})
        };
      }),
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    }
  });
});

// ─── PUBLIC: List Categories ─────────────────────────────────
// GET /api/products/meta/categories  (must be BEFORE /:slug)
productRoutes.get('/meta/categories', async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC`
  ).all();

  return c.json({ success: true, data: { categories: result.results } });
});

// ─── PUBLIC: Get Single Product by Slug ──────────────────────
// GET /api/products/:slug
productRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  let product = await c.env.DB.prepare(
    `SELECT * FROM products WHERE slug = ?`
  ).bind(slug).first();

  if (!product && /^\d+$/.test(slug)) {
    product = await c.env.DB.prepare(
      `SELECT * FROM products WHERE id = ?`
    ).bind(parseInt(slug)).first();
  }

  if (!product) {
    return c.json({ success: false, message: 'Product not found', code: 404 }, 404);
  }

  // Fetch variants (for any product that has them)
  const variantResult = await c.env.DB.prepare(
    `SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC`
  ).bind(product.id).all();
  const variants = variantResult.results.map(v => ({
    ...v,
    options: safeJsonParse(v.options as string, {}),
  }));

  // Fetch categories with parent category information
  const categoriesResult = await c.env.DB.prepare(
    `SELECT categories.id, categories.name, categories.slug, categories.parent_id,
            parent.id as parent_id_val, parent.name as parent_name, parent.slug as parent_slug
     FROM categories 
     JOIN product_categories ON product_categories.category_id = categories.id 
     LEFT JOIN categories parent ON categories.parent_id = parent.id
     WHERE product_categories.product_id = ?
     ORDER BY categories.sort_order ASC`
  ).bind(product.id).all();

  // Compute breadcrumbs: [{ name: 'Main Category', slug: '...' }, { name: 'Sub Category', slug: '...' }]
  const breadcrumbs: Array<{ name: string; slug: string }> = [];
  
  if (categoriesResult.results && categoriesResult.results.length > 0) {
    const firstCat: any = categoriesResult.results[0];
    if (firstCat.parent_name && firstCat.parent_slug) {
      breadcrumbs.push({ name: firstCat.parent_name, slug: firstCat.parent_slug });
    }
    breadcrumbs.push({ name: firstCat.name, slug: firstCat.slug });
  } else if (product.category) {
    // If product only has legacy category string, look up in categories table
    const catLookup: any = await c.env.DB.prepare(
      `SELECT c.name, c.slug, p.name as parent_name, p.slug as parent_slug
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE LOWER(c.name) = LOWER(?) OR LOWER(c.slug) = LOWER(?)
       LIMIT 1`
    ).bind(product.category, product.category).first();

    if (catLookup) {
      if (catLookup.parent_name && catLookup.parent_slug) {
        breadcrumbs.push({ name: catLookup.parent_name, slug: catLookup.parent_slug });
      }
      breadcrumbs.push({ name: catLookup.name, slug: catLookup.slug });
    } else {
      breadcrumbs.push({ 
        name: product.category as string, 
        slug: (product.category as string).toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-+|-+$/g, '') 
      });
    }
  }

  // Fetch reviews
  const reviews = await c.env.DB.prepare(
    `SELECT id, rating, reviewer_name, body, verified, created_at
     FROM reviews WHERE product_id = ? AND approved = 1
     ORDER BY created_at DESC LIMIT 50`
  ).bind(product.id).all();

  // Fetch digital assets if applicable
  let digitalAssets: any[] = [];
  if (product.requires_shipping === 0) {
    const assets = await c.env.DB.prepare(
      `SELECT * FROM digital_assets WHERE product_id = ?`
    ).bind(product.id).all();
    
    const isAdmin = c.req.path.includes('/admin/');
    digitalAssets = assets.results.map((a: any) => ({
      id: a.id,
      name: a.name,
      ...(isAdmin ? { file_url: a.file_url } : {})
    }));
  }

  c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
  return c.json({
    success: true,
    data: {
      product: {
        ...product,
        tags: safeJsonParse(product.tags as string, []),
        images: safeJsonParse(product.images as string, []),
        categories: categoriesResult.results, // Relational categories with parent
        breadcrumbs, // Pre-computed breadcrumb chain
      },
      digital_assets: digitalAssets,
      variants,
      reviews: reviews.results,
    }
  });
});

// ─── POST a Review ────────────────────────────────────────────
// POST /api/products/:slug/reviews
productRoutes.post('/:slug/reviews', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json();
  const { rating, reviewer_name, review_body } = body;

  if (!rating || !reviewer_name) {
    return c.json({ success: false, message: 'Rating and reviewer name are required' }, 400);
  }

  // Spam protection & validation
  const parsedRating = parseInt(rating);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return c.json({ success: false, message: 'Rating must be between 1 and 5' }, 400);
  }
  if (reviewer_name.length > 50) {
    return c.json({ success: false, message: 'Name is too long' }, 400);
  }
  if (review_body && review_body.length > 1000) {
    return c.json({ success: false, message: 'Review is too long' }, 400);
  }

  // Ensure product exists
  const product = await c.env.DB.prepare('SELECT id FROM products WHERE slug = ?').bind(slug).first();
  if (!product) {
    return c.json({ success: false, message: 'Product not found' }, 404);
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO reviews (product_id, rating, reviewer_name, body, approved) VALUES (?, ?, ?, ?, 0)`
    ).bind(product.id, parsedRating, reviewer_name, review_body || '').run();

    return c.json({ success: true, message: 'Review submitted and pending moderation' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── ADMIN: Create Product ────────────────────────────────────
// POST /api/admin/products
productRoutes.post('/', async (c) => {
  // Check if this is an admin route (has adminId set by middleware)
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  try {
    const body = await c.req.json();
    const slug = body.slug || slugify(body.title);

    // Check slug uniqueness
    const existing = await c.env.DB.prepare(
      'SELECT id FROM products WHERE slug = ?'
    ).bind(slug).first();
    if (existing) {
      return c.json({ success: false, message: 'A product with this slug already exists', code: 409 }, 409);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO products (title, slug, description, sku, category, brand, tags, images,
        base_price, original_price, stock, is_unlimited_stock, is_variant_bulk_mode,
        free_delivery, free_delivery_min_qty, free_delivery_min_amount, is_flash_sale, status, requires_shipping)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.title || '',
      slug,
      body.description || '',
      body.sku || '',
      body.category || '',
      body.brand || '',
      JSON.stringify(body.tags || []),
      JSON.stringify(body.images || []),
      body.base_price || 0,
      body.original_price || null,
      body.stock || 99,
      body.is_unlimited_stock ? 1 : 0,
      body.is_variant_bulk_mode ? 1 : 0,
      body.free_delivery ? 1 : 0,
      body.free_delivery_min_qty || 0,
      body.free_delivery_min_amount || 0,
      body.is_flash_sale ? 1 : 0,
      body.status || 'active',
      body.requires_shipping !== undefined ? (body.requires_shipping ? 1 : 0) : 1
    ).run();

    const productId = result.meta.last_row_id;

    // Insert categories if provided
    if (Array.isArray(body.categories) && body.categories.length > 0) {
      for (const catId of body.categories) {
        await c.env.DB.prepare(
          `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`
        ).bind(productId, catId).run();
      }
    }

    // Insert digital assets if provided and requires no shipping
    if (body.requires_shipping === 0 && Array.isArray(body.digital_assets)) {
      for (const asset of body.digital_assets) {
        if (!asset.name) continue;
        await c.env.DB.prepare(
          `INSERT INTO digital_assets (product_id, name, file_url) VALUES (?, ?, ?)`
        ).bind(productId, asset.name, asset.file_url || '').run();
      }
    }

    // Insert variants if provided (even for simple products with options)
    if (Array.isArray(body.variants) && body.variants.length > 0) {
      for (let i = 0; i < body.variants.length; i++) {
        const v = body.variants[i];
        await c.env.DB.prepare(
          `INSERT INTO product_variants (product_id, name, sku, image_url, price, original_price, stock, is_unlimited_stock, options, sort_order, requires_shipping)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          productId,
          v.name || '',
          v.sku || '',
          v.image_url || '',
          v.price || 0,
          v.original_price || null,
          v.stock || 99,
          v.is_unlimited_stock ? 1 : 0,
          JSON.stringify(v.options || {}),
          i,
          body.requires_shipping !== undefined ? (body.requires_shipping ? 1 : 0) : 1
        ).run();
      }
    }

    return c.json({ success: true, data: { id: productId, slug, message: 'Product created' } }, 201);
  } catch (err) {
    console.error('Create product error:', err);
    return c.json({ success: false, message: 'Failed to create product', error: (err as Error).message, code: 500 }, 500);
  }
});

// ─── ADMIN: Update Product ────────────────────────────────────
// PUT /api/admin/products/:id
productRoutes.put('/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ success: false, message: 'Invalid product ID', code: 400 }, 400);

  try {
    const body = await c.req.json();

    await c.env.DB.prepare(
      `UPDATE products SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        sku = COALESCE(?, sku),
        category = COALESCE(?, category),
        brand = COALESCE(?, brand),
        tags = COALESCE(?, tags),
        images = COALESCE(?, images),
        base_price = COALESCE(?, base_price),
        original_price = ?,
        stock = COALESCE(?, stock),
        is_unlimited_stock = COALESCE(?, is_unlimited_stock),
        is_variant_bulk_mode = COALESCE(?, is_variant_bulk_mode),
        free_delivery = COALESCE(?, free_delivery),
        free_delivery_min_qty = COALESCE(?, free_delivery_min_qty),
        free_delivery_min_amount = COALESCE(?, free_delivery_min_amount),
        is_flash_sale = COALESCE(?, is_flash_sale),
        status = COALESCE(?, status),
        requires_shipping = COALESCE(?, requires_shipping),
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      body.title ?? null,
      body.description ?? null,
      body.sku ?? null,
      body.category ?? null,
      body.brand ?? null,
      body.tags !== undefined ? JSON.stringify(body.tags) : null,
      body.images !== undefined ? JSON.stringify(body.images) : null,
      body.base_price ?? null,
      body.original_price ?? null,  // Allow explicit null to remove discount
      body.stock ?? null,
      body.is_unlimited_stock !== undefined ? (body.is_unlimited_stock ? 1 : 0) : null,
      body.is_variant_bulk_mode !== undefined ? (body.is_variant_bulk_mode ? 1 : 0) : null,
      body.free_delivery !== undefined ? (body.free_delivery ? 1 : 0) : null,
      body.free_delivery_min_qty ?? null,
      body.free_delivery_min_amount ?? null,
      body.is_flash_sale !== undefined ? (body.is_flash_sale ? 1 : 0) : null,
      body.status ?? null,
      body.requires_shipping !== undefined ? (body.requires_shipping ? 1 : 0) : null,
      id
    ).run();

    // Replace categories if provided
    if (body.categories !== undefined && Array.isArray(body.categories)) {
      // Delete existing category mappings
      await c.env.DB.prepare('DELETE FROM product_categories WHERE product_id = ?').bind(id).run();

      // Insert new category mappings
      for (const catId of body.categories) {
        await c.env.DB.prepare(
          `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`
        ).bind(id, catId).run();
      }
    }

    // Replace digital assets if provided
    if (body.digital_assets !== undefined && Array.isArray(body.digital_assets)) {
      await c.env.DB.prepare('DELETE FROM digital_assets WHERE product_id = ?').bind(id).run();
      if (body.requires_shipping === 0) {
        for (const asset of body.digital_assets) {
          if (!asset.name) continue;
          await c.env.DB.prepare(
            `INSERT INTO digital_assets (product_id, name, file_url) VALUES (?, ?, ?)`
          ).bind(id, asset.name, asset.file_url || '').run();
        }
      }
    }

    // Replace variants if provided
    if (body.variants !== undefined && Array.isArray(body.variants)) {
      // Delete existing variants
      await c.env.DB.prepare('DELETE FROM product_variants WHERE product_id = ?').bind(id).run();

      // Insert new variants
      for (let i = 0; i < body.variants.length; i++) {
        const v = body.variants[i];
        await c.env.DB.prepare(
          `INSERT INTO product_variants (product_id, name, sku, image_url, price, original_price, stock, is_unlimited_stock, options, sort_order, requires_shipping)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          v.name || '',
          v.sku || '',
          v.image_url || '',
          v.price || 0,
          v.original_price || null,
          v.stock || 99,
          v.is_unlimited_stock ? 1 : 0,
          JSON.stringify(v.options || {}),
          i,
          body.requires_shipping !== undefined ? (body.requires_shipping ? 1 : 0) : 1
        ).run();
      }
    }

    return c.json({ success: true, data: { message: 'Product updated' } });
  } catch (err) {
    console.error('Update product error:', err);
    return c.json({ success: false, message: 'Failed to update product', error: (err as Error).message, code: 500 }, 500);
  }
});

// ─── ADMIN: Delete Product ────────────────────────────────────
// DELETE /api/admin/products/:id
productRoutes.delete('/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ success: false, message: 'Invalid product ID', code: 400 }, 400);

  await c.env.DB.prepare('DELETE FROM product_variants WHERE product_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

  return c.json({ success: true, data: { message: 'Product deleted' } });
});

// ─── Helpers ──────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

function safeJsonParse(str: string | null | undefined, fallback: unknown): unknown {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}
