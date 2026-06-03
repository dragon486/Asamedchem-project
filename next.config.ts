import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from external sources if needed in future
  images: {
    remotePatterns: [],
  },
  // Ensure experimental features are stable
  experimental: {},
};

export default nextConfig;
