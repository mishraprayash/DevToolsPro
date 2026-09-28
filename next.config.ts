import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['curlconverter', 'tree-sitter-bash', 'web-tree-sitter'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;