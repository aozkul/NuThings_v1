
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com; style-src 'self' 'unsafe-inline' https://www.paypal.com https://www.paypalobjects.com; img-src 'self' data: https://www.paypalobjects.com https://www.paypal.com; frame-src https://www.paypal.com; connect-src 'self' https://api-m.sandbox.paypal.com https://api-m.paypal.com https://www.paypal.com;"
          }
        ]
      }
    ];
  }
};
export default nextConfig;
