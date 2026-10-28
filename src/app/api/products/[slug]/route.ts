import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProduct } from "@/lib/products";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const p = await db.product.findUnique({
    where: { slug },
    include: { category: true, options: { include: { options: true } } },
  });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: serializeProduct(p) });
}
