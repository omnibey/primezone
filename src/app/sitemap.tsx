export const runtime = 'edge';
import { getProducts, getPages, getBlogs, getSettings } from "@/lib/api";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  
  // Fetch dynamic content
  const [productsRes, pagesRes, blogsRes, settingsRes] = await Promise.all([
    getProducts().catch(() => ({ data: { products: [] } })),
    getPages().catch(() => ({ data: { pages: [] } })),
    getBlogs().catch(() => ({ data: { blogs: [] } })),
    getSettings().catch(() => ({ data: { settings: {} } }))
  ]);

  const products = productsRes?.data?.products || [];
  const pages = pagesRes?.data?.pages || pagesRes?.data || [];
  const blogs = blogsRes?.data?.blogs || blogsRes?.data || [];
  const categories = settingsRes?.data?.settings?.home_categories || [];

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const pageUrls = pages.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const blogUrls = blogs.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...productUrls,
    ...categoryUrls,
    ...pageUrls,
    ...blogUrls,
  ];
}
