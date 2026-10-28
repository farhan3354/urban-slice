"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Instagram,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useSettings, getDayLabel } from "@/hooks/use-settings";
import { SmartImage } from "./SmartImage";

const POLICY_LINKS = [
  { href: "/delivery-info", label: "Delivery Info" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const MENU_LINKS = [
  { href: "/menu", label: "Full Menu" },
  { href: "/menu?category=pizza", label: "Pizzas" },
  { href: "/menu?category=burgers", label: "Burgers" },
  { href: "/menu?category=wraps", label: "Wraps & Rolls" },
  { href: "/menu?category=broast", label: "Broast" },
  { href: "/deals", label: "Deals & Combos" },
];

export function SiteFooter() {
  const { settings } = useSettings();
  const pathname = usePathname();

  const social = settings.social || {};
  const socials: { href?: string; label: string; icon: React.ReactNode }[] = [
    { href: social.facebook, label: "Facebook", icon: <Facebook className="size-4" /> },
    { href: social.instagram, label: "Instagram", icon: <Instagram className="size-4" /> },
    {
      href: settings.whatsappNumber
        ? `https://wa.me/${settings.whatsappNumber}`
        : undefined,
      label: "WhatsApp",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.821 11.821 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.512 5.26l-.999 3.648 3.476-.911zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="mt-auto bg-sidebar text-sidebar-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            {settings.logoUrl && (
              <SmartImage
                src={settings.logoUrl}
                alt={settings.restaurantName}
                className="size-14 rounded-full bg-background ring-2 ring-sidebar-accent shrink-0"
                imgClassName="object-cover"
              />
            )}
            <div>
              <p className="font-display font-extrabold text-lg">
                {settings.restaurantName}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {settings.tagline}
              </p>
            </div>
          </div>
          <p className="text-sm text-sidebar-foreground/70 leading-relaxed">
            Kabirwala&apos;s favourite pizza, burgers, wraps, broast &amp; more.
            Free Home Delivery. Order on WhatsApp in seconds.
          </p>
          <div className="flex gap-2 mt-4">
            {socials
              .filter((s) => s.href && s.href !== "#")
              .map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid place-items-center size-9 rounded-full bg-sidebar-accent hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {s.icon}
                </a>
              ))}
          </div>
        </div>

        <div>
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-3">
            Menu
          </h3>
          <ul className="space-y-2 text-sm">
            {MENU_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-3">
            Contact
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="size-4 mt-0.5 shrink-0 text-accent" />
              <a
                href={settings.mapLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
              >
                {settings.address}
              </a>
            </li>
            <li className="flex gap-2">
              <Phone className="size-4 mt-0.5 shrink-0 text-accent" />
              <span className="flex flex-col gap-0.5">
                <a
                  href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                  className="text-sidebar-foreground/80 hover:text-sidebar-foreground tabular-nums font-medium"
                >
                  {settings.contactPhone}
                </a>
                {settings.contactPhoneSecondary ? (
                  <a
                    href={`tel:${settings.contactPhoneSecondary.replace(/\s/g, "")}`}
                    className="text-sidebar-foreground/60 hover:text-sidebar-foreground tabular-nums"
                  >
                    {settings.contactPhoneSecondary}
                  </a>
                ) : null}
              </span>
            </li>
            <li className="flex gap-2">
              <Mail className="size-4 mt-0.5 shrink-0 text-accent" />
              <a
                href={`mailto:${settings.contactEmail}`}
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground break-all"
              >
                {settings.contactEmail}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-3">
            Opening Hours
          </h3>
          <ul className="space-y-1.5 text-sm">
            {settings.openingHours.map((h) => (
              <li
                key={h.day}
                className="flex justify-between gap-2 text-sidebar-foreground/70"
              >
                <span>{getDayLabel(h.day)}</span>
                <span className="tabular-nums text-right">
                  {h.closed ? "Closed" : `${h.open} – ${h.close}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-sidebar-border">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-sidebar-foreground/60">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5" />
            <span>
              © <YearNow /> {settings.restaurantName}. All
              rights reserved.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {POLICY_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-sidebar-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 hover:text-sidebar-foreground transition-colors"
            >
              <ShieldCheck className="size-3.5" />
              Admin
            </Link>
          </div>
        </div>
        {settings.footerNote ? (
          <div className="border-t border-sidebar-border">
            <p className="mx-auto max-w-7xl px-4 py-3 text-[11px] text-sidebar-foreground/50 italic">
              {settings.footerNote}
            </p>
          </div>
        ) : null}
      </div>
    </footer>
  );
}

// Renders the current year AFTER mount to avoid SSR/CSR hydration mismatch
// (server timezone vs client timezone could differ around New Year).
function YearNow() {
  const [year, setYear] = React.useState<number | null>(null);
  React.useEffect(() => setYear(new Date().getFullYear()), []);
  return <>{year ?? ""}</>;
}
