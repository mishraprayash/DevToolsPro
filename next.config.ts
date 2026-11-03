import type { NextConfig } from "next";

// The service worker and its generated precache list must never be served from
// the HTTP cache, or browsers would keep running a stale worker after deploys.
const noCacheHeaders = [
  { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
  { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ['curlconverter', 'tree-sitter-bash', 'web-tree-sitter'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [...noCacheHeaders, { key: 'Service-Worker-Allowed', value: '/' }],
      },
      { source: '/sw-precache.js', headers: noCacheHeaders },
    ];
  },
};

export default nextConfig;
