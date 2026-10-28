import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Heart,
  Sparkles,
  Users,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Urban Slice Pizza — Kabirwala",
  description:
    "Learn about Urban Slice Pizza in Kabirwala — our story, our values, and our love for hand-tossed, freshly baked pizza.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: Heart,
    title: "Made with love",
    description:
      "Every pizza we serve starts with passion — from the dough we hand-toss to the sauces we simmer.",
  },
  {
    icon: Sparkles,
    title: "Quality first",
    description:
      "Premium mozzarella, fresh vegetables, real meats and bold spices. No shortcuts, no compromises.",
  },
  {
    icon: Users,
    title: "Local & family-run",
    description:
      "We're proud to be part of the Kabirwala community — serving families, students and friends.",
  },
  {
    icon: Clock,
    title: "Fast & fresh",
    description:
      "Baked fresh when you order, delivered hot in 25–40 minutes across Kabirwala and nearby areas.",
  },
];

export default async function AboutPage() {
  const settings = await getSettings();
  const about = settings.policies.about;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/restaurant-interior.png"
            alt="Urban Slice Pizza interior"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(23,23,23,0.85), rgba(230,57,54,0.7))",
            }}
          />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <Badge className="mb-3 bg-white/15 text-white border-white/30 backdrop-blur">
              <Sparkles className="size-3" />
              Our story
            </Badge>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white">
              About Urban Slice Pizza
            </h1>
            <p className="mt-4 text-white/85 text-lg leading-relaxed">
              Hand-tossed pizzas, fresh ingredients, and a whole lot of love —
              proudly serving Kabirwala.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/menu">
                Explore our menu
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Badge variant="outline" className="mb-3">
            Who we are
          </Badge>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-4">
            Freshly baked, every single day
          </h2>
          <div className="prose prose-stone max-w-none">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {about}
            </p>
          </div>
          <p className="mt-6 text-xs text-muted-foreground italic bg-muted/40 border rounded-lg p-3">
            This is demo content — the owner can update the about text from the
            admin dashboard under Settings → Policies.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 sm:py-16 bg-card border-y">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-2">
              <Heart className="size-3" />
              What we stand for
            </Badge>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
              Our Values
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} className="p-5 text-center">
                  <div className="mx-auto mb-3 grid place-items-center size-12 rounded-full bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-display font-semibold">{v.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {v.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            {[
              { v: "10+", l: "Pizza varieties" },
              { v: "25 min", l: "Average prep time" },
              { v: "3", l: "Delivery zones" },
              { v: "100%", l: "Fresh dough daily" },
            ].map((s) => (
              <Card key={s.l} className="p-5">
                <p className="font-display font-extrabold text-3xl text-primary">
                  {s.v}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-primary/5 border-t">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
            Hungry yet?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Browse the menu, customize your pizza, and order on WhatsApp in
            seconds.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/menu">
                Order now
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
          <Separator className="my-8" />
          <div className="grid sm:grid-cols-3 gap-4 text-left text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="size-4 mt-0.5 text-primary shrink-0" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="size-4 mt-0.5 text-primary shrink-0" />
              <a href={`tel:${settings.contactPhone}`} className="hover:text-primary">
                {settings.contactPhone}
              </a>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="size-4 mt-0.5 text-primary shrink-0" />
              <a
                href={`mailto:${settings.contactEmail}`}
                className="hover:text-primary break-all"
              >
                {settings.contactEmail}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
