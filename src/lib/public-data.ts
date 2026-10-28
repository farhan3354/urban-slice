// Server-side data fetchers for public site pages.
// These read from the DB directly (same data as the public API).

import { db } from "@/lib/db";
import { serializeProduct } from "@/lib/products";
import type {
  Category,
  Deal,
  DealItem,
  SerializedProduct,
  TrackedOrder,
} from "@/lib/types";

export async function fetchCategories(): Promise<Category[]> {
  const cats = await db.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    order: c.order,
    active: c.active,
  }));
}

export async function fetchProducts(opts?: {
  categoryId?: string;
  q?: string;
  featured?: boolean;
  popular?: boolean;
}): Promise<SerializedProduct[]> {
  const where: any = { available: true };
  if (opts?.categoryId) where.categoryId = opts.categoryId;
  if (opts?.featured) where.featured = true;
  if (opts?.popular) where.popular = true;
  if (opts?.q) {
    where.OR = [
      { name: { contains: opts.q } },
      { description: { contains: opts.q } },
    ];
  }
  const products = await db.product.findMany({
    where,
    include: { category: true, options: { include: { options: true } } },
    orderBy: { createdAt: "asc" },
  });
  return products.map(serializeProduct);
}

export async function fetchProductBySlug(
  slug: string
): Promise<SerializedProduct | null> {
  const p = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      options: { include: { options: true } },
    },
  });
  if (!p) return null;
  return serializeProduct(p);
}

export async function fetchCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const c = await db.category.findUnique({ where: { slug } });
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    order: c.order,
    active: c.active,
  };
}

export async function fetchDeals(): Promise<Deal[]> {
  const now = new Date();
  const deals = await db.deal.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  return deals
    .filter((d) => {
      if (d.startDate && now < d.startDate) return false;
      if (d.endDate && now > d.endDate) return false;
      return true;
    })
    .map((d) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      description: d.description,
      imageUrl: d.imageUrl,
      price: d.price,
      oldPrice: d.oldPrice,
      badge: d.badge,
      couponCode: d.couponCode,
      itemsJson: d.itemsJson,
    }));
}

export function parseDealItems(itemsJson: string): DealItem[] {
  try {
    const arr = JSON.parse(itemsJson);
    if (!Array.isArray(arr)) return [];
    return arr.map((it: any) => ({
      name: String(it?.name || ""),
      qty: Number(it?.qty || 1),
    }));
  } catch {
    return [];
  }
}

export async function fetchOrderByRef(ref: string): Promise<TrackedOrder | null> {
  const order = await db.order.findUnique({ where: { orderRef: ref } });
  if (!order) return null;
  return {
    orderRef: order.orderRef,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    type: order.type as "delivery" | "pickup",
    address: order.address,
    area: order.area,
    notes: order.notes,
    items: JSON.parse(order.itemsJson || "[]"),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    total: order.total,
    status: order.status as TrackedOrder["status"],
    couponCode: order.couponCode,
    createdAt: order.createdAt.toISOString(),
    confirmedAt: order.confirmedAt?.toISOString() || null,
    completedAt: order.completedAt?.toISOString() || null,
    cancelledAt: order.cancelledAt?.toISOString() || null,
  };
}
