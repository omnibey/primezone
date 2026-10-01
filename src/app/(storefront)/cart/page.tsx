export const runtime = 'edge';
import CartClient from "./CartClient";

import { getSettings } from "@/lib/api";

export async function generateMetadata() {
  const settingsRes = await getSettings().catch(() => null);
  const storeName = settingsRes?.data?.settings?.layout?.store_name || settingsRes?.data?.settings?.store_name || "Store";
  return {
    title: `Your Cart | ${storeName}`,
  };
}

export default function CartPage() {
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <CartClient />
    </div>
  );
}
