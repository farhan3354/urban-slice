import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-guard";
import { serializeProduct } from "@/lib/products";
import { slugify } from "@/lib/format";
import { z } from "zod";

const OptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  priceModifier: z.number().min(0),
  order: z.number().int().min(0),
  defaultSel: z.boolean().optional(),
});
const GroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  key: z.string().min(1),
  type: z.enum(["single", "multiple"]),
  required: z.boolean(),
  min: z.number().int().min(0),
  max: z.number().int().min(0),
  order: z.number().int().min(0),
  options: z.array(OptionSchema),
});
const UpdateSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  categoryId: z.string().min(1),
  basePrice: z.number().min(0),
  imageUrl: z.string().max(500).optional().nullable(),
  available: z.boolean(),
  featured: z.boolean(),
  popular: z.boolean(),
  prepTimeMin: z.number().int().min(0).max(180),
  promoPrice: z.number().min(0).optional().nullable(),
  tags: z.array(z.string()),
  optionGroups: z.array(GroupSchema),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  const p = await db.product.findUnique({
    where: { id },
    include: { category: true, options: { include: { options: true } } },
  });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: serializeProduct(p) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const existing = await db.product.findUnique({ where: { id }, include: { options: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = d.slug ? slugify(d.slug) : slugify(d.name);
    if (slug !== existing.slug) {
      const clash = await db.product.findUnique({ where: { slug } });
      if (clash) return NextResponse.json({ ok: false, errors: [{ field: "slug", message: "Slug already in use" }] }, { status: 400 });
    }

    // Update base fields
    await db.product.update({
      where: { id },
      data: {
        name: d.name,
        slug,
        description: d.description || null,
        categoryId: d.categoryId,
        basePrice: d.basePrice,
        imageUrl: d.imageUrl || null,
        available: d.available,
        featured: d.featured,
        popular: d.popular,
        prepTimeMin: d.prepTimeMin,
        promoPrice: d.promoPrice ?? null,
        tagsJson: JSON.stringify(d.tags),
      },
    });

    // Replace option groups
    await db.productOptionGroup.deleteMany({ where: { productId: id } });
    for (const g of d.optionGroups) {
      await db.productOptionGroup.create({
        data: {
          productId: id,
          name: g.name,
          key: g.key,
          type: g.type,
          required: g.required,
          min: g.min,
          max: g.max,
          order: g.order,
          options: { create: g.options.map((o) => ({ name: o.name, priceModifier: o.priceModifier, order: o.order, defaultSel: !!o.defaultSel })) },
        },
      });
    }

    const updated = await db.product.findUnique({
      where: { id },
      include: { category: true, options: { include: { options: true } } },
    });
    await audit(guard.admin.id, "product.update", id, { name: d.name });
    return NextResponse.json({ ok: true, product: serializeProduct(updated) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, errors: [{ field: "server", message: e?.message }] }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  const p = await db.product.delete({ where: { id } }).catch(() => null);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit(guard.admin.id, "product.delete", id, { name: p.name });
  return NextResponse.json({ ok: true });
}
