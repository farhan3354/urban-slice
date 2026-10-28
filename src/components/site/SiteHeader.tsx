"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ShoppingCart,
  MapPin,
  Phone,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSettings } from "@/hooks/use-settings";
import { useCartCount, useHydrated } from "@/lib/cart-store";
import { SmartImage } from "./SmartImage";
import { OpenStatus } from "./OpenStatus";
import { CartDrawer } from "./CartDrawer";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/deals", label: "Deals" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { settings } = useSettings();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const count = useCartCount();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b py-4 px-5">
                  <SheetTitle className="flex items-center gap-2">
                    {settings.logoUrl ? (
                      <SmartImage
                        src={settings.logoUrl}
                        alt={settings.restaurantName}
                        className="size-11 rounded-full ring-1 ring-border shrink-0"
                        imgClassName="object-cover"
                      />
                    ) : null}
                    <div className="flex flex-col text-left">
                      <span className="font-display font-bold leading-tight">{settings.restaurantName}</span>
                      <span className="text-[11px] font-bold text-[#FFD700]" dir="rtl">دل کہے ایک سلائس اور</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-2">
                  {NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      {item.label}
                      <ChevronRight className="size-4 opacity-50" />
                    </Link>
                  ))}
                </nav>
                <div className="mt-2 px-4 pb-4 space-y-3">
                  <a
                    href={settings.mapLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <MapPin className="size-4" />
                    {settings.address}
                  </a>
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="size-4" />
                    {settings.contactPhone}
                  </a>
                  <OpenStatus />
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              {settings.logoUrl ? (
                <SmartImage
                  src={settings.logoUrl}
                  alt={settings.restaurantName}
                  className="size-12 sm:size-14 rounded-full ring-2 ring-border shrink-0"
                  imgClassName="object-cover"
                />
              ) : (
                <span className="grid place-items-center size-12 sm:size-14 rounded-full bg-primary text-primary-foreground font-display font-bold">
                  US
                </span>
              )}
              <span className="hidden sm:flex flex-col leading-tight">
                <span className="font-display font-extrabold text-lg tracking-tight">
                  {settings.restaurantName}
                </span>
                <span className="text-xs font-bold text-[#FFD700] tracking-wide" dir="rtl">
                  دل کہے ایک سلائس اور
                </span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-foreground/80 hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {/* Click-to-call phones (desktop) */}
              <div className="hidden lg:flex items-center gap-1">
                {settings.contactPhone ? (
                  <a
                    href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                    aria-label={`Call ${settings.contactPhone}`}
                  >
                    <span className="grid place-items-center size-7 rounded-full bg-primary/10 text-primary">
                      <Phone className="size-3.5" />
                    </span>
                    <span className="tabular-nums">{settings.contactPhone}</span>
                  </a>
                ) : null}
                {settings.contactPhoneSecondary ? (
                  <a
                    href={`tel:${settings.contactPhoneSecondary.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-foreground/80 hover:bg-muted transition-colors"
                    aria-label={`Call ${settings.contactPhoneSecondary}`}
                  >
                    <span className="tabular-nums">{settings.contactPhoneSecondary}</span>
                  </a>
                ) : null}
              </div>
              <div className="hidden xl:block">
                <OpenStatus />
              </div>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/menu">Order Now</Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="relative"
                aria-label="Open cart"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="size-5" />
                {hydrated && count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tabular-nums">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
