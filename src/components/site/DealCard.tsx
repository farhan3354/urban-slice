"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Tag, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Price } from "./Price";
import { useSettings } from "@/hooks/use-settings";
import { parseDealItems } from "@/lib/public-data";
import type { Deal, SerializedProduct } from "@/lib/types";

function buildDealWhatsAppUrl(
  number: string | undefined,
  deal: Deal,
  restaurantName?: string
): string {
  if (!number) return "#";
  const items = parseDealItems(deal.itemsJson);
  const itemsText = items.length
    ? items.map((i) => `• ${i.qty}× ${i.name}`).join("\n")
    : "";
  const msg = `Hi ${restaurantName || "Urban Slice"}! I'd like to order the *${deal.title}* deal${
    deal.couponCode ? ` (code: ${deal.couponCode})` : ""
  } for Rs. ${deal.price}. ${itemsText ? `\n\n${itemsText}` : ""}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

export function DealCard({ deal }: { deal: Deal }) {
  const { settings } = useSettings();
  const items = parseDealItems(deal.itemsJson);
  const savings =
    deal.oldPrice && deal.oldPrice > deal.price ? deal.oldPrice - deal.price : 0;
  const waUrl = buildDealWhatsAppUrl(settings.whatsappNumber, deal, settings.restaurantName);

  return (
    <Card className="group overflow-hidden p-0 lift flex flex-col border-border/80 hover:border-primary/40 transition-all duration-300">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {deal.imageUrl ? (
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        {deal.badge && (
          <Badge className="absolute top-3 left-3 bg-[#CC0000] text-white font-bold shadow-md hover:scale-105 transition-transform">
            {deal.badge}
          </Badge>
        )}
        {savings > 0 && (
          <Badge className="absolute top-3 right-3 bg-[#FFD700] text-[#1a0f00] font-bold shadow-md">
            Save <Price amount={savings} className="text-[#1a0f00] ml-1" />
          </Badge>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors">
          {deal.title}
        </h3>
        {deal.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {deal.description}
          </p>
        )}
        {items.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm">
            {items.map((i, idx) => (
              <li key={idx} className="flex items-start gap-2 text-foreground/80">
                <span className="text-primary font-bold tabular-nums text-xs mt-0.5">
                  {i.qty}×
                </span>
                <span className="flex-1">{i.name}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-border/40">
          <div>
            <Price
              amount={deal.price}
              className="font-display font-bold text-2xl text-primary"
            />
            {deal.oldPrice && deal.oldPrice > deal.price && (
              <Price
                amount={deal.oldPrice}
                strike
                className="text-xs ml-2 text-muted-foreground"
              />
            )}
          </div>
          <Button asChild size="sm" className="bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold hover:scale-105 transition-all shadow-md">
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <Tag className="size-3.5 mr-1" />
              Order Deal
            </a>
          </Button>
        </div>
        {deal.couponCode && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Use code <span className="font-mono font-semibold text-foreground">{deal.couponCode}</span> at checkout
          </p>
        )}
      </div>
    </Card>
  );
}

export function FeaturedProductSection({
  product,
}: {
  product: SerializedProduct;
}) {
  const hasPromo =
    product.promoPrice != null && product.promoPrice < product.basePrice;

  return (
    <section className="py-12 sm:py-16 bg-card border-y">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-xl">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : null}
            {hasPromo && (
              <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                Promo
              </Badge>
            )}
          </div>
          <div className="space-y-4">
            <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/30">
              <Star className="size-3 fill-current" />
              Signature Pizza
            </Badge>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl">
              {product.name}
            </h2>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed text-lg">
                {product.description}
              </p>
            )}
            <div className="flex items-center gap-4">
              <Price
                amount={product.effectivePrice}
                className="font-display font-bold text-3xl text-primary"
              />
              {hasPromo && (
                <Price
                  amount={product.basePrice}
                  strike
                  className="text-base"
                />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              <span>{product.prepTimeMin} min prep time</span>
            </div>
            <Button asChild size="lg" className="mt-2">
              <Link href={`/menu/${product.slug}`}>
                Customize & Order
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
