import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://urbanslice.pk";
  const staticRoutes = [
    "",
    "/menu",
    "/deals",
    "/about",
    "/contact",
    "/delivery-info",
    "/refund-policy",
    "/privacy",
    "/terms",
  ].map((r) => ({
    url: `${base}${r}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: r === "" ? 1 : 0.8,
  }));

  const products = await db.product.findMany({ where: { available: true }, select: { slug: true, updatedAt: true } });
  const productRoutes = products.map((p) => ({
    url: `${base}/menu/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const categories = await db.category.findMany({ where: { active: true }, select: { slug: true } });
  const catRoutes = categories.map((c) => ({
    url: `${base}/menu?category=${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...catRoutes];
}
