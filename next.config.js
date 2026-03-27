/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webflow Cloud mount path — your app will be at blockchain-ads.com/cta-admin
  basePath: '/cta-admin',
  assetPrefix: '/cta-admin',
  // Allow images from blockchain-ads.com for admin previews
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blockchain-ads.com',
      },
      {
        protocol: 'https',
        hostname: '**.webflow.com',
      },
    ],
  },
  // Headers for the client script (CORS for cross-origin fetch)
  async headers() {
    return [
      {
        source: '/cta-loader.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=300' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
