"use client";

import * as React from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { useSettings, getDayLabel } from "@/hooks/use-settings";

export default function ContactPage() {
  const { settings } = useSettings();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error("Please fill in your name and message");
      return;
    }
    const text = `Hi ${settings.restaurantName}! My name is ${name.trim()}${
      phone.trim() ? ` (phone: ${phone.trim()})` : ""
    }. ${message.trim()}`;
    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp with your message…");
  }

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <Badge variant="outline" className="mb-3">
            <MessageCircle className="size-3" />
            Get in touch
          </Badge>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Questions, feedback, catering, or special requests — we&apos;d love
            to hear from you. The fastest way to reach us is WhatsApp.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact info */}
          <div className="space-y-4">
            <Card className="p-5 sm:p-6">
              <h2 className="font-display font-semibold text-lg mb-4">
                Reach us directly
              </h2>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <div className="grid place-items-center size-10 rounded-full bg-primary/10 text-primary shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{settings.address}</p>
                    <a
                      href={settings.mapLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="grid place-items-center size-10 rounded-full bg-primary/10 text-primary shrink-0">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <a
                      href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                      className="text-muted-foreground hover:text-primary tabular-nums"
                    >
                      {settings.contactPhone}
                    </a>
                    {settings.contactPhoneSecondary ? (
                      <>
                        <span className="text-muted-foreground/50"> · </span>
                        <a
                          href={`tel:${settings.contactPhoneSecondary.replace(/\s/g, "")}`}
                          className="text-muted-foreground hover:text-primary tabular-nums"
                        >
                          {settings.contactPhoneSecondary}
                        </a>
                      </>
                    ) : null}
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="grid place-items-center size-10 rounded-full bg-[#25D366]/15 text-[#25D366] shrink-0">
                    <WhatsAppIcon className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <a
                      href={`https://wa.me/${settings.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary tabular-nums"
                    >
                      {settings.contactPhone}
                    </a>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Best for placing orders and quick questions.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="grid place-items-center size-10 rounded-full bg-primary/10 text-primary shrink-0">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="text-muted-foreground hover:text-primary break-all"
                    >
                      {settings.contactEmail}
                    </a>
                  </div>
                </li>
              </ul>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="font-display font-semibold text-lg mb-2 flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                Opening hours
              </h2>
              <ul className="divide-y divide-border">
                {settings.openingHours.map((h) => (
                  <li
                    key={h.day}
                    className="flex items-center justify-between py-2 text-sm"
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
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground italic">
                Hours shown are demo values pending owner confirmation.
              </p>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="font-display font-semibold text-lg mb-2">
                Find us
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                We&apos;re located in the heart of Kabirwala.
              </p>
              <Button asChild className="w-full">
                <a
                  href={settings.mapLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="size-4" />
                  Get Directions
                </a>
              </Button>
            </Card>
          </div>

          {/* Contact form */}
          <div>
            <Card className="p-5 sm:p-6">
              <h2 className="font-display font-semibold text-lg mb-1">
                Send us a message
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Fill this in and we&apos;ll open WhatsApp with your message
                ready to send.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    Your name <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ali Khan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Your phone (optional)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03XX XXXXXXX"
                    inputMode="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">
                    Message <span className="text-primary">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help you?"
                    rows={5}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white">
                  <Send className="size-4" />
                  Send via WhatsApp
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  This form opens WhatsApp with your message pre-filled — you
                  still need to hit send.
                </p>
              </form>
            </Card>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Prefer to order right now?{" "}
              <Link href="/menu" className="text-primary hover:underline font-medium">
                Browse the menu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
