import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProduct } from "@/lib/products";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId");
  const search = url.searchParams.get("q")?.trim();
  const featured = url.searchParams.get("featured");
  const popular = url.searchParams.get("popular");

  const where: any = { available: true };
  if (categoryId) where.categoryId = categoryId;
  if (featured === "true") where.featured = true;
  if (popular === "true") where.popular = true;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const products = await db.product.findMany({
    where,
    include: { category: true, options: { include: { options: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    products: products.map(serializeProduct),
  });
}
