export const runtime = 'edge';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HtmlRenderer from '@/components/landing/HtmlRenderer';
import { siteConfig } from '@/config/site';

const API_BASE_URL = siteConfig.apiUrl;

async function getLandingData(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/landing/${slug}`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    console.error('Failed to fetch landing page:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLandingData(slug);
  
  if (!data) {
    return { title: 'Product Not Found' };
  }

  const { product, landing } = data;
  const title = landing.settings?.metaTitle || product.title;
  const desc = landing.settings?.metaDesc || product.description?.replace(/<[^>]+>/g, '').substring(0, 160) || '';
  const image = landing.settings?.ogImage || product.images?.[0] || '';

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: image ? [image] : [],
    }
  };
}

export default async function ProductLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getLandingData(slug);

  if (!data) {
    notFound();
  }

  const rawHtml = String(data.landing.sections || "");

  return (
    <div className="landing-page-wrapper font-sans antialiased text-gray-900 bg-gray-50 min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
          ${data.landing.settings?.fontFamily ? `
            .landing-page-wrapper {
              font-family: '${data.landing.settings.fontFamily}', sans-serif;
            }
          ` : ''}
          .landing-page-wrapper p {
             white-space: pre-wrap;
          }
        `
      }} />
      <HtmlRenderer html={rawHtml} product={data.product} settings={data.landing.settings} />
    </div>
  );
}
