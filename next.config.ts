import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    // Serve local /images/* and /upload/* files directly (no optimizer) so a
    // previously-failed optimization never gets cached as a broken image.
    unoptimized: true,
  },
};

export default nextConfig;
