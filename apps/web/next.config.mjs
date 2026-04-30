const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const apiCorsHeaders = [
  { key: 'Access-Control-Allow-Origin', value: '*' },
  { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
  { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@node-rs/argon2', 'sharp'],
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/api/v1/:path*', headers: apiCorsHeaders },
    ];
  },
};

export default nextConfig;
