export const runtime = 'edge';

import { getProducts, getCategories, getSettings } from "@/lib/api";
import CategoryClient from "./CategoryClient";

export async function generateMetadata(props) {
  const params = await props.params;
  const decodedSlug = decodeURIComponent(params.slug);
  const settingsRes = await getSettings().catch(() => null);
  const storeName = settingsRes?.data?.settings?.layout?.store_name || settingsRes?.data?.settings?.store_name || "Store";
  
  return {
    title: `${decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1)} - ${storeName}`,
    description: `Shop for the best ${decodedSlug} at ${storeName}.`,
  };
}

export default async function CategoryPage(props) {
  const params = await props.params;
  const { slug } = params;
  const decodedSlug = decodeURIComponent(slug);

  // Fetch real products and categories data in parallel
  const [productsRes, categoriesRes] = await Promise.all([
    getProducts(decodedSlug, 1, 24),
    getCategories()
  ]);

  const PRODUCTS = productsRes?.data?.products || [];
  const PAGINATION = productsRes?.data?.pagination || { page: 1, limit: 24, total: PRODUCTS.length, totalPages: 1 };

  const categoriesList = Array.isArray(categoriesRes)
    ? categoriesRes
    : (categoriesRes?.data || categoriesRes?.categories || []);

  const currentCategory = categoriesList.find(c =>
    (c.slug && c.slug.toLowerCase() === slug.toLowerCase()) ||
    (c.slug && c.slug.toLowerCase() === decodedSlug.toLowerCase()) ||
    (c.name && c.name.toLowerCase() === decodedSlug.toLowerCase())
  ) || null;

  return (
    <CategoryClient 
      categoryName={currentCategory?.name || decodedSlug} 
      categorySlug={decodedSlug}
      categoryData={currentCategory}
      initialProducts={PRODUCTS}
      initialPagination={PAGINATION}
    />
  );
}
