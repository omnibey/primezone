import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const adminCustomerRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /api/v1/admin/customers
adminCustomerRoutes.get('/', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query('limit') || '50')));
  const search = c.req.query('search') || '';
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (search) {
    whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const sp = `%${search}%`;
    params.push(sp, sp, sp);
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM customers ${whereClause}`
  ).bind(...params).first<{ total: number }>();

  const customers = await c.env.DB.prepare(
    `SELECT id, name, email, phone, created_at FROM customers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return c.json({
    success: true,
    data: {
      customers: customers.results,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    }
  });
});

// GET /api/v1/admin/customers/:id
adminCustomerRoutes.get('/:id', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const id = c.req.param('id');
  
  const customer = await c.env.DB.prepare(
    'SELECT id, name, email, phone, created_at FROM customers WHERE id = ?'
  ).bind(id).first();

  if (!customer) return c.json({ success: false, message: 'Customer not found', code: 404 }, 404);

  // Get recent orders
  const orders = await c.env.DB.prepare(
    'SELECT * FROM orders WHERE email = ? OR phone = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(customer.email, customer.phone || '').all();

  return c.json({
    success: true,
    data: {
      customer,
      recent_orders: orders.results,
    }
  });
});
