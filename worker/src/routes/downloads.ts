import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const downloadRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /api/v1/downloads/:token
downloadRoutes.get('/:token', async (c) => {
  const token = c.req.param('token');

  try {
    // 1. Fetch token and associated order + asset
    const downloadRecord = await c.env.DB.prepare(`
      SELECT 
        od.id as download_id,
        od.downloads_count,
        od.download_limit,
        o.status as order_status,
        o.payment_status,
        da.file_url,
        da.file_name
      FROM order_downloads od
      JOIN orders o ON od.order_id = o.id
      JOIN digital_assets da ON od.digital_asset_id = da.id
      WHERE od.token = ?
    `).bind(token).first<{
      download_id: number;
      downloads_count: number;
      download_limit: number;
      order_status: string;
      payment_status: string;
      file_url: string;
      file_name: string;
    }>();

    if (!downloadRecord) {
      return c.json({ success: false, message: 'Invalid download link.', code: 404 }, 404);
    }

    // 2. Validate Order Status
    const validStatuses = ['Processing', 'Shipped', 'Delivered'];
    if (!validStatuses.includes(downloadRecord.order_status) && downloadRecord.payment_status !== 'Paid') {
      return c.json({ 
        success: false, 
        message: 'Order is not yet processed or paid. Please wait for verification.', 
        code: 403 
      }, 403);
    }

    // 3. Validate Download Limit
    if (downloadRecord.download_limit !== -1 && downloadRecord.downloads_count >= downloadRecord.download_limit) {
      return c.json({ success: false, message: 'Download limit exceeded.', code: 403 }, 403);
    }

    // 4. Increment download count
    await c.env.DB.prepare(
      'UPDATE order_downloads SET downloads_count = downloads_count + 1 WHERE id = ?'
    ).bind(downloadRecord.download_id).run();

    // 5. Proxy the file or Redirect
    // If the URL is relative (e.g. uploaded directly), we should construct full URL or proxy
    // For now, redirecting to the file_url. 
    // In a strict secure setup, we would fetch(file_url) and return it.
    
    // Proxying to hide the true URL:
    if (downloadRecord.file_url.startsWith('http')) {
      return c.redirect(downloadRecord.file_url, 302);
    } else {
      // If it's a relative path on our domain (e.g. /uploads/...)
      const host = new URL(c.req.url).origin;
      return c.redirect(host + downloadRecord.file_url, 302);
    }

  } catch (err) {
    console.error('Download error:', err);
    return c.json({ success: false, message: 'Failed to process download.', code: 500 }, 500);
  }
});
