export type Product = {
  id: string; slug: string; title_en: string; title_ar: string;
  description_en: string | null; description_ar: string | null;
  price: number; discount_price: number | null; discount_percent: number | null;
  discount_start: string | null; discount_end: string | null;
  stock_qty: number; low_stock_threshold: number; is_active: boolean; is_featured: boolean;
  gender: "unisex" | "men" | "women"; collection: string | null; tags: string[];
  volume: string | null; concentration: string | null; units_sold: number; created_at: string;
  product_images?: { id: string; path: string; sort_order: number }[];
  product_notes?: { top_notes: string[]; heart_notes: string[]; base_notes: string[] } | null;
};

export type Settings = {
  whatsapp_number: string; shipping_fee: number; free_shipping_threshold: number;
  instagram: string | null; facebook: string | null; tiktok: string | null;
  contact_email: string | null; contact_phone: string | null;
  announcement_en: string | null; announcement_ar: string | null;
};

export const ORDER_STATUSES = [
  "PENDING_PAYMENT_VERIFICATION", "PAID", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELED", "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
