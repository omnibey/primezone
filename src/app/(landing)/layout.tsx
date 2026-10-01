import { getSettings } from "@/lib/api";
import Script from "next/script";
import "./landing.css";

export async function generateMetadata() {
  try {
    const settingsRes = await getSettings().catch(() => null);
    const settings = settingsRes?.data?.settings || settingsRes?.data || {};
    const layout = settings.layout || {};
    const storeName = layout.store_name || settings.store_name || "Store";
    
    const baseMetadata: any = {
      title: `${storeName} - Landing`,
      description: `Shop at ${storeName}`,
    };

    if (layout.favicon_url) {
      baseMetadata.icons = {
        icon: layout.favicon_url,
        shortcut: layout.favicon_url,
        apple: layout.favicon_url,
      };
    }

    return baseMetadata;
  } catch (error) {
    return {
      title: "Landing",
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <Script src="https://unpkg.com/@phosphor-icons/web" strategy="beforeInteractive" />
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <Script id="tailwind-config" strategy="beforeInteractive">
          {`
            window.tailwind = window.tailwind || {};
            window.tailwind.config = {
              corePlugins: {
                preflight: false,
              }
            };
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
