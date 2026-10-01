// ============================================================
// Image Routes — R2 Upload + Gallery
// ============================================================

import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const imageRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── ADMIN: Upload Image to R2 ────────────────────────────────
// POST /api/admin/images/upload
imageRoutes.post('/upload', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  try {
    const formData = await c.req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return c.json({ success: false, message: 'No image file provided', code: 400 }, 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ success: false, message: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, AVIF', code: 400 }, 400);
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ success: false, message: 'File too large. Maximum 10MB', code: 400 }, 400);
    }

    // Read optional folder name, default to 'products'
    let folder = 'products';
    const reqFolder = (formData.get('folder') as string) || c.req.query('folder') || '';
    // Only allow alphanumeric, dash, and underscore for folder names
    if (reqFolder && /^[a-zA-Z0-9_-]+$/.test(reqFolder.trim())) {
      folder = reqFolder.trim();
    }
    console.log('[ImageUpload] folder:', folder, '| reqFolder raw:', reqFolder);

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const key = `${folder}/${timestamp}-${random}.${ext}`;

    // Upload to R2
    await c.env.R2.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
      customMetadata: {
        uploadedBy: c.get('adminEmail') || 'admin',
        originalName: file.name,
      },
    });

    // Build public URL
    const publicUrl = `${c.env.R2_PUBLIC_URL}/${key}`;

    return c.json({
      success: true,
      data: {
        url: publicUrl,
        key,
        size: file.size,
        type: file.type,
        message: 'Image uploaded successfully',
      }
    }, 201);
  } catch (err) {
    console.error('Image upload error:', err);
    return c.json({ success: false, message: 'Failed to upload image', code: 500 }, 500);
  }
});

// ─── ADMIN: Batch Upload Images ───────────────────────────────
// POST /api/admin/images/upload-batch
imageRoutes.post('/upload-batch', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  try {
    const formData = await c.req.formData();
    const files = formData.getAll('images') as unknown as File[];

    if (!files.length) {
      return c.json({ success: false, message: 'No image files provided', code: 400 }, 400);
    }

    const results: Array<{ url: string; key: string; name: string }> = [];
    const errors: Array<{ name: string; error: string }> = [];

    for (const file of files) {
      try {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
        if (!allowedTypes.includes(file.type)) {
          errors.push({ name: file.name, error: 'Invalid file type' });
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          errors.push({ name: file.name, error: 'File too large (max 10MB)' });
          continue;
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const key = `products/${timestamp}-${random}.${ext}`;

        await c.env.R2.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type,
            cacheControl: 'public, max-age=31536000',
          },
        });

        results.push({
          url: `${c.env.R2_PUBLIC_URL}/${key}`,
          key,
          name: file.name,
        });
      } catch (err) {
        errors.push({ name: file.name, error: (err as Error).message });
      }
    }

    return c.json({ success: true, data: { uploaded: results, errors, message: `${results.length} uploaded, ${errors.length} failed` } });
  } catch (err) {
    console.error('Batch upload error:', err);
    return c.json({ success: false, message: 'Batch upload failed', code: 500 }, 500);
  }
});

// ─── ADMIN: List Images in R2 ─────────────────────────────────
// GET /api/admin/images?prefix=products/&cursor=X
imageRoutes.get('/', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  const prefix = c.req.query('prefix') || 'products/';
  const cursor = c.req.query('cursor') || undefined;
  const limit = Math.min(100, parseInt(c.req.query('limit') || '50'));

  const listed = await c.env.R2.list({
    prefix,
    limit,
    cursor,
  });

  const images = listed.objects.map((obj) => ({
    key: obj.key,
    url: `${c.env.R2_PUBLIC_URL}/${obj.key}`,
    size: obj.size,
    uploaded: obj.uploaded.toISOString(),
  }));

  return c.json({
    success: true,
    data: {
      images,
      cursor: listed.truncated ? listed.cursor : null,
      hasMore: listed.truncated,
    }
  });
});

// ─── ADMIN: Delete Image from R2 ──────────────────────────────
// DELETE /api/admin/images/:key
imageRoutes.delete('/*', async (c) => {
  const adminId = c.get('adminId');
  if (!adminId) return c.json({ success: false, message: 'Admin access required', code: 403 }, 403);

  // The key is the full path after /api/v1/admin/images/
  const rawKey = c.req.path.replace(/^\/api\/(v1\/)?admin\/images\//, '').replace(/^\//, '');
  const key = decodeURIComponent(rawKey);

  if (!key) {
    return c.json({ success: false, message: 'Image key required', code: 400 }, 400);
  }

  await c.env.R2.delete(key);
  return c.json({ success: true, data: { message: 'Image deleted' } });
});
