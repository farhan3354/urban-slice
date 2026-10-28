import { NextResponse } from "next/server";
import { validateAndPriceCart, type RawCartLineInput } from "@/lib/cart-validate";
import { getSettings } from "@/lib/settings";
import { buildOrderMessage, whatsappUrl, type CheckoutInfo } from "@/lib/whatsapp";
import { z } from "zod";

// Builds the WhatsApp click-to-chat URL for the current cart (without creating an order).
const Schema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  type: z.enum(["delivery", "pickup"]),
  address: z.string().optional(),
  area: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(
    z.object({
      productId: z.string(),
      qty: z.number().int().min(1).max(99),
      selectedOptionIds: z.array(z.string()),
      specialInstructions: z.string().optional(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) }, { status: 400 });
    }
    const data = parsed.data;
    const settings = await getSettings();
    const rawLines: RawCartLineInput[] = data.lines.map((l) => ({
      productId: l.productId,
      qty: l.qty,
      selectedOptionIds: l.selectedOptionIds,
      specialInstructions: l.specialInstructions,
    }));
    const validation = await validateAndPriceCart(rawLines);
    if (!validation.ok) return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });

    let deliveryFee = 0;
    if (data.type === "delivery") {
      const area = settings.deliveryAreas.find((a) => a.name.toLowerCase() === (data.area || "").toLowerCase());
      deliveryFee = area ? area.fee : settings.defaultDeliveryFee;
      if (settings.freeDeliveryThreshold > 0 && validation.subtotal >= settings.freeDeliveryThreshold) deliveryFee = 0;
    }
    const total = validation.subtotal + deliveryFee;

    const info: CheckoutInfo = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      type: data.type,
      address: data.address,
      area: data.area,
      notes: data.notes,
    };
    const message = buildOrderMessage({
      restaurantName: settings.restaurantName,
      lines: validation.lines,
      subtotal: validation.subtotal,
      deliveryFee,
      discount: 0,
      total,
      info,
      currency: settings.currency,
    });
    return NextResponse.json({ ok: true, whatsappUrl: whatsappUrl(settings.whatsappNumber, message), message });
  } catch (e: any) {
    return NextResponse.json({ ok: false, errors: [{ field: "server", message: e?.message }] }, { status: 500 });
  }
}
