import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.context = path.resolve(process.cwd());
    return config;
  },
};

export default nextConfig;
