import * as React from "react";
import { getSettings } from "@/lib/settings";
import { PolicyLayout, PolicyText } from "@/components/site/PolicyLayout";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund and replacement policy for Urban Slice Pizza orders in Kabirwala.",
  alternates: { canonical: "/refund-policy" },
};

export default async function RefundPolicyPage() {
  const s = await getSettings();
  return (
    <PolicyLayout
      title="Refund Policy"
      description="How we handle order issues and refunds."
    >
      <PolicyText content={s.policies.refundPolicy} />
    </PolicyLayout>
  );
}
