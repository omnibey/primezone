export const runtime = 'edge';
import { getProducts, getSettings } from "@/lib/api";
import HomeProductSection from "@/components/storefront/HomeProductSection";
import ProductListDataLayer from "@/components/common/ProductListDataLayer";

export async function generateMetadata() {
  const settingsRes = await getSettings().catch(() => null);
  const storeName = settingsRes?.data?.settings?.layout?.store_name || settingsRes?.data?.settings?.store_name || "Store";
  return {
    title: `All Products | ${storeName}`,
    description: 'Browse all our products.',
  };
}

export default async function ProductsPage() {
  const productsRes = await getProducts(null, 1, 24);
  const PRODUCTS = productsRes?.data?.products || [];
  const PAGINATION = productsRes?.data?.pagination || { page: 1, limit: 24, total: PRODUCTS.length, totalPages: 1 };

  return (
    <>
      <ProductListDataLayer products={PRODUCTS} pageName="all_products" listName="All Products Page" />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-color)' }}>All Products</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Browse all products available in our store.</p>
      </div>
      <div className="container">
          <HomeProductSection initialProducts={PRODUCTS} initialPagination={PAGINATION} listName="All Products Page" />
      </div>
    </>
  );
}
