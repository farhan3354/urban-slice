// Shared types for the admin dashboard (mirror server-side shapes).

export type OrderStatus =
  | "pending_whatsapp"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_whatsapp: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],
  cancelled: ["pending_whatsapp"],
};

export const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; dot: string }
> = {
  pending_whatsapp: {
    label: "Pending WhatsApp",
    className:
      "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    dot: "bg-slate-500",
  },
  preparing: {
    label: "Preparing",
    className:
      "border-yellow-300 bg-yellow-100 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200",
    dot: "bg-yellow-500",
  },
  ready: {
    label: "Ready",
    className:
      "border-green-300 bg-green-100 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-200",
    dot: "bg-green-500",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className:
      "border-teal-300 bg-teal-100 text-teal-900 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-200",
    dot: "bg-teal-500",
  },
  completed: {
    label: "Completed",
    className:
      "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "border-red-300 bg-red-100 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200",
    dot: "bg-red-500",
  },
};

export const ALL_STATUSES: OrderStatus[] = [
  "pending_whatsapp",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
];

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type SerializedOption = {
  id?: string;
  groupId?: string;
  name: string;
  priceModifier: number;
  order: number;
  defaultSel?: boolean;
};

export type SerializedOptionGroup = {
  id?: string;
  name: string;
  key: string;
  type: "single" | "multiple";
  required: boolean;
  min: number;
  max: number;
  order: number;
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
  _count?: { products: number };
};

export type Deal = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  oldPrice: number | null;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  couponCode: string | null;
  badge: string | null;
  itemsJson: string;
  createdAt: string;
};

export type OrderItemOption = {
  groupKey: string;
  groupName: string;
  optionName: string;
  priceModifier: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  basePrice: number;
  qty: number;
  options: OrderItemOption[];
  unitPrice: number;
  lineTotal: number;
  specialInstructions?: string;
};

export type Order = {
  id: string;
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
  internalNotes: string | null;
  couponCode: string | null;
  whatsappSentAt: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type DashboardData = {
  counts: {
    total: number;
    pendingWhatsApp: number;
    confirmed: number;
    preparing: number;
    ready: number;
    outForDelivery: number;
    completed: number;
    cancelled: number;
  };
  salesTotal: number;
  cancelledTotal: number;
  orderCount: number;
  salesSeries: { day: string; value: number }[];
  popularItems: { name: string; qty: number; revenue: number }[];
  recent: {
    orderRef: string;
    customerName: string;
    customerPhone: string;
    type: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
  }[];
  unavailableCount: number;
  lowItems: { id: string; name: string; category: string }[];
  isDemoData: boolean;
};

export type AuditEvent = {
  id: string;
  action: string;
  target: string;
  metadata: unknown;
  createdAt: string;
  admin: { name: string | null; email: string | null } | null;
};

export type ApiError = { field: string; message: string };

export async function extractErrors(res: Response): Promise<ApiError[]> {
  try {
    const data = await res.json();
    if (Array.isArray(data?.errors)) return data.errors;
    if (data?.error) return [{ field: "form", message: data.error }];
    return [];
  } catch {
    return [{ field: "form", message: `Request failed (${res.status})` }];
  }
}
