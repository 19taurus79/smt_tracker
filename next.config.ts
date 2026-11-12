import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Always export to out/ for Telegram Serverless static hosting
  output: "export",
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
