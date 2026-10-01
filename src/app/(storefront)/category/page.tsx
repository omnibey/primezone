export const runtime = 'edge';
import { getCategories, getSettings } from "@/lib/api";
import CategoryIndexClient from "./CategoryIndexClient";

export async function generateMetadata() {
  const settingsRes = await getSettings().catch(() => null);
  const settings = settingsRes?.data?.settings || settingsRes?.data || {};
  const storeName = settings?.layout?.store_name || settings?.general?.store_name || settings?.store_name || "Store";
  
  return {
    title: `All Categories | ${storeName}`,
    description: `Browse all product categories at ${storeName}. Authentic products & essentials.`,
  };
}

export default async function CategoryPage() {
  let categories = [];
  try {
    const res = await getCategories();
    categories = Array.isArray(res) ? res : (res.data || res.categories || res.results || []);
  } catch (error) {
    console.error("Error loading categories", error);
  }

  return (
    <main className="main-content" style={{ minHeight: '70vh' }}>
      <CategoryIndexClient categories={categories} />
    </main>
  );
}
