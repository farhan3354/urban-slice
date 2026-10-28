"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useCartLines,
  useCartSubtotal,
  useCartStore,
  useHydrated,
} from "@/lib/cart-store";
import { useSettings } from "@/hooks/use-settings";
import { formatPKR } from "@/lib/format";
import { Price } from "@/components/site/Price";

export default function CartPage() {
  const hydrated = useHydrated();
  const lines = useCartLines();
  const subtotal = useCartSubtotal();
  const setQty = useCartStore((s) => s.setQty);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);
  const { settings } = useSettings();

  const remainingForFree =
    settings.freeDeliveryThreshold > 0
      ? settings.freeDeliveryThreshold - subtotal
      : 0;
  const showFreeDeliveryNote = remainingForFree > 0 && subtotal > 0;

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-8 w-1/3 bg-muted animate-pulse rounded mb-6" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 bg-muted/60 animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24 text-center">
        <div className="mx-auto size-20 grid place-items-center rounded-full bg-muted mb-5">
          <ShoppingBag className="size-10 text-muted-foreground" />
        </div>
        <h1 className="font-display font-extrabold text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Looks like you haven&apos;t added any pizzas yet. Let&apos;s fix that!
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/menu">
            Browse the menu
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl">Your Cart</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lines.reduce((n, l) => n + l.qty, 0)} item
            {lines.reduce((n, l) => n + l.qty, 0) === 1 ? "" : "s"} · review before
            checkout
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("Clear all items from your cart?")) clear();
          }}
        >
          <Trash2 className="size-4" />
          Clear all
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {showFreeDeliveryNote && (
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
              <p>
                Add <Price amount={remainingForFree} className="font-semibold" /> more to unlock{" "}
                <span className="font-semibold">FREE delivery</span> 🎉
              </p>
            </div>
          )}
          {lines.map((line) => (
            <Card key={line.key} className="p-3 sm:p-4">
              <div className="flex gap-3 sm:gap-4">
                <div className="relative size-20 sm:size-24 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt={line.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-2xl font-display opacity-30">
                      {line.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href="/menu"
                        className="font-display font-semibold text-base sm:text-lg leading-tight hover:text-primary"
                      >
                        {line.name}
                      </Link>
                      {line.optionSummary && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {line.optionSummary}
                        </p>
                      )}
                      {line.specialInstructions && (
                        <p className="text-xs italic text-muted-foreground mt-1 line-clamp-2">
                          “{line.specialInstructions}”
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeLine(line.key)}
                      aria-label={`Remove ${line.name}`}
                      className="text-muted-foreground hover:text-destructive p-1 -m-1 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center border rounded-full">
                      <button
                        onClick={() => setQty(line.key, line.qty - 1)}
                        aria-label="Decrease quantity"
                        className="grid place-items-center size-8 rounded-full hover:bg-muted transition-colors"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        onClick={() => setQty(line.key, line.qty + 1)}
                        aria-label="Increase quantity"
                        className="grid place-items-center size-8 rounded-full hover:bg-muted transition-colors"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <Price
                        amount={line.lineTotal}
                        className="font-display font-bold text-lg"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {formatPKR(line.unitPrice)} each
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/menu">
              <ArrowLeft className="size-4" />
              Continue shopping
            </Link>
          </Button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="p-5 sticky top-24">
            <h2 className="font-display font-semibold text-lg">Order Summary</h2>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="text-muted-foreground text-xs">
                  Calculated at checkout
                </span>
              </div>
              {settings.minOrderValue > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min order</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatPKR(settings.minOrderValue)}
                  </span>
                </div>
              )}
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Estimated total</span>
              <Price
                amount={subtotal}
                className="font-display font-bold text-xl"
              />
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href="/checkout">
                Proceed to Checkout
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0" />
              Order is confirmed only after the restaurant replies on WhatsApp.
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur p-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Subtotal</p>
          <Price amount={subtotal} className="font-display font-bold text-lg" />
        </div>
        <Button asChild size="sm" className="px-5">
          <Link href="/checkout">
            Checkout
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
