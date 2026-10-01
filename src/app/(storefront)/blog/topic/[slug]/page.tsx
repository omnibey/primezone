import { getBlogs, getSettings } from "@/lib/api";
import PageDataLayer from "@/components/common/PageDataLayer";
import BlogListClient from "../../BlogListClient";

export const runtime = 'edge';

// Utility to slugify
function slugify(text) {
  return (text || "").toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [blogsRes, settingsRes] = await Promise.all([
    getBlogs().catch(() => ({ data: [] })),
    getSettings().catch(() => null)
  ]);

  const settings = settingsRes?.data?.settings || settingsRes?.data || {};
  const storeName = settings?.layout?.store_name || settings?.general?.store_name || settings?.store_name || "Store";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  // Find a matching post to identify the topic label
  const rawBlogs = Array.isArray(blogsRes?.data) ? blogsRes.data : (blogsRes?.data?.blogs || []);
  const topicPost = rawBlogs.find(p => slugify(p.category) === slug);
  const topicLabel = topicPost?.category || slug.replace(/-/g, " ");

  const capitalizedTopic = topicLabel.charAt(0).toUpperCase() + topicLabel.slice(1);

  return {
    title: `${capitalizedTopic} | Blog | ${storeName}`,
    description: `Browse all ${capitalizedTopic} articles and guides from ${storeName}.`,
    alternates: {
      canonical: `${siteUrl}/blog/topic/${slug}`
    },
    openGraph: {
      title: `${capitalizedTopic} | Blog | ${storeName}`,
      description: `Browse all ${capitalizedTopic} articles and guides from ${storeName}.`,
      url: `${siteUrl}/blog/topic/${slug}`,
      type: "website"
    }
  };
}

export default async function BlogTopicPage({ params }) {
  const { slug } = await params;

  const [blogsRes, settingsRes] = await Promise.all([
    getBlogs().catch(() => ({ data: [] })),
    getSettings().catch(() => null)
  ]);

  const rawBlogs = Array.isArray(blogsRes?.data) ? blogsRes.data : (blogsRes?.data?.blogs || []);

  // Filter for this specific topic + published only
  const allBlogPosts = rawBlogs.filter(p => p.status !== 'draft');

  // Filter by topic slug
  const topicPosts = allBlogPosts.filter(p => slugify(p.category) === slug);

  // Identify the human-readable topic label
  const topicLabel = topicPosts[0]?.category || slug.replace(/-/g, " ");
  const capitalizedTopic = topicLabel.charAt(0).toUpperCase() + topicLabel.slice(1);

  const settings = settingsRes?.data?.settings || settingsRes?.data || {};
  const storeName = settings?.layout?.store_name || settings?.general?.store_name || settings?.store_name || "Store";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  return (
    <main className="main-content" style={{ minHeight: '70vh', paddingBottom: '3.5rem' }}>
      <PageDataLayer type="blog_topic" name={capitalizedTopic} />
      <div className="container" style={{ marginTop: '0.75rem' }}>
        <BlogListClient
          posts={topicPosts}
          storeName={storeName}
          siteUrl={siteUrl}
          activeTopic={slug}
          initialSearch=""
          topicLabel={capitalizedTopic}
        />
      </div>
    </main>
  );
}
