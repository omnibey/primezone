// ============================================================
// Order Routes — Public create/track + Admin management
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';
import { generateOrderId } from '../utils/order-id';
import { sendOrderNotification, type TelegramConfig } from '../telegram';
import { 
  initSSLCommerzPayment, 
  initAamarPayPayment, 
  initBkashPayment, 
  initNagadPayment,
  initEpsPayment,
  initStripePayment,
  initPaypalPayment
} from './payments';

export const orderRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── PUBLIC: Create Order ─────────────────────────────────────
// POST /api/orders
orderRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.customer_name || !body.phone || !body.address) {
      return c.json({ success: false, message: 'customer_name, phone, and address are required', code: 400 }, 400);
    }

    // Validate phone (Bangladesh format)
    const phone = body.phone.replace(/\D/g, '').slice(-11);
    if (phone.length !== 11 || !phone.startsWith('01')) {
      return c.json({ success: false, message: 'Invalid phone number', code: 400 }, 400);
    }

    // Validate items
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return c.json({ success: false, message: 'At least one item is required', code: 400 }, 400);
    }

    // Generate order ID
    const orderId = await generateOrderId(c.env.DB);

    // Calculate verified totals
    const subtotal = body.subtotal || 0;
    const deliveryFee = body.delivery_fee || 0;
    const discountAmount = body.discount_amount || 0;
    const totalAmount = subtotal - discountAmount + deliveryFee;

    // Validate payment
    const paymentMethod = body.payment_method || 'cod';
    if (paymentMethod === 'full') {
      if (!body.payment_provider) {
        return c.json({ success: false, message: 'Payment provider required for online payment', code: 400 }, 400);
      }
      if (!body.sender_number || body.sender_number.replace(/\D/g, '').length < 11) {
        return c.json({ success: false, message: 'Valid sender number required for online payment', code: 400 }, 400);
      }
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO orders (order_id, customer_name, phone, email, address, city, thana,
        delivery_area, subtotal, delivery_fee, discount_amount, coupon_code, total_amount,
        payment_method, payment_provider, sender_number, payment_status, notes, items, source, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`
    ).bind(
      orderId,
      body.customer_name,
      phone,
      body.email || null,
      body.address,
      body.city || '',
      body.thana || '',
      body.delivery_area || 'outside',
      subtotal,
      deliveryFee,
      discountAmount,
      body.coupon_code || null,
      totalAmount,
      paymentMethod,
      paymentMethod === 'full' ? body.payment_provider : null,
      paymentMethod === 'full' ? body.sender_number : null,
      paymentMethod === 'cod' ? 'Pending' : 'Verify Manual',
      body.notes || null,
      JSON.stringify(body.items),
      body.source || 'checkout_drawer'
    ).run();

    const orderNumericId = result.meta.last_row_id;
    if (orderNumericId) {
      for (const item of body.items) {
        if (!item.id) continue;
        const assets = await c.env.DB.prepare('SELECT id FROM digital_assets WHERE product_id = ?').bind(item.id).all();
        if (assets && assets.results) {
          for (const asset of assets.results) {
            const token = crypto.randomUUID();
            await c.env.DB.prepare('INSERT INTO order_downloads (order_id, digital_asset_id, token, download_limit) VALUES (?, ?, ?, ?)').bind(orderNumericId, asset.id, token, 10).run();
          }
        }
      }
    }

    // Increment coupon usage if applicable
    if (body.coupon_code) {
      await c.env.DB.prepare(
        'UPDATE coupons SET used_count = used_count + 1 WHERE code = ?'
      ).bind(body.coupon_code).run();
    }

    // Send Telegram notification (server-side, bot token hidden)
    try {
      const telegramSetting = await c.env.DB.prepare(
        "SELECT value FROM store_settings WHERE key = 'telegram'"
      ).first<{ value: string }>();

      if (telegramSetting) {
        const config = JSON.parse(telegramSetting.value) as TelegramConfig;
        await sendOrderNotification(config, {
          order_id: orderId,
          customer_name: body.customer_name,
          phone,
          address: body.address || '',
          city: body.city || '',
          total_amount: totalAmount,
          payment_method: paymentMethod,
          items: body.items,
        });
      }
    } catch (tgErr) {
      console.error('[Telegram] Notification failed (non-blocking):', tgErr);
    }

    // --- Payment Gateway Initialization ---
    let paymentUrl = null;
    try {
      if (['sslcommerz', 'aamarpay', 'bkash_api', 'nagad_api', 'eps', 'stripe', 'paypal'].includes(paymentMethod)) {
        const paymentsSetting = await c.env.DB.prepare("SELECT value FROM store_settings WHERE key = 'payments'").first<{ value: string }>();
        if (paymentsSetting) {
          const paymentsConfig = JSON.parse(paymentsSetting.value);
          const origin = c.env.STORE_FRONTEND_URL || c.req.url.split('/api/v1')[0];
          
          const orderDataForGateway = {
            order_id: orderId,
            total_amount: totalAmount,
            customer_name: body.customer_name,
            email: body.email,
            address: body.address,
            city: body.city,
            phone: phone
          };

          if (paymentMethod === 'sslcommerz' && paymentsConfig.sslcommerz) {
             paymentUrl = await initSSLCommerzPayment(c.env.DB, orderDataForGateway, paymentsConfig.sslcommerz, origin);
          } else if (paymentMethod === 'aamarpay' && paymentsConfig.aamarpay) {
             paymentUrl = await initAamarPayPayment(c.env.DB, orderDataForGateway, paymentsConfig.aamarpay, origin);
          } else if (paymentMethod === 'bkash_api' && paymentsConfig.bkash_api) {
             paymentUrl = await initBkashPayment(c.env.DB, orderDataForGateway, paymentsConfig.bkash_api, origin);
          } else if (paymentMethod === 'nagad_api' && paymentsConfig.nagad_api) {
             paymentUrl = await initNagadPayment(c.env.DB, orderDataForGateway, paymentsConfig.nagad_api, origin);
          } else if (paymentMethod === 'eps' && paymentsConfig.eps) {
             paymentUrl = await initEpsPayment(c.env.DB, orderDataForGateway, paymentsConfig.eps, origin);
          } else if (paymentMethod === 'stripe' && paymentsConfig.stripe) {
             paymentUrl = await initStripePayment(c.env.DB, orderDataForGateway, paymentsConfig.stripe, origin, paymentsConfig.usd_exchange_rate || 120);
          } else if (paymentMethod === 'paypal' && paymentsConfig.paypal) {
             paymentUrl = await initPaypalPayment(c.env.DB, orderDataForGateway, paymentsConfig.paypal, origin, paymentsConfig.usd_exchange_rate || 120);
          }
        }
      }
    } catch (payErr) {
      console.error('[Payment Init Error]:', payErr);
      // We don't fail the order creation, we just won't return a payment_url,
      // so the frontend will redirect to thank-you page with Pending status.
    }

    return c.json({ 
      success: true, 
      data: { 
        order_id: orderId, 
        total_amount: totalAmount, 
        payment_url: paymentUrl,
        message: 'Order placed successfully' 
      } 
    }, 201);
  } catch (err) {
    console.error('Create order error:', err);
    return c.json({ success: false, message: 'Failed to create order', error: (err as Error).message, code: 500 }, 500);
  }
});

// ─── PUBLIC: Track Specific Order ─────────────────────────────
// GET /api/orders/track?phone=01XXXXXXXXX&order_id=KOT-XXXXXX
orderRoutes.get('/track', async (c) => {
  const rawPhone = c.req.query('phone') || '';
  const orderId = c.req.query('order_id') || '';
  const phone = rawPhone.replace(/\D/g, '').slice(-11);

  if (phone.length < 11) {
    return c.json({ success: false, message: 'Valid 11-digit phone number required', code: 400 }, 400);
  }
  if (!orderId) {
    return c.json({ success: false, message: 'Order ID is required for tracking', code: 400 }, 400);
  }

  // Query by phone and order_id
  const results = await c.env.DB.prepare(
    `SELECT order_id, customer_name, phone, status, total_amount,
            payment_method, items, created_at, delivery_fee, subtotal, discount_amount, address, city
     FROM orders
     WHERE (phone = ? OR phone = ?) AND order_id = ?
     LIMIT 1`
  ).bind(phone, '+88' + phone, orderId).all();

  if (!results.results.length) {
    return c.json({ success: false, message: 'No matching order found for this phone number and Order ID', code: 404 }, 404);
  }

  const order = results.results[0];
  const orderData = {
    ...order,
    items: safeJsonParse(order.items as string, []),
  };

  return c.json({ success: true, data: { order: orderData } });
});

// ─── ADMIN: Create Manual Order ────────────────────────────────
// POST /api/admin/orders/manual
orderRoutes.post('/manual', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) {
    return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);
  }

  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.customer_name || !body.phone || !body.address) {
      return c.json({ success: false, message: 'customer_name, phone, and address are required', code: 400 }, 400);
    }

    // Validate items
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return c.json({ success: false, message: 'At least one item is required', code: 400 }, 400);
    }

    // Generate order ID
    const orderId = await generateOrderId(c.env.DB);

    // Extract raw values from the request
    const phone = body.phone;
    const subtotal = body.subtotal || 0;
    const deliveryFee = body.delivery_fee || 0;
    const discountAmount = body.discount_amount || 0;
    const totalAmount = subtotal - discountAmount + deliveryFee;
    const paymentMethod = body.payment_method || 'cod';

    await c.env.DB.prepare(
      `INSERT INTO orders (order_id, customer_name, phone, email, address, city, thana,
        delivery_area, subtotal, delivery_fee, discount_amount, coupon_code, total_amount,
        payment_method, payment_provider, sender_number, payment_status, notes, items, source, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`
    ).bind(
      orderId,
      body.customer_name,
      phone,
      body.email || null,
      body.address,
      body.city || '',
      body.thana || '',
      body.delivery_area || 'outside',
      subtotal,
      deliveryFee,
      discountAmount,
      null, // No coupon code for manual discounts
      totalAmount,
      paymentMethod,
      paymentMethod === 'full' ? body.payment_provider : null,
      paymentMethod === 'full' ? body.sender_number : null,
      paymentMethod === 'cod' ? 'Pending' : 'Verify Manual',
      body.notes || null,
      JSON.stringify(body.items),
      body.source || 'Manual',
    ).run();

    // Send Telegram notification (server-side, bot token hidden)
    try {
      const telegramSetting = await c.env.DB.prepare(
        "SELECT value FROM store_settings WHERE key = 'telegram'"
      ).first<{ value: string }>();

      if (telegramSetting) {
        const config = JSON.parse(telegramSetting.value) as TelegramConfig;
        await sendOrderNotification(config, {
          order_id: orderId,
          customer_name: body.customer_name,
          phone,
          address: body.address,
          delivery_area: body.delivery_area || 'outside',
          items: body.items,
          subtotal,
          delivery_fee: deliveryFee,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          source: body.source || 'Manual'
        });
      }
    } catch (err) {
      console.error('Failed to send Telegram notification:', err);
    }

    return c.json({ success: true, message: 'Order created successfully', data: { order_id: orderId } });
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Internal Server Error', code: 500 }, 500);
  }
});

// ─── ADMIN: List Orders ───────────────────────────────────────
// GET /api/admin/orders?status=All&search=X&dateFrom=X&dateTo=X&page=1&limit=50
orderRoutes.get('/', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query('limit') || '50')));
  const status = c.req.query('status') || 'All';
  const search = c.req.query('search') || '';
  const dateFrom = c.req.query('dateFrom') || '';
  const dateTo = c.req.query('dateTo') || '';
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (status !== 'All') {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    whereClause += ' AND (order_id LIKE ? OR phone LIKE ? OR customer_name LIKE ?)';
    const sp = `%${search}%`;
    params.push(sp, sp, sp);
  }

  if (dateFrom) {
    whereClause += ' AND created_at >= ?';
    params.push(dateFrom);
  }

  if (dateTo) {
    whereClause += ' AND created_at <= ?';
    params.push(dateTo + 'T23:59:59');
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM orders ${whereClause}`
  ).bind(...params).first<{ total: number }>();

  const orders = await c.env.DB.prepare(
    `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return c.json({
    success: true,
    data: {
      orders: orders.results.map(o => ({
        ...o,
        items: safeJsonParse(o.items as string, []),
      })),
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    }
  });
});

// ─── ADMIN: Get Single Order ──────────────────────────────────
// GET /api/admin/orders/:id
orderRoutes.get('/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = c.req.param('id');
  const order = await c.env.DB.prepare(
    'SELECT * FROM orders WHERE order_id = ? OR id = ?'
  ).bind(id, parseInt(id) || 0).first();

  if (!order) return c.json({ success: false, message: 'Order not found', code: 404 }, 404);

  return c.json({
    success: true,
    data: {
      order: {
        ...order,
        items: safeJsonParse(order.items as string, []),
      },
    }
  });
});

// ─── ADMIN: Update Order Status ───────────────────────────────
// PUT /api/admin/orders/:id
orderRoutes.put('/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = c.req.param('id');
  const body = await c.req.json();

  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
  if (body.status && !validStatuses.includes(body.status)) {
    return c.json({ success: false, message: 'Invalid status', code: 400 }, 400);
  }

  // Build dynamic update
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.status) { updates.push('status = ?'); values.push(body.status); }
  if (body.payment_status) { updates.push('payment_status = ?'); values.push(body.payment_status); }
  if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes); }

  if (body.customer_name) { updates.push('customer_name = ?'); values.push(body.customer_name); }
  if (body.phone) { updates.push('phone = ?'); values.push(body.phone); }
  if (body.email !== undefined) { updates.push('email = ?'); values.push(body.email); }
  if (body.address) { updates.push('address = ?'); values.push(body.address); }
  if (body.city !== undefined) { updates.push('city = ?'); values.push(body.city); }
  if (body.thana !== undefined) { updates.push('thana = ?'); values.push(body.thana); }
  if (body.delivery_area) { updates.push('delivery_area = ?'); values.push(body.delivery_area); }
  
  if (body.subtotal !== undefined) { updates.push('subtotal = ?'); values.push(body.subtotal); }
  if (body.delivery_fee !== undefined) { updates.push('delivery_fee = ?'); values.push(body.delivery_fee); }
  if (body.discount_amount !== undefined) { updates.push('discount_amount = ?'); values.push(body.discount_amount); }
  if (body.total_amount !== undefined) { updates.push('total_amount = ?'); values.push(body.total_amount); }
  
  if (body.payment_method) { updates.push('payment_method = ?'); values.push(body.payment_method); }
  if (body.payment_provider !== undefined) { updates.push('payment_provider = ?'); values.push(body.payment_provider); }
  if (body.sender_number !== undefined) { updates.push('sender_number = ?'); values.push(body.sender_number); }
  
  if (body.source) { updates.push('source = ?'); values.push(body.source); }
  if (body.items) { updates.push('items = ?'); values.push(JSON.stringify(body.items)); }

  updates.push("updated_at = datetime('now')");

  if (updates.length === 1) {
    return c.json({ success: false, message: 'No fields to update', code: 400 }, 400);
  }

  const orderBefore = await c.env.DB.prepare(
    'SELECT order_id, status FROM orders WHERE order_id = ? OR id = ?'
  ).bind(id, parseInt(id) || 0).first<{ order_id: string; status: string }>();

  if (!orderBefore) {
    return c.json({ success: false, message: 'Order not found', code: 404 }, 404);
  }

  await c.env.DB.prepare(
    `UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`
  ).bind(...values, orderBefore.order_id).run();

  // Log the update
  const adminName = c.get('adminName') || 'Unknown Admin';
    
  // Capture detailed changes
  const detailedChanges: any = {};
  if (body.status && body.status !== orderBefore.status) {
    detailedChanges.status = { from: orderBefore.status, to: body.status };
  }
  
  // For other fields, just log that they were changed
  const otherFields = Object.keys(body).filter(k => k !== 'restock' && k !== 'status');
  if (otherFields.length > 0) {
    detailedChanges.updated_fields = otherFields.join(', ');
  }
    
  await c.env.DB.prepare(
    `INSERT INTO order_logs (order_id, admin_name, action, changes) VALUES (?, ?, ?, ?)`
  ).bind(
    orderBefore.order_id,
    adminName,
    'Updated Order',
    JSON.stringify(detailedChanges)
  ).run();

  // Handle stock restoration for Cancelled/Returned orders
  if (body.restock && (body.status === 'Cancelled' || body.status === 'Returned')) {
    const order = await c.env.DB.prepare(
      'SELECT items FROM orders WHERE order_id = ? OR id = ?'
    ).bind(id, parseInt(id) || 0).first<{ items: string }>();

    if (order) {
      const items = safeJsonParse(order.items, []) as Array<{ sku?: string; quantity: number }>;
      for (const item of items) {
        if (item.sku) {
          // Restore stock to main product or variant
          await c.env.DB.prepare(
            'UPDATE products SET stock = stock + ? WHERE sku = ? AND is_unlimited_stock = 0'
          ).bind(item.quantity, item.sku).run();
          await c.env.DB.prepare(
            'UPDATE product_variants SET stock = stock + ? WHERE sku = ? AND is_unlimited_stock = 0'
          ).bind(item.quantity, item.sku).run();
        }
      }
    }
  }

  return c.json({ success: true, data: { message: 'Order updated' } });
});

// 🔸🔸🔸 ADMIN: Order Logs 🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸
// GET /api/admin/orders/:id/logs
orderRoutes.get('/:id/logs', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = c.req.param('id');
  const order = await c.env.DB.prepare('SELECT order_id FROM orders WHERE order_id = ? OR id = ?').bind(id, parseInt(id) || 0).first<{ order_id: string }>();
  if (!order) return c.json({ success: false, message: 'Order not found', code: 404 }, 404);

  const logs = await c.env.DB.prepare(
    'SELECT * FROM order_logs WHERE order_id = ? ORDER BY created_at DESC'
  ).bind(order.order_id).all();

  return c.json({ success: true, data: { logs: logs.results } });
});

// POST /api/admin/orders/:id/logs
orderRoutes.post('/:id/logs', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = c.req.param('id');
  const body = await c.req.json();
  if (!body.note) return c.json({ success: false, message: 'Note is required', code: 400 }, 400);

  const order = await c.env.DB.prepare('SELECT order_id FROM orders WHERE order_id = ? OR id = ?').bind(id, parseInt(id) || 0).first<{ order_id: string }>();
  if (!order) return c.json({ success: false, message: 'Order not found', code: 404 }, 404);

  const adminName = c.get('adminName') || 'Unknown Admin';

  await c.env.DB.prepare(
    `INSERT INTO order_logs (order_id, admin_name, action, note) VALUES (?, ?, ?, ?)`
  ).bind(order.order_id, adminName, 'Added Note', body.note).run();

  return c.json({ success: true, data: { message: 'Log added successfully' } });
});

// 🔸🔸🔸 ADMIN: Delete Order 🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸
// DELETE /api/admin/orders/:id
orderRoutes.delete('/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = c.req.param('id');
  await c.env.DB.prepare(
    'DELETE FROM orders WHERE order_id = ? OR id = ?'
  ).bind(id, parseInt(id) || 0).run();

  return c.json({ success: true, data: { message: 'Order deleted' } });
});

// ─── Helper ───────────────────────────────────────────────────
function safeJsonParse(str: string | null | undefined, fallback: unknown): unknown {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}
