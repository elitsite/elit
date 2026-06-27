import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

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
};

export default withNextIntl(nextConfig);
