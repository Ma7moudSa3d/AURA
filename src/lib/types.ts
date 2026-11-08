// src/lib/types.ts

export const ORDER_STATUSES = [
  "PENDING_PAYMENT_VERIFICATION",
  "PAID",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface ProductVariant {
  volume: string;
  price: number;
  discount_price?: number | null;
  stock_qty?: number;
  [key: string]: any;
}

export interface ProductImage {
  id: string;
  path: string;
  sort_order: number;
  [key: string]: any;
}

export interface ProductNotes {
  top_notes?: string[];
  heart_notes?: string[];
  base_notes?: string[];
  [key: string]: any;
}

export interface Product {
  id: string;
  title_en: string;
  title_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  price: number;
  discount_price?: number | null;
  discount_percent?: number | null;
  discount_start?: string | null;
  discount_end?: string | null;
  stock_qty: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  gender: "unisex" | "men" | "women" | string;
  collection?: string | null;
  tags: string[];
  volume: string;
  concentration: string;
  variants?: ProductVariant[];
  created_at?: string;
  updated_at?: string;
  images?: ProductImage[];
  notes?: ProductNotes;
  product_images?: ProductImage[];
  product_notes?: ProductNotes | ProductNotes[] | any;
  [key: string]: any;
}

export interface CartItem {
  id: string;
  product_id: string;
  title_en: string;
  title_ar: string;
  volume: string;
  price: number;
  discount_price?: number | null;
  qty: number;
  image?: string;
  [key: string]: any;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  expires_at?: string | null;
  max_uses?: number | null;
  used_count?: number;
  [key: string]: any;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  volume?: string;
  products?: Partial<Product>;
  [key: string]: any;
}

export interface Order {
  id: string;
  user_id?: string | null;
  status: OrderStatus;
  payment_method: string;
  deposit_amount: number;
  remaining_balance: number;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  coupon_code?: string | null;
  proof_path?: string | null;
  transaction_reference_id?: string | null;
  governorate?: string | null;
  city?: string | null;
  address_details?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  customer_name?: string | null;
  admin_note?: string | null;
  created_at: string;
  order_items?: OrderItem[];
  [key: string]: any;
}

export interface Settings {
  id: number;
  whatsapp_number?: string | null;
  shipping_fee: number;
  free_shipping_threshold: number;
  instagram?: string | null;
  instagram_url?: string | null;
  facebook?: string | null;
  facebook_url?: string | null;
  tiktok?: string | null;
  tiktok_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  announcement_en?: string | null;
  announcement_ar?: string | null;
  enable_cod: boolean;
  enable_instapay: boolean;
  enable_deposit: boolean;
  updated_at?: string;
  [key: string]: any;
}

export interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  [key: string]: any;
}
