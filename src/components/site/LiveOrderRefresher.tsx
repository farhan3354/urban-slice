"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// Auto-refreshes the page every 30s so the customer sees latest order status.
export function LiveOrderRefresher({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();
  React.useEffect(() => {
    const id = setInterval(() => {
      React.startTransition(() => {
        router.refresh();
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
