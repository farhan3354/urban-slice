// Restaurant settings — key/value store with typed getters.
// All complex values stored as JSON strings in RestaurantSetting.

import { db } from "@/lib/db";

export type OpeningHour = {
  day: string; // "monday"...
  open: string; // "11:00"
  close: string; // "23:00"
  closed: boolean;
};

export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
};

export type DeliveryArea = {
  name: string;
  fee: number;
  etaMin: number;
};

export type HeroContent = {
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  imageUrl: string;
};

export type PolicyContent = {
  about: string;
  deliveryInfo: string;
  refundPolicy: string;
  privacyPolicy: string;
  terms: string;
};

export type RestaurantSettings = {
  restaurantName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  mapLink: string;
  whatsappNumber: string; // international, digits only
  contactPhone: string;
  contactPhoneSecondary?: string; // optional second number
  contactEmail: string;
  openingHours: OpeningHour[];
  temporarilyClosed: boolean;
  deliveryAreas: DeliveryArea[];
  defaultDeliveryFee: number;
  minOrderValue: number;
  freeDeliveryThreshold: number;
  prepTimeMin: number;
  currency: string; // "PKR"
  announcementBar: { enabled: boolean; text: string; link?: string };
  hero: HeroContent;
  social: SocialLinks;
  policies: PolicyContent;
  footerNote: string;
};

export const DEFAULT_SETTINGS: RestaurantSettings = {
  restaurantName: "Urban Slice",
  tagline: "Slice Into Happiness",
  logoUrl: "/images/logo-official.jpg",
  address:
    "New Lari Adda, Near Bank Al Habib, Jhang Road, Kabirwala",
  // Google Maps link for the restaurant location.
  mapLink: "https://share.google/IrwMc8yaUJTIhxX2F",
  // WhatsApp ordering uses the primary mobile (923052806919).
  whatsappNumber: "923052806919",
  contactPhone: "0305-2806919",
  contactPhoneSecondary: "0342-0663919",
  contactEmail: "farhanbashir3354@gmail.com",
  openingHours: [
    { day: "monday",    open: "13:00", close: "03:00", closed: false },
    { day: "tuesday",   open: "13:00", close: "03:00", closed: false },
    { day: "wednesday", open: "13:00", close: "03:00", closed: false },
    { day: "thursday",  open: "13:00", close: "03:00", closed: false },
    { day: "friday",    open: "13:00", close: "03:00", closed: false },
    { day: "saturday",  open: "13:00", close: "03:00", closed: false },
    { day: "sunday",    open: "13:00", close: "03:00", closed: false },
  ],
  temporarilyClosed: false,
  deliveryAreas: [
    { name: "Kabirwala City",  fee: 60,  etaMin: 25 },
    { name: "Mian Channu Road", fee: 100, etaMin: 35 },
    { name: "Khanewal Road",   fee: 120, etaMin: 40 },
  ],
  defaultDeliveryFee: 60,
  minOrderValue: 350,
  freeDeliveryThreshold: 2500,
  prepTimeMin: 25,
  currency: "PKR",
  announcementBar: {
    enabled: true,
    text: "🍕 Free Home Delivery Available · Open Daily 1:00 PM – 3:00 AM · Order on WhatsApp: 0305-2806919",
    link: "/deals",
  },
  hero: {
    headline: "Good Food, Good Mood",
    subheadline:
      "Kabirwala's favourite pizza, burgers, wraps & deals — made fresh every day. Take Away · Home Delivery · Casual Dining · Family Dining. Order on WhatsApp in seconds!",
    primaryCta: "Order Now on WhatsApp",
    secondaryCta: "View Full Menu",
    imageUrl: "/images/hero-pizza.png",
  },
  social: {
    facebook: "https://www.facebook.com/share/1DbF9Q7r6Z/",
    instagram: "#",
    tiktok: "#",
  },
  policies: {
    about:
      "Urban Slice is Kabirwala's premier pizza & fast food destination, serving hand-tossed pizzas, crispy burgers, fresh wraps, broast, pasta, sandwiches and more. We believe in Good Food, Good Mood — every order is made fresh, with quality ingredients and bold flavours. Visit us at New Lari Adda, Near Bank Al Habib, Jhang Road, Kabirwala, or order for free home delivery via WhatsApp.",
    deliveryInfo:
      "We offer FREE Home Delivery across Kabirwala and nearby areas. Estimated delivery time is 25–40 minutes depending on your area and order size. Minimum order: Rs. 350. Pickup is always free — just come to New Lari Adda, Near Bank Al Habib, Jhang Road, Kabirwala.",
    refundPolicy:
      "If your order is incorrect or unsatisfactory, please contact us on WhatsApp (0305-2806919) within 30 minutes of delivery. We will replace the item or issue a store credit at our discretion.",
    privacyPolicy:
      "We only collect the information needed to fulfil your order (name, phone, address). We do not sell your data. We use WhatsApp to confirm and coordinate orders.",
    terms:
      "By placing an order you agree to provide accurate contact information. Prices are in Pakistani Rupees and may change without notice. Orders are confirmed only when the restaurant acknowledges them on WhatsApp.",
  },
  footerNote:
    "Urban Slice — Slice Into Happiness. New Lari Adda, Near Bank Al Habib, Jhang Road, Kabirwala. Tel: 0305-2806919 | 0342-0663919",
};

