import type { NextConfig } from "next";
import brand from "./src/config/brand.json";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages. The sub-path (e.g. /demo-clinic) comes from jk/brand/brand.json.
  output: "export",
  trailingSlash: true,
  basePath: brand.projects.demoClinic.path.replace(/\/$/, ""),
  // Photos are served straight from images.unsplash.com (Unsplash hotlinking rule), sized by URL params.
  images: { unoptimized: true },
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
