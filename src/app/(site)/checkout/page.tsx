"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Store,
  Truck,
  Tag,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCartLines,
  useCartSubtotal,
  useCartStore,
  useHydrated,
} from "@/lib/cart-store";
import { useSettings } from "@/hooks/use-settings";
import { formatPKR } from "@/lib/format";
import { Price } from "@/components/site/Price";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";

type FieldErrors = Record<string, string>;

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCartLines();
  const subtotal = useCartSubtotal();
  const clear = useCartStore((s) => s.clear);
  const { settings } = useSettings();

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [type, setType] = React.useState<"delivery" | "pickup">("delivery");
  const [area, setArea] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [couponCode, setCouponCode] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const deliveryFee = React.useMemo(() => {
    if (type !== "delivery") return 0;
    const found = settings.deliveryAreas.find(
      (a) => a.name.toLowerCase() === area.toLowerCase()
    );
    const fee = found ? found.fee : settings.defaultDeliveryFee;
    if (
      settings.freeDeliveryThreshold > 0 &&
      subtotal >= settings.freeDeliveryThreshold
    )
      return 0;
    return fee;
  }, [
    type,
    area,
    settings.deliveryAreas,
    settings.defaultDeliveryFee,
    settings.freeDeliveryThreshold,
    subtotal,
  ]);

  const total = subtotal + deliveryFee;

  const minOrderMet =
    settings.minOrderValue <= 0 || subtotal >= settings.minOrderValue;

  const selectedArea = settings.deliveryAreas.find(
    (a) => a.name.toLowerCase() === area.toLowerCase()
  );
  const etaMin =
    type === "pickup"
      ? settings.prepTimeMin
      : selectedArea?.etaMin || settings.prepTimeMin + 15;

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (name.trim().length < 2) errs.name = "Please enter your full name";
    if (phone.replace(/\D/g, "").length < 8)
      errs.phone = "Please enter a valid phone number";
    if (type === "delivery" && address.trim().length < 5)
      errs.address = "Please enter your delivery address";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!hydrated || lines.length === 0) return;
    if (!minOrderMet) {
      toast.error(`Minimum order is ${formatPKR(settings.minOrderValue)}`);
      return;
    }
    if (!validate()) {
      toast.error("Please fix the errors above");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        type,
        address: type === "delivery" ? address.trim() : undefined,
        area: type === "delivery" ? area || undefined : undefined,
        notes: notes.trim() || undefined,
        couponCode: couponCode.trim() || undefined,
        lines: lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          selectedOptionIds: l.selectedOptionIds,
          specialInstructions: l.specialInstructions,
        })),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const errs = Array.isArray(data.errors) ? data.errors : [];
        const fieldErrs: FieldErrors = {};
        for (const e of errs) {
          if (e?.field) fieldErrs[e.field] = e.message;
        }
        setErrors(fieldErrs);
        toast.error(errs[0]?.message || "Could not place order. Please try again.");
        return;
      }
      // Open WhatsApp pre-filled (does NOT mark order confirmed).
      try {
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        }
      } catch {
        // Popup blocked — that's OK, the success page has the link.
      }
      clear();
      toast.success("Order placed! Sending on WhatsApp to confirm.");
      router.push(`/order/success?ref=${encodeURIComponent(data.orderRef)}`);
    } catch (e: any) {
      toast.error("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-8 w-1/3 bg-muted animate-pulse rounded mb-6" />
        <div className="h-64 bg-muted/60 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24 text-center">
        <div className="mx-auto size-20 grid place-items-center rounded-full bg-muted mb-5">
          <AlertCircle className="size-10 text-muted-foreground" />
        </div>
        <h1 className="font-display font-extrabold text-3xl">
          Your cart is empty
        </h1>
        <p className="mt-2 text-muted-foreground">
          Add items to your cart before checking out.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/menu">
            Browse menu
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/cart">
          <ArrowLeft className="size-4" />
          Back to cart
        </Link>
      </Button>
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-2">
        Checkout
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Fill in your details, place the order, and we&apos;ll open WhatsApp with
        your message ready to send.
      </p>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-display font-semibold text-lg mb-4">
              Contact details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Full name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ali Khan"
                  autoComplete="name"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Phone number <span className="text-primary">*</span>
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03XX XXXXXXX"
                  inputMode="tel"
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Delivery type */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-display font-semibold text-lg mb-4">
              Delivery or pickup?
            </h2>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as "delivery" | "pickup")}
              className="grid sm:grid-cols-2 gap-3"
            >
              <Label
                htmlFor="type-delivery"
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  type === "delivery"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem id="type-delivery" value="delivery" className="mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <Truck className="size-4" />
                    Home Delivery
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delivery fee applies based on area. Free over{" "}
                    {formatPKR(settings.freeDeliveryThreshold)}.
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="type-pickup"
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  type === "pickup"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem id="type-pickup" value="pickup" className="mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <Store className="size-4" />
                    Pickup
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pick up from our Kabirwala location — no delivery fee.
                  </p>
                </div>
              </Label>
            </RadioGroup>

            {type === "delivery" && (
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="area">
                    Delivery area <span className="text-primary">*</span>
                  </Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger id="area">
                      <SelectValue placeholder="Select your area" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.deliveryAreas.map((a) => (
                        <SelectItem key={a.name} value={a.name}>
                          {a.name} · {formatPKR(a.fee)} · {a.etaMin} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">
                    Delivery address <span className="text-primary">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House #, street, landmark, area…"
                    rows={2}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive">{errors.address}</p>
                  )}
                </div>
              </div>
            )}
            {type === "pickup" && (
              <p className="mt-4 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                Pickup at:{" "}
                <span className="text-foreground font-medium">
                  {settings.address}
                </span>
              </p>
            )}

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="notes">Order notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. ring the bell on arrival, extra napkins, etc."
                rows={2}
                maxLength={500}
              />
            </div>
          </Card>

          {/* Coupon */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-display font-semibold text-lg mb-2 flex items-center gap-2">
              <Tag className="size-4 text-primary" />
              Coupon code
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Have a deal coupon code? Enter it here for 10% off (demo).
            </p>
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. FAMILY10"
                className="uppercase"
              />
            </div>
          </Card>

          {/* Items list */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-display font-semibold text-lg mb-4">
              Order items ({lines.length})
            </h2>
            <ul className="space-y-3">
              {lines.map((l) => (
                <li
                  key={l.key}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {l.qty} × {l.name}
                    </p>
                    {l.optionSummary && (
                      <p className="text-xs text-muted-foreground">
                        {l.optionSummary}
                      </p>
                    )}
                    {l.specialInstructions && (
                      <p className="text-xs italic text-muted-foreground">
                        “{l.specialInstructions}”
                      </p>
                    )}
                  </div>
                  <Price amount={l.lineTotal} className="font-medium tabular-nums" />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="p-5 sticky top-24">
            <h2 className="font-display font-semibold text-lg">Order summary</h2>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">
                  {formatPKR(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Delivery fee
                  {deliveryFee === 0 && type === "delivery" && subtotal > 0 && (
                    <span className="ml-1 text-emerald-600 font-medium text-xs">
                      (Free)
                    </span>
                  )}
                </span>
                <span className="font-medium tabular-nums">
                  {deliveryFee === 0 ? "Free" : formatPKR(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Estimated prep + delivery</span>
                <span className="tabular-nums">~{etaMin} min</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Total</span>
              <Price
                amount={total}
                className="font-display font-bold text-2xl text-primary"
              />
            </div>

            {!minOrderMet && (
              <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  Minimum order is{" "}
                  <span className="font-semibold">
                    {formatPKR(settings.minOrderValue)}
                  </span>
                  . Add{" "}
                  <span className="font-semibold">
                    {formatPKR(settings.minOrderValue - subtotal)}
                  </span>{" "}
                  more to checkout.
                </span>
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || !minOrderMet}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Placing order…
                </>
              ) : (
                <>
                  <WhatsAppIcon className="size-4" />
                  Place Order via WhatsApp
                </>
              )}
            </Button>

            <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                Order is confirmed only after restaurant replies on WhatsApp.
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" />
                No online payment needed — pay on delivery/pickup.
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur p-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <Price amount={total} className="font-display font-bold text-lg" />
        </div>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || !minOrderMet}
          className="px-5"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Place Order
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
