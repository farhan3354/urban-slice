import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Flame,
  Star,
  Wheat,
  Slice,
  Bike,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroSection } from "@/components/site/HeroSection";
import { ProductCard } from "@/components/site/ProductCard";
import { DealCard, FeaturedProductSection } from "@/components/site/DealCard";
import { getSettings, getDayLabel } from "@/lib/settings";
import {
  fetchCategories,
  fetchDeals,
  fetchProducts,
} from "@/lib/public-data";
import type { PublicSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

const REVIEWS = [
  {
    name: "Ali K.",
    location: "Kabirwala",
    rating: 5,
    text: "Best pizza in Kabirwala! The Malai Boti pizza is absolutely amazing. Delivery was super quick and the food was hot.",
    date: "Customer Review",
  },
  {
    name: "Sara A.",
    location: "Kabirwala",
    rating: 5,
    text: "The chicken tikka pizza had the perfect spice level. Family Feast deal is great value. Ordered on WhatsApp — so easy!",
    date: "Customer Review",
  },
  {
    name: "Bilal R.",
    location: "Kabirwala",
    rating: 5,
    text: "Zinger Burger and loaded fries are a must try! The Bihari Wrap is incredible. Urban Slice is my go-to place.",
    date: "Customer Review",
  },
];

const CLAIMS = [
  {
    icon: Wheat,
    title: "Fresh Every Day",
    description:
      "Every pizza dough is hand-tossed fresh daily — never frozen. Our broast and burgers are made to order with premium ingredients.",
  },
  {
    icon: Slice,
    title: "Huge Menu Variety",
    description:
      "50+ items: Classic & Royal Pizzas, US Burgers, Beef Burgers, Wraps, Broast, Pasta, Sandwiches, Fries, Wings, and more.",
  },
  {
    icon: Bike,
    title: "Free Home Delivery",
    description:
      "Free Home Delivery across Kabirwala and nearby areas. Hot, fresh food at your door in 25–40 minutes.",
  },
  {
    icon: Sparkles,
    title: "Easy WhatsApp Ordering",
    description:
      "Order in seconds via WhatsApp — just message us your order and we'll confirm right away. No app needed!",
  },
];

export default async function HomePage() {
  const settings = (await getSettings()) as PublicSettings;
  const [popularProducts, featuredProducts, deals, categories] =
    await Promise.all([
      fetchProducts({ popular: true }),
      fetchProducts({ featured: true }),
      fetchDeals(),
      fetchCategories(),
    ]);

  const featuredProduct =
    featuredProducts[0] || popularProducts[0] || null;

  // LocalBusiness JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: settings.restaurantName,
    description: settings.tagline,
    servesCuisine: ["Pizza", "Italian", "Fast Food"],
    priceRange: "Rs.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kabirwala",
      addressRegion: "Punjab",
      addressCountry: "PK",
      streetAddress: settings.address,
    },
    telephone: settings.contactPhoneSecondary
      ? `${settings.contactPhone}, ${settings.contactPhoneSecondary}`
      : settings.contactPhone,
    url: "https://urbanslice.pk",
    image: settings.hero.imageUrl
      ? `https://urbanslice.pk${settings.hero.imageUrl}`
      : undefined,
    acceptsReservations: "False",
    hasMenu: "/menu",
    openingHoursSpecification: settings.openingHours
      .filter((h) => !h.closed)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: getDayLabel(h.day),
        opens: h.open,
        closes: h.close,
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeroSection />

      {/* Popular Pizzas */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between mb-6 gap-3">
            <div>
              <Badge variant="outline" className="mb-2 bg-primary/5 border-primary/20 text-primary">
                <Flame className="size-3 fill-current" />
                Most loved
              </Badge>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
                Popular Pizzas
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Customer favourites, hot off our oven.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/menu">
                View all
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {popularProducts.length === 0 ? (
            <p className="text-muted-foreground">No products available right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {popularProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          <div className="mt-6 sm:hidden">
            <Button asChild variant="outline" className="w-full">
              <Link href="/menu">View full menu</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Signature pizza */}
      {featuredProduct && <FeaturedProductSection product={featuredProduct} />}

      {/* Deals & Family Combos */}
      {deals.length > 0 && (
        <section className="py-12 sm:py-16 pizza-grid-bg">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-6 gap-3">
              <div>
                <Badge variant="outline" className="mb-2 bg-accent/10 border-accent/30 text-accent-foreground">
                  <Sparkles className="size-3 fill-current" />
                  Save more
                </Badge>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
                  Deals & Family Combos
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Bundle up and save big on your favourites.
                </p>
              </div>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/deals">All deals</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {deals.slice(0, 3).map((d) => (
                <DealCard key={d.id} deal={d} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-12 sm:py-16 bg-card border-y">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">
              <Sparkles className="size-3" />
              Explore
            </Badge>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
              Browse by Category
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              From hand-tossed pizzas to crispy sides and chilled drinks.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/menu?category=${c.slug}`}
                className="group rounded-xl overflow-hidden border bg-background lift"
              >
                <div className="aspect-square relative bg-muted">
                  {c.imageUrl ? (
                    <Image
                      src={c.imageUrl}
                      alt={c.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="font-display font-semibold text-sm">{c.name}</p>
                  {c.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {c.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-2">
              <Slice className="size-3" />
              Our promise
            </Badge>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
              Why Choose Urban Slice?
            </h2>
            <p className="text-muted-foreground mt-1 text-sm max-w-xl mx-auto">
              Every pizza is made fresh, by hand, with the good stuff.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CLAIMS.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.title} className="p-6 text-center border-border/70 lift">
                  <div className="mx-auto mb-4 grid place-items-center size-14 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                    <Icon className="size-7" />
                  </div>
                  <h3 className="font-display font-bold text-lg">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {c.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-12 sm:py-16 bg-card border-y">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">
              <Star className="size-3 fill-current" />
              Customer love
            </Badge>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
              What Our Customers Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {REVIEWS.map((r, idx) => (
              <Card key={idx} className="p-5 border-border/70">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < r.rating
                          ? "size-4 fill-accent text-accent"
                          : "size-4 text-muted-foreground/30"
                      }
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                  “{r.text}”
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid place-items-center size-10 rounded-full bg-gradient-to-br from-primary to-accent text-white font-semibold text-sm shadow-sm">
                    {r.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.location}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <Badge variant="outline" className="mb-2">
                <MapPin className="size-3" />
                Find us
              </Badge>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-3">
                Visit Urban Slice
              </h2>
              <p className="text-muted-foreground mb-4">
                {settings.address}
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-primary shrink-0" />
                  <span className="flex flex-wrap gap-x-4 gap-y-1">
                    <a
                      href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                      className="hover:text-primary tabular-nums font-medium"
                    >
                      {settings.contactPhone}
                    </a>
                    {settings.contactPhoneSecondary ? (
                      <a
                        href={`tel:${settings.contactPhoneSecondary.replace(/\s/g, "")}`}
                        className="hover:text-primary tabular-nums text-muted-foreground"
                      >
                        {settings.contactPhoneSecondary}
                      </a>
                    ) : null}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="size-4 text-primary shrink-0" />
                  <a
                    href={`https://wa.me/${settings.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    WhatsApp {settings.contactPhone}
                  </a>
                </div>
              </div>
              <Button asChild className="mt-6">
                <a href={settings.mapLink} target="_blank" rel="noopener noreferrer">
                  <MapPin className="size-4" />
                  Get Directions
                </a>
              </Button>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">
                <Clock className="size-3" />
                Opening hours
              </Badge>
              <h3 className="font-display font-semibold text-xl mb-3">
                When we&apos;re open
              </h3>
              <ul className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
                {settings.openingHours.map((h) => (
                  <li
                    key={h.day}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{getDayLabel(h.day)}</span>
                    {h.closed ? (
                      <span className="text-red-600 font-medium">Closed</span>
                    ) : (
                      <span className="tabular-nums text-muted-foreground">
                        {h.open} – {h.close}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA band */}
      <section className="relative overflow-hidden bg-[#0f0f0f]">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/cta-whatsapp-bg.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.93), rgba(204,0,0,0.85))" }} />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:py-20 text-center">
          <Badge className="mb-4 bg-white/15 text-white border-white/30 backdrop-blur">
            <MessageCircle className="size-3" />
            Order in 30 seconds
          </Badge>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
            Order on WhatsApp — It&apos;s Easy!
          </h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">
            Pick your items from the menu, place your order, and we&apos;ll open WhatsApp
            pre-filled with all your items. Just hit send — that&apos;s it! Free Home Delivery
            across Kabirwala.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-[#25D366] hover:bg-[#1ebe5d] text-white wa-pulse">
              <a
                href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                  "Hi Urban Slice! I'd like to place an order."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-5" />
                Chat on WhatsApp
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 hover:text-white">
              <Link href="/menu">
                Build your order
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-white/60 text-sm">
            📞 Call us: 0305-2806919 · 0342-0663919
          </p>
        </div>
      </section>
    </>
  );
}
