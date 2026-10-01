// ============================================================
// Universal Admin Model Context Protocol (MCP) Server
// 100% Aligned with schema.sql & D1 Database Schema
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const adminMcpRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── 1. Admin MCP Tool Definitions ───────────────────────────
const ADMIN_MCP_TOOLS = [
  {
    name: 'admin_get_product_details',
    description: 'Get full product details including title, description, images, categories, stock, price, and all product variants (size/color/options).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Product ID' },
        slug: { type: 'string', description: 'Product slug (e.g., "centella-ampoule")' },
      },
    },
  },
  {
    name: 'admin_create_product',
    description: 'Create and publish a new product in the store with titles, pricing, images, categories, descriptions, and optional variants (size, color, weight).',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Product title in English or Bangla' },
        base_price: { type: 'number', description: 'Selling price in BDT (৳)' },
        original_price: { type: 'number', description: 'Original/regular strike-through price before discount (optional)' },
        category: { type: 'string', description: 'Category name or slug (e.g., "Skin Care", "Hair Care")' },
        brand: { type: 'string', description: 'Brand name (e.g., "COSRX", "Beauty of Joseon")' },
        description: { type: 'string', description: 'HTML/Markdown product description and benefits' },
        sku: { type: 'string', description: 'Product SKU or code (optional)' },
        images: { type: 'array', items: { type: 'string' }, description: 'Array of image URLs' },
        stock: { type: 'number', description: 'Inventory stock count (default: 99)' },
        is_unlimited_stock: { type: 'boolean', description: 'True if stock is unlimited' },
        is_flash_sale: { type: 'boolean', description: 'Set true to feature in flash sale' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Search tags array' },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Variant name (e.g., "50ml", "100ml", "Red / XL")' },
              price: { type: 'number', description: 'Variant price in BDT' },
              original_price: { type: 'number', description: 'Variant original price in BDT' },
              stock: { type: 'number', description: 'Variant stock quantity' },
              sku: { type: 'string', description: 'Variant SKU' },
              image_url: { type: 'string', description: 'Variant specific image URL' },
              is_unlimited_stock: { type: 'boolean', description: 'Unlimited stock for this variant' },
              options: { type: 'object', description: 'Key-value options e.g. {"Size": "50ml", "Color": "Red"}' },
            },
            required: ['name', 'price'],
          },
          description: 'Optional list of variants (sizes, shades, volumes)',
        },
      },
      required: ['title', 'base_price'],
    },
  },
  {
    name: 'admin_update_product',
    description: 'Update any attribute of an existing product (price, stock, title, description, images, tags, status, flash sale, or variants).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Product ID' },
        slug: { type: 'string', description: 'Product slug (alternative to ID)' },
        title: { type: 'string', description: 'New product title' },
        base_price: { type: 'number', description: 'New selling price in BDT' },
        original_price: { type: 'number', description: 'New original strike-through price in BDT' },
        stock: { type: 'number', description: 'New stock count' },
        is_unlimited_stock: { type: 'boolean', description: 'Set unlimited stock true/false' },
        is_flash_sale: { type: 'boolean', description: 'Toggle flash sale badge' },
        category: { type: 'string', description: 'Update category' },
        brand: { type: 'string', description: 'Update brand' },
        status: { type: 'string', enum: ['active', 'draft', 'archived'], description: 'Publish status' },
        description: { type: 'string', description: 'Updated HTML/Markdown product description and benefits' },
        images: { type: 'array', items: { type: 'string' }, description: 'Updated array of product image URLs' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Updated search tags array' },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Variant name (e.g., "50ml", "100ml", "Red / XL")' },
              price: { type: 'number', description: 'Variant price in BDT' },
              original_price: { type: 'number', description: 'Variant original price in BDT' },
              stock: { type: 'number', description: 'Variant stock quantity' },
              sku: { type: 'string', description: 'Variant SKU' },
              image_url: { type: 'string', description: 'Variant specific image URL' },
              is_unlimited_stock: { type: 'boolean', description: 'Unlimited stock for this variant' },
              options: { type: 'object', description: 'Key-value options e.g. {"Size": "50ml"}' },
            },
            required: ['name', 'price'],
          },
          description: 'Updated list of variants. If provided, replaces existing variants.',
        },
      },
    },
  },
  {
    name: 'admin_set_product_variants',
    description: 'Add or replace the entire variant set (sizes, shades, weights) for a product.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'number', description: 'Product ID' },
        slug: { type: 'string', description: 'Product slug' },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Variant label e.g. "50ml", "100ml", "Medium"' },
              price: { type: 'number', description: 'Price in BDT' },
              original_price: { type: 'number', description: 'Original price in BDT (optional)' },
              stock: { type: 'number', description: 'Stock count' },
              sku: { type: 'string', description: 'Variant SKU' },
              image_url: { type: 'string', description: 'Image URL for this variant' },
              is_unlimited_stock: { type: 'boolean', description: 'Unlimited stock flag' },
              options: { type: 'object', description: 'Options JSON object e.g. {"Size":"100ml"}' },
            },
            required: ['name', 'price'],
          },
          description: 'Array of variant objects',
        },
      },
      required: ['variants'],
    },
  },
  {
    name: 'admin_delete_product',
    description: 'Delete or archive a product from the store catalog.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Product ID to remove' },
        slug: { type: 'string', description: 'Product slug to remove' },
      },
    },
  },
  {
    name: 'admin_update_inventory',
    description: 'Quickly adjust stock quantity and unlimited flag for a product.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Product ID' },
        slug: { type: 'string', description: 'Product slug' },
        stock: { type: 'number', description: 'New stock quantity' },
        is_unlimited_stock: { type: 'boolean', description: 'Set 1 for unlimited stock, 0 for finite' },
      },
    },
  },
  {
    name: 'admin_list_orders',
    description: 'Query and filter customer orders by status, date range, or search keyword.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'], description: 'Filter by order status' },
        search: { type: 'string', description: 'Search by customer phone, name, or Order ID' },
        limit: { type: 'number', description: 'Number of orders to retrieve (default: 20)' },
        page: { type: 'number', description: 'Page number for pagination' },
      },
    },
  },
  {
    name: 'admin_get_order_details',
    description: 'Get complete breakdown of an order including customer address, ordered items, payment method, and courier details.',
    inputSchema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'Order ID (e.g., "KOT-123456")' },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'admin_update_order_status',
    description: 'Update the progress status, payment status, or internal admin notes of an order.',
    inputSchema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'Order ID to update' },
        status: { type: 'string', enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'], description: 'New order status' },
        payment_status: { type: 'string', enum: ['Pending', 'Paid', 'Verify Manual', 'Verified'], description: 'Payment status' },
        notes: { type: 'string', description: 'Internal admin / fulfillment note' },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'admin_create_coupon',
    description: 'Create a new promotional discount coupon code for marketing campaigns.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Coupon promo code (e.g., "EID2026", "FLASH10")' },
        type: { type: 'string', enum: ['Percentage', 'Fixed'], description: 'Discount type (Percentage or Fixed BDT)' },
        value: { type: 'number', description: 'Discount amount (% or BDT value)' },
        min_order: { type: 'number', description: 'Minimum cart subtotal required in BDT' },
        max_uses: { type: 'number', description: 'Maximum total uses allowed (0 = unlimited)' },
        expires_at: { type: 'string', description: 'Expiry date in ISO or YYYY-MM-DD format (optional)' },
      },
      required: ['code', 'type', 'value'],
    },
  },
  {
    name: 'admin_get_sales_analytics',
    description: 'Retrieve real-time revenue, order metrics, average order value, and top selling products for business analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['today', 'week', 'month', 'all'], description: 'Time period for reporting (default: today)' },
      },
    },
  },
  {
    name: 'admin_get_inventory_health',
    description: 'Scan catalog for out-of-stock items, inactive listings, and inventory summary.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'admin_update_store_settings',
    description: 'Update store delivery rates, customer hotline phone, email, or general announcements.',
    inputSchema: {
      type: 'object',
      properties: {
        inside_dhaka_delivery_bdt: { type: 'number', description: 'Delivery fee for inside Dhaka' },
        outside_dhaka_delivery_bdt: { type: 'number', description: 'Delivery fee for outside Dhaka' },
        hotline: { type: 'string', description: 'Support phone number' },
        email: { type: 'string', description: 'Support email address' },
      },
    },
  },
];

