"use client";

import { cn } from "@/lib/utils";

export function Loading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] w-full items-center justify-center p-10",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

export function RowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-md bg-muted/60"
          aria-hidden
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      className="h-24 animate-pulse rounded-xl bg-muted/60"
      aria-hidden
    />
  );
}
