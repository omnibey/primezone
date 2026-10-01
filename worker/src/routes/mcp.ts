// ============================================================
// Model Context Protocol (MCP) & WebMCP Complete Server
// Cloudflare Workers Native JSON-RPC 2.0 MCP Server
// 100% Aligned with schema.sql & D1 Database Schema
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const mcpRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── 1. MCP Tools Specifications ─────────────────────────────
const MCP_TOOLS = [
  {
    name: 'search_products',
    description: 'Search products in the \ store by keyword, category slug, or price range. Returns product details, pricing, discount, stock, and images.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword for product title, description, or tags (e.g., "centella", "moisturizer", "sunscreen")',
        },
        category: {
          type: 'string',
          description: 'Optional category slug (e.g., "skin-care", "hair-care", "face-wash")',
        },
        min_price: {
          type: 'number',
          description: 'Minimum product price in BDT',
        },
        max_price: {
          type: 'number',
          description: 'Maximum product price in BDT',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of items to return (default: 10, max: 25)',
        },
      },
    },
  },
  {
    name: 'get_product_details',
    description: 'Get full product specifications, ingredients/description, price, compare price, variations, and availability for a specific product by slug or ID.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Product URL slug or unique product identifier',
        },
        id: {
          type: 'number',
          description: 'Numeric product ID (if slug is not known)',
        },
      },
    },
  },
  {
    name: 'track_order',
    description: 'Track live status, shipping progress, delivery address, items ordered, total amount, and courier consignment details for an order.',
    inputSchema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'The 11-digit Bangladeshi customer phone number used during checkout (e.g., "01712345678")',
        },
        order_id: {
          type: 'string',
          description: 'The \ Order ID (e.g., "KOT-123456")',
        },
      },
      required: ['phone', 'order_id'],
    },
  },
  {
    name: 'list_categories',
    description: 'Retrieve all active product categories, departments, and homepage featured collections from \.',
    inputSchema: {
      type: 'object',
      properties: {
        homepage_only: {
          type: 'boolean',
          description: 'If true, returns only categories featured on the homepage',
        },
      },
    },
  },
  {
    name: 'get_flash_sales',
    description: 'Retrieve all ongoing flash sale discounts, hot deals, special campaign items, and promotional prices.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of flash sale items to fetch (default: 12)',
        },
      },
    },
  },
  {
    name: 'validate_coupon',
    description: 'Check whether a coupon discount code is valid, its discount type (% or fixed BDT), value, and minimum order requirements.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Coupon promo code (e.g., "SAVE10", "WELCOME")',
        },
        order_amount: {
          type: 'number',
          description: 'Total cart subtotal in BDT to verify minimum spend qualification',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'get_product_reviews',
    description: 'Retrieve verified customer reviews, ratings (1-5 stars), and customer feedback for a product.',
    inputSchema: {
      type: 'object',
      properties: {
        product_slug: {
          type: 'string',
          description: 'Slug of the product to fetch reviews for',
        },
        product_id: {
          type: 'number',
          description: 'ID of the product (optional if slug is given)',
        },
      },
    },
  },
  {
    name: 'get_store_info',
    description: 'Get store contact details, shipping delivery rates (inside/outside Dhaka), Cash on Delivery policy, and customer service information.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ─── 2. MCP Resources Specifications ──────────────────────────
const MCP_RESOURCES = [
  {
    uri: 'store://catalog/products',
    name: 'Product Catalog Summary',
    description: 'Live snapshot of all active products with titles, prices, and stock status.',
    mimeType: 'application/json',
  },
  {
    uri: 'store://catalog/categories',
    name: 'Store Categories Hierarchy',
    description: 'Complete list of departments and categories available on \.',
    mimeType: 'application/json',
  },
  {
    uri: 'store://store/policies',
    name: 'Store Policies & Terms',
    description: 'Official return/refund policies, terms of service, and delivery guidelines.',
    mimeType: 'application/json',
  },
];

// ─── 3. MCP Prompts Specifications ────────────────────────────
const MCP_PROMPTS = [
  {
    name: 'shopping_consultant',
    description: 'Prompt guiding the AI to assist customers with product recommendations, ingredient analysis, and beauty routine suggestions.',
    arguments: [
      {
        name: 'customer_preference',
        description: 'Customer skin type, hair condition, or desired product benefit (e.g., dry skin, oily acne-prone, brightening)',
        required: true,
      },
    ],
  },
  {
    name: 'order_support_agent',
    description: 'Prompt guiding the AI to provide friendly customer support for order tracking and delivery status verification.',
    arguments: [
      {
        name: 'order_id',
        description: 'Order ID to investigate',
        required: false,
      },
    ],
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

// ─── Tool Execution Engine ────────────────────────────────────
async function executeTool(name: string, args: Record<string, any>, env: Env): Promise<any> {
  switch (name) {
    case 'search_products': {
      const query = (args.query || '').trim();
      const category = (args.category || '').trim();
      const minPrice = typeof args.min_price === 'number' ? args.min_price : null;
      const maxPrice = typeof args.max_price === 'number' ? args.max_price : null;
      const limit = Math.min(25, Math.max(1, parseInt(args.limit || '10')));

      let sql = `SELECT id, title, slug, sku, category, brand, description, tags, images, base_price, original_price, stock, is_unlimited_stock, is_flash_sale 
                 FROM products 
                 WHERE status = 'active'`;
      const params: (string | number)[] = [];

      if (query) {
        sql += ` AND (title LIKE ? OR description LIKE ? OR tags LIKE ? OR sku LIKE ?)`;
        const p = `%${query}%`;
        params.push(p, p, p, p);
      }

      if (category) {
        sql += ` AND (LOWER(category) = LOWER(?) OR id IN (SELECT product_id FROM product_categories JOIN categories ON product_categories.category_id = categories.id WHERE LOWER(categories.slug) = LOWER(?)))`;
        params.push(category, category);
      }

      if (minPrice !== null) {
        sql += ` AND base_price >= ?`;
        params.push(minPrice);
      }

      if (maxPrice !== null) {
        sql += ` AND base_price <= ?`;
        params.push(maxPrice);
      }

      sql += ` ORDER BY created_at DESC LIMIT ?`;
      params.push(limit);

      const { results } = await env.DB.prepare(sql).bind(...params).all();
      return {
        total_found: results.length,
        products: results.map((p: any) => {
          const imgs = safeJsonParse(p.images, []);
          return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            category: p.category,
            brand: p.brand,
            price_bdt: p.base_price,
            original_price_bdt: p.original_price,
            stock: p.stock,
            is_unlimited_stock: Boolean(p.is_unlimited_stock),
            in_stock: p.stock > 0 || p.is_unlimited_stock === 1,
            is_flash_sale: Boolean(p.is_flash_sale),
            featured_image: imgs[0] || '',
            images: imgs,
            tags: safeJsonParse(p.tags, []),
          };
        }),
      };
    }

    case 'get_product_details': {
      const slug = (args.slug || '').trim();
      const id = args.id;

      let product: any = null;
      if (slug) {
        product = await env.DB.prepare(`SELECT * FROM products WHERE slug = ? AND status = 'active' LIMIT 1`).bind(slug).first();
      } else if (id) {
        product = await env.DB.prepare(`SELECT * FROM products WHERE id = ? AND status = 'active' LIMIT 1`).bind(id).first();
      }

      if (!product) {
        return { error: 'Product not found' };
      }

      const variants = await env.DB.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC').bind(product.id).all();

      const imgs = safeJsonParse(product.images, []);
      return {
        id: product.id,
        title: product.title,
        slug: product.slug,
        sku: product.sku,
        category: product.category,
        brand: product.brand,
        description: product.description,
        price_bdt: product.base_price,
        original_price_bdt: product.original_price,
        stock: product.stock,
        is_unlimited_stock: Boolean(product.is_unlimited_stock),
        in_stock: product.stock > 0 || product.is_unlimited_stock === 1,
        is_flash_sale: Boolean(product.is_flash_sale),
        free_delivery: Boolean(product.free_delivery),
        featured_image: imgs[0] || '',
        images: imgs,
        tags: safeJsonParse(product.tags, []),
        variants: variants.results.map((v: any) => ({
          ...v,
          options: safeJsonParse(v.options, {}),
        })),
      };
    }

    case 'track_order': {
      const rawPhone = (args.phone || '').trim();
      const orderId = (args.order_id || '').trim();
      const phone = rawPhone.replace(/\D/g, '').slice(-11);

      if (phone.length < 11 || !orderId) {
        return { error: 'Valid 11-digit Bangladeshi phone number and Order ID (e.g., KOT-XXXXXX) are required.' };
      }

      const order: any = await env.DB.prepare(
        `SELECT order_id, customer_name, phone, status, total_amount, subtotal, delivery_fee, discount_amount,
                payment_method, items, created_at, address, city, thana, delivery_area
         FROM orders
         WHERE (phone = ? OR phone = ?) AND order_id = ?
         LIMIT 1`
      ).bind(phone, '+88' + phone, orderId).first();

      if (!order) {
        return { error: `No matching order found for phone ${phone} and order ID ${orderId}` };
      }

      return {
        order_id: order.order_id,
        customer_name: order.customer_name,
        status: order.status,
        total_amount_bdt: order.total_amount,
        subtotal_bdt: order.subtotal,
        delivery_fee_bdt: order.delivery_fee,
        discount_amount_bdt: order.discount_amount,
        delivery_address: `${order.address}, ${order.thana || ''} ${order.city || ''}`.trim(),
        payment_method: order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : order.payment_method,
        order_date: order.created_at,
        items: safeJsonParse(order.items, []),
      };
    }

    case 'list_categories': {
      const homepageOnly = Boolean(args.homepage_only);
      let sql = `SELECT id, name, slug, image_url, parent_id, sort_order, show_on_homepage FROM categories WHERE is_active = 1`;
      if (homepageOnly) {
        sql += ` AND show_on_homepage = 1`;
      }
      sql += ` ORDER BY sort_order ASC`;

      const { results } = await env.DB.prepare(sql).all();
      return {
        categories: results,
      };
    }

    case 'get_flash_sales': {
      const limit = Math.min(24, Math.max(1, parseInt(args.limit || '12')));
      const { results } = await env.DB.prepare(
        `SELECT id, title, slug, base_price, original_price, category, stock, is_unlimited_stock, images, description
         FROM products
         WHERE status = 'active' AND is_flash_sale = 1
         ORDER BY id DESC
         LIMIT ?`
      ).bind(limit).all();

      return {
        flash_sales_count: results.length,
        items: results.map((p: any) => {
          const imgs = safeJsonParse(p.images, []);
          const discountPct = p.original_price && p.original_price > p.base_price
            ? Math.round(((p.original_price - p.base_price) / p.original_price) * 100)
            : 0;
          return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            price_bdt: p.base_price,
            original_price_bdt: p.original_price,
            discount_percentage: discountPct,
            featured_image: imgs[0] || '',
            in_stock: p.stock > 0 || p.is_unlimited_stock === 1,
          };
        }),
      };
    }

    case 'validate_coupon': {
      const code = (args.code || '').trim().toUpperCase();
      const orderAmount = parseFloat(args.order_amount || '0');

      if (!code) return { error: 'Coupon code is required' };

      const coupon: any = await env.DB.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').bind(code).first();
      if (!coupon) {
        return { is_valid: false, message: 'Invalid or inactive coupon code' };
      }

      if (coupon.min_order && orderAmount < coupon.min_order) {
        return {
          is_valid: false,
          message: `Minimum order amount of ৳${coupon.min_order} required for this coupon.`,
        };
      }

      let discountAmount = 0;
      if (coupon.type.toLowerCase() === 'percentage') {
        discountAmount = (orderAmount * coupon.value) / 100;
      } else {
        discountAmount = coupon.value;
      }

      return {
        is_valid: true,
        code: coupon.code,
        discount_type: coupon.type,
        discount_value: coupon.value,
        estimated_discount_bdt: discountAmount,
      };
    }

    case 'get_product_reviews': {
      const slug = (args.product_slug || '').trim();
      const id = args.product_id;

      let sql = `SELECT r.id, r.reviewer_name, r.rating, r.body, r.verified, r.created_at 
                 FROM reviews r 
                 JOIN products p ON r.product_id = p.id 
                 WHERE r.approved = 1`;
      const params: (string | number)[] = [];

      if (slug) {
        sql += ` AND p.slug = ?`;
        params.push(slug);
      } else if (id) {
        sql += ` AND p.id = ?`;
        params.push(id);
      }

      sql += ` ORDER BY r.created_at DESC LIMIT 20`;
      const { results } = await env.DB.prepare(sql).bind(...params).all();

      const averageRating = results.length > 0 
        ? (results.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / results.length).toFixed(1) 
        : null;

      return {
        total_reviews: results.length,
        average_rating: averageRating,
        reviews: results,
      };
    }

    case 'get_store_info': {
      const rows = await env.DB.prepare(`SELECT key, value FROM store_settings WHERE key IN ('layout', 'footer', 'shipping')`).all<{ key: string; value: string }>();
      const settings: Record<string, any> = {};
      for (const row of rows.results) {
        settings[row.key] = safeJsonParse(row.value, {});
      }

      return {
        store_name: settings.layout?.store_name || 'Store',
        currency: 'BDT (৳)',
        hotline: settings.footer?.phone || '01XXXXXXXXX',
        email: settings.footer?.email || 'support@example.com',
        shipping_rates: {
          inside_dhaka_bdt: settings.shipping?.inside_dhaka || 70,
          outside_dhaka_bdt: settings.shipping?.outside_dhaka || 130,
        },
        payment_methods_accepted: ['Cash on Delivery (COD)', 'bKash / Nagad Mobile Banking'],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── Resource Reader Engine ───────────────────────────────────
async function readResource(uri: string, env: Env): Promise<any> {
  switch (uri) {
    case 'store://catalog/products': {
      const { results } = await env.DB.prepare(
        `SELECT id, title, slug, base_price, original_price, category, stock, is_unlimited_stock FROM products WHERE status = 'active' LIMIT 50`
      ).all();
      return results;
    }
    case 'store://catalog/categories': {
      const { results } = await env.DB.prepare(`SELECT id, name, slug, image_url, show_on_homepage FROM categories WHERE is_active = 1`).all();
      return results;
    }
    case 'store://store/policies': {
      const { results } = await env.DB.prepare(`SELECT slug, title, content FROM pages WHERE status = 'published'`).all();
      return results;
    }
    default:
      throw new Error(`Resource not found for URI: ${uri}`);
  }
}

// ─── GET: Discovery & Manifest Endpoint ───────────────────────
mcpRoutes.get('/', async (c) => {
  return c.json({
    name: 'store-mcp',
    description: '\ Full E-Commerce Model Context Protocol (MCP) and WebMCP Server',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    endpoint: '/api/v1/mcp',
    capabilities: {
      tools: MCP_TOOLS.length,
      resources: MCP_RESOURCES.length,
      prompts: MCP_PROMPTS.length,
    },
    tools: MCP_TOOLS,
    resources: MCP_RESOURCES,
    prompts: MCP_PROMPTS,
  });
});

// ─── POST: JSON-RPC 2.0 Handler ───────────────────────────────
mcpRoutes.post('/', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: Invalid JSON' } }, 400);
  }

  const { id = null, method, params = {} } = body;

  switch (method) {
    case 'initialize': {
      return c.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
            resources: { listChanged: false, subscribe: false },
            prompts: { listChanged: false },
          },
          serverInfo: {
            name: 'store-mcp',
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
      return c.json({ jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } });
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
        const output = await executeTool(toolName, toolArgs, c.env);
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
                text: `Error executing tool ${toolName}: ${err.message}`,
              },
            ],
            isError: true,
          },
        });
      }
    }

    case 'resources/list': {
      return c.json({ jsonrpc: '2.0', id, result: { resources: MCP_RESOURCES } });
    }

    case 'resources/read': {
      const uri = params.uri;
      try {
        const data = await readResource(uri, c.env);
        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(data, null, 2),
              },
            ],
          },
        });
      } catch (err: any) {
        return c.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: err.message },
        });
      }
    }

    case 'prompts/list': {
      return c.json({ jsonrpc: '2.0', id, result: { prompts: MCP_PROMPTS } });
    }

    case 'prompts/get': {
      const promptName = params.name;
      if (promptName === 'shopping_consultant') {
        const pref = params.arguments?.customer_preference || 'general beauty recommendations';
        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            description: '\ Skincare & Beauty Advisor',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `You are \'s friendly expert shopping consultant. The customer is interested in: "${pref}". Use the search_products and get_product_details tools to recommend suitable authentic products, explain key benefits, ingredients, and current promotional prices in BDT.`,
                },
              },
            ],
          },
        });
      }

      if (promptName === 'order_support_agent') {
        const orderId = params.arguments?.order_id || '';
        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            description: '\ Order Delivery & Customer Support Agent',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `You are \'s Customer Support Assistant. Help the customer track their order ${orderId ? `(Order ID: ${orderId})` : ''} using the track_order tool. Politely ask for their 11-digit phone number if not provided, and clearly summarize delivery address, courier progress, and payment status.`,
                },
              },
            ],
          },
        });
      }

      return c.json({ jsonrpc: '2.0', id, error: { code: -32602, message: `Prompt not found: ${promptName}` } });
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
