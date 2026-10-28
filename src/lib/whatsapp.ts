// WhatsApp ordering — message builder + click-to-chat URL.
// IMPORTANT: We never mark an order as confirmed just because WhatsApp opened.

import type { Order } from "@prisma/client";

export type CartLineOption = {
  groupKey: string;
  groupName: string;
  optionName: string;
  priceModifier: number;
};

export type CartLine = {
  productId: string;
  name: string;
  basePrice: number;
  imageUrl?: string;
  qty: number;
  options: CartLineOption[];
  unitPrice: number; // computed (base + modifiers)
  lineTotal: number; // unitPrice * qty
  specialInstructions?: string;
};

export type CheckoutInfo = {
  customerName: string;
  customerPhone: string;
  type: "delivery" | "pickup";
  address?: string;
  area?: string;
  notes?: string;
};

export function buildOrderMessage(opts: {
  restaurantName: string;
  orderRef?: string;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  info: CheckoutInfo;
  currency: string;
}): string {
  const { restaurantName, orderRef, lines, subtotal, deliveryFee, discount, total, info, currency } =
    opts;
  const cur = (n: number) =>
    `${currency === "PKR" ? "Rs. " : ""}${Math.round(n).toLocaleString("en-PK")}`;

  const L: string[] = [];
  L.push(`*${restaurantName}*`);
  L.push(`New order${orderRef ? ` — ${orderRef}` : ""}`);
  L.push("");
  L.push(`*Customer:* ${info.customerName}`);
  L.push(`*Phone:* ${info.customerPhone}`);
  L.push(`*Type:* ${info.type === "delivery" ? "Home Delivery" : "Pickup"}`);
  if (info.type === "delivery" && info.address) {
    L.push(`*Address:* ${info.address}`);
    if (info.area) L.push(`*Area:* ${info.area}`);
  }
  if (info.notes) L.push(`*Notes:* ${info.notes}`);
  L.push("");
  L.push("*Order Items*");
  lines.forEach((l, i) => {
    L.push(`${i + 1}. ${l.name} × ${l.qty} — ${cur(l.lineTotal)}`);
    if (l.options.length > 0) {
      l.options.forEach((o) => {
        L.push(
          `   • ${o.groupName}: ${o.optionName}${o.priceModifier > 0 ? ` (+${cur(o.priceModifier)})` : ""}`
        );
      });
    }
    if (l.specialInstructions) L.push(`   • Note: ${l.specialInstructions}`);
  });
  L.push("");
  L.push(`Subtotal: ${cur(subtotal)}`);
  if (deliveryFee > 0) L.push(`Delivery fee: ${cur(deliveryFee)}`);
  if (discount > 0) L.push(`Discount: -${cur(discount)}`);
  L.push(`*Total: ${cur(total)}*`);
  L.push("");
  L.push("_This order was placed via the Urban Slice Pizza website and is pending your confirmation._");
  return L.join("\n");
}

export function whatsappUrl(number: string, message: string): string {
  const clean = (number || "").replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function buildReceiptText(order: Order & { itemsJson: string }): string {
  const items = JSON.parse(order.itemsJson || "[]") as any[];
  const cur = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
  const L: string[] = [];
  L.push("================================");
  L.push(`  ${order.orderRef}`);
  L.push("================================");
  L.push(`Customer: ${order.customerName}`);
  L.push(`Phone: ${order.customerPhone}`);
  L.push(`Type: ${order.type.toUpperCase()}`);
  if (order.type === "delivery" && order.address) {
    L.push(`Address: ${order.address}`);
    if (order.area) L.push(`Area: ${order.area}`);
  }
  L.push(`Date: ${new Date(order.createdAt).toLocaleString("en-PK")}`);
  L.push("--------------------------------");
  items.forEach((it: any, i: number) => {
    L.push(`${i + 1}. ${it.name} x${it.qty}   ${cur(it.lineTotal)}`);
    if (it.options?.length) {
      it.options.forEach((o: any) => L.push(`    - ${o.groupName}: ${o.optionName}`));
    }
  });
  L.push("--------------------------------");
  L.push(`Subtotal:        ${cur(order.subtotal)}`);
  if (order.deliveryFee > 0) L.push(`Delivery:        ${cur(order.deliveryFee)}`);
  if (order.discount > 0) L.push(`Discount:       -${cur(order.discount)}`);
  L.push(`TOTAL:           ${cur(order.total)}`);
  if (order.notes) L.push(`Notes: ${order.notes}`);
  L.push("================================");
  L.push(`Status: ${order.status}`);
  return L.join("\n");
}
