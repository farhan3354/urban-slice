"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Eye, Flame, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "./Price";
import { useCartStore } from "@/lib/cart-store";
import { formatPKR } from "@/lib/format";
import type { SerializedProduct, SerializedOptionGroup } from "@/lib/types";

// Compute the default selected option IDs for a product, plus a summary string
// and the resulting unit price (effectivePrice + modifiers).
export function computeDefaultSelection(
  product: SerializedProduct
): {
  selectedOptionIds: string[];
  summary: string;
  unitPrice: number;
  modifiers: number;
} {
  const selected: string[] = [];
  const summaryParts: string[] = [];
  let modifiers = 0;

  for (const g of product.optionGroups) {
    const defaults = g.options.filter((o) => o.defaultSel);
    if (g.type === "single") {
      const opt = defaults[0] || g.options[0];
      if (opt) {
        selected.push(opt.id);
        summaryParts.push(opt.name);
        modifiers += opt.priceModifier;
      }
    } else {
      for (const opt of defaults) {
        selected.push(opt.id);
        modifiers += opt.priceModifier;
        summaryParts.push(`+${opt.name}`);
      }
    }
  }

  const unitPrice = product.effectivePrice + modifiers;
  return {
    selectedOptionIds: selected,
    summary: summaryParts.join(" · "),
    unitPrice,
    modifiers,
  };
}

export function ProductCard({
  product,
  className,
}: {
  product: SerializedProduct;
  className?: string;
}) {
  const addLine = useCartStore((s) => s.addLine);
  const hasPromo =
    product.promoPrice != null && product.promoPrice < product.basePrice;
  const [adding, setAdding] = React.useState(false);

  const onQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.available) return;
    setAdding(true);
    const { selectedOptionIds, summary, unitPrice } =
      computeDefaultSelection(product);
    addLine({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl || undefined,
      basePrice: product.effectivePrice,
      qty: 1,
      selectedOptionIds,
      optionSummary: summary,
      unitPrice,
      lineTotal: unitPrice,
    });
    toast.success(`${product.name} added to cart`, {
      description: summary ? `${summary} · ${formatPKR(unitPrice)}` : formatPKR(unitPrice),
    });
    setTimeout(() => setAdding(false), 400);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-0 border-border/70 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/50 bg-card/95 backdrop-blur-sm",
        !product.available && "opacity-70",
        className
      )}
    >
      <Link
        href={`/menu/${product.slug}`}
        className="block"
        aria-label={`${product.name} — view details`}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <span className="font-display text-4xl opacity-30">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            {product.featured && (
              <Badge className="bg-[#FFD700] text-[#0f0f0f] font-bold shadow-md hover:scale-105 transition-transform">
                <Star className="size-3 fill-current" />
                Featured
              </Badge>
            )}
            {product.popular && !product.featured && (
              <Badge className="bg-[#CC0000] text-white font-bold shadow-md hover:scale-105 transition-transform">
                <Flame className="size-3 fill-current" />
                Popular
              </Badge>
            )}
            {hasPromo && (
              <Badge className="bg-red-600 text-white font-bold shadow-md">Promo</Badge>
            )}
          </div>
          {!product.available && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
              <span className="text-sm font-medium text-foreground/80 px-3 py-1.5 rounded-full bg-card border">
                Currently unavailable
              </span>
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
            {product.description || "Delicious and made to order."}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Price
              amount={product.effectivePrice}
              className="font-display font-extrabold text-lg text-primary"
            />
            {hasPromo && (
              <Price
                amount={product.basePrice}
                strike
                className="text-xs text-muted-foreground"
              />
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4 flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="flex-1 hover:border-primary/50 active:scale-95 transition-all text-xs font-semibold"
          aria-label={`View ${product.name}`}
        >
          <Link href={`/menu/${product.slug}`}>
            <Eye className="size-3.5" />
            Customize
          </Link>
        </Button>
        <Button
          size="sm"
          className="flex-1 active:scale-95 transition-all text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md hover:shadow-primary/30"
          onClick={onQuickAdd}
          disabled={!product.available || adding}
          aria-label={`Add ${product.name} to cart`}
        >
          <Plus className={cn("size-3.5 transition-transform", adding && "rotate-45")} />
          {adding ? "Added!" : "Quick Add"}
        </Button>
      </div>
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
        <div className="h-3 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
        <div className="h-8 w-full rounded bg-muted animate-pulse mt-2" />
      </div>
    </Card>
  );
}
