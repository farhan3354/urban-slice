import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-guard";
import { serializeProduct, type SerializedOptionGroup } from "@/lib/products";
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

const ProductSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  categoryId: z.string().min(1),
  basePrice: z.number().min(0),
  imageUrl: z.string().max(500).optional().nullable(),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  prepTimeMin: z.number().int().min(0).max(180).default(20),
  promoPrice: z.number().min(0).optional().nullable(),
  tags: z.array(z.string()).default([]),
  optionGroups: z.array(GroupSchema).default([]),
});

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const products = await db.product.findMany({
    include: { category: true, options: { include: { options: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products: products.map(serializeProduct) });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const body = await req.json();
    const parsed = ProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const slug = d.slug ? slugify(d.slug) : slugify(d.name);
    const existing = await db.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { ok: false, errors: [{ field: "slug", message: "A product with this slug already exists" }] },
        { status: 400 }
      );
    }
    const p = await db.product.create({
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
        options: {
          create: d.optionGroups.map((g: any) => ({
            name: g.name,
            key: g.key,
            type: g.type,
            required: g.required,
            min: g.min,
            max: g.max,
            order: g.order,
            options: { create: g.options.map((o: any) => ({ name: o.name, priceModifier: o.priceModifier, order: o.order, defaultSel: !!o.defaultSel })) },
          })),
        },
      },
      include: { options: { include: { options: true } } },
    });
    await audit(guard.admin.id, "product.create", p.id, { name: p.name });
    return NextResponse.json({ ok: true, product: serializeProduct(p) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, errors: [{ field: "server", message: e?.message }] }, { status: 500 });
  }
}
