import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public bucket (product images).
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default withNextIntl(nextConfig);
