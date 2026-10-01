import Link from "next/link";
import { notFound } from "next/navigation";
import PageDataLayer from "@/components/common/PageDataLayer";
import { getBlog, getBlogs, getSettings } from "@/lib/api";

export const runtime = 'edge';

// Helper to calculate estimated reading time
function calculateReadingTime(content = "") {
  const plainText = content.replace(/<[^>]+>/g, " ");
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 180));
  return `${minutes} min read`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [json, settingsRes] = await Promise.all([
    getBlog(slug).catch(() => null),
    getSettings().catch(() => null)
  ]);

  const settings = settingsRes?.data?.settings || settingsRes?.data || {};
  const storeName = settings?.layout?.store_name || settings?.general?.store_name || settings?.store_name || "Store";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  if (json && json.success && json.data) {
    const post = json.data;
    const plainExcerpt = (post.content || "").replace(/<[^>]+>/g, " ").substring(0, 160).trim();
    return {
      title: `${post.title} | ${storeName}`,
      description: plainExcerpt || `Read ${post.title} on ${storeName} Blog.`,
      alternates: {
        canonical: `${siteUrl}/blog/${slug}`
      },
      openGraph: {
        title: `${post.title} | ${storeName}`,
        description: plainExcerpt,
        url: `${siteUrl}/blog/${slug}`,
        type: "article",
        publishedTime: post.created_at
      }
    };
  }
  return { title: `Blog | ${storeName}` };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  
  const [json, blogsRes, settingsRes] = await Promise.all([
    getBlog(slug).catch(() => null),
    getBlogs().catch(() => ({ data: [] })),
    getSettings().catch(() => null)
  ]);

  if (!json || !json.success || !json.data) {
    notFound();
  }

  const post = json.data;
  const settings = settingsRes?.data?.settings || settingsRes?.data || {};
  const storeName = settings?.layout?.store_name || settings?.general?.store_name || settings?.store_name || "Store";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const allBlogs = Array.isArray(blogsRes?.data) ? blogsRes.data : (blogsRes?.data?.blogs || []);
  const relatedPosts = allBlogs
    .filter(p => p.slug !== slug)
    .slice(0, 3);

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  const readingTime = calculateReadingTime(post.content);

  // Article JSON-LD Schema for AI engines and Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": (post.content || "").replace(/<[^>]+>/g, " ").substring(0, 160).trim(),
    "articleSection": post.category || "General",
    "url": `${siteUrl}/blog/${slug}`,
    "datePublished": post.created_at || new Date().toISOString(),
    "dateModified": post.updated_at || post.created_at || new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": `${storeName} Editorial Team`,
      "url": siteUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": storeName,
      "url": siteUrl
    }
  };

  return (
    <main className="main-content" style={{ minHeight: '70vh', paddingBottom: '3.5rem' }}>
      <PageDataLayer type="blog_post" name={post.title} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="container" style={{ marginTop: '0.75rem' }}>
        {/* Standard Page Hero Header */}
        <div className="static-page-hero">
          <div className="static-page-breadcrumb">
            <Link href="/" className="crumb-link"><i className="ph-fill ph-house"></i> Home</Link>
            <span className="crumb-sep"><i className="ph-bold ph-caret-right"></i></span>
            <Link href="/blog" className="crumb-link">Blog & Guides</Link>
            {post.category && (
              <>
                <span className="crumb-sep"><i className="ph-bold ph-caret-right"></i></span>
                <span className="crumb-link" style={{ opacity: 0.85 }}>{post.category}</span>
              </>
            )}
            <span className="crumb-sep"><i className="ph-bold ph-caret-right"></i></span>
            <span className="crumb-current">{post.title}</span>
          </div>
          <div className="static-page-hero-header">
            <div className="static-page-hero-icon" style={{ background: 'color-mix(in srgb, var(--primary-color, #FF6B35) 12%, #fff)' }}>
              <i className="ph-bold ph-newspaper" style={{ color: 'var(--primary-color, #FF6B35)' }}></i>
            </div>
            <div>
              <h1 className="static-page-title">{post.title}</h1>
              <div className="static-page-meta">
                {post.category && (
                  <>
                    <span style={{ background: 'var(--bg-light)', color: '#0F172A', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                      {post.category}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span><i className="ph-bold ph-user"></i> {storeName} Editorial Team</span>
                {formattedDate && (
                  <>
                    <span>•</span>
                    <span><i className="ph-bold ph-calendar-blank"></i> {formattedDate}</span>
                  </>
                )}
                <span>•</span>
                <span><i className="ph-bold ph-clock"></i> {readingTime}</span>
                <span>•</span>
                <span style={{ color: "#16A34A", fontWeight: "600" }}><i className="ph-bold ph-seal-check"></i> 100% Authentic Guide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Static Page Body Card */}
        <div className="static-page-card">
          <div 
            className="rich-page-content" 
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </div>

        {/* Related Guides Section */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ph-bold ph-book-open" style={{ color: 'var(--primary-color, #FF6B35)' }}></i> Related Guides & Articles
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {relatedPosts.map(rel => (
                <Link 
                  href={`/blog/${rel.slug}`} 
                  key={rel.id || rel.slug} 
                  style={{
                    background: 'var(--bg-color)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    padding: '1.25rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    transition: 'transform 0.2s, border-color 0.2s'
                  }}
                >
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0F172A', lineHeight: '1.4', marginBottom: '0.5rem', flex: 1 }}>
                    {rel.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="ph-bold ph-calendar-blank"></i>
                    {new Date(rel.created_at || Date.now()).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
