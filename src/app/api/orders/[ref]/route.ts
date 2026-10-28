import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  const order = await db.order.findUnique({ where: { orderRef: ref } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({
    order: {
      orderRef: order.orderRef,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      type: order.type,
      address: order.address,
      area: order.area,
      notes: order.notes,
      items: JSON.parse(order.itemsJson || "[]"),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      status: order.status,
      internalNotes: order.internalNotes,
      couponCode: order.couponCode,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
    },
  });
}
