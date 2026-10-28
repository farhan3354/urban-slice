"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export function CategoryChips({
  categories,
  active,
  baseHref = "/menu",
  className,
}: {
  categories: Category[];
  active?: string | null;
  baseHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1",
        className
      )}
      role="tablist"
      aria-label="Filter by category"
    >
      <Chip href={baseHref} active={!active}>
        All
      </Chip>
      {categories.map((c) => (
        <Chip
          key={c.id}
          href={`${baseHref}?category=${c.slug}`}
          active={active === c.slug}
        >
          {c.name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-105 font-bold"
          : "bg-card/80 backdrop-blur-sm border-border/80 hover:bg-muted hover:border-primary/40 hover:scale-102 hover:text-foreground text-foreground/80 active:scale-95"
      )}
    >
      {children}
    </Link>
  );
}
