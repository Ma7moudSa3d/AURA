export interface ProductVariant {
  volume: string;
  price: number;
  discount_price?: number | null;
  stock_qty?: number;
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
  gender: 'unisex' | 'men' | 'women';
  collection?: string | null;
  tags: string[];
  volume: string;
  concentration: string;
  variants?: ProductVariant[];
  created_at?: string;
  updated_at?: string;
  images?: { id: string; path: string; sort_order: number }[];
  notes?: { top_notes: string[]; heart_notes: string[]; base_notes: string[] };
}
