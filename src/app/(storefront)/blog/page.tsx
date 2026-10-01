import { getBlogs, getSettings } from "@/lib/api";
import PageDataLayer from "@/components/common/PageDataLayer";
import BlogListClient from "./BlogListClient";

export const runtime = 'edge';

export async function generateMetadata() {
  const settingsRes = await getSettings().catch(() => null);
  const settings = settingsRes?.data?.settings || settingsRes?.data || {};
  const storeName = settings?.layout?.store_name || settings?.general?.store_name || settings?.store_name || "Store";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  return {
    title: `Blog & Buying Guides | ${storeName}`,
    description: `Read expert advice, product comparison guides, and buying tips curated by ${storeName}.`,
    alternates: {
      canonical: `${siteUrl}/blog`
    },
    openGraph: {
      title: `Blog & Buying Guides | ${storeName}`,
      description: `Read expert advice, product comparison guides, and buying tips curated by ${storeName}.`,
      url: `${siteUrl}/blog`,
      type: "website"
    }
  };
}

export default async function BlogPage({ searchParams }) {
  const { q: searchQ = "" } = await searchParams;

  const [blogsRes, settingsRes] = await Promise.all([
    getBlogs().catch(() => ({ data: [] })),
    getSettings().catch(() => null)
  ]);

  const rawBlogs = Array.isArray(blogsRes?.data) ? blogsRes.data : (blogsRes?.data?.blogs || []);
  
  // Filter for blog posts (published only)
  const blogPosts = rawBlogs.filter(p => p.status !== 'draft');
  
  const settings = settingsRes?.data?.settings || settingsRes?.data || {};
  const storeName = settings?.layout?.store_name || settings?.general?.store_name || settings?.store_name || "Store";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  // Structured Data (JSON-LD) for GEO / AI Citation
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": `${storeName} Blog & Knowledge Hub`,
    "description": `Expert advice, buying guides, and tips from ${storeName}.`,
    "url": `${siteUrl}/blog`,
    "publisher": {
      "@type": "Organization",
      "name": storeName,
      "url": siteUrl
    },
    "blogPost": blogPosts.map((post) => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "url": `${siteUrl}/blog/${post.slug}`,
      "datePublished": post.created_at || new Date().toISOString()
    }))
  };

  return (
    <main className="main-content" style={{ minHeight: '70vh', paddingBottom: '3.5rem' }}>
      <PageDataLayer type="blog_list" name="Blog" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container" style={{ marginTop: '0.75rem' }}>
        <BlogListClient
          posts={blogPosts}
          storeName={storeName}
          siteUrl={siteUrl}
          activeTopic="all"
          initialSearch={searchQ}
        />
      </div>
    </main>
  );
}
