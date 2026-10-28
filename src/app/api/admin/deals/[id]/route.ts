import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-guard";
import { slugify } from "@/lib/format";
import { z } from "zod";

const Schema = z.object({
  title: z.string().min(2).max(100),
  slug: z.string().optional(),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  price: z.number().min(0),
  oldPrice: z.number().min(0).optional().nullable(),
  active: z.boolean(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  couponCode: z.string().max(40).optional().nullable(),
  badge: z.string().max(40).optional().nullable(),
  itemsJson: z.string(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) }, { status: 400 });
  const d = parsed.data;
  const slug = d.slug ? slugify(d.slug) : slugify(d.title);
  if (slug) {
    const clash = await db.deal.findFirst({ where: { slug, NOT: { id } } });
    if (clash) return NextResponse.json({ ok: false, errors: [{ field: "slug", message: "Slug in use" }] }, { status: 400 });
  }
  const deal = await db.deal.update({
    where: { id },
    data: {
      title: d.title,
      slug,
      description: d.description || null,
      imageUrl: d.imageUrl || null,
      price: d.price,
      oldPrice: d.oldPrice ?? null,
      active: d.active,
      startDate: d.startDate ? new Date(d.startDate) : null,
      endDate: d.endDate ? new Date(d.endDate) : null,
      couponCode: d.couponCode || null,
      badge: d.badge || null,
      itemsJson: d.itemsJson,
    },
  });
  await audit(guard.admin.id, "deal.update", id, { title: deal.title });
  return NextResponse.json({ ok: true, deal });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  await db.deal.delete({ where: { id } }).catch(() => {});
  await audit(guard.admin.id, "deal.delete", id);
  return NextResponse.json({ ok: true });
}
