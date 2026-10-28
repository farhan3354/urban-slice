"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore, useCartLines, useCartSubtotal, useHydrated } from "@/lib/cart-store";
import { SmartImage } from "./SmartImage";
import { Price } from "./Price";
import { formatPKR } from "@/lib/format";

export function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const lines = useCartLines();
  const subtotal = useCartSubtotal();
  const hydrated = useHydrated();
  const setQty = useCartStore((s) => s.setQty);
  const removeLine = useCartStore((s) => s.removeLine);
  const router = useRouter();

  const goCheckout = () => {
    onOpenChange(false);
    router.push("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBag className="size-5 text-primary" />
            Your Cart
          </SheetTitle>
          <SheetDescription>
            {hydrated && lines.length > 0
              ? `${lines.reduce((n, l) => n + l.qty, 0)} item${
                  lines.reduce((n, l) => n + l.qty, 0) === 1 ? "" : "s"
                } in your cart`
              : "Your cart is empty"}
          </SheetDescription>
        </SheetHeader>

        {!hydrated ? (
          <div className="flex-1 grid place-items-center p-8 text-muted-foreground text-sm">
            Loading cart…
          </div>
        ) : lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="size-16 rounded-full bg-muted grid place-items-center">
              <ShoppingBag className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add some delicious pizzas to get started.
              </p>
            </div>
            <Button asChild onClick={() => onOpenChange(false)}>
              <Link href="/menu">Browse Menu</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 thin-scroll">
              <div className="px-5 py-2 space-y-3">
                {lines.map((line) => (
                  <div
                    key={line.key}
                    className="flex gap-3 p-3 rounded-xl border bg-card"
                  >
                    <SmartImage
                      src={line.imageUrl}
                      alt={line.name}
                      className="size-16 rounded-lg shrink-0 bg-muted"
                      imgClassName="object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-snug line-clamp-2">
                          {line.name}
                        </p>
                        <button
                          onClick={() => removeLine(line.key)}
                          aria-label={`Remove ${line.name} from cart`}
                          className="text-muted-foreground hover:text-destructive p-1 -m-1 rounded transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {line.optionSummary && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {line.optionSummary}
                        </p>
                      )}
                      {line.specialInstructions && (
                        <p className="text-xs italic text-muted-foreground mt-0.5 line-clamp-2">
                          “{line.specialInstructions}”
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 border rounded-md">
                          <button
                            onClick={() => setQty(line.key, line.qty - 1)}
                            aria-label="Decrease quantity"
                            className="grid place-items-center size-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-l-md transition-colors"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium tabular-nums">
                            {line.qty}
                          </span>
                          <button
                            onClick={() => setQty(line.key, line.qty + 1)}
                            aria-label="Increase quantity"
                            className="grid place-items-center size-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-r-md transition-colors"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <Price
                          amount={line.lineTotal}
                          className="font-semibold text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="border-t bg-muted/30">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPKR(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Delivery fee & any discounts are calculated at checkout.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button asChild variant="outline">
                  <Link href="/cart" onClick={() => onOpenChange(false)}>
                    View Cart
                  </Link>
                </Button>
                <Button onClick={goCheckout}>
                  Checkout
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
