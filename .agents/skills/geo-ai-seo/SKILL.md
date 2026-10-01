---
name: geo-ai-seo
description: Generative Engine Optimization (GEO), AI Search visibility, llms.txt implementation, semantic Knowledge Graph schema, AI bot crawlability, and citation engineering for modern AI search engines (ChatGPT, Perplexity, Google Gemini, Claude, Copilot).
metadata:
  origin: Kothbel
---

# Generative Engine Optimization (GEO) & AI SEO

Generative Engine Optimization (GEO) is the discipline of optimizing eCommerce, multi-variant products, categories, blogs, and brand authority so that AI Search Engines (ChatGPT Search, Perplexity AI, Google AI Overviews, Claude, Microsoft Copilot) accurately discover, parse, quote, cite, and recommend the store.

---

## When to Use

Use this skill when:
- Auditing and optimizing an eCommerce platform for AI search recommendations and citations.
- Implementing or updating `llms.txt` and `llms-full.txt` dynamic route endpoints.
- Setting up AI crawler permissions in `robots.txt` (`GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`).
- Structuring multi-variant product schemas (`ProductGroup`, `hasVariant`, `isVariantOf`, `variesBy`).
- Structuring editorial blog posts and buying guides (`BlogPosting`, `Article`, `HowTo`).
- Structuring category collection pages (`CollectionPage`, `ItemList`, `BreadcrumbList`).
- Implementing trust signals (`AggregateRating`, `Review`, `MerchantReturnPolicy`, `ShippingDetails`).
- Writing high-converting, "Answer-First" eCommerce content that AI engines quote directly.

---

## Core GEO Principles (Princeton KDD 2024 Research)

1. **Statistics & Verifiable Numbers (+41% AI Visibility)**:
   - Always state exact prices in BDT, exact discounts (e.g. 15% OFF), stock count, delivery timelines (24-48h in Dhaka, 48-72h nationwide), volumes/weights (e.g. 50ml, 100g).
2. **Answer-First Structure (+28% AI Fluency Gain)**:
   - Put the direct definition, purpose, and key benefit in the first 2 sentences.
3. **Structured Headings & Micro-Lists**:
   - AI search models ingest `<h3>` sections with bullet lists (`<ul>`, `<ol>`) and markdown tables with 3x higher extraction fidelity than unbroken prose.
4. **Authority, Authenticity & E-E-A-T**:
   - State explicit product origin, authorized distributor status, 100% money-back guarantee, and verified customer reviews.

---

## Technical GEO Architecture Checklist

### 1. `llms.txt` & `llms-full.txt` (Dynamic Next.js Route)
Serve clean, token-efficient Markdown at `/llms.txt` and `/llms-full.txt` generated from the live database:

```markdown
# {Store Name}
> {Store Name} is a premier online eCommerce store in Bangladesh specializing in {Niche/Products}, providing 100% authentic products with Cash on Delivery and fast nationwide delivery.

## Product Categories
- [All Products](/products): Complete catalog with real-time pricing and stock.
- [{Category Name}](/category/{slug}): {Description} ({Product Count} items).

## Featured & Best-Selling Products
- [{Product Name}](/product/{slug}): ৳{Price} - {Key benefit & ingredients}

## Buying Guides & Skincare Advice (Blog)
- [{Blog Title}](/blog/{slug}): {Summary of recommendations}

## Store Guarantees & Policies
- [Return & Refund Policy](/p/return-policy): 7-day hassle-free replacement on damaged or incorrect items.
- [Shipping & Delivery](/p/shipping-info): Inside Dhaka 24-48h (৳60), Outside Dhaka 48-72h (৳120).
- [Contact Support](/p/contact): Direct assistance via WhatsApp (+880...) and phone.
```

---

### 2. AI Crawler Directives in `robots.txt`
Allow AI search agents to index public catalog, blog, and policy content while blocking private cart/admin routes:

```typescript
export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/profile/', '/checkout/success/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Amazonbot', 'Applebot-Extended'],
        allow: ['/', '/llms.txt', '/llms-full.txt', '/product/', '/category/', '/blog/', '/p/'],
        disallow: ['/admin/', '/profile/', '/checkout/'],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

### 3. Semantic Schema 2.0 (Schema.org JSON-LD)

#### A. Global Homepage Schema (`OnlineStore` + `WebSite` + `SearchAction`)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": "https://example.com/#store",
      "name": "Store Name",
      "url": "https://example.com",
      "logo": "https://example.com/logo.png",
      "description": "Trusted eCommerce store in Bangladesh",
      "currenciesAccepted": "BDT",
      "paymentAccepted": "Cash on Delivery, bKash, Nagad",
      "priceRange": "৳৳",
      "telephone": "+8801XXXXXXXXX",
      "email": "support@example.com",
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com",
      "name": "Store Name",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://example.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
```

