// ============================================================
// Store Settings Routes — Public read + Admin write
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';
import { hashPassword, verifyPassword } from '../auth';

export const settingsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── PUBLIC: Get Store Settings ───────────────────────────────
// GET /api/settings
// Returns only public-safe settings (no Telegram bot token, etc.)
settingsRoutes.get('/', async (c) => {
  const results = await c.env.DB.prepare(
    'SELECT key, value FROM store_settings'
  ).all<{ key: string; value: string }>();

  const settings: Record<string, unknown> = {};
  for (const row of results.results) {
    // Filter out sensitive settings for public access
    if (row.key === 'telegram') continue; // Never expose bot token to client
    if (row.key === 'ai') continue; // Never expose AI API keys to client
    try {
      const parsed = JSON.parse(row.value);
      if (row.key === 'marketing') {
        // Strip sensitive access tokens and api secrets for public response
        settings['marketing'] = {
          serverTracking: Boolean(parsed.serverTracking),
          meta: { enabled: parsed.meta?.enabled, pixelId: parsed.meta?.pixelId },
          tiktok: { enabled: parsed.tiktok?.enabled, pixelId: parsed.tiktok?.pixelId },
          ga4: { enabled: parsed.ga4?.enabled, measurementId: parsed.ga4?.measurementId, gtmContainerId: parsed.ga4?.gtmContainerId }
        };
      } else if (row.key === 'payments') {
        // Strip sensitive payment gateway keys for public response
        settings['payments'] = {
          cod_enabled: parsed.cod_enabled,
          cod_instructions: parsed.cod_instructions,
          manual_enabled: parsed.manual_enabled,
          manual_instructions: parsed.manual_instructions,
          manual_bkash: parsed.manual_bkash,
          manual_nagad: parsed.manual_nagad,
          manual_rocket: parsed.manual_rocket,
          manual_upay: parsed.manual_upay,
          sslcommerz: { enabled: parsed.sslcommerz?.enabled, is_live: parsed.sslcommerz?.is_live },
          aamarpay: { enabled: parsed.aamarpay?.enabled, is_live: parsed.aamarpay?.is_live },
          surjopay: { enabled: parsed.surjopay?.enabled, is_live: parsed.surjopay?.is_live },
          bkash_api: { enabled: parsed.bkash_api?.enabled, is_live: parsed.bkash_api?.is_live },
          nagad_api: { enabled: parsed.nagad_api?.enabled, is_live: parsed.nagad_api?.is_live }
        };
      } else {
        settings[row.key] = parsed;
      }
    } catch {
      settings[row.key] = row.value;
    }
  }

  c.header('Cache-Control', 'public, max-age=300, s-maxage=3600');
  return c.json({ success: true, data: { settings } });
});

// ─── ADMIN: Get All Settings (including sensitive) ────────────
// GET /api/admin/settings
settingsRoutes.get('/all', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const results = await c.env.DB.prepare(
    'SELECT key, value FROM store_settings'
  ).all<{ key: string; value: string }>();

  const settings: Record<string, unknown> = {};
  for (const row of results.results) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }

  return c.json({ success: true, data: { settings } });
});

// ─── ADMIN: Update Settings ───────────────────────────────────
// PUT /api/admin/settings
settingsRoutes.put('/', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  try {
    const body = await c.req.json();

    // Body is an object of { key: value } pairs
    for (const [key, value] of Object.entries(body)) {
      let finalValue = value;
      // Only deep merge specific keys that need it. Others like checkout_districts should fully overwrite.
      const mergeKeys = ['layout', 'footer', 'contact', 'telegram', 'delivery', 'marketing'];
      if (mergeKeys.includes(key) && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Fetch existing
        const existingRow = await c.env.DB.prepare('SELECT value FROM store_settings WHERE key = ?').bind(key).first<{ value: string }>();
        if (existingRow) {
          try {
            const existingVal = JSON.parse(existingRow.value);
            if (typeof existingVal === 'object' && existingVal !== null && !Array.isArray(existingVal)) {
              finalValue = { ...existingVal, ...value };
            }
          } catch (e) {}
        }
      }
      const valueStr = typeof finalValue === 'string' ? finalValue : JSON.stringify(finalValue);

      await c.env.DB.prepare(
        `INSERT INTO store_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?`
      ).bind(key, valueStr, valueStr).run();
    }

    return c.json({ success: true, data: { message: 'Settings updated' } });
  } catch (err) {
    console.error('Update settings error:', err);
    return c.json({ success: false, message: 'Failed to update settings', code: 500 }, 500);
  }
});

// ─── ADMIN: Change Password ──────────────────────────────────
// PUT /api/admin/settings/password
settingsRoutes.put('/password', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  try {
    const body = await c.req.json<{ currentPassword: string; newPassword: string }>();

    if (!body.currentPassword || !body.newPassword) {
      return c.json({ success: false, message: 'Current and new password required', code: 400 }, 400);
    }

    if (body.newPassword.length < 6) {
      return c.json({ success: false, message: 'New password must be at least 6 characters', code: 400 }, 400);
    }

    // Verify current password
    const admin = await c.env.DB.prepare(
      'SELECT password_hash FROM admins WHERE id = ?'
    ).bind(adminId).first<{ password_hash: string }>();

    if (!admin) return c.json({ success: false, message: 'Admin not found', code: 404 }, 404);

    const valid = await verifyPassword(body.currentPassword, admin.password_hash);
    if (!valid) {
      return c.json({ success: false, message: 'Current password is incorrect', code: 401 }, 401);
    }

    // Hash new password
    const newHash = await hashPassword(body.newPassword);
    await c.env.DB.prepare(
      'UPDATE admins SET password_hash = ? WHERE id = ?'
    ).bind(newHash, adminId).run();

    return c.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (err) {
    console.error('Change password error:', err);
    return c.json({ success: false, message: 'Failed to change password', code: 500 }, 500);
  }
});