// Helper: Safely parse JSON strings
function safeJsonParse<T>(val: unknown, fallback: T): T {
  if (typeof val !== 'string') return (val as T) || fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Helper: Generate URL slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

// ─── Authentication Checker ───────────────────────────────────
async function authenticateAdmin(c: any): Promise<boolean> {
  // 0. Check if AI MCP is master disabled by store owner
  try {
    const enabledRow = (await c.env.DB.prepare(
      "SELECT value FROM store_settings WHERE key = 'mcp_enabled'"
    ).first()) as { value: string } | null;
    if (enabledRow && enabledRow.value) {
      const val = enabledRow.value.replace(/^["']|["']$/g, '').trim().toLowerCase();
      if (val === 'false' || val === '0' || val === 'disabled') {
        return false; // Master switch is OFF: reject all AI requests
      }
    }
  } catch {}

  const authHeader = c.req.header('Authorization') || '';
  const apiKeyHeader = c.req.header('X-Admin-Key') || c.req.header('X-API-Key') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  const secret = c.env.JWT_SECRET;
  const providedKey = apiKeyHeader || token;

  // 1. Database-stored Admin MCP Key or Environment Secret Match
  if (providedKey) {
    if (secret && providedKey === secret) return true;

    try {
      const dbKeyRow = (await c.env.DB.prepare(
        "SELECT value FROM store_settings WHERE key IN ('mcp_secret', 'ai_admin_key', 'mcp_key')"
      ).first()) as { value: string } | null;
      if (dbKeyRow && dbKeyRow.value) {
        const storedKey = dbKeyRow.value.replace(/^["']|["']$/g, '').trim();
        if (storedKey && providedKey === storedKey) return true;
      }
    } catch {
      // skip
    }
  }

  // 2. JWT Verification
  if (token && token.includes('.')) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const [headerB64, claimsB64, sigB64] = parts;
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw', encoder.encode(secret || 'store-secret-fallback'), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
        );
        const sigStr = atob(sigB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - sigB64.length % 4) % 4));
        const sigArray = new Uint8Array(sigStr.length);
        for (let i = 0; i < sigStr.length; i++) sigArray[i] = sigStr.charCodeAt(i);

        const valid = await crypto.subtle.verify('HMAC', key, sigArray, encoder.encode(`${headerB64}.${claimsB64}`));
        if (valid) {
          const claims = JSON.parse(atob(claimsB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - claimsB64.length % 4) % 4)));
          if (!claims.exp || claims.exp >= Math.floor(Date.now() / 1000)) return true;
        }
      }
    } catch {
      // ignore
    }
  }

  return false;
}

