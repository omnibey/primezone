export const runtime = 'edge';

import { getProduct, getSettings } from "@/lib/api";
import ProductClient from "./ProductClient";
import { formatPrice } from "@/lib/formatPrice";
import { notFound } from "next/navigation";

export async function generateMetadata(props) {
  const params = await props.params;
  const { slug } = params;
  
  try {
    const [response, settingsRes] = await Promise.all([getProduct(slug), getSettings().catch(() => null)]);
    const product = response?.data?.product;
    const storeName = settingsRes?.data?.settings?.layout?.store_name || settingsRes?.data?.settings?.store_name || "Store";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    
    if (!product) {
      return { title: `Product Not Found | ${storeName}` };
    }

    const title = `${product.title} - ${storeName}`;
    const description = product.description
      ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
      : `Buy ${product.title} from ${storeName}. Price: ৳${formatPrice(product.base_price)}`;
    const image = product.images && product.images.length > 0 ? product.images[0] : null;
    const url = `${siteUrl}/product/${slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: storeName,
        type: 'website',
        ...(image && {
          images: [
            {
              url: image,
              width: 1200,
              height: 1200,
              alt: product.title,
            },
          ],
        }),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(image && { images: [image] }),
      },
    };
  } catch (error) {
    return { title: 'Product Not Found | Store' };
  }
}

export default async function ProductPage(props) {
  const params = await props.params;
  const { slug } = params;
  
  const [response, settingsRes] = await Promise.all([getProduct(slug), getSettings().catch(() => null)]);
  const storeName = settingsRes?.data?.settings?.layout?.store_name || settingsRes?.data?.settings?.store_name || "Store";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  
  if (!response || !response.success || !response.data || !response.data.product) {
    notFound();
  }
  
  const productData = response.data.product;
  productData.reviews = response.data.reviews || [];
  const variants = response.data.variants || [];

  // Build Full SEO Breadcrumb Hierarchy for Google Search
  const breadcrumbList = [
    { name: "Home", url: siteUrl }
  ];

  if (productData.breadcrumbs && Array.isArray(productData.breadcrumbs) && productData.breadcrumbs.length > 0) {
    productData.breadcrumbs.forEach(b => {
      breadcrumbList.push({
        name: b.name,
        url: `${siteUrl}/category/${b.slug}`
      });
    });
  } else if (productData.category) {
    breadcrumbList.push({
      name: productData.category,
      url: `${siteUrl}/category/${productData.category.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')}`
    });
  }

  // Include the product itself at the end of the SEO breadcrumb
  breadcrumbList.push({
    name: productData.title,
    url: `${siteUrl}/product/${slug}`
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbList.map((item, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productData.title,
    "image": productData.images && productData.images.length > 0 ? productData.images : undefined,
    "description": productData.description ? productData.description.replace(/<[^>]*>/g, '').substring(0, 200) : '',
    "sku": productData.sku || slug,
    "brand": {
      "@type": "Brand",
      "name": productData.brand || storeName
    },
    "offers": {
      "@type": "Offer",
      "url": `${siteUrl}/product/${slug}`,
      "priceCurrency": "BDT",
      "price": productData.base_price,
      "availability": (productData.stock > 0 || productData.is_unlimited_stock) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="container" id="productContainer">
        <ProductClient product={productData} variants={variants} />
      </div>
    </>
  );
}
