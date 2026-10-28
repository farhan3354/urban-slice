import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { Pizza, PackageSearch, SlidersHorizontal } from "lucide-react";
import { fetchCategories, fetchProducts, fetchCategoryBySlug } from "@/lib/public-data";
import { CategoryChips } from "@/components/site/CategoryChips";
import { ProductCard } from "@/components/site/ProductCard";
import { MenuSearch } from "@/components/site/MenuSearch";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu — Pizzas, Sides, Drinks & Deals",
  description:
    "Browse the full Urban Slice Pizza menu: hand-tossed pizzas, sides, fries, burgers, drinks and family deals. Customize and order on WhatsApp.",
  alternates: { canonical: "/menu" },
};

type SearchParams = Promise<{ category?: string; q?: string }>;

export default async function MenuPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const categorySlug = sp.category;
  const q = sp.q;

  const [allCategories, category] = await Promise.all([
    fetchCategories(),
    categorySlug ? fetchCategoryBySlug(categorySlug) : Promise.resolve(null),
  ]);

  const categoryId = category?.id;
  const products = await fetchProducts({
    categoryId,
    q,
  });

  const activeCatSlug = category?.slug || null;

  return (
    <>
      {/* Page header */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <nav className="text-xs text-muted-foreground mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">Menu</span>
          </nav>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
            {category ? category.name : "Our Menu"}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            {category?.description ||
              "Hand-tossed pizzas, sides, fries, burgers and drinks — all made fresh to order."}
          </p>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <Suspense fallback={<div className="h-9 max-w-md w-full bg-muted animate-pulse rounded-md" />}>
              <MenuSearch defaultValue={q} />
            </Suspense>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <SlidersHorizontal className="size-3.5" />
              {products.length} item{products.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-5">
            <CategoryChips categories={allCategories} active={activeCatSlug} />
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4">
          {products.length === 0 ? (
            <div className="text-center py-16 sm:py-24">
              <div className="mx-auto size-16 grid place-items-center rounded-full bg-muted mb-4">
                <PackageSearch className="size-8 text-muted-foreground" />
              </div>
              <h2 className="font-display font-semibold text-xl">
                No items match your search
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Try a different keyword or browse all categories.
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 mt-5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
              >
                <Pizza className="size-4" />
                View full menu
              </Link>
            </div>
          ) : (
            <>
              {q && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Showing results for &ldquo;<span className="font-medium text-foreground">{q}</span>&rdquo;
                  {" — "}
                  <Link href={categorySlug ? `/menu?category=${categorySlug}` : "/menu"} className="underline hover:text-foreground">
                    clear
                  </Link>
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
