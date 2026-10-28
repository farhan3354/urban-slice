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
  order: z.number().int().min(0),
  active: z.boolean(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) }, { status: 400 });
  const d = parsed.data;
  const slug = d.slug ? slugify(d.slug) : slugify(d.name);
  if (slug) {
    const clash = await db.category.findFirst({ where: { slug, NOT: { id } } });
    if (clash) return NextResponse.json({ ok: false, errors: [{ field: "slug", message: "Slug in use" }] }, { status: 400 });
  }
  const c = await db.category.update({
    where: { id },
    data: { name: d.name, slug, description: d.description || null, imageUrl: d.imageUrl || null, order: d.order, active: d.active },
  });
  await audit(guard.admin.id, "category.update", id, { name: d.name });
  return NextResponse.json({ ok: true, category: c });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  // Prevent deletion if products exist
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json({ ok: false, errors: [{ field: "category", message: `Move or delete ${count} products first` }] }, { status: 400 });
  }
  await db.category.delete({ where: { id } }).catch(() => {});
  await audit(guard.admin.id, "category.delete", id);
  return NextResponse.json({ ok: true });
}
