// Local restaurant-settings type (mirror of src/lib/settings.ts).
// We avoid importing the server-side settings module in client components.

export type OpeningHour = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

export type DeliveryArea = {
  name: string;
  fee: number;
  etaMin: number;
};

export type RestaurantSettings = {
  restaurantName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  mapLink: string;
  whatsappNumber: string;
  contactPhone: string;
  contactPhoneSecondary?: string;
  contactEmail: string;
  openingHours: OpeningHour[];
  temporarilyClosed: boolean;
  deliveryAreas: DeliveryArea[];
  defaultDeliveryFee: number;
  minOrderValue: number;
  freeDeliveryThreshold: number;
  prepTimeMin: number;
  currency: string;
  announcementBar: { enabled: boolean; text: string; link?: string };
  hero: {
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    imageUrl: string;
  };
  social: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  policies: {
    about: string;
    deliveryInfo: string;
    refundPolicy: string;
    privacyPolicy: string;
    terms: string;
  };
  footerNote: string;
};

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export function getDayLabel(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}
