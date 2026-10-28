import * as React from "react";
import { getSettings } from "@/lib/settings";
import { PolicyLayout, PolicyText } from "@/components/site/PolicyLayout";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What information we collect and how we use it at Urban Slice Pizza.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPolicyPage() {
  const s = await getSettings();
  return (
    <PolicyLayout
      title="Privacy Policy"
      description="How we handle your personal information."
    >
      <PolicyText content={s.policies.privacyPolicy} />
    </PolicyLayout>
  );
}
