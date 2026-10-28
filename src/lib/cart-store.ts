"use client";

import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  key: string; // productId + sorted selectedOptionIds + specialInstructions hash
  productId: string;
  name: string;
  imageUrl?: string;
  basePrice: number; // effectivePrice (promo||base)
  qty: number;
  selectedOptionIds: string[];
  optionSummary: string; // e.g. "Medium, Stuffed Crust, +Extra Cheese"
  unitPrice: number; // basePrice + modifiers
  lineTotal: number;
  specialInstructions?: string;
};

type CartState = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "key">) => void;
  removeLine: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

function lineKey(l: {
  productId: string;
  selectedOptionIds: string[];
  specialInstructions?: string;
}) {
  const ids = [...(l.selectedOptionIds || [])].sort().join(",");
  const note = (l.specialInstructions || "").trim();
  return `${l.productId}|${ids}|${note}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addLine: (line) =>
        set((state) => {
          const key = lineKey(line);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            const nextQty = Math.min(99, existing.qty + line.qty);
            return {
              lines: state.lines.map((l) =>
                l.key === key
                  ? {
                      ...l,
                      qty: nextQty,
                      lineTotal:
                        Math.round(l.unitPrice * nextQty * 100) / 100,
                    }
                  : l
              ),
            };
          }
          const newLine: CartLine = { ...line, key };
          return { lines: [...state.lines, newLine] };
        }),
      removeLine: (key) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.key !== key),
        })),
      setQty: (key, qty) =>
        set((state) => ({
          lines: state.lines
            .map((l) => {
              if (l.key !== key) return l;
              const q = Math.max(1, Math.min(99, Math.floor(qty) || 1));
              return {
                ...l,
                qty: q,
                lineTotal: Math.round(l.unitPrice * q * 100) / 100,
              };
            })
            .filter((l) => l.qty >= 1),
        })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((sum, l) => sum + l.qty, 0),
      subtotal: () => get().lines.reduce((sum, l) => sum + l.lineTotal, 0),
    }),
    {
      name: "usp-cart",
      version: 1,
      // Only persist lines, not the methods.
      partialize: (s) => ({ lines: s.lines }),
    }
  )
);

// Selectors for use in components without re-rendering on every store change.
export function useCartCount(): number {
  return useCartStore((s) => s.lines.reduce((n, l) => n + l.qty, 0));
}

export function useCartSubtotal(): number {
  return useCartStore((s) =>
    Math.round(s.lines.reduce((n, l) => n + l.lineTotal, 0) * 100) / 100
  );
}

export function useCartLines(): CartLine[] {
  return useCartStore((s) => s.lines);
}

// Tracks whether the persisted store has hydrated on the client.
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  return hydrated;
}
