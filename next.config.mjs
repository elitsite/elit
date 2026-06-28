import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' is required for Next.js inline runtime script & JSON-LD blocks.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.supabase.co https://images.pexels.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://api.telegram.org https://api.mymemory.translated.net",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      // Supabase Storage public bucket (product images).
      { protocol: 'https', hostname: '**.supabase.co' },
      // Pexels (event showcase images).
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
