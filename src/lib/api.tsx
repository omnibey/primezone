// White-label Store API Utility
import { siteConfig } from '@/config/site';

const API_BASE_URL = siteConfig.apiUrl;

/**
 * Fetch all products or products by category with pagination
 */
export async function getProducts(categorySlug = null, page = 1, limit = 24) {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (categorySlug) params.set('category', categorySlug);
    
    const url = `${API_BASE_URL}/products?${params.toString()}`;
    const res = await fetch(url, { next: { tags: ['products'] } });
    if (!res.ok) throw new Error("Failed to fetch products");
    
    return await res.json();
  } catch (error) {
    
    return { data: { products: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } } };
  }
}

/**
 * Search products by keyword with pagination
 */
export async function searchProducts(query, page = 1, limit = 24) {
  try {
    const params = new URLSearchParams({ q: query, page: String(page), limit: String(limit) });
    const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to search products");
    
    return await res.json();
  } catch (error) {
    
    return { data: { products: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } } };
  }
}

/**
 * Fetch a single product by slug or id
 */
export async function getProduct(slug) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${slug}`, { 
      next: { 
        tags: ['products']
      } 
    });
    
    if (res.status === 404) {
      return null;
    }
    
    if (!res.ok) {
      console.warn(`Failed to fetch product ${slug}: HTTP ${res.status}`);
      return null;
    }
    
    const data = await res.json();

    return data;
  } catch (error) {
    
    return null;
  }
}

/**
 * Fetch all categories
 */
export async function getCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, { next: { tags: ['categories'] } });
    if (!res.ok) throw new Error("Failed to fetch categories");
    
    return await res.json();
  } catch (error) {
    
    return { data: [] };
  }
}

/**
 * Fetch global settings (including dynamic delivery fees, etc.)
 */
export async function getSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, { next: { tags: ['settings'] } });
    if (!res.ok) throw new Error("Failed to fetch settings");
    
    return await res.json();
  } catch (error) {
    
    return null;
  }
}

/**
 * Place a new order (Checkout Flow)
 */
export async function placeOrder(orderData) {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // Fire-and-forget background cache invalidation to update live stock instantly
      const secret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'fallback_secret';
      fetch(`/api/revalidate?secret=${secret}&tag=products`, { method: 'POST' }).catch(e => console.warn('Cache revalidate failed:', e));
      
      // Normalize response so checkout component can always rely on result.success
      return { success: true, data: data.data || data };
    } else {
      return { success: false, message: data.message || "Failed to place order." };
    }
  } catch (error) {
    
    return { success: false, message: "Failed to connect to the server." };
  }
}

/**
 * Fetch all pages (including blogs)
 */
export async function getPages() {
  try {
    const res = await fetch(`${API_BASE_URL}/pages`, { next: { tags: ['pages'] } });
    if (!res.ok) throw new Error("Failed to fetch pages");
    
    return await res.json();
  } catch (error) {
    
    return { data: [] };
  }
}

/**
 * Fetch a single page or blog by slug
 */
export async function getPage(slug) {
  try {
    const res = await fetch(`${API_BASE_URL}/pages/${slug}`, { next: { tags: ['pages'] } });
    
    if (res.status === 404) {
      return null;
    }
    
    if (!res.ok) {
      console.warn(`Failed to fetch page ${slug}: HTTP ${res.status}`);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    
    return null;
  }
}

/**
 * Fetch all blogs
 */
export async function getBlogs() {
  try {
    const res = await fetch(`${API_BASE_URL}/blogs`, { next: { tags: ['blogs'] } });
    if (!res.ok) throw new Error("Failed to fetch blogs");
    
    return await res.json();
  } catch (error) {
    
    return { data: [] };
  }
}

/**
 * Fetch a single blog by slug
 */
export async function getBlog(slug) {
  try {
    const res = await fetch(`${API_BASE_URL}/blogs/${slug}`, { next: { tags: ['blogs'] } });
    
    if (res.status === 404) {
      return null;
    }
    
    if (!res.ok) {
      console.warn(`Failed to fetch blog ${slug}: HTTP ${res.status}`);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    
    return null;
  }
}

/**
 * Fetch categories marked for homepage display
 */
export async function getHomeCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories?homepage=true`, { next: { tags: ['categories'] } });
    if (!res.ok) throw new Error("Failed to fetch categories");
    
    const json = await res.json();
    return json?.data || [];
  } catch (error) {
    
    return [];
  }
}
