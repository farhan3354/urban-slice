import * as React from "react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; dot: string }
> = {
  pending_whatsapp: {
    label: "Pending WhatsApp",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-sky-100 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
  preparing: {
    label: "Preparing",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dot: "bg-yellow-500",
  },
  ready: {
    label: "Ready",
    className: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className: "bg-teal-100 text-teal-800 border-teal-200",
    dot: "bg-teal-500",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
};

export function StatusBadge({
  status,
  className,
  withDot = true,
}: {
  status: OrderStatus;
  className?: string;
  withDot?: boolean;
}) {
  const meta = STATUS_META[status] || STATUS_META.pending_whatsapp;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.className,
        className
      )}
    >
      {withDot && (
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", meta.dot)}
        />
      )}
      {meta.label}
    </span>
  );
}

export function statusMeta(status: OrderStatus) {
  return STATUS_META[status] || STATUS_META.pending_whatsapp;
}
