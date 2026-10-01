import { Hono, MiddlewareHandler } from 'hono';
import { hashPassword, verifyPassword, createJWT, verifyJWT } from '../auth';
import type { Env, Variables } from '../index';

export const customerAuthRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── POST /api/v1/auth/customer/register ─────────────────────────
customerAuthRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json<{ name: string; email: string; password?: string; phone?: string }>();
    if (!body.name || !body.email || !body.password) {
      return c.json({ success: false, message: 'Name, email and password are required', code: 400 }, 400);
    }

    const email = body.email.toLowerCase().trim();

    // Check if customer exists
    const existing = await c.env.DB.prepare('SELECT id FROM customers WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json({ success: false, message: 'Email already registered', code: 409 }, 409);
    }

    const passwordHash = await hashPassword(body.password);

    const result = await c.env.DB.prepare(
      `INSERT INTO customers (full_name, email, password_hash, phone) VALUES (?, ?, ?, ?)`
    ).bind(body.name, email, passwordHash, body.phone || null).run();

    const customerId = result.meta.last_row_id;

    // Link guest orders to this customer by email
    await c.env.DB.prepare(
      `UPDATE orders SET customer_id = ? WHERE email = ? AND customer_id IS NULL`
    ).bind(customerId, email).run();

    const token = await createJWT({ sub: customerId, email, role: 'customer' }, c.env.JWT_SECRET);

    return c.json({
      success: true,
      data: {
        token,
        customer: { id: customerId, name: body.name, email }
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return c.json({ success: false, message: 'Registration failed', error: (err as Error).message, code: 500 }, 500);
  }
});

// ─── POST /api/v1/auth/customer/login ────────────────────────────
customerAuthRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json<{ email: string; password?: string }>();
    if (!body.email || !body.password) {
      return c.json({ success: false, message: 'Email and password required', code: 400 }, 400);
    }

    const email = body.email.toLowerCase().trim();

    const customer = await c.env.DB.prepare(
      'SELECT id, full_name as name, email, password_hash FROM customers WHERE email = ?'
    ).bind(email).first<{ id: number; name: string; email: string; password_hash: string }>();

    if (!customer || !customer.password_hash) {
      return c.json({ success: false, message: 'Invalid credentials', code: 401 }, 401);
    }

    const valid = await verifyPassword(body.password, customer.password_hash);
    if (!valid) {
      return c.json({ success: false, message: 'Invalid credentials', code: 401 }, 401);
    }

    const token = await createJWT({ sub: customer.id, email: customer.email, role: 'customer' }, c.env.JWT_SECRET);

    return c.json({
      success: true,
      data: {
        token,
        customer: { id: customer.id, name: customer.name, email: customer.email }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return c.json({ success: false, message: 'Login failed', error: (err as Error).message, code: 500 }, 500);
  }
});

// ─── Customer Auth Middleware ────────────────────────────────────
export const customerAuthMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Unauthorized', code: 401 }, 401);
  }

  const token = authHeader.slice(7);
  const claims = await verifyJWT(token, c.env.JWT_SECRET);
  if (!claims || claims.role !== 'customer') {
    return c.json({ success: false, message: 'Invalid or expired token', code: 401 }, 401);
  }

  c.set('customerId', claims.sub as number);
  c.set('customerEmail', claims.email as string);
  
  await next();
};
