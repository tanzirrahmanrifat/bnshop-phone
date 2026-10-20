export type Settings = {
  shop_name: string;
  tagline: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  maps_url: string;
  topbar: string;
  hero_badge: string;
  hero_title: string;
  hero_text: string;
  hero_image: string;
  delivery_note: string;
  warranty_note: string;
  bank_details: string;
  free_delivery_min: number;
};

export type District = { code: string; name: string; fee: number; eta: string; sort: number; active: boolean };

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort: number;
  active: boolean;
};

export type Tag = { id: string; name: string; slug: string; image_url: string; sort: number };

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  brand: string;
  price: number;
  sale_price: number | null;
  sale_ends_at: string | null;
  stock: number;
  images: string[];
  option_name: string;
  active: boolean;
  featured: boolean;
  sold_count: number;
  created_at: string;
  effective_price: number;
  on_sale: boolean;
  in_stock: boolean;
};

export type Variant = {
  id: string;
  product_id: string;
  label: string;
  price: number | null;
  stock: number;
  sku: string;
  sort: number;
};

export type Product = ProductListItem & {
  description: string;
  sku: string;
  variants: Variant[];
  category: Pick<Category, "name" | "slug"> | null;
};

export type Banner = {
  id: string;
  placement: "hero" | "side" | "promo";
  title: string;
  subtitle: string;
  cta_label: string;
  link: string;
  image_url: string;
  theme: "dark" | "orange" | "green" | "blue";
  sort: number;
  active: boolean;
};

export type RepairBrand = { id: string; name: string; slug: string; image_url: string; sort: number; active: boolean };
export type RepairModel = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  series: string;
  sort: number;
  active: boolean;
};
export type RepairService = {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration: string;
  sort: number;
  active: boolean;
};
export type Grade = "compatible" | "oem" | "original";
export type RepairPrice = { model_id: string; service_id: string; grade: Grade; price: number };

export const ORDER_STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const REPAIR_STATUSES = [
  "received",
  "diagnosis",
  "approval",
  "repairing",
  "ready",
  "completed",
  "cancelled",
] as const;
export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export const GRADES: { id: Grade; label: string; note: string }[] = [
  { id: "compatible", label: "Compatible", note: "Lowest price" },
  { id: "oem", label: "OEM-grade", note: "Best value" },
  { id: "original", label: "Original", note: "Where available" },
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const REPAIR_STATUS_LABEL: Record<RepairStatus, string> = {
  received: "Received",
  diagnosis: "Diagnosing",
  approval: "Waiting for your approval",
  repairing: "Repairing",
  ready: "Ready for collection / delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};
