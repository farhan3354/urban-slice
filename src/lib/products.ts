// Product serialization + price calculation (server-side, trusted).

import { db } from "@/lib/db";

export type SerializedOption = {
  id: string;
  groupId: string;
  name: string;
  priceModifier: number;
  defaultSel: boolean;
};

export type SerializedOptionGroup = {
  id: string;
  name: string;
  key: string;
  type: "single" | "multiple";
  required: boolean;
  min: number;
  max: number;
  options: SerializedOption[];
};

export type SerializedProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  effectivePrice: number;
  imageUrl: string | null;
  available: boolean;
  featured: boolean;
  popular: boolean;
  prepTimeMin: number;
  promoPrice: number | null;
  tags: string[];
  optionGroups: SerializedOptionGroup[];
};

export function serializeProduct(p: any): SerializedProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? "",
    basePrice: p.basePrice,
    effectivePrice: p.promoPrice != null ? p.promoPrice : p.basePrice,
    imageUrl: p.imageUrl ?? null,
    available: p.available,
    featured: p.featured,
    popular: p.popular,
    prepTimeMin: p.prepTimeMin,
    promoPrice: p.promoPrice ?? null,
    tags: safeJsonArray(p.tagsJson),
    optionGroups: (p.options ?? [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((g: any) => ({
        id: g.id,
        name: g.name,
        key: g.key,
        type: g.type,
        required: g.required,
        min: g.min,
        max: g.max,
        options: (g.options ?? [])
          .sort((a: any, b: any) => a.order - b.order)
          .map((o: any) => ({
            id: o.id,
            groupId: g.id,
            name: o.name,
            priceModifier: o.priceModifier,
            defaultSel: !!o.defaultSel,
          })),
      })),
  };
}

function safeJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function getFullProduct(slug: string) {
  const p = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      options: { include: { options: true } },
    },
  });
  return p;
}

export async function listProductsWithCategory(opts?: {
  categoryId?: string;
  availableOnly?: boolean;
}) {
  const where: any = {};
  if (opts?.categoryId) where.categoryId = opts.categoryId;
  if (opts?.availableOnly) where.available = true;
  return db.product.findMany({
    where,
    include: { category: true, options: { include: { options: true } } },
    orderBy: { createdAt: "asc" },
  });
}
