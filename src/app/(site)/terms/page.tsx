import * as React from "react";
import { getSettings } from "@/lib/settings";
import { PolicyLayout, PolicyText } from "@/components/site/PolicyLayout";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for ordering from Urban Slice Pizza.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <PolicyLayout
      title="Terms of Service"
      description="The terms that apply when you place an order with us."
    >
      <PolicyText content={s.policies.terms} />
    </PolicyLayout>
  );
}
