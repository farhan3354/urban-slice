"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_META, type OrderStatus } from "./types";

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus | string;
  className?: string;
}) {
  const meta = STATUS_META[status as OrderStatus] ?? {
    label: String(status),
    className:
      "border-muted-foreground/30 bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  };
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", meta.className, className)}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}
