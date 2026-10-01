// ============================================================
// STORE API — Main Hono Router (Cloudflare Worker)
// ============================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware } from './auth';
import { productRoutes } from './routes/products';
import { orderRoutes } from './routes/orders';
import { couponRoutes } from './routes/coupons';
import { settingsRoutes } from './routes/settings';
import { imageRoutes } from './routes/images';
import { dashboardRoutes } from './routes/dashboard';
import { categoryRoutes, adminCategoryRoutes } from './routes/categories';
import { adminsRoutes } from './routes/admins';
import { paymentRoutes } from './routes/payments';
import { authorize } from './auth';

// ─── Type Definitions ─────────────────────────────────────────
export type Env = {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  R2_PUBLIC_URL: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_D1_DATABASE_ID: string;
  CLOUDFLARE_R2_BUCKET_NAME: string;
  STORE_FRONTEND_URL?: string;
};

export type Variables = {
  adminId: number;
  adminEmail: string;
  adminName: string;
  adminPermissions: string[];
  customerId?: number;
  customerEmail?: string;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Global Middleware ────────────────────────────────────────
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use('*', logger());

// ─── Health Check ─────────────────────────────────────────────
app.get('/', (c) => c.json({ 
  name: 'Store API',
  version: '1.0.0',
  status: 'running' 
}));

import { publicPageRoutes, adminPageRoutes } from './routes/pages';
import { publicBlogRoutes, adminBlogRoutes } from './routes/blogs';

import { mcpRoutes } from './routes/mcp';
import { adminMcpRoutes } from './routes/adminMcp';
import { downloadRoutes } from './routes/downloads';
import { adminCustomerRoutes } from './routes/adminCustomers';

// ─── Public Routes ────────────────────────────────────────────
app.route('/api/v1/products', productRoutes);
app.route('/api/v1/orders', orderRoutes);
app.route('/api/v1/coupons', couponRoutes);
app.route('/api/v1/pages', publicPageRoutes);
app.route('/api/v1/blogs', publicBlogRoutes);
app.route('/api/v1/settings', settingsRoutes);
app.route('/api/v1/categories', categoryRoutes); 
app.route('/api/v1/downloads', downloadRoutes);
app.route('/api/v1/payments', paymentRoutes);

// ─── Admin Login (Unprotected) ────────────────────────────────
import { loginHandler } from './auth';
app.post('/api/v1/admin/login', loginHandler);

// ─── Customer Auth (Unprotected) ──────────────────────────────
import { customerAuthRoutes } from './routes/customerAuth';
app.route('/api/v1/auth/customer', customerAuthRoutes);

// ─── Customer Profile (Protected by customer auth) ──────────────
import { customerRoutes } from './routes/customer';
app.route('/api/v1/customer', customerRoutes);

// ============================================================
// Protected API Routes (Requires Token)
// ============================================================
app.use('/api/v1/admin/*', authMiddleware);
app.route('/api/v1/admin/dashboard', dashboardRoutes);
app.route('/api/v1/admin/products', productRoutes);
app.route('/api/v1/admin/orders', orderRoutes);
app.route('/api/v1/admin/coupons', couponRoutes);
app.route('/api/v1/admin/settings', settingsRoutes);
app.route('/api/v1/admin/categories', adminCategoryRoutes);
app.route('/api/v1/admin/customers', adminCustomerRoutes);

// Protected Admins Route
app.use('/api/v1/admin/admins/*', authorize('super_admin'));
app.route('/api/v1/admin/admins', adminsRoutes); 

app.get('/migrate', async (c) => {
  try {
    await c.env.DB.prepare(`ALTER TABLE admins ADD COLUMN permissions TEXT NOT NULL DEFAULT '["super_admin"]'`).run();
  } catch (e) {
    console.log('permissions column likely exists');
  }
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS order_logs (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        admin_name    TEXT    NOT NULL,
        action        TEXT    NOT NULL,
        changes       TEXT    DEFAULT NULL,
        note          TEXT    DEFAULT NULL,
        created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
      );
    `).run();
  } catch (e) {}
  return c.json({ success: true, message: 'Migration applied!' });
});
app.route('/api/v1/mcp', mcpRoutes);
app.route('/mcp', mcpRoutes); 
app.route('/api/v1/admin/mcp', adminMcpRoutes);
app.route('/admin/mcp', adminMcpRoutes); 



import { publicLandingRoutes, adminLandingRoutes } from './routes/landing';
app.route('/api/v1/landing', publicLandingRoutes);

// (Login handler moved to top)

// ─── Admin Routes (JWT Protected) ────────────────────────────
const adminApp = new Hono<{ Bindings: Env; Variables: Variables }>();
adminApp.use('*', authMiddleware);
adminApp.route('/products', productRoutes);
adminApp.route('/orders', orderRoutes);
adminApp.route('/coupons', couponRoutes);
adminApp.route('/settings', settingsRoutes);
adminApp.route('/images', imageRoutes);
adminApp.route('/dashboard', dashboardRoutes);
adminApp.route('/pages', adminPageRoutes);
adminApp.route('/blogs', adminBlogRoutes);
adminApp.route('/categories', adminCategoryRoutes);
adminApp.route('/landing', adminLandingRoutes);

import { reviewRoutes } from './routes/reviews';
adminApp.route('/reviews', reviewRoutes);

import { usageRoutes } from './routes/usage';
adminApp.route('/usage', usageRoutes);

import { trackingRoutes } from './routes/tracking';
app.route('/api/v1/tracking', trackingRoutes);
adminApp.route('/tracking', trackingRoutes);

import { analyticsRoutes } from './routes/analytics';
adminApp.route('/analytics', analyticsRoutes);

app.route('/api/v1/admin', adminApp);

// ─── OAuth 2.0 Discovery (Root-level, required by Gemini) ────────
// Gemini always fetches /.well-known/oauth-authorization-server
// from the root origin — NOT from the sub-path of the MCP endpoint.
const oauthMeta = (c: any) => {
  const origin = new URL(c.req.url).origin;
  const base = origin + '/api/v1/admin/mcp';
  return c.json({
    issuer: base,
    authorization_endpoint: base + '/oauth/authorize',
    token_endpoint: base + '/oauth/token',
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    grant_types_supported: ['authorization_code', 'client_credentials'],
    response_types_supported: ['code'],
    scopes_supported: ['admin'],
    code_challenge_methods_supported: ['S256'],
  });
};
app.get('/.well-known/oauth-authorization-server', oauthMeta);
app.get('/.well-known/openid-configuration', oauthMeta);

// ─── 404 Handler ──────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ─── Global Error Handler ─────────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

export default app;
