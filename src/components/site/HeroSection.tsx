"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Flame, Star, Bike, UtensilsCrossed, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings, todayOpenLabel } from "@/hooks/use-settings";

const SERVICE_BADGES = [
  { icon: ShoppingBag, label: "Take Away" },
  { icon: Bike,        label: "Home Delivery" },
  { icon: UtensilsCrossed, label: "Casual Dining" },
  { icon: Users,       label: "Family Dining" },
];

export function HeroSection() {
  const { settings } = useSettings();
  const hero = settings.hero;
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const { open, label } = mounted ? todayOpenLabel(settings) : { open: false, label: "Checking hours…" };

  const waHref = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    "Hi Urban Slice! I'd like to place an order."
  )}`;

  return (
    <section className="relative overflow-hidden bg-[#0f0f0f]">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        {hero.imageUrl ? (
          <Image
            src={hero.imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#CC0000] to-[#FFD700]" />
        )}
        <div className="absolute inset-0 hero-overlay" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Content */}
          <div className="lg:col-span-7 max-w-2xl">
            {/* Status + badge row */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium text-white border border-white/20">
                <span
                  className={`size-2 rounded-full ${
                    mounted
                      ? open
                        ? "bg-emerald-400 animate-pulse"
                        : "bg-red-400"
                      : "bg-white/50"
                  }`}
                  aria-hidden
                />
                {label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#CC0000] px-3.5 py-1 text-xs font-bold text-white shadow-md hover:scale-105 transition-transform">
                <Flame className="size-3.5 animate-bounce" />
                Kabirwala&apos;s #1 Choice
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/60 px-3.5 py-1 text-xs font-bold text-[#FFD700] hover:scale-105 transition-transform">
                🛵 Free Home Delivery
              </span>
            </div>

            {/* Main headline */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
              {hero.headline || "Good Food, Good Mood"}
            </h1>

            {/* Urdu tagline */}
            <p
              className="mt-2 text-[#FFD700] font-bold text-2xl sm:text-3xl gold-shimmer tracking-wide"
              dir="rtl"
              style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
            >
              دل کہے ایک سلائس اور
            </p>

            <p className="mt-4 text-base sm:text-lg text-white/85 max-w-xl leading-relaxed">
              {hero.subheadline}
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="text-base font-bold bg-[#25D366] hover:bg-[#1ebe5d] text-white btn-glow wa-pulse hover:scale-105 transition-all shadow-lg"
              >
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.821 11.821 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.512 5.26l-.999 3.648 3.476-.911zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  Order on WhatsApp
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 hover:text-white text-base font-semibold hover:scale-105 transition-all shadow-md"
              >
                <Link href="/menu">
                  {hero.secondaryCta || "View Full Menu"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            {/* Service badges */}
            <div className="mt-8 flex flex-wrap gap-2">
              {SERVICE_BADGES.map(({ icon: Icon, label: svc }) => (
                <span
                  key={svc}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 hover:border-[#FFD700]/50 transition-all cursor-default"
                >
                  <Icon className="size-3.5 text-[#FFD700]" />
                  {svc}
                </span>
              ))}
            </div>

            {/* Stats row */}
            <div className="mt-8 flex items-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="size-4 fill-[#FFD700] text-[#FFD700]" />
                <span>
                  <span className="font-bold text-white">4.9</span> · 500+ Happy Reviews
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="font-bold text-white">75+</span> Menu Items
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="font-bold text-white">25–35 min</span> Fast Delivery
              </div>
            </div>
          </div>

          {/* Right Column: Visual Floating Pizza Showcase (Desktop & Tablet) */}
          <div className="lg:col-span-5 hidden lg:flex relative items-center justify-center">
            {/* Ambient Background Aura */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#CC0000]/30 via-[#FFD700]/20 to-transparent rounded-full blur-3xl" />

            {/* Showcase Pizza Image */}
            <div className="relative size-80 xl:size-96 animate-float z-10 drop-shadow-[0_25px_35px_rgba(0,0,0,0.65)]">
              <Image
                src="/images/hero-pizza.png"
                alt="Urban Slice Signature Pizza"
                fill
                priority
                sizes="(min-width: 1280px) 384px, 320px"
                className="object-contain"
              />
            </div>

            {/* Top-Right Floating Glass Badge */}
            <div className="absolute -top-3 -right-3 z-20 glass-panel px-4 py-2.5 rounded-2xl shadow-xl animate-float-reverse">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Fresh Oven Baked</span>
              </div>
              <p className="text-[11px] text-[#FFD700] font-semibold mt-0.5">100% Mozzarella</p>
            </div>

            {/* Bottom-Left Floating Glass Badge */}
            <div className="absolute -bottom-4 -left-4 z-20 glass-panel px-4 py-3 rounded-2xl shadow-xl animate-float">
              <div className="flex items-center gap-2">
                <span className="text-base">🍕</span>
                <div>
                  <p className="text-xs font-bold text-white">Kabirwala Hot Deals</p>
                  <p className="text-[11px] text-white/70">Starting at Rs. 499/-</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade into background */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-b from-transparent to-background pointer-events-none" />
    </section>
  );
}
