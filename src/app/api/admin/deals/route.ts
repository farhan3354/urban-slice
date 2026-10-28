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
  active: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  couponCode: z.string().max(40).optional().nullable(),
  badge: z.string().max(40).optional().nullable(),
  itemsJson: z.string().default("[]"),
});

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const deals = await db.deal.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ deals });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) }, { status: 400 });
  const d = parsed.data;
  const slug = d.slug ? slugify(d.slug) : slugify(d.title);
  const existing = await db.deal.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ ok: false, errors: [{ field: "slug", message: "Slug in use" }] }, { status: 400 });
  const deal = await db.deal.create({
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
  await audit(guard.admin.id, "deal.create", deal.id, { title: deal.title });
  return NextResponse.json({ ok: true, deal });
}
