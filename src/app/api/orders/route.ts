import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateAndPriceCart, type RawCartLineInput } from "@/lib/cart-validate";
import { getSettings } from "@/lib/settings";
import { buildOrderMessage, whatsappUrl, type CheckoutInfo } from "@/lib/whatsapp";
import { generateOrderRef, onlyDigits } from "@/lib/format";
import { z } from "zod";

const OrderSchema = z.object({
  customerName: z.string().min(2, "Please enter your full name").max(80),
  customerPhone: z
    .string()
    .min(8, "Please enter a valid phone number")
    .max(20),
  type: z.enum(["delivery", "pickup"]),
  address: z.string().max(300).optional(),
  area: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  couponCode: z.string().max(40).optional(),
  lines: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().int().min(1).max(99),
        selectedOptionIds: z.array(z.string()),
        specialInstructions: z.string().max(300).optional(),
      })
    )
    .min(1, "Cart is empty"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = OrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (data.type === "delivery" && (!data.address || data.address.trim().length < 5)) {
      return NextResponse.json(
        { ok: false, errors: [{ field: "address", message: "Please enter your delivery address" }] },
        { status: 400 }
      );
    }

    const settings = await getSettings();

    // Recompute prices server-side
    const rawLines: RawCartLineInput[] = data.lines.map((l) => ({
      productId: l.productId,
      qty: l.qty,
      selectedOptionIds: l.selectedOptionIds,
      specialInstructions: l.specialInstructions,
    }));
    const validation = await validateAndPriceCart(rawLines);
    if (!validation.ok) {
      return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
    }

    let subtotal = validation.subtotal;
    let deliveryFee = 0;
    if (data.type === "delivery") {
      const area = settings.deliveryAreas.find(
        (a) => a.name.toLowerCase() === (data.area || "").toLowerCase()
      );
      deliveryFee = area ? area.fee : settings.defaultDeliveryFee;
      // free delivery threshold
      if (settings.freeDeliveryThreshold > 0 && subtotal >= settings.freeDeliveryThreshold) {
        deliveryFee = 0;
      }
    }
    if (settings.minOrderValue > 0 && subtotal < settings.minOrderValue) {
      return NextResponse.json(
        {
          ok: false,
          errors: [{ field: "cart", message: `Minimum order is Rs. ${settings.minOrderValue}` }],
        },
        { status: 400 }
      );
    }

    // Coupon validation
    let discount = 0;
    if (data.couponCode) {
      const code = data.couponCode.trim().toUpperCase();
      const deal = await db.deal.findFirst({
        where: { couponCode: code, active: true },
      });
      if (deal) {
        // flat 10% off as demo coupon behavior
        discount = Math.round(subtotal * 0.1 * 100) / 100;
      }
    }

    const total = subtotal + deliveryFee - discount;

    const orderRef = generateOrderRef();
    const itemsJson = JSON.stringify(
      validation.lines.map((l) => ({
        name: l.name,
        qty: l.qty,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        options: l.options,
        specialInstructions: l.specialInstructions,
      }))
    );

    const order = await db.order.create({
      data: {
        orderRef,
        customerName: data.customerName.trim(),
        customerPhone: onlyDigits(data.customerPhone),
        type: data.type,
        address: data.address?.trim() || null,
        area: data.area || null,
        notes: data.notes?.trim() || null,
        itemsJson,
        subtotal,
        deliveryFee,
        discount,
        total,
        status: "pending_whatsapp",
        couponCode: data.couponCode || null,
        whatsappSentAt: new Date(),
      },
    });

    const info: CheckoutInfo = {
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      type: order.type as "delivery" | "pickup",
      address: order.address || undefined,
      area: order.area || undefined,
      notes: order.notes || undefined,
    };

    const message = buildOrderMessage({
      restaurantName: settings.restaurantName,
      orderRef: order.orderRef,
      lines: validation.lines,
      subtotal,
      deliveryFee,
      discount,
      total,
      info,
      currency: settings.currency,
    });

    const waUrl = whatsappUrl(settings.whatsappNumber, message);

    return NextResponse.json({
      ok: true,
      orderRef: order.orderRef,
      orderId: order.id,
      total,
      subtotal,
      deliveryFee,
      discount,
      whatsappUrl: waUrl,
      message,
    });
  } catch (e: any) {
    console.error("order create error", e);
    return NextResponse.json(
      { ok: false, errors: [{ field: "server", message: "Could not create order. Please try again." }] },
      { status: 500 }
    );
  }
}
