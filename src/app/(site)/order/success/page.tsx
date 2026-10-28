"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Price } from "@/components/site/Price";
import { StatusBadge } from "@/components/site/StatusBadge";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { useSettings } from "@/hooks/use-settings";
import { formatDate } from "@/lib/format";
import type { TrackedOrder } from "@/lib/types";

export default function OrderSuccessPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Loader2 className="size-8 text-muted-foreground animate-spin mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Loading order…</p>
        </div>
      }
    >
      <OrderSuccessInner />
    </React.Suspense>
  );
}

function OrderSuccessInner() {
  const params = useSearchParams();
  const { settings } = useSettings();
  const ref = params.get("ref");

  const [order, setOrder] = React.useState<TrackedOrder | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    if (!ref) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders/${encodeURIComponent(ref)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        if (data?.order) setOrder(data.order);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [ref]);

  if (!ref) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display font-extrabold text-3xl">No order reference</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t find your order reference. Please check your link.
        </p>
        <Button asChild className="mt-6">
          <Link href="/menu">Browse menu</Link>
        </Button>
      </div>
    );
  }

  const waHref = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `Hi ${settings.restaurantName}! I just placed order ${ref}. Please confirm.`
  )}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <div className="text-center">
        <div className="mx-auto size-20 grid place-items-center rounded-full bg-emerald-100 mb-5">
          {loading ? (
            <Loader2 className="size-10 text-emerald-600 animate-spin" />
          ) : (
            <CheckCircle2 className="size-10 text-emerald-600" />
          )}
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
          Order placed!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your order reference is
        </p>
        <p className="font-mono font-bold text-xl text-primary mt-1">{ref}</p>
      </div>

      <Card className="mt-8 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Package className="size-5 text-primary" />
            Status
          </h2>
          <StatusBadge status={order?.status || "pending_whatsapp"} />
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <p className="font-semibold flex items-center gap-1.5">
            <Clock className="size-4" />
            Pending WhatsApp confirmation
          </p>
          <p className="mt-1 text-xs">
            Your order is pending confirmation by the restaurant. We&apos;ve
            opened WhatsApp — please send the message to confirm. The restaurant
            will reply to lock in your order.
          </p>
        </div>

        {order && (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Placed at</dt>
              <dd className="tabular-nums">{formatDate(order.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Order type</dt>
              <dd className="capitalize">
                {order.type === "delivery" ? "Home Delivery" : "Pickup"}
              </dd>
            </div>
            {order.type === "delivery" && order.area && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Area</dt>
                <dd>{order.area}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Items</dt>
              <dd>{order.items.length}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t mt-2">
              <dt className="font-semibold">Total</dt>
              <dd>
                <Price amount={order.total} className="font-display font-bold text-lg" />
              </dd>
            </div>
          </dl>
        )}
      </Card>

      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <Button asChild size="lg" className="bg-[#25D366] hover:bg-[#1ebe5d] text-white">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="size-5" />
            Open WhatsApp
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={`/order/${encodeURIComponent(ref)}`}>
            <Package className="size-4" />
            Track your order
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Tip: You can bookmark the tracking link to check your order status
        anytime.
      </p>

      <div className="mt-8 text-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/menu">Back to menu</Link>
        </Button>
      </div>
    </div>
  );
}
