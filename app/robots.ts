import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://thisorthat.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/card/", "/topic/", "/compare/"],
      disallow: [
        "/home",
        "/discover",
        "/search",
        "/play",
        "/create",
        "/profile",
        "/settings",
        "/activity",
        "/admin",
        "/onboarding",
        "/login",
        "/signup",
        "/comparison/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
