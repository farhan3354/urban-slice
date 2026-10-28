import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// Public settings — only fields safe to expose
export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    restaurantName: s.restaurantName,
    tagline: s.tagline,
    logoUrl: s.logoUrl,
    address: s.address,
    mapLink: s.mapLink,
    whatsappNumber: s.whatsappNumber,
    contactPhone: s.contactPhone,
    contactPhoneSecondary: s.contactPhoneSecondary,
    contactEmail: s.contactEmail,
    openingHours: s.openingHours,
    temporarilyClosed: s.temporarilyClosed,
    deliveryAreas: s.deliveryAreas,
    defaultDeliveryFee: s.defaultDeliveryFee,
    minOrderValue: s.minOrderValue,
    freeDeliveryThreshold: s.freeDeliveryThreshold,
    prepTimeMin: s.prepTimeMin,
    currency: s.currency,
    announcementBar: s.announcementBar,
    hero: s.hero,
    social: s.social,
    footerNote: s.footerNote,
  });
}
