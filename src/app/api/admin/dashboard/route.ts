import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to + "T23:59:59");
  }

  const [total, pendingWhatsApp, confirmed, preparing, ready, outForDelivery, completed, cancelled, orders] =
    await Promise.all([
      db.order.count({ where }),
      db.order.count({ where: { ...where, status: "pending_whatsapp" } }),
      db.order.count({ where: { ...where, status: "confirmed" } }),
      db.order.count({ where: { ...where, status: "preparing" } }),
      db.order.count({ where: { ...where, status: "ready" } }),
      db.order.count({ where: { ...where, status: "out_for_delivery" } }),
      db.order.count({ where: { ...where, status: "completed" } }),
      db.order.count({ where: { ...where, status: "cancelled" } }),
      db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 1000 }),
    ]);

  const validStatuses = new Set(["confirmed", "preparing", "ready", "out_for_delivery", "completed"]);
  const validOrders = orders.filter((o) => validStatuses.has(o.status));
  const salesTotal = validOrders.reduce((s, o) => s + o.total, 0);
  const cancelledTotal = orders
    .filter((o) => o.status === "cancelled")
    .reduce((s, o) => s + o.total, 0);

  // Sales by day (last 14 days)
  const byDay = new Map<string, number>();
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, 0);
  }
  validOrders.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, byDay.get(key)! + o.total);
  });
  const salesSeries = Array.from(byDay.entries()).map(([day, value]) => ({ day, value }));

  // Popular items
  const itemCounts = new Map<string, { name: string; qty: number; revenue: number }>();
  validOrders.forEach((o) => {
    try {
      const items = JSON.parse(o.itemsJson) as any[];
      items.forEach((it) => {
        const cur = itemCounts.get(it.name) || { name: it.name, qty: 0, revenue: 0 };
        cur.qty += it.qty;
        cur.revenue += it.lineTotal || 0;
        itemCounts.set(it.name, cur);
      });
    } catch {}
  });
  const popularItems = Array.from(itemCounts.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  const recent = orders.slice(0, 8).map((o) => ({
    orderRef: o.orderRef,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    type: o.type,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
  }));

  // Low availability / unavailable items
  const unavailableCount = await db.product.count({ where: { available: false } });
  const lowItems = await db.product.findMany({ where: { available: false }, take: 10, include: { category: true } });

  return NextResponse.json({
    ok: true,
    counts: {
      total,
      pendingWhatsApp,
      confirmed,
      preparing,
      ready,
      outForDelivery,
      completed,
      cancelled,
    },
    salesTotal,
    cancelledTotal,
    orderCount: orders.length,
    salesSeries,
    popularItems,
    recent,
    unavailableCount,
    lowItems: lowItems.map((p) => ({ id: p.id, name: p.name, category: p.category.name })),
    isDemoData: true,
  });
}
