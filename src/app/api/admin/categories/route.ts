import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-guard";
import { slugify } from "@/lib/format";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().optional(),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const cats = await db.category.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { products: true } } } });
  return NextResponse.json({ categories: cats });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) }, { status: 400 });
  }
  const d = parsed.data;
  const slug = d.slug ? slugify(d.slug) : slugify(d.name);
  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ ok: false, errors: [{ field: "slug", message: "Slug in use" }] }, { status: 400 });
  const c = await db.category.create({
    data: { name: d.name, slug, description: d.description || null, imageUrl: d.imageUrl || null, order: d.order, active: d.active },
  });
  await audit(guard.admin.id, "category.create", c.id, { name: c.name });
  return NextResponse.json({ ok: true, category: c });
}
