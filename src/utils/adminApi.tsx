import { siteConfig } from '@/config/site';

const API_BASE = siteConfig.apiUrl;
const ADMIN_API_BASE = `${API_BASE}/admin`;

// ─── LIFETIME IN-MEMORY CACHE ─────────────────────────────────
// Cached forever until a write operation (POST/PUT/DELETE) invalidates it.
// Same pattern as customer storefront's tag-based SSR caching.
const _adminCache = new Map<string, any>();

/**
 * Determine the cache "tag" (resource group) from an endpoint.
 * e.g. '/products?page=1' → 'products', '/settings/all' → 'settings'
 */
function getCacheTag(endpoint: string): string {
  const clean = endpoint.split('?')[0].replace(/^\//, '');
  // '/products/123/landing' → 'products'
  // '/settings/all' → 'settings'
  // '/orders?page=1' → 'orders'
  return clean.split('/')[0];
}

/**
 * Invalidate all cached entries for a given resource tag.
 * Called automatically after any write operation (POST/PUT/DELETE).
 */
export function invalidateAdminCache(tag?: string) {
  if (!tag) {
    _adminCache.clear();
    return;
  }
  const keys = Array.from(_adminCache.keys());
  for (const key of keys) {
    if (getCacheTag(key) === tag) {
      _adminCache.delete(key);
    }
  }
}

/**
 * Native React Fetch Wrapper for Admin API.
 * - GET requests: Served from lifetime in-memory cache if available.
 * - POST/PUT/DELETE: Bypasses cache & auto-invalidates the resource group.
 * Automatically attaches JWT from localStorage.
 * Supports both JSON and FormData bodies.
 */
export async function adminFetch(endpoint, options: any = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('store_admin_token') : null;
  const method = (options.method || 'GET').toUpperCase();

  // ── Cache: Return cached data for GET requests ──
  if (method === 'GET' && _adminCache.has(endpoint)) {
    return _adminCache.get(endpoint);
  }

  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData bodies
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${ADMIN_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    if (response.status === 401 || response.status === 403 || json.message === 'Invalid token') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('store_admin_token');
        localStorage.removeItem('store_admin_user');
        window.location.href = '/admin/login';
      }
    }
    throw new Error(json.error || json.message || 'An error occurred while fetching data');
  }

  const data = json.data !== undefined ? json.data : json;

  // ── Cache: Store GET responses forever ──
  if (method === 'GET') {
    _adminCache.set(endpoint, data);
  }

  // ── Cache: Invalidate on write operations ──
  if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
    const tag = getCacheTag(endpoint);
    invalidateAdminCache(tag);
  }

  return data;
}

/**
 * Public API fetch (no auth needed)
 */
export async function publicFetch(endpoint, options: any = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || json.message || 'API error');
  }

  return json.data;
}

/**
 * Upload image to R2 via admin API
 * @param {File} file - The image file to upload
 * @param {string} folder - Target folder (e.g. 'products', 'banners', 'categories')
 * @returns {Promise<string>} The uploaded public URL
 */
export async function uploadToR2(file, folder = 'products') {
  if (!file) throw new Error('No file provided');

  const compressed = await compressImage(file, 1200, 0.8);
  const formData = new FormData();
  formData.append('image', compressed);
  formData.append('folder', folder);

  const res = await adminFetch(`/images/upload?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    body: formData,
  });

  return res.url;
}

/**
 * Triggers Next.js on-demand cache revalidation for a specific tag.
 * @param {string} tag - The cache tag to bust: 'settings', 'products', 'categories', 'pages'
 */
export async function triggerRevalidate(tag) {
  try {
    const secret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'fallback_secret';
    await fetch(`/api/revalidate?secret=${secret}&tag=${tag}`, { method: 'POST' });
  } catch (err) {
    console.warn(`[Cache] Revalidation failed for tag "${tag}":`, err);
  }
}

/**
 * Client-side image compression to WebP before upload.
 * Skips SVGs, GIFs, and files under 400KB.
 */
export async function compressImage(file, maxWidth = 800, quality = 0.7) {
  if (!file || !file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  if (file.size <= 400 * 1024) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round(width * (maxWidth / height));
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob failed'));
              return;
            }
            const newName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            resolve(new File([blob], newName, { type: 'image/webp', lastModified: Date.now() }));
          },
          'image/webp',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
