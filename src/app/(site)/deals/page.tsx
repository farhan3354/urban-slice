import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchDeals, parseDealItems } from "@/lib/public-data";
import { DealCard } from "@/components/site/DealCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deals & Family Combos",
  description:
    "Save big on Urban Slice Pizza deals — Family Feast, Solo Combo and more. Bundle pizzas, sides and drinks for less.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage() {
  const deals = await fetchDeals();
  const totalSavings = deals.reduce(
    (sum, d) =>
      d.oldPrice && d.oldPrice > d.price ? sum + (d.oldPrice - d.price) : sum,
    0
  );

  return (
    <div>
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <nav className="text-xs text-muted-foreground mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">Deals</span>
          </nav>
          <Badge variant="outline" className="mb-3 bg-accent/10 border-accent/30 text-accent-foreground">
            <Sparkles className="size-3 fill-current" />
            Save more
          </Badge>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
            Deals & Family Combos
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Bundle your favourites and save. All deals are made fresh to order —
            pick one, place it on WhatsApp, and we&apos;ll handle the rest.
          </p>
          {totalSavings > 0 && (
            <p className="mt-4 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 font-medium">
                <Tag className="size-3.5" />
                Save up to Rs. {totalSavings.toLocaleString("en-PK")} with our
                combos!
              </span>
            </p>
          )}
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4">
          {deals.length === 0 ? (
            <div className="text-center py-16 sm:py-24">
              <div className="mx-auto size-16 grid place-items-center rounded-full bg-muted mb-4">
                <Tag className="size-8 text-muted-foreground" />
              </div>
              <h2 className="font-display font-semibold text-xl">
                No deals available right now
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Check back soon — we&apos;re cooking up new combos!
              </p>
              <Button asChild className="mt-5">
                <Link href="/menu">
                  Browse the menu
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {deals.map((d) => (
                <DealCard key={d.id} deal={d} />
              ))}
            </div>
          )}

          {deals.length > 0 && (
            <div className="mt-12 rounded-2xl border bg-card p-6 sm:p-8 text-center">
              <h2 className="font-display font-extrabold text-xl sm:text-2xl">
                Want to build your own combo?
              </h2>
              <p className="mt-2 text-muted-foreground text-sm max-w-xl mx-auto">
                Pick your favourite pizzas, sides and drinks individually and
                we&apos;ll prepare them fresh for you.
              </p>
              <Button asChild className="mt-4">
                <Link href="/menu">
                  Build your order
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
