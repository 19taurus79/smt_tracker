import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables hybrid deployment: pre-renders static pages and enables serverless API routes
  output: process.env.STATIC_EXPORT === "true" ? "export" : undefined,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
