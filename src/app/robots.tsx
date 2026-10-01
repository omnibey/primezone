export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/profile/', '/checkout/success/'], 
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
