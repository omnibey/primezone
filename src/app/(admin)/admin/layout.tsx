import '../admin-globals.css';

import { getSettings } from '@/lib/api';

export async function generateMetadata() {
  try {
    const settingsRes = await getSettings().catch(() => null);
    const settings = settingsRes?.data?.settings || settingsRes?.data || {};
    const layout = settings.layout || {};
    
    const baseMetadata: any = {
      title: 'Admin Panel',
      description: 'Store Admin Dashboard',
      robots: 'noindex, nofollow',
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
      title: 'Admin Panel',
      description: 'Store Admin Dashboard',
      robots: 'noindex, nofollow',
    };
  }
}

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