const SETTINGS_KEY = "main";

export async function getSettings(): Promise<RestaurantSettings> {
  const row = await db.restaurantSetting.findUnique({
    where: { id: SETTINGS_KEY },
  });
  if (!row) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(patch: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
  const current = await getSettings();
  const merged = { ...current, ...patch };
  await db.restaurantSetting.upsert({
    where: { id: SETTINGS_KEY },
    update: { value: JSON.stringify(merged) },
    create: { id: SETTINGS_KEY, value: JSON.stringify(merged) },
  });
  return merged;
}

// Handles overnight hours: if close <= open (e.g. open 13:00, close 03:00),
// the restaurant closes the next calendar day at `close`. We also check
// yesterday's hours in case we are still inside yesterday's overnight window.
export function todayOpenLabel(s: RestaurantSettings): { open: boolean; label: string } {
  if (s.temporarilyClosed) return { open: false, label: "Temporarily closed" };
  const now = new Date();
  return computeOpenLabel(s, now);
}

function computeOpenLabel(s: RestaurantSettings, now: Date): { open: boolean; label: string } {
  const dayName = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const today = s.openingHours.find((h) => h.day === dayName);

  const cur = now.getHours() * 60 + now.getMinutes();
  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const yesterdayName = DAY_NAMES[(now.getDay() + 6) % 7];
  const yesterday = s.openingHours.find((h) => h.day === yesterdayName);

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  // Overnight check: still inside yesterday's extended hours?
  // (e.g. yesterday opened 13:00 and closed 03:00, and it's now 01:00 today)
  if (yesterday && !yesterday.closed) {
    const yOpen = toMin(yesterday.open);
    const yClose = toMin(yesterday.close);
    if (yClose <= yOpen && cur < yClose) {
      return { open: true, label: `Open · closes ${yesterday.close}` };
    }
  }

  if (!today || today.closed) return { open: false, label: "Closed today" };

  const open = toMin(today.open);
  const close = toMin(today.close);

  if (close > open) {
    // Same-day window
    if (cur >= open && cur < close) {
      return { open: true, label: `Open · closes ${today.close}` };
    }
  } else {
    // Overnight window: open until close next day
    if (cur >= open || cur < close) {
      return { open: true, label: `Open · closes ${today.close}` };
    }
  }
  return { open: false, label: `Closed · opens ${today.open}` };
}

export function getDayLabel(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}
