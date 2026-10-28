// Cart validation & price recompute — server-trusted.
// Client never submits totals; we recompute from DB.

import { db } from "@/lib/db";
import type { CartLine } from "@/lib/whatsapp";

export type RawCartLineInput = {
  productId: string;
  qty: number;
  selectedOptionIds: string[]; // option IDs chosen
  specialInstructions?: string;
};

export type ValidationErr = { field: string; message: string };

export type ValidationResult = {
  ok: boolean;
  errors: ValidationErr[];
  lines: CartLine[];
  subtotal: number;
};

export async function validateAndPriceCart(
  rawLines: RawCartLineInput[]
): Promise<ValidationResult> {
  const errors: ValidationErr[] = [];
  const lines: CartLine[] = [];

  if (!rawLines || rawLines.length === 0) {
    return { ok: false, errors: [{ field: "cart", message: "Cart is empty" }], lines: [], subtotal: 0 };
  }

  // Fetch all needed products in one query
  const ids = Array.from(new Set(rawLines.map((l) => l.productId)));
  const products = await db.product.findMany({
    where: { id: { in: ids } },
    include: { options: { include: { options: true } }, category: true },
  });
  const pMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;

  rawLines.forEach((l, idx) => {
    const p = pMap.get(l.productId);
    if (!p) {
      errors.push({ field: `lines[${idx}]`, message: `Product not found` });
      return;
    }
    if (!p.available) {
      errors.push({ field: `lines[${idx}]`, message: `${p.name} is currently unavailable` });
      return;
    }
    const qty = Math.max(1, Math.min(99, Math.floor(l.qty) || 1));
    const basePrice = p.promoPrice != null ? p.promoPrice : p.basePrice;

    // Validate option selections against groups
    const selectedOptionIds = Array.from(new Set(l.selectedOptionIds || []));
    const chosenOptions: {
      id: string;
      groupId: string;
      groupName: string;
      optionName: string;
      priceModifier: number;
    }[] = [];

    let modifiers = 0;
    for (const g of p.options) {
      const chosen = g.options.filter((o) => selectedOptionIds.includes(o.id));
      if (g.required && g.type === "single" && chosen.length === 0) {
        errors.push({
          field: `lines[${idx}].${g.key}`,
          message: `Please select a ${g.name} for ${p.name}`,
        });
      }
      if (g.type === "single" && chosen.length > 1) {
        errors.push({
          field: `lines[${idx}].${g.key}`,
          message: `Only one ${g.name} is allowed for ${p.name}`,
        });
      }
      if (g.type === "multiple" && g.max > 0 && chosen.length > g.max) {
        errors.push({
          field: `lines[${idx}].${g.key}`,
          message: `Maximum ${g.max} for ${g.name}`,
        });
      }
      if (g.type === "multiple" && g.min > 0 && chosen.length < g.min) {
        errors.push({
          field: `lines[${idx}].${g.key}`,
          message: `Choose at least ${g.min} for ${g.name}`,
        });
      }
      for (const o of chosen) {
        chosenOptions.push({
          id: o.id,
          groupId: g.id,
          groupName: g.name,
          optionName: o.name,
          priceModifier: o.priceModifier,
        });
        modifiers += o.priceModifier;
      }
    }

    if (errors.length > 0) return; // continue collecting errors but skip this line

    const unitPrice = basePrice + modifiers;
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;

    lines.push({
      productId: p.id,
      name: p.name,
      basePrice: basePrice,
      imageUrl: p.imageUrl ?? undefined,
      qty,
      options: chosenOptions.map((o) => ({
        groupKey: o.groupId,
        groupName: o.groupName,
        optionName: o.optionName,
        priceModifier: o.priceModifier,
      })),
      unitPrice,
      lineTotal,
      specialInstructions: l.specialInstructions?.trim() || undefined,
    });
  });

  return { ok: errors.length === 0, errors, lines, subtotal };
}
