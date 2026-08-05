import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://queuesis.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/courses", "/api/terms"],
      disallow: "/api/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
