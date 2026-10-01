export const runtime = 'edge';

import { searchProducts, getSettings } from "@/lib/api";
import SearchClient from "./SearchClient";

export async function generateMetadata(props) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";
  const settingsRes = await getSettings().catch(() => null);
  const storeName = settingsRes?.data?.settings?.layout?.store_name || settingsRes?.data?.settings?.store_name || "Store";
  
  return {
    title: `Search results for "${q}" - ${storeName}`,
    description: `Shop for the best "${q}" at ${storeName}.`,
  };
}

export default async function SearchPage(props) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";

  // Fetch real data
  const productsRes = await searchProducts(q, 1, 24);
  const PRODUCTS = productsRes?.data?.products || [];
  const PAGINATION = productsRes?.data?.pagination || { page: 1, limit: 24, total: PRODUCTS.length, totalPages: 1 };

  return (
    <SearchClient 
      searchQuery={q} 
      initialProducts={PRODUCTS}
      initialPagination={PAGINATION}
    />
  );
}
