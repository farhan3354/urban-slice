import type { Metadata } from "next";
import { SettingsProvider } from "@/hooks/use-settings";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { getSettings } from "@/lib/settings";
import type { PublicSettings } from "@/lib/types";

export const metadata: Metadata = {
  title: {
    default: "Urban Slice — Kabirwala | Pizza, Burgers, Wraps & More",
    template: "%s | Urban Slice",
  },
  description:
    "Urban Slice in Kabirwala — hand-tossed pizzas, crispy burgers, fresh wraps, broast, pasta & drinks. Free Home Delivery. Order on WhatsApp: 0305-2806919.",
};

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch settings server-side so the header/footer render without a flash.
  const settings = (await getSettings()) as PublicSettings;
  return (
    <SettingsProvider initialSettings={settings}>
      <div className="min-h-screen flex flex-col bg-background">
        <AnnouncementBar />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <WhatsAppFloat />
      </div>
    </SettingsProvider>
  );
}
