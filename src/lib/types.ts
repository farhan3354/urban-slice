// Public type definitions mirroring server API shapes.

import type {
  RestaurantSettings,
  OpeningHour,
  SocialLinks,
  DeliveryArea,
  HeroContent,
} from "@/lib/settings";

export type {
  RestaurantSettings,
  OpeningHour,
  SocialLinks,
  DeliveryArea,
  HeroContent,
};

export type PublicSettings = Omit<RestaurantSettings, "policies">;

export type SerializedOption = {
  id: string;
  groupId: string;
  name: string;
  priceModifier: number;
  defaultSel: boolean;
};

export type SerializedOptionGroup = {
  id: string;
  name: string;
  key: string;
  type: "single" | "multiple";
  required: boolean;
  min: number;
  max: number;
  options: SerializedOption[];
};

export type SerializedProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  effectivePrice: number;
  imageUrl: string | null;
  available: boolean;
  featured: boolean;
  popular: boolean;
  prepTimeMin: number;
  promoPrice: number | null;
  tags: string[];
  optionGroups: SerializedOptionGroup[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  order: number;
  active: boolean;
};

export type Deal = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  oldPrice: number | null;
  badge: string | null;
  couponCode: string | null;
  itemsJson: string;
};

export type DealItem = { name: string; qty: number };

export type OrderStatus =
  | "pending_whatsapp"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type OrderItemOption = {
  groupKey: string;
  groupName: string;
  optionName: string;
  priceModifier: number;
};

export type OrderItem = {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  options: OrderItemOption[];
  specialInstructions?: string;
};

export type TrackedOrder = {
  orderRef: string;
  customerName: string;
  customerPhone: string;
  type: "delivery" | "pickup";
  address: string | null;
  area: string | null;
  notes: string | null;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  couponCode: string | null;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
};

export type CartLineInput = {
  productId: string;
  qty: number;
  selectedOptionIds: string[];
  specialInstructions?: string;
};