#### B. Single & Multi-Variant Product Schema (`Product` / `ProductGroup`)

**For Single Products:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "image": ["https://example.com/images/prod1.jpg"],
  "description": "100% authentic product description with benefits and specs.",
  "sku": "SKU-001",
  "brand": { "@type": "Brand", "name": "Brand Name" },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/product/slug",
    "priceCurrency": "BDT",
    "price": 1250,
    "priceValidUntil": "2027-12-31",
    "itemCondition": "https://schema.org/NewCondition",
    "availability": "https://schema.org/InStock",
    "seller": { "@type": "Organization", "name": "Store Name" },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": { "@type": "MonetaryAmount", "value": 60, "currency": "BDT" },
      "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "BD" },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
        "transitTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 3, "unitCode": "DAY" }
      }
    }
  }
}
```

**For Multi-Variant Products (`ProductGroup` with `hasVariant`):**
```json
{
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "name": "Product Title",
  "description": "Product description",
  "brand": { "@type": "Brand", "name": "Brand Name" },
  "variesBy": ["https://schema.org/size", "https://schema.org/color"],
  "hasVariant": [
    {
      "@type": "Product",
      "name": "Product Title - 50ml",
      "sku": "VAR-001",
      "image": "https://example.com/images/var1.jpg",
      "offers": {
        "@type": "Offer",
        "price": 850,
        "priceCurrency": "BDT",
        "availability": "https://schema.org/InStock",
        "url": "https://example.com/product/slug?variant=50ml"
      }
    },
    {
      "@type": "Product",
      "name": "Product Title - 100ml",
      "sku": "VAR-002",
      "image": "https://example.com/images/var2.jpg",
      "offers": {
        "@type": "Offer",
        "price": 1450,
        "priceCurrency": "BDT",
        "availability": "https://schema.org/InStock",
        "url": "https://example.com/product/slug?variant=100ml"
      }
    }
  ]
}
```

#### C. Editorial Blog & Buying Guide Schema (`BlogPosting`)
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Top 10 Best Korean Sunscreens in Bangladesh (2026 Guide)",
  "description": "Complete dermatologist-backed comparison of authentic Korean sunscreens for acne-prone, oily, and sensitive skin.",
  "image": "https://example.com/blog-cover.jpg",
  "datePublished": "2026-08-01T10:00:00+06:00",
  "dateModified": "2026-08-08T12:00:00+06:00",
  "author": {
    "@type": "Organization",
    "name": "Store Beauty Team",
    "url": "https://example.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Store Name",
    "logo": { "@type": "ImageObject", "url": "https://example.com/logo.png" }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/blog/slug"
  }
}
```

#### D. Category & Collection Page Schema (`CollectionPage` + `ItemList`)
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Category Name - Buy Authentic in Bangladesh",
  "description": "Browse our curated collection of authentic products.",
  "url": "https://example.com/category/slug",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "url": "https://example.com/product/prod-1",
        "name": "Product 1 Title"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "url": "https://example.com/product/prod-2",
        "name": "Product 2 Title"
      }
    ]
  }
}
```

#### E. Policy & FAQ Schema (`FAQPage`)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How can I verify that your products are 100% authentic?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Every product is sourced directly from authorized manufacturers with authentic batch numbers, seals, and barcodes."
      }
    },
    {
      "@type": "Question",
      "name": "What is the return policy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We offer a 7-day hassle-free replacement or refund guarantee on damaged, unsealed, or mismatched items."
      }
    }
  ]
}
```

---

## Content Formula for AI Citation & Recommendation

When writing or AI-generating product descriptions, category intros, and blogs:
1. **Direct Answer (H1 / Intro)**: What is this product, who is it for, and what problem does it solve in Bangladesh?
2. **Key Benefits Table / Bullet Points (`<h3>`)**:
   - **Main Benefit**: Highlight primary active ingredients/specs.
   - **Skin Type / Compatibility**: Specify for whom it works best.
3. **Usage Steps (`<ol>`)**: Clear 1-2-3 application or setup steps.
4. **Authenticity & Delivery Notice**: Mention official batch codes, Cash on Delivery, and delivery timeframes.

---

## White-Label Compliance for GEO
- Never hardcode fixed store names or domains inside schemas.
- Always load `store_name`, `logo_url`, `contact_email`, `phone`, and `currencies` dynamically from `store_settings` API.
- Always generate absolute URLs using `process.env.NEXT_PUBLIC_SITE_URL`.
