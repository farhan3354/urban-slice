import * as React from "react";
import { Bike, Clock, MapPin, Wallet, ShieldCheck } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { PolicyLayout, PolicyText } from "@/components/site/PolicyLayout";
import { formatPKR } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delivery Information",
  description:
    "Delivery areas, fees, estimated times and pickup options for Urban Slice Pizza in Kabirwala.",
  alternates: { canonical: "/delivery-info" },
};

export default async function DeliveryInfoPage() {
  const s = await getSettings();
  return (
    <PolicyLayout
      title="Delivery Information"
      description="Delivery areas, fees, and pickup options in Kabirwala."
    >
      <h2>Delivery Areas & Fees</h2>
      <PolicyText content={s.policies.deliveryInfo} />

      <h2>Areas we serve</h2>
      <ul className="space-y-2 not-prose">
        {s.deliveryAreas.map((a) => (
          <li
            key={a.name}
            className="flex items-center justify-between rounded-lg border p-3 text-sm"
          >
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <span className="font-medium">{a.name}</span>
            </div>
            <div className="text-right text-muted-foreground">
              <p className="tabular-nums">{formatPKR(a.fee)}</p>
              <p className="text-xs">~{a.etaMin} min</p>
            </div>
          </li>
        ))}
      </ul>

      <h2>Order minimums & free delivery</h2>
      <ul className="space-y-2 not-prose">
        <li className="flex items-center gap-3 rounded-lg border p-3 text-sm">
          <Wallet className="size-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Minimum order: {formatPKR(s.minOrderValue)}</p>
            <p className="text-xs text-muted-foreground">
              We require a minimum subtotal for delivery orders.
            </p>
          </div>
        </li>
        <li className="flex items-center gap-3 rounded-lg border p-3 text-sm">
          <Bike className="size-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">
              Free delivery over {formatPKR(s.freeDeliveryThreshold)}
            </p>
            <p className="text-xs text-muted-foreground">
              Orders above this threshold get free delivery (demo).
            </p>
          </div>
        </li>
        <li className="flex items-center gap-3 rounded-lg border p-3 text-sm">
          <Clock className="size-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Average prep time: {s.prepTimeMin} min</p>
            <p className="text-xs text-muted-foreground">
              Plus delivery time based on your area.
            </p>
          </div>
        </li>
        <li className="flex items-center gap-3 rounded-lg border p-3 text-sm">
          <ShieldCheck className="size-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Pay on delivery or pickup</p>
            <p className="text-xs text-muted-foreground">
              We don&apos;t take online payments — cash on delivery or pickup.
            </p>
          </div>
        </li>
      </ul>
    </PolicyLayout>
  );
}
