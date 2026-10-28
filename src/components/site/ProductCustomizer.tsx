"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, ChevronLeft, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/cart-store";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Price } from "./Price";
import type { SerializedProduct, SerializedOptionGroup } from "@/lib/types";

type Props = {
  product: SerializedProduct;
};

export function ProductCustomizer({ product }: Props) {
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);

  // Selected option IDs grouped by groupId for easy state management.
  const [selectedByGroup, setSelectedByGroup] = React.useState<
    Record<string, string[]>
  >(() => {
    const init: Record<string, string[]> = {};
    for (const g of product.optionGroups) {
      const defs = g.options.filter((o) => o.defaultSel);
      if (g.type === "single") {
        init[g.id] = defs[0] ? [defs[0].id] : g.options[0] ? [g.options[0].id] : [];
      } else {
        init[g.id] = defs.map((o) => o.id);
      }
    }
    return init;
  });

  const [qty, setQty] = React.useState(1);
  const [specialInstructions, setSpecialInstructions] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Recompute live unit price & summary.
  const { unitPrice, summary, selectedIds } = React.useMemo(() => {
    let mod = 0;
    const parts: string[] = [];
    const ids: string[] = [];
    for (const g of product.optionGroups) {
      const sel = selectedByGroup[g.id] || [];
      for (const opt of g.options) {
        if (sel.includes(opt.id)) {
          mod += opt.priceModifier;
          ids.push(opt.id);
          parts.push(
            g.type === "single" ? opt.name : `+${opt.name}`
          );
        }
      }
    }
    return {
      unitPrice: product.effectivePrice + mod,
      summary: parts.join(", "),
      selectedIds: ids,
    };
  }, [selectedByGroup, product]);

  function setSingle(groupId: string, optionId: string) {
    setSelectedByGroup((p) => ({ ...p, [groupId]: [optionId] }));
    setErrors((e) => {
      if (!e[groupId]) return e;
      const next = { ...e };
      delete next[groupId];
      return next;
    });
  }

  function toggleMultiple(groupId: string, optionId: string, group: SerializedOptionGroup) {
    setSelectedByGroup((p) => {
      const cur = p[groupId] || [];
      const has = cur.includes(optionId);
      let next: string[];
      if (has) {
        next = cur.filter((id) => id !== optionId);
      } else {
        if (group.max > 0 && cur.length >= group.max) {
          toast.error(`Maximum ${group.max} selection${group.max === 1 ? "" : "s"} for ${group.name}`);
          return p;
        }
        next = [...cur, optionId];
      }
      return { ...p, [groupId]: next };
    });
    setErrors((e) => {
      if (!e[groupId]) return e;
      const next = { ...e };
      delete next[groupId];
      return next;
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const g of product.optionGroups) {
      const sel = selectedByGroup[g.id] || [];
      if (g.required && g.type === "single" && sel.length === 0) {
        errs[g.id] = `Please select a ${g.name.toLowerCase()}`;
      }
      if (g.type === "multiple") {
        if (g.min > 0 && sel.length < g.min) {
          errs[g.id] = `Choose at least ${g.min}`;
        }
        if (g.max > 0 && sel.length > g.max) {
          errs[g.id] = `Maximum ${g.max} allowed`;
        }
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstErr = Object.values(errs)[0];
      toast.error(firstErr);
    }
    return Object.keys(errs).length === 0;
  }

  function handleAdd() {
    if (!product.available) return;
    if (!validate()) return;
    addLine({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl || undefined,
      basePrice: product.effectivePrice,
      qty,
      selectedOptionIds: selectedIds,
      optionSummary: summary,
      unitPrice,
      lineTotal: Math.round(unitPrice * qty * 100) / 100,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    toast.success(`Added ${qty} × ${product.name} to cart`, {
      description: summary ? `${summary} · ${formatPKR(unitPrice * qty)}` : formatPKR(unitPrice * qty),
      action: {
        label: "View Cart",
        onClick: () => router.push("/cart"),
      },
    });
    setQty(1);
    setSpecialInstructions("");
  }

  const hasPromo =
    product.promoPrice != null && product.promoPrice < product.basePrice;
  const unavailable = !product.available;

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/menu">
            <ChevronLeft className="size-4" />
            Back to menu
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          <span>{product.prepTimeMin} min prep</span>
          {unavailable && (
            <span className="inline-flex items-center gap-1 text-red-600 font-medium">
              <AlertCircle className="size-4" />
              Currently unavailable
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-3">
          <Price
            amount={product.effectivePrice}
            className="font-display font-bold text-3xl"
          />
          {hasPromo && (
            <Price
              amount={product.basePrice}
              strike
              className="text-base"
            />
          )}
        </div>
        {product.description && (
          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        )}
      </div>

      <Separator />

      {/* Option groups */}
      <div className="space-y-6">
        {product.optionGroups.map((g) => {
          const sel = selectedByGroup[g.id] || [];
          const err = errors[g.id];
          return (
            <div key={g.id} className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display font-semibold text-base">
                  {g.name}
                  {g.required && <span className="text-primary"> *</span>}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {g.type === "single"
                    ? "Choose one"
                    : g.max > 0
                    ? `Up to ${g.max}`
                    : g.min > 0
                    ? `Min ${g.min}`
                    : "Optional"}
                </span>
              </div>

              {g.type === "single" ? (
                <RadioGroup
                  value={sel[0] || ""}
                  onValueChange={(v) => setSingle(g.id, v)}
                  className={cn("grid gap-2", err && "ring-1 ring-destructive/40 rounded-md p-2 -m-2")}
                >
                  {g.options.map((o) => {
                    const oid = `opt-${g.id}-${o.id}`;
                    const priceLabel =
                      o.priceModifier > 0
                        ? `+${formatPKR(o.priceModifier)}`
                        : o.priceModifier < 0
                        ? formatPKR(o.priceModifier)
                        : "Included";
                    return (
                      <Label
                        key={o.id}
                        htmlFor={oid}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                          sel[0] === o.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <RadioGroupItem id={oid} value={o.id} />
                        <span className="flex-1 text-sm">{o.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {priceLabel}
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              ) : (
                <div className={cn("grid gap-2", err && "ring-1 ring-destructive/40 rounded-md p-2 -m-2")}>
                  {g.options.map((o) => {
                    const oid = `opt-${g.id}-${o.id}`;
                    const checked = sel.includes(o.id);
                    const priceLabel =
                      o.priceModifier > 0
                        ? `+${formatPKR(o.priceModifier)}`
                        : o.priceModifier < 0
                        ? formatPKR(o.priceModifier)
                        : "Included";
                    return (
                      <Label
                        key={o.id}
                        htmlFor={oid}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                          checked
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          id={oid}
                          checked={checked}
                          onCheckedChange={() =>
                            toggleMultiple(g.id, o.id, g)
                          }
                        />
                        <span className="flex-1 text-sm">{o.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {priceLabel}
                        </span>
                      </Label>
                    );
                  })}
                </div>
              )}

              {err && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {err}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Special instructions */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="font-display font-semibold">
          Special instructions
          <span className="text-xs text-muted-foreground font-normal ml-2">
            (optional)
          </span>
        </Label>
        <Textarea
          id="notes"
          placeholder="e.g. extra spicy, no onions, ring the bell…"
          value={specialInstructions}
          maxLength={300}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          rows={2}
        />
        <p className="text-[11px] text-muted-foreground">
          {specialInstructions.length}/300
        </p>
      </div>

      <Separator />

      {/* Quantity + Add */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-display font-semibold">Quantity</Label>
          <div className="inline-flex items-center border rounded-full">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              className="grid place-items-center size-9 rounded-full hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-10 text-center text-base font-semibold tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              aria-label="Increase quantity"
              disabled={qty >= 99}
              className="grid place-items-center size-9 rounded-full hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-card border p-3">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <Price
              amount={unitPrice * qty}
              className="font-display font-bold text-xl"
            />
          </div>
          <Button
            size="lg"
            onClick={handleAdd}
            disabled={unavailable}
            className="min-w-[160px]"
          >
            <ShoppingBag className="size-4" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
