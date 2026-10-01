"use client";

import { useState, useCallback } from "react";
import ProductCard from "@/components/storefront/ProductCard";
import { pushViewItemList } from "@/lib/dataLayer";
import { getRecommendationData } from "@/lib/recommendation";

export default function HomeProductSection({ initialProducts = [], initialPagination = {} as any, listName = "Home - All Products" }: any) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(initialPagination.page || 1);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages || 1);
  const [totalProducts, setTotalProducts] = useState(initialPagination.total || initialProducts.length);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = page < totalPages;
  const progressPercent = totalProducts > 0 
    ? Math.min(100, Math.round((products.length / totalProducts) * 100)) 
    : 100;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;

    try {
      const { viewed_ids, interests } = getRecommendationData();
      const queryParams = new URLSearchParams({
        page: nextPage.toString(),
        limit: '24',
        sort: 'recommendation',
        viewed_ids: viewed_ids,
        interests: interests
      });
      
      const res = await fetch(`/api/v1/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load more products");
      const data = await res.json();

      if (data.success && data.data?.products) {
        const newBatch = data.data.products;
        setProducts((prev) => [...prev, ...newBatch]);
        setPage(nextPage);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages);
          setTotalProducts(data.data.pagination.total);
        }

        // GA4 / GTM tracking for newly loaded batch
        if (typeof window !== "undefined") {
          pushViewItemList(newBatch, listName, window.location.href);
        }
      }
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, products, listName]);

  const scrollToTop = () => {
    const grid = document.getElementById("productGrid");
    if (grid) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="home-product-section" style={{ paddingBottom: "3rem" }}>
      {/* Product Grid */}
      <div id="productGrid" className="product-grid" style={{ paddingTop: "1rem" }}>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-light)", gridColumn: "1 / -1" }}>
            No products found.
          </div>
        ) : (
          products.map((prod, index) => (
            <ProductCard
              key={`${prod.id}-${index}`}
              prod={prod}
              index={index}
              listName={listName}
            />
          ))
        )}
      </div>

      {/* Load More & Progress Bar Section */}
      {totalProducts > 0 && (
        <div
          className="load-more-wrapper"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "2.5rem",
            gap: "12px",
            textAlign: "center",
          }}
        >
          {/* Action Button */}
          {hasMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoading}
              className="btn"
              style={{
                backgroundColor: "var(--primary-color, #E6007E)",
                color: "#ffffff",
                border: "none",
                borderRadius: "30px",
                padding: "12px 32px",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(230, 0, 126, 0.25)",
                transition: "all 0.2s ease",
                opacity: isLoading ? 0.75 : 1,
              }}
              onMouseOver={(e) => {
                if (!isLoading) e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                if (!isLoading) e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {isLoading ? (
                <>
                  <i className="ph-bold ph-spinner ph-spin" style={{ fontSize: "1.1rem" }}></i>
                  <span>Loading Products...</span>
                </>
              ) : (
                <>
                  <i className="ph-bold ph-arrow-circle-down" style={{ fontSize: "1.15rem" }}></i>
                  <span>Load More Products</span>
                </>
              )}
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#16a34a",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "6px 16px",
                  borderRadius: "20px",
                }}
              >
                <i className="ph-bold ph-check-circle"></i> You&apos;ve reached the end ({totalProducts} products)
              </span>
              <button
                type="button"
                onClick={scrollToTop}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-light)",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                  marginTop: "4px",
                }}
              >
                Back to Top ↑
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
