import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/reports/export/pdf": ["./node_modules/pdfkit/js/data/**/*", "./public/fonts/NotoSansArabic.ttf"]
  },
  serverExternalPackages: ["pdfkit"],
  typedRoutes: false
};

export default nextConfig;
