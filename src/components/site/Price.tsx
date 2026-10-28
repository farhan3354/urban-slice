"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";

export function Price({
  amount,
  className,
  strike = false,
}: {
  amount: number;
  className?: string;
  strike?: boolean;
}) {
  return (
    <span
      className={cn(
        strike && "line-through text-muted-foreground",
        "tabular-nums",
        className
      )}
    >
      {formatPKR(amount)}
    </span>
  );
}
