import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/cart", "/checkout", "/order/success"] },
    sitemap: "https://urbanslice.pk/sitemap.xml",
    host: "https://urbanslice.pk",
  };
}
