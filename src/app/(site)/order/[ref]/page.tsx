import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Package,
  Phone,
  MapPin,
  Truck,
  Store,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Price } from "@/components/site/Price";
import { StatusBadge } from "@/components/site/StatusBadge";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { LiveOrderRefresher } from "@/components/site/LiveOrderRefresher";
import { fetchOrderByRef } from "@/lib/public-data";
import { getSettings } from "@/lib/settings";
import { formatDate, formatPKR } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = Promise<{ ref: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { ref } = await params;
  return {
    title: `Order ${ref}`,
    description: `Track your Urban Slice Pizza order ${ref}.`,
    robots: { index: false, follow: false },
  };
}

// Status timeline steps in order.
const TIMELINE: { status: OrderStatus; label: string; icon: any }[] = [
  { status: "pending_whatsapp", label: "Pending WhatsApp", icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { status: "preparing", label: "Preparing", icon: Package },
  { status: "ready", label: "Ready", icon: Store },
  { status: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { status: "completed", label: "Completed", icon: CheckCircle2 },
];

function stepIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return TIMELINE.findIndex((t) => t.status === status);
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Params;
}) {
  const { ref } = await params;
  const [order, settings] = await Promise.all([
    fetchOrderByRef(ref),
    getSettings(),
  ]);
  if (!order) notFound();

  const idx = stepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  const waHref = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `Hi ${settings.restaurantName}! I'm checking on order ${order.orderRef}.`
  )}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <LiveOrderRefresher />

      <nav className="text-xs text-muted-foreground mb-2" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">Order {order.orderRef}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
            Order Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reference{" "}
            <span className="font-mono font-semibold text-foreground">
              {order.orderRef}
            </span>{" "}
            · Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Status timeline */}
      <Card className="p-5 sm:p-6 mb-6">
        <h2 className="font-display font-semibold text-base mb-4">Progress</h2>
        {isCancelled ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            <p className="font-semibold">This order was cancelled.</p>
            {order.cancelledAt && (
              <p className="text-xs text-red-700/70 mt-1">
                Cancelled on {formatDate(order.cancelledAt)}
              </p>
            )}
            <p className="text-xs mt-2">
              Need help? Message us on WhatsApp — we&apos;re happy to help you
              place a new order.
            </p>
          </div>
        ) : (
          <ol className="space-y-0">
            {TIMELINE.map((step, i) => {
              const Icon = step.icon;
              const reached = i <= idx;
              const current = i === idx;
              const isLast = i === TIMELINE.length - 1;
              return (
                <li key={step.status} className="flex gap-3 relative">
                  {/* Connector */}
                  {!isLast && (
                    <span
                      aria-hidden
                      className={`absolute left-3 top-7 bottom-0 w-0.5 -translate-x-1/2 ${
                        reached ? "bg-primary" : "bg-border"
                      }`}
                      style={{ height: "calc(100% - 12px)" }}
                    />
                  )}
                  <span
                    className={`relative z-10 grid place-items-center size-6 rounded-full shrink-0 mt-0.5 ${
                      reached
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    } ${current ? "ring-4 ring-primary/20" : ""}`}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className={`pb-5 ${reached ? "" : "opacity-60"}`}>
                    <p
                      className={`text-sm font-medium ${
                        reached ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {i === 0 && order.createdAt && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(order.createdAt)}
                      </p>
                    )}
                    {i === idx && i !== 0 && order.confirmedAt && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(
                          i === 1
                            ? order.confirmedAt
                            : i === TIMELINE.length - 1
                            ? order.completedAt || order.confirmedAt
                            : order.confirmedAt
                        )}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <Separator className="my-4" />
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5 mt-0.5 shrink-0" />
          <p>
            This page auto-refreshes every 30 seconds to show the latest status.
            You can also refresh manually.
          </p>
        </div>
      </Card>

      {/* Items */}
      <Card className="p-5 sm:p-6 mb-6">
        <h2 className="font-display font-semibold text-base mb-4">
          Items ({order.items.length})
        </h2>
        <ul className="space-y-3">
          {order.items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {item.qty} × {item.name}
                </p>
                {item.options.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.options
                      .map((o) => `${o.groupName}: ${o.optionName}`)
                      .join(" · ")}
                  </p>
                )}
                {item.specialInstructions && (
                  <p className="text-xs italic text-muted-foreground mt-0.5">
                    “{item.specialInstructions}”
                  </p>
                )}
              </div>
              <Price amount={item.lineTotal} className="font-medium tabular-nums" />
            </li>
          ))}
        </ul>
        <Separator className="my-4" />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatPKR(order.subtotal)}</dd>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery fee</dt>
              <dd className="tabular-nums">{formatPKR(order.deliveryFee)}</dd>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Discount</dt>
              <dd className="tabular-nums">-{formatPKR(order.discount)}</dd>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between text-base">
            <dt className="font-semibold">Total</dt>
            <dd>
              <Price amount={order.total} className="font-display font-bold text-lg" />
            </dd>
          </div>
        </dl>
      </Card>

      {/* Customer info */}
      <Card className="p-5 sm:p-6 mb-6">
        <h2 className="font-display font-semibold text-base mb-4">
          Customer & delivery
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground flex items-center gap-1.5">
              Name
            </dt>
            <dd className="font-medium text-right">{order.customerName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground flex items-center gap-1.5">
              <Phone className="size-3.5" />
              Phone
            </dt>
            <dd className="font-medium tabular-nums">{order.customerPhone}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Order type</dt>
            <dd className="font-medium">
              {order.type === "delivery" ? "Home Delivery" : "Pickup"}
            </dd>
          </div>
          {order.type === "delivery" && order.address && (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  Address
                </dt>
                <dd className="text-right max-w-[60%]">{order.address}</dd>
              </div>
              {order.area && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Area</dt>
                  <dd className="font-medium">{order.area}</dd>
                </div>
              )}
            </>
          )}
          {order.notes && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="text-right italic max-w-[60%]">{order.notes}</dd>
            </div>
          )}
          {order.couponCode && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Coupon</dt>
              <dd className="font-mono font-medium">{order.couponCode}</dd>
            </div>
          )}
        </dl>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Button asChild variant="outline">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="size-4 text-[#25D366]" />
            Ask about this order
          </a>
        </Button>
        <Button asChild>
          <Link href="/menu">
            Place another order
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
