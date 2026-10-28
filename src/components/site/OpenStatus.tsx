"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, todayOpenLabel } from "@/hooks/use-settings";

export function OpenStatus({ className }: { className?: string }) {
  const { settings, loading } = useSettings();
  // Avoid hydration mismatch: todayOpenLabel() uses new Date() which differs
  // between server render and client hydration. Render a neutral placeholder
  // until after mount, then compute the real open/closed label.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (loading || !mounted) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 bg-muted text-muted-foreground",
          className
        )}
      >
        <Clock className="size-3.5" />
        Checking hours…
      </span>
    );
  }
  const { open, label } = todayOpenLabel(settings);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 border",
        open
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200",
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          open ? "bg-emerald-500 animate-pulse" : "bg-red-500"
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
