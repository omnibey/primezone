"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Helper to calculate estimated reading time
function calculateReadingTime(content = "") {
  const plainText = content.replace(/<[^>]+>/g, " ");
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 180));
  return `${minutes} min read`;
}

// Helper to extract clean excerpt
function getCleanExcerpt(content = "", length = 140) {
  const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (plainText.length <= length) return plainText;
  return plainText.substring(0, length).trim() + "...";
}

// Utility to slugify category names
function slugify(text) {
  return (text || "").toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default function BlogListClient({ posts = [], storeName = "Store", siteUrl = "", activeTopic = "all", initialSearch = "", topicLabel = "" }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  
  const isTopicPage = activeTopic !== "all" && Boolean(topicLabel);
  const heroTitle = isTopicPage ? `${topicLabel} — ${storeName} Blog` : `${storeName} Knowledge Hub`;
  const heroSubtitle = isTopicPage
    ? `Browse all ${topicLabel} articles and guides published by ${storeName}.`
    : `Discover expert advice, product comparison guides, and practical tips curated by ${storeName}.`;

  // Dynamic Categories extracted from posts + standard presets
  const categoriesList = useMemo(() => {
    const list = [{ id: "all", label: "All Guides & Articles", icon: "ph-squares-four", slug: "all" }];
    const seen = new Set(["all"]);

    // Standard white-label presets
    const presets = [
      { id: "news-updates", label: "News & Updates", icon: "ph-newspaper" },
      { id: "buying-guides", label: "Buying Guides", icon: "ph-shopping-bag" },
      { id: "tutorials", label: "Tutorials", icon: "ph-lightbulb" },
      { id: "product-reviews", label: "Product Reviews", icon: "ph-star" }
    ];

    // Check which presets exist in posts or add presets
    presets.forEach((p) => {
      list.push({ ...p, slug: p.id });
      seen.add(p.id);
    });

    // Add any unique categories found in posts that are not in presets
    posts.forEach((post) => {
      if (post.category && post.category.trim()) {
        const catSlug = slugify(post.category);
        if (!seen.has(catSlug) && catSlug) {
          seen.add(catSlug);
          list.push({
            id: catSlug,
            slug: catSlug,
            label: post.category.trim(),
            icon: "ph-tag"
          });
        }
      }
    });

    return list;
  }, [posts]);

  // Filter posts based ONLY on search query (Category is handled by the server passing pre-filtered posts)
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const title = (post.title || "").toLowerCase();
      const excerpt = (post.content || "").toLowerCase();
      const postCat = (post.category || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      return !q || title.includes(q) || excerpt.includes(q) || postCat.includes(q);
    });
  }, [posts, searchQuery]);

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const standardPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

  const handleTopicClick = (slug) => {
    if (slug === "all") {
      router.push("/blog");
    } else {
      router.push(`/blog/topic/${slug}`);
    }
  };

  return (
    <div className="blog-page-wrapper">
      <style>{`
        .blog-page-wrapper {
          width: 100%;
          margin: 0 auto;
          color: #0F172A;
          font-family: inherit;
        }

        /* Breadcrumb */
        .blog-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--text-light);
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .blog-breadcrumb a {
          color: var(--text-light);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.15s;
        }
        .blog-breadcrumb a:hover {
          color: var(--primary-color, #FF6B35);
        }
        .blog-breadcrumb .crumb-current {
          color: #0F172A;
          font-weight: 600;
        }

        /* Hero Banner */
        .blog-hero-section {
          background: linear-gradient(135deg, #0F172A 0%, var(--text-color) 50%, #334155 100%);
          border-radius: var(--radius-lg, 16px);
          padding: 3rem 2rem;
          color: #fff;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 15px 35px -10px rgba(15, 23, 42, 0.2);
          margin-bottom: 2rem;
        }
        .blog-hero-section::before {
          content: "";
          position: absolute;
          top: -40%;
          right: -20%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(255, 107, 53, 0.22) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .blog-hero-section::after {
          content: "";
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .blog-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.35rem 0.95rem;
          border-radius: 9999px;
          font-size: 0.825rem;
          font-weight: 600;
          color: #FFD29D;
          margin-bottom: 1rem;
        }
        .blog-hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.75rem;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        @media (max-width: 768px) {
          .blog-hero-title { font-size: 1.85rem; }
          .blog-hero-section { padding: 2.25rem 1.25rem; }
        }
        .blog-hero-subtitle {
          font-size: 1.05rem;
          color: #CBD5E1;
          max-width: 600px;
          margin: 0 auto 1.75rem auto;
          line-height: 1.6;
        }

        /* Search Input in Hero */
        .blog-search-bar {
          max-width: 520px;
          margin: 0 auto;
          position: relative;
          display: flex;
          align-items: center;
        }
        .blog-search-input {
          width: 100%;
          padding: 0.85rem 1.25rem 0.85rem 2.85rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.95);
          color: #0F172A;
          font-size: 0.95rem;
          font-family: inherit;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          outline: none;
          transition: all 0.2s ease;
        }
        .blog-search-input:focus {
          background-color: var(--bg-color);
          border-color: var(--primary-color, #FF6B35);
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.15);
        }
        .blog-search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-light);
          font-size: 1.15rem;
          pointer-events: none;
        }

        /* Category Filter Pills */
        .blog-categories-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          margin-bottom: 1.75rem;
          scrollbar-width: thin;
        }
        .category-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0.45rem 0.95rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-color);
          background: var(--bg-light);
          border: 1px solid #E2E8F0;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
        }
        .category-pill:hover {
          background: #E2E8F0;
          color: #0F172A;
        }
        .category-pill.active {
          background: var(--primary-color, #FF6B35);
          color: #fff;
          border-color: var(--primary-color, #FF6B35);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Featured Article Spotlight Card */
        .featured-article-card {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 1.75rem;
          background-color: var(--bg-color);
          border-radius: var(--radius-lg, 16px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          overflow: hidden;
          margin-bottom: 2.25rem;
          box-shadow: 0 2px 14px rgba(0, 0, 0, 0.03);
          text-decoration: none;
          color: inherit;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .featured-article-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 28px -8px rgba(0, 0, 0, 0.08);
          border-color: #CBD5E1;
        }
        @media (max-width: 860px) {
          .featured-article-card { grid-template-columns: 1fr; }
        }

        .featured-img-box {
          background: linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%);
          min-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .featured-img-icon {
          font-size: 5rem;
          color: #EA580C;
          opacity: 0.85;
          transition: transform 0.35s ease;
        }
        .featured-article-card:hover .featured-img-icon {
          transform: scale(1.06) rotate(2deg);
        }
        .featured-badge-overlay {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: #0F172A;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.7rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .featured-content-box {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @media (max-width: 640px) {
          .featured-content-box { padding: 1.5rem 1.25rem; }
        }
        .article-meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.825rem;
          color: var(--text-light);
          font-weight: 600;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .featured-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.35;
          margin-bottom: 0.85rem;
          transition: color 0.15s ease;
        }
        .featured-article-card:hover .featured-title {
          color: var(--primary-color, #FF6B35);
        }
        .featured-excerpt {
          color: var(--text-color);
          font-size: 0.95rem;
          line-height: 1.65;
          margin-bottom: 1.25rem;
        }
        .featured-read-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          color: var(--primary-color, #FF6B35);
          font-size: 0.925rem;
        }
        .featured-read-btn i {
          transition: transform 0.2s ease;
        }
        .featured-article-card:hover .featured-read-btn i {
          transform: translateX(4px);
        }

        /* Standard Articles Grid */
        .articles-grid-section-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 1.15rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .articles-grid-section-title i {
          color: var(--primary-color, #FF6B35);
        }

        .articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 640px) {
          .articles-grid { grid-template-columns: 1fr; }
        }

        .article-card {
          background-color: var(--bg-color);
          border-radius: var(--radius-lg, 14px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .article-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.07);
          border-color: #CBD5E1;
        }

        .article-card-thumb {
          height: 160px;
          background: linear-gradient(135deg, #F8FAFC 0%, var(--bg-light) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .article-card-thumb i {
          font-size: 3rem;
          color: #94A3B8;
          transition: transform 0.3s ease, color 0.2s ease;
        }
        .article-card:hover .article-card-thumb i {
          transform: scale(1.06);
          color: var(--primary-color, #FF6B35);
        }
        .article-card-category-tag {
          position: absolute;
          bottom: 0.75rem;
          left: 0.75rem;
          background: rgba(15, 23, 42, 0.82);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: 4px;
          backdrop-filter: blur(4px);
        }

        .article-card-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .article-card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.4;
          margin-bottom: 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.15s ease;
        }
        .article-card:hover .article-card-title {
          color: var(--primary-color, #FF6B35);
        }
        .article-card-excerpt {
          font-size: 0.875rem;
          color: var(--text-light);
          line-height: 1.6;
          margin-bottom: 1.15rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }
        .article-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px solid var(--bg-light);
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--primary-color, #FF6B35);
        }
        .article-card-footer i {
          transition: transform 0.2s ease;
        }
        .article-card:hover .article-card-footer i {
          transform: translateX(4px);
        }

        /* Empty State */
        .blog-empty-state {
          text-align: center;
          padding: 3.5rem 1.5rem;
          background-color: var(--bg-color);
          border-radius: var(--radius-lg, 16px);
          border: 1px dashed #CBD5E1;
          margin: 1.5rem 0;
        }
        .blog-empty-state i {
          font-size: 3rem;
          color: #94A3B8;
          margin-bottom: 0.75rem;
        }
        .blog-empty-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-color);
          margin-bottom: 0.4rem;
        }
        .blog-empty-text {
          font-size: 0.925rem;
          color: var(--text-light);
          max-width: 400px;
          margin: 0 auto 1.25rem auto;
        }
      `}</style>

      {/* Breadcrumb */}
      <nav className="blog-breadcrumb" aria-label="Breadcrumb">
        <Link href="/"><i className="ph-fill ph-house"></i> Home</Link>
        <i className="ph-bold ph-caret-right" style={{ fontSize: '0.75rem' }}></i>
        <Link href="/blog">Blog</Link>
        {isTopicPage && (
          <>
            <i className="ph-bold ph-caret-right" style={{ fontSize: '0.75rem' }}></i>
            <span className="crumb-current">{topicLabel}</span>
          </>
        )}
        {!isTopicPage && (
          <span className="crumb-current">All Articles & Guides</span>
        )}
      </nav>

      {/* Hero Header */}
      <section className="blog-hero-section">
        <div className="blog-hero-badge">
          <i className="ph-bold ph-sparkle"></i> {isTopicPage ? topicLabel : "Expert Advice & Guides"}
        </div>
        <h1 className="blog-hero-title">{heroTitle}</h1>
        <p className="blog-hero-subtitle">
          {heroSubtitle}
        </p>

        {/* Live Search Bar */}
        <div className="blog-search-bar">
          <i className="ph-bold ph-magnifying-glass blog-search-icon"></i>
          <input
            type="text"
            className="blog-search-input"
            placeholder="Search articles, guides, or active ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Category Pills Bar */}
      <div className="blog-categories-bar">
        {categoriesList.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`category-pill ${activeTopic === cat.slug ? "active" : ""}`}
            onClick={() => handleTopicClick(cat.slug)}
          >
            <i className={`ph-bold ${cat.icon}`}></i> {cat.label}
          </button>
        ))}
      </div>

      {/* If No Posts Found */}
      {filteredPosts.length === 0 ? (
        <div className="blog-empty-state">
          <i className="ph-bold ph-newspaper-clipping"></i>
          <div className="blog-empty-title">No Articles Found</div>
          <div className="blog-empty-text">
            {searchQuery
              ? `No articles match your search "${searchQuery}". Try searching with different keywords or reset filters.`
              : "New expert guides and product comparison articles will be published shortly!"}
          </div>
          {searchQuery && (
            <button
              type="button"
              className="category-pill active"
              onClick={() => {
                setSearchQuery("");
                if (activeTopic !== "all") {
                  handleTopicClick("all");
                }
              }}
            >
              <i className="ph-bold ph-arrow-counter-clockwise"></i> Reset Search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Featured Post Spotlight */}
          {featuredPost && (
            <Link href={`/blog/${featuredPost.slug}`} className="featured-article-card">
              <div className="featured-img-box">
                <div className="featured-badge-overlay">
                  <i className="ph-bold ph-star"></i> {featuredPost.category || "Featured Guide"}
                </div>
                <i className="ph-bold ph-newspaper featured-img-icon"></i>
              </div>

              <div className="featured-content-box">
                <div className="article-meta-row">
                  <span className="meta-item">
                    <i className="ph-bold ph-calendar-blank"></i>{" "}
                    {new Date(featuredPost.created_at || Date.now()).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                  <span>•</span>
                  <span className="meta-item">
                    <i className="ph-bold ph-clock"></i> {calculateReadingTime(featuredPost.content)}
                  </span>
                  <span>•</span>
                  <span className="meta-item" style={{ color: "#16A34A" }}>
                    <i className="ph-bold ph-seal-check"></i> Editorial Verified
                  </span>
                </div>

                <h2 className="featured-title">{featuredPost.title}</h2>
                <p className="featured-excerpt">{getCleanExcerpt(featuredPost.content, 180)}</p>

                <div className="featured-read-btn">
                  Read Full Guide <i className="ph-bold ph-arrow-right"></i>
                </div>
              </div>
            </Link>
          )}

          {/* Subsequent Articles Grid */}
          {standardPosts.length > 0 && (
            <section>
              <div className="articles-grid-section-title">
                <i className="ph-bold ph-book-open"></i> All Articles & Guides ({filteredPosts.length})
              </div>

              <div className="articles-grid">
                {standardPosts.map((post) => (
                  <Link href={`/blog/${post.slug}`} className="article-card" key={post.id || post.slug}>
                    <div className="article-card-thumb">
                      <div className="article-card-category-tag">{post.category || "Guide"}</div>
                      <i className="ph-bold ph-article"></i>
                    </div>

                    <div className="article-card-body">
                      <div className="article-meta-row" style={{ marginBottom: "0.5rem" }}>
                        <span className="meta-item">
                          <i className="ph-bold ph-calendar-blank"></i>{" "}
                          {new Date(post.created_at || Date.now()).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                        <span>•</span>
                        <span className="meta-item">
                          <i className="ph-bold ph-clock"></i> {calculateReadingTime(post.content)}
                        </span>
                      </div>

                      <h3 className="article-card-title">{post.title}</h3>
                      <p className="article-card-excerpt">{getCleanExcerpt(post.content, 120)}</p>

                      <div className="article-card-footer">
                        <span>Read Article</span>
                        <i className="ph-bold ph-arrow-right"></i>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