// ─── Admin Tool Execution Engine ──────────────────────────────
async function executeAdminTool(name: string, args: Record<string, any>, env: Env): Promise<any> {
  switch (name) {
    case 'admin_get_product_details': {
      let productId = args.id;
      let product: any = null;

      if (productId) {
        product = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productId).first();
      } else if (args.slug) {
        product = await env.DB.prepare('SELECT * FROM products WHERE slug = ?').bind(args.slug).first();
      }

      if (!product) return { error: 'Product not found with provided ID or slug.' };

      const variants = await env.DB.prepare(
        'SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC'
      ).bind(product.id).all();

      return {
        success: true,
        product: {
          ...product,
          images: product.images ? JSON.parse(product.images) : [],
          tags: product.tags ? JSON.parse(product.tags) : [],
          variants: (variants.results || []).map((v: any) => ({
            ...v,
            options: v.options ? JSON.parse(v.options) : {},
          })),
        },
      };
    }

    case 'admin_create_product': {
      const title = (args.title || '').trim();
      if (!title) return { error: 'Product title is required' };

      const baseSlug = generateSlug(title);
      let slug = baseSlug;
      let counter = 1;
      while (await env.DB.prepare('SELECT id FROM products WHERE slug = ?').bind(slug).first()) {
        slug = `${baseSlug}-${counter++}`;
      }

      const basePrice = typeof args.base_price === 'number' ? args.base_price : parseFloat(args.base_price || '0');
      const originalPrice = typeof args.original_price === 'number' ? args.original_price : (args.original_price ? parseFloat(args.original_price) : null);
      const category = (args.category || '').trim();
      const brand = (args.brand || '').trim();
      const description = args.description || '';
      const sku = args.sku || '';
      const images = JSON.stringify(Array.isArray(args.images) ? args.images : []);
      const tags = JSON.stringify(Array.isArray(args.tags) ? args.tags : []);
      const stock = typeof args.stock === 'number' ? args.stock : 99;
      const isUnlimited = args.is_unlimited_stock ? 1 : 0;
      const isFlashSale = args.is_flash_sale ? 1 : 0;
      const hasVariants = Array.isArray(args.variants) && args.variants.length > 0;

      const result = await env.DB.prepare(
        `INSERT INTO products (title, slug, description, sku, category, brand, tags, images, base_price, original_price, stock, is_unlimited_stock, is_variant_bulk_mode, is_flash_sale, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`
      ).bind(
        title, slug, description, sku, category, brand, tags, images, basePrice, originalPrice, stock, isUnlimited, hasVariants ? 1 : 0, isFlashSale
      ).run();

      const newProductId = result.meta?.last_row_id;

      if (hasVariants && newProductId) {
        for (let i = 0; i < args.variants.length; i++) {
          const v = args.variants[i];
          await env.DB.prepare(
            `INSERT INTO product_variants (product_id, name, sku, image_url, price, original_price, stock, is_unlimited_stock, options, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            newProductId,
            v.name || '',
            v.sku || '',
            v.image_url || '',
            v.price || basePrice,
            v.original_price || null,
            v.stock !== undefined ? v.stock : 99,
            v.is_unlimited_stock ? 1 : 0,
            JSON.stringify(v.options || {}),
            i
          ).run();
        }
      }

      return {
        success: true,
        message: `Product "${title}" created with ${hasVariants ? args.variants.length : 0} variants and published successfully!`,
        product: {
          id: newProductId,
          title,
          slug,
          base_price: basePrice,
          original_price: originalPrice,
          stock,
          category,
          variants_count: hasVariants ? args.variants.length : 0,
          url: `https://example.com/product/${slug}`,
        },
      };
    }

    case 'admin_update_product': {
      let productId = args.id;
      if (!productId && args.slug) {
        const found: any = await env.DB.prepare('SELECT id FROM products WHERE slug = ?').bind(args.slug).first();
        if (found) productId = found.id;
      }

      if (!productId) return { error: 'Valid product ID or slug is required.' };

      const updates: string[] = [];
      const params: (string | number)[] = [];

      if (args.title) { updates.push('title = ?'); params.push(args.title); }
      if (typeof args.base_price === 'number') { updates.push('base_price = ?'); params.push(args.base_price); }
      if (typeof args.original_price === 'number') { updates.push('original_price = ?'); params.push(args.original_price); }
      if (typeof args.stock === 'number') { updates.push('stock = ?'); params.push(args.stock); }
      if (typeof args.is_unlimited_stock === 'boolean') { updates.push('is_unlimited_stock = ?'); params.push(args.is_unlimited_stock ? 1 : 0); }
      if (typeof args.is_flash_sale === 'boolean') { updates.push('is_flash_sale = ?'); params.push(args.is_flash_sale ? 1 : 0); }
      if (args.category) { updates.push('category = ?'); params.push(args.category); }
      if (args.brand) { updates.push('brand = ?'); params.push(args.brand); }
      if (args.status) { updates.push('status = ?'); params.push(args.status); }
      if (args.description !== undefined) { updates.push('description = ?'); params.push(args.description); }
      if (Array.isArray(args.images)) { updates.push('images = ?'); params.push(JSON.stringify(args.images)); }
      if (Array.isArray(args.tags)) { updates.push('tags = ?'); params.push(JSON.stringify(args.tags)); }

      if (Array.isArray(args.variants)) {
        updates.push('is_variant_bulk_mode = ?');
        params.push(args.variants.length > 0 ? 1 : 0);

        // Replace variants
        await env.DB.prepare('DELETE FROM product_variants WHERE product_id = ?').bind(productId).run();
        for (let i = 0; i < args.variants.length; i++) {
          const v = args.variants[i];
          await env.DB.prepare(
            `INSERT INTO product_variants (product_id, name, sku, image_url, price, original_price, stock, is_unlimited_stock, options, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            productId,
            v.name || '',
            v.sku || '',
            v.image_url || '',
            v.price || 0,
            v.original_price || null,
            v.stock !== undefined ? v.stock : 99,
            v.is_unlimited_stock ? 1 : 0,
            JSON.stringify(v.options || {}),
            i
          ).run();
        }
      }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        params.push(productId);
        await env.DB.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
      }

      const updated = await env.DB.prepare('SELECT id, title, slug, base_price, original_price, stock, images, description, is_variant_bulk_mode, is_flash_sale, status FROM products WHERE id = ?').bind(productId).first();
      return {
        success: true,
        message: `Product ID #${productId} updated successfully.`,
        product: updated,
      };
    }

    case 'admin_set_product_variants': {
      let productId = args.product_id || args.id;
      if (!productId && args.slug) {
        const found: any = await env.DB.prepare('SELECT id FROM products WHERE slug = ?').bind(args.slug).first();
        if (found) productId = found.id;
      }

      if (!productId) return { error: 'Valid product ID or slug is required.' };
      if (!Array.isArray(args.variants) || args.variants.length === 0) {
        return { error: 'Array of variants is required.' };
      }

      await env.DB.prepare('DELETE FROM product_variants WHERE product_id = ?').bind(productId).run();
      for (let i = 0; i < args.variants.length; i++) {
        const v = args.variants[i];
        await env.DB.prepare(
          `INSERT INTO product_variants (product_id, name, sku, image_url, price, original_price, stock, is_unlimited_stock, options, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          productId,
          v.name || '',
          v.sku || '',
          v.image_url || '',
          v.price || 0,
          v.original_price || null,
          v.stock !== undefined ? v.stock : 99,
          v.is_unlimited_stock ? 1 : 0,
          JSON.stringify(v.options || {}),
          i
        ).run();
      }

      await env.DB.prepare("UPDATE products SET is_variant_bulk_mode = 1, updated_at = datetime('now') WHERE id = ?").bind(productId).run();

      const variants = await env.DB.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC').bind(productId).all();

      return {
        success: true,
        message: `Successfully updated ${args.variants.length} variants for Product ID #${productId}.`,
        variants: variants.results,
      };
    }

    case 'admin_delete_product': {
      let productId = args.id;
      if (!productId && args.slug) {
        const found: any = await env.DB.prepare('SELECT id FROM products WHERE slug = ?').bind(args.slug).first();
        if (found) productId = found.id;
      }

      if (!productId) return { error: 'Valid product ID or slug is required.' };

      await env.DB.prepare("UPDATE products SET status = 'archived', updated_at = datetime('now') WHERE id = ?").bind(productId).run();
      return { success: true, message: `Product ID #${productId} has been archived/removed.` };
    }

    case 'admin_update_inventory': {
      let productId = args.id;
      if (!productId && args.slug) {
        const found: any = await env.DB.prepare('SELECT id FROM products WHERE slug = ?').bind(args.slug).first();
        if (found) productId = found.id;
      }

      if (!productId) return { error: 'Valid product ID or slug is required.' };

      const updates: string[] = [];
      const params: (string | number)[] = [];

      if (typeof args.stock === 'number') {
        updates.push('stock = ?');
        params.push(args.stock);
      }
      if (typeof args.is_unlimited_stock === 'boolean') {
        updates.push('is_unlimited_stock = ?');
        params.push(args.is_unlimited_stock ? 1 : 0);
      }

      if (updates.length === 0) return { message: 'No stock update parameters provided.' };

      updates.push("updated_at = datetime('now')");
      params.push(productId);
      await env.DB.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
      return { success: true, message: `Stock for Product #${productId} updated.` };
    }

    case 'admin_list_orders': {
      const status = args.status || 'all';
      const search = (args.search || '').trim();
      const limit = Math.min(50, Math.max(1, parseInt(args.limit || '20')));
      const page = Math.max(1, parseInt(args.page || '1'));
      const offset = (page - 1) * limit;

      let sql = `SELECT id, order_id, customer_name, phone, address, city, thana, delivery_area, subtotal, delivery_fee, discount_amount, total_amount, status, payment_method, payment_status, created_at 
                 FROM orders WHERE 1=1`;
      const params: (string | number)[] = [];

      if (status !== 'all') {
        sql += ` AND status = ?`;
        params.push(status);
      }

      if (search) {
        sql += ` AND (customer_name LIKE ? OR phone LIKE ? OR order_id LIKE ?)`;
        const p = `%${search}%`;
        params.push(p, p, p);
      }

      sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const { results } = await env.DB.prepare(sql).bind(...params).all();
      return {
        count: results.length,
        page,
        orders: results,
      };
    }

    case 'admin_get_order_details': {
      const orderId = (args.order_id || '').trim();
      const order: any = await env.DB.prepare('SELECT * FROM orders WHERE order_id = ?').bind(orderId).first();
      if (!order) return { error: `Order #${orderId} not found.` };

      return {
        ...order,
        items: safeJsonParse(order.items, []),
      };
    }

    case 'admin_update_order_status': {
      const orderId = (args.order_id || '').trim();
      const updates: string[] = [];
      const params: string[] = [];

      if (args.status) { updates.push('status = ?'); params.push(args.status); }
      if (args.payment_status) { updates.push('payment_status = ?'); params.push(args.payment_status); }
      if (args.notes) { updates.push('notes = ?'); params.push(args.notes); }

      if (updates.length === 0) return { message: 'No updates specified.' };

      updates.push("updated_at = datetime('now')");
      params.push(orderId);
      await env.DB.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`).bind(...params).run();

      return {
        success: true,
        message: `Order #${orderId} status updated successfully.`,
        order_id: orderId,
        new_status: args.status,
      };
    }

    case 'admin_create_coupon': {
      const code = (args.code || '').trim().toUpperCase();
      const type = (args.type || 'Fixed').toLowerCase() === 'percentage' ? 'Percentage' : 'Fixed';
      const value = typeof args.value === 'number' ? args.value : parseFloat(args.value || '0');
      const minOrder = typeof args.min_order === 'number' ? args.min_order : (args.min_order ? parseFloat(args.min_order) : 0);
      const maxUses = typeof args.max_uses === 'number' ? args.max_uses : (args.max_uses ? parseInt(args.max_uses) : 0);
      const expiresAt = args.expires_at || null;

      await env.DB.prepare(
        `INSERT INTO coupons (code, type, value, min_order, max_uses, used_count, active, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, 0, 1, ?, datetime('now'))`
      ).bind(code, type, value, minOrder, maxUses, expiresAt).run();

      return {
        success: true,
        message: `Coupon "${code}" created successfully!`,
        coupon: { code, type, value, min_order: minOrder, max_uses: maxUses, expires_at: expiresAt },
      };
    }

    case 'admin_get_sales_analytics': {
      const period = args.period || 'today';
      let dateFilter = "datetime('now', 'start of day')";
      if (period === 'week') dateFilter = "datetime('now', '-7 days')";
      if (period === 'month') dateFilter = "datetime('now', '-30 days')";
      if (period === 'all') dateFilter = "'1970-01-01'";

      const stats: any = await env.DB.prepare(
        `SELECT 
           COUNT(*) as total_orders,
           SUM(total_amount) as total_revenue,
           SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_orders,
           SUM(CASE WHEN status = 'Delivered' OR status = 'Completed' THEN 1 ELSE 0 END) as completed_orders,
           AVG(total_amount) as avg_order_value
         FROM orders 
         WHERE created_at >= ${dateFilter}`
      ).first();

      return {
        period,
        total_orders: stats?.total_orders || 0,
        total_revenue_bdt: stats?.total_revenue || 0,
        pending_orders: stats?.pending_orders || 0,
        completed_orders: stats?.completed_orders || 0,
        average_order_value_bdt: Math.round(stats?.avg_order_value || 0),
      };
    }

    case 'admin_get_inventory_health': {
      const counts: any = await env.DB.prepare(
        `SELECT 
           COUNT(*) as total_products,
           SUM(CASE WHEN stock > 0 OR is_unlimited_stock = 1 THEN 1 ELSE 0 END) as in_stock_count,
           SUM(CASE WHEN stock = 0 AND is_unlimited_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
           SUM(CASE WHEN is_flash_sale = 1 THEN 1 ELSE 0 END) as flash_sale_count
         FROM products WHERE status = 'active'`
      ).first();

      const outOfStockItems = await env.DB.prepare(
        `SELECT id, title, slug, base_price, stock FROM products WHERE stock = 0 AND is_unlimited_stock = 0 AND status = 'active' LIMIT 10`
      ).all();

      return {
        summary: counts,
        out_of_stock_items: outOfStockItems.results,
      };
    }

    case 'admin_update_store_settings': {
      const insideDhaka = args.inside_dhaka_delivery_bdt;
      const outsideDhaka = args.outside_dhaka_delivery_bdt;

      if (typeof insideDhaka === 'number' || typeof outsideDhaka === 'number') {
        const existing: any = await env.DB.prepare("SELECT value FROM store_settings WHERE key = 'shipping'").first();
        const current = safeJsonParse(existing?.value, { inside_dhaka: 70, outside_dhaka: 130 });
        if (typeof insideDhaka === 'number') current.inside_dhaka = insideDhaka;
        if (typeof outsideDhaka === 'number') current.outside_dhaka = outsideDhaka;

        await env.DB.prepare("INSERT OR REPLACE INTO store_settings (key, value) VALUES ('shipping', ?)").bind(JSON.stringify(current)).run();
      }

      return { success: true, message: 'Store settings updated successfully.' };
    }

    default:
      throw new Error(`Unknown admin tool: ${name}`);
  }
}

// ─── OAuth 2.0: Discovery Endpoints ───────────────────────────
// These tell Gemini where to find the auth & token endpoints
adminMcpRoutes.get('/.well-known/oauth-authorization-server', (c) => {
  const base = new URL(c.req.url).origin + '/api/v1/admin/mcp';
  return c.json({
    issuer: base,
    authorization_endpoint: base + '/oauth/authorize',
    token_endpoint: base + '/oauth/token',
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    grant_types_supported: ['authorization_code', 'client_credentials'],
    response_types_supported: ['code'],
    scopes_supported: ['admin'],
  });
});

adminMcpRoutes.get('/.well-known/openid-configuration', (c) => {
  const base = new URL(c.req.url).origin + '/api/v1/admin/mcp';
  return c.json({
    issuer: base,
    authorization_endpoint: base + '/oauth/authorize',
    token_endpoint: base + '/oauth/token',
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    grant_types_supported: ['authorization_code', 'client_credentials'],
    response_types_supported: ['code'],
    scopes_supported: ['admin'],
  });
});

// ─── OAuth 2.0: Authorization Endpoint ────────────────────────
// Gemini redirects here to get an auth code
adminMcpRoutes.get('/oauth/authorize', (c) => {
  const redirectUri = c.req.query('redirect_uri');
  const state = c.req.query('state') || '';

  // Generate a short-lived auth code (timestamp-based, validated at token stage)
  const code = `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  if (redirectUri) {
    try {
      const target = new URL(redirectUri);
      target.searchParams.set('code', code);
      if (state) target.searchParams.set('state', state);
      return c.redirect(target.toString());
    } catch {
      return c.json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' }, 400);
    }
  }

  return c.json({ code }, 200);
});

// ─── OAuth 2.0: Token Endpoint ─────────────────────────────────
// Gemini exchanges auth code + client_secret for access_token.
// Security: ONLY JWT_SECRET or DB mcp_secret is accepted — no bypass.
const handleOAuthToken = async (c: any) => {
  let clientSecret = '';

  // Method 1: HTTP Basic Auth (Authorization: Basic base64(client_id:client_secret))
  const authHeader = c.req.header('Authorization') || '';
  if (authHeader.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.slice(6));
      const colonIndex = decoded.indexOf(':');
      if (colonIndex !== -1) {
        // client_id is before colon, client_secret after
        clientSecret = decoded.slice(colonIndex + 1).trim();
      }
    } catch {}
  }

  // Method 2: Request body (client_secret in JSON or form)
  if (!clientSecret) {
    try {
      const contentType = c.req.header('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await c.req.json();
        clientSecret = (body.client_secret || '').trim();
      } else {
        const body = await c.req.parseBody();
        clientSecret = ((body.client_secret as string) || '').trim();
      }
    } catch {}
  }

  if (!clientSecret) {
    return c.json({
      error: 'invalid_client',
      error_description: 'client_secret is required',
    }, 401);
  }

  // ─── Strict Secret Validation (NO bypass) ─────────────────
  const envSecret = c.env.JWT_SECRET || '';
  let isValid = false;

  // Check 1: Match against environment JWT_SECRET
  if (envSecret && clientSecret === envSecret) {
    isValid = true;
  }

  // Check 2: Match against DB-stored mcp_secret / ai_admin_key
  if (!isValid) {
    try {
      const dbRow = (await c.env.DB.prepare(
        "SELECT value FROM store_settings WHERE key IN ('mcp_secret', 'ai_admin_key', 'mcp_key') LIMIT 1"
      ).first()) as { value: string } | null;

      if (dbRow?.value) {
        const storedKey = dbRow.value.replace(/^["']|["']$/g, '').trim();
        if (storedKey && clientSecret === storedKey) {
          isValid = true;
        }
      }
    } catch {}
  }

  if (!isValid) {
    return c.json({
      error: 'invalid_client',
      error_description: 'Invalid client_secret. Use your Admin API Key (JWT_SECRET).',
    }, 401);
  }

  // Issue access token (same value as the secret — Gemini will use this as Bearer)
  return c.json({
    access_token: clientSecret,
    token_type: 'Bearer',
    expires_in: 86400,
    scope: 'admin',
  });
};

adminMcpRoutes.post('/oauth/token', handleOAuthToken);
adminMcpRoutes.post('/token', handleOAuthToken);

// ─── GET: Admin MCP Manifest & Discovery ──────────────────────
adminMcpRoutes.get('/', async (c) => {
  const isAuth = await authenticateAdmin(c);
  if (!isAuth) {
    return c.json({
      error: 'Unauthorized',
      message: 'Admin MCP endpoint requires Authorization: Bearer <JWT_SECRET>',
    }, 401);
  }

  return c.json({
    name: 'store-admin-mcp',
    description: '\ Universal Admin Model Context Protocol (MCP) Server',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    endpoint: '/api/v1/admin/mcp',
    authenticated: true,
    total_tools: ADMIN_MCP_TOOLS.length,
    tools: ADMIN_MCP_TOOLS,
  });
});

// ─── POST: Admin JSON-RPC 2.0 Handler ─────────────────────────
adminMcpRoutes.post('/', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: Invalid JSON' } }, 400);
  }

  const { id = null, method, params = {} } = body;

  const isAuth = await authenticateAdmin(c);
  if (!isAuth) {
    return c.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: 'Unauthorized: Valid Admin API Key or Bearer Token required' },
    }, 401);
  }

  switch (method) {
    case 'initialize': {
      return c.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: 'store-admin-mcp',
            version: '1.0.0',
          },
        },
      });
    }

    case 'notifications/initialized': {
      return c.json({ jsonrpc: '2.0', id, result: {} });
    }

    case 'ping': {
      return c.json({ jsonrpc: '2.0', id, result: {} });
    }

    case 'tools/list': {
      return c.json({ jsonrpc: '2.0', id, result: { tools: ADMIN_MCP_TOOLS } });
    }

    case 'tools/call': {
      const toolName = params.name;
      const toolArgs = params.arguments || {};

      if (!toolName) {
        return c.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Invalid params: "name" is required' },
        });
      }

      try {
        const output = await executeAdminTool(toolName, toolArgs, c.env);
        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
              },
            ],
            isError: false,
          },
        });
      } catch (err: any) {
        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `Error executing admin tool ${toolName}: ${err.message}`,
              },
            ],
            isError: true,
          },
        });
      }
    }

    default: {
      return c.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
    }
  }
});

