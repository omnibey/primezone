export const runtime = 'edge';
import CheckoutUI from "@/components/common/CheckoutUI";
import { getSettings } from "@/lib/api";
import Head from "next/head";

export async function generateMetadata() {
  const settingsRes = await getSettings().catch(() => null);
  const storeName = settingsRes?.data?.settings?.layout?.store_name || settingsRes?.data?.settings?.store_name || "Store";
  return {
    title: `Secure Checkout | ${storeName}`,
  };
}

export default async function CheckoutPage() {
  const settingsRes = await getSettings();
  const settings = settingsRes?.data?.settings || {};

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .site-footer, .mobile-nav-drawer, .floating-whatsapp { display: none !important; }
        body { background-color: var(--bg-light); }
      `}} />
      <div className="container" style={{ paddingTop: '0px', paddingBottom: '40px' }}>
        <CheckoutUI initialSettings={settings} mode="page" />
      </div>
    </>
  );
}
