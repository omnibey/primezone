import Link from "next/link";
import { notFound } from "next/navigation";
import PageDataLayer from "@/components/common/PageDataLayer";
import { getPage, getSettings } from "@/lib/api";

export const runtime = 'edge';

const RESERVED_ROUTES = new Set([
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'manifest.json',
  'api',
  'admin',
  'blog',
  'cart',
  'checkout',
  'product',
  'category',
  'wishlist',
  'track-order',
  'thank-you',
  'profile',
  'search'
]);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  if (RESERVED_ROUTES.has(slug)) {
    return { title: 'Not Found' };
  }

  const [json, settingsRes] = await Promise.all([
    getPage(slug).catch(() => null),
    getSettings().catch(() => null)
  ]);

  const settings = settingsRes?.data?.settings || settingsRes?.data || {};
  const storeName = settings?.layout?.store_name || settings?.general?.store_name || settings?.store_name || "Store";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  if (json && json.success && json.data) {
    const plainExcerpt = (json.data.content || "").replace(/<[^>]+>/g, " ").substring(0, 160).trim();
    return { 
      title: `${json.data.title} | ${storeName}`,
      description: plainExcerpt || `Read ${json.data.title} on ${storeName}.`,
      alternates: {
        canonical: `${siteUrl}/${slug}`
      }
    };
  }
  
  return { title: storeName };
}

export default async function DynamicPage({ params }) {
  const { slug } = await params;
  
  if (RESERVED_ROUTES.has(slug)) {
    notFound();
  }

  const [json, settingsRes] = await Promise.all([
    getPage(slug).catch(() => null),
    getSettings().catch(() => null)
  ]);

  if (!json || !json.success || !json.data) {
    notFound();
  }

  const page = json.data;
  const settings = settingsRes?.data?.settings || settingsRes?.data || {};
  const storeName = settings?.layout?.store_name || settings?.general?.store_name || settings?.store_name || "Store";

  // Format date if available
  const formattedDate = page.updated_at || page.created_at
    ? new Date(page.updated_at || page.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  return (
    <main className="main-content" style={{ minHeight: '70vh', paddingBottom: '3.5rem' }}>
      <PageDataLayer type="page" name={page.title} />
      
      <div className="container" style={{ marginTop: '0.75rem' }}>
        {/* Page Hero Header */}
        <div className="static-page-hero">
          <div className="static-page-breadcrumb">
            <Link href="/" className="crumb-link"><i className="ph-fill ph-house"></i> Home</Link>
            <span className="crumb-sep"><i className="ph-bold ph-caret-right"></i></span>
            <span className="crumb-current">{page.title}</span>
          </div>
          <div className="static-page-hero-header">
            <div className="static-page-hero-icon">
              <i className="ph-bold ph-file-text"></i>
            </div>
            <div>
              <h1 className="static-page-title">{page.title}</h1>
              {formattedDate && (
                <div className="static-page-meta">
                  <i className="ph-bold ph-clock"></i> Last updated: {formattedDate}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Static Page Body Card */}
        <div className="static-page-card">
          <div 
            className="rich-page-content" 
            dangerouslySetInnerHTML={{ __html: page.content }} 
          />
        </div>
      </div>
    </main>
  );
}
