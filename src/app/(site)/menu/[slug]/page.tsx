import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { fetchProductBySlug, fetchProducts } from "@/lib/public-data";
import { ProductCustomizer } from "@/components/site/ProductCustomizer";
import { ProductCard } from "@/components/site/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }
  const title = `${product.name} — ${formatPKR(product.effectivePrice)}`;
  const description =
    product.description || `Order ${product.name} from Urban Slice Pizza, Kabirwala.`;
  return {
    title,
    description,
    alternates: { canonical: `/menu/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: product.imageUrl
        ? [{ url: product.imageUrl, alt: product.name }]
        : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  // Related: other popular products in same category
  const related = (await fetchProducts({ categoryId: product.categoryId }))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const hasPromo =
    product.promoPrice != null && product.promoPrice < product.basePrice;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.imageUrl ? `https://urbanslice.pk${product.imageUrl}` : undefined,
    category: product.categoryName,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.effectivePrice,
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `https://urbanslice.pk/menu/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        <nav className="text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/menu" className="hover:text-foreground">Menu</Link>
          <span className="mx-1.5">/</span>
          <Link
            href={`/menu?category=${product.categoryName.toLowerCase()}`}
            className="hover:text-foreground capitalize"
          >
            {product.categoryName}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex -ml-2 mb-4">
          <Link href="/menu">
            <ChevronLeft className="size-4" />
            Back to menu
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="relative">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-sm">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-6xl font-display opacity-20">
                  {product.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.featured && (
                <Badge className="bg-accent text-accent-foreground">Featured</Badge>
              )}
              {product.popular && (
                <Badge className="bg-primary text-primary-foreground">Popular</Badge>
              )}
              {hasPromo && (
                <Badge className="bg-red-600 text-white">Promo</Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {product.categoryName}
            </p>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-1">
              {product.name}
            </h1>

            <ProductCustomizer product={product} />

            {product.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {product.tags.map((t) => (
                  <Badge key={t} variant="outline" className="capitalize">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related items */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display font-extrabold text-2xl mb-5">
              You might also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
