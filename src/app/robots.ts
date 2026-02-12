import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/signup",
          "/privacy",
          "/terms",
          "/help-center",
          "/invoice/*",
        ],
        disallow: ["/dashboard/*", "/api/*", "/reset-password/*", "/verify-email/*"],
      },
    ],
    sitemap: "https://billmint.io/sitemap.xml",
  };
}
