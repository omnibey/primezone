/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Build-time environment variables ────────────────────────────────────
  // These are baked into the JS bundle at build time.
  // On Cloudflare Pages, NEXT_PUBLIC_* vars must be defined here or as build
  // environment variables in the dashboard — runtime vars are NOT available.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://primezone-api.bayazidzaman.workers.dev/api/v1',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://kothbel.pages.dev',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/pages/:path*',
          destination: '/p/:path*',
        },
        // Note: This rewrite only works in local dev (Next.js server).
        // On Cloudflare Pages (edge runtime), API calls go directly to
        // NEXT_PUBLIC_API_URL (the worker URL above).
        {
          source: '/api/v1/:path*',
          destination: 'https://primezone-api.bayazidzaman.workers.dev/api/v1/:path*',
        }
      ],
      fallback: [
        {
          source: '/oldadmin',
          destination: '/oldadmin/index.html',
        },
        {
          source: '/oldadmin/:path*',
          destination: '/oldadmin/:path*.html',
        },
      ],
    };
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  generateBuildId: async () => {
    return 'kb-' + Date.now();
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },

};

export default nextConfig;

