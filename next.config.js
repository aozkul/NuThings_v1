/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eouodqzlcwgnlocjfpho.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Diğer uzak görsel kaynakların varsa buraya ekleyebilirsin
      // { protocol: 'https', hostname: 'images.unsplash.com', pathname: '**' },
    ],
  },
};

module.exports = nextConfig;
