import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

// Permitted status transitions
const TRANSITIONS: Record<string, string[]> = {
  pending_whatsapp: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],
  cancelled: ["pending_whatsapp"],
};

export function canTransition(from: string, to: string): boolean {
  if (from === to) return false;
  const allowed = TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.trim();
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "20")));

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to + "T23:59:59");
  }
  if (q) {
    where.OR = [
      { orderRef: { contains: q } },
      { customerName: { contains: q } },
      { customerPhone: { contains: q } },
    ];
  }

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderRef: o.orderRef,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      type: o.type,
      address: o.address,
      area: o.area,
      notes: o.notes,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      discount: o.discount,
      total: o.total,
      status: o.status,
      internalNotes: o.internalNotes,
      couponCode: o.couponCode,
      whatsappSentAt: o.whatsappSentAt,
      confirmedAt: o.confirmedAt,
      completedAt: o.completedAt,
      cancelledAt: o.cancelledAt,
      createdAt: o.createdAt,
      items: JSON.parse(o.itemsJson || "[]"),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
