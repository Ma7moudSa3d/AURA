-- AURA schema. Run in Supabase SQL editor (or supabase db push).
create extension if not exists "pgcrypto";

create type order_status as enum (
  'PENDING_PAYMENT_VERIFICATION','PAID','CONFIRMED','SHIPPED','DELIVERED','CANCELED','REFUNDED'
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_ar text not null,
  slug text unique not null,
  description_en text,
  description_ar text,
  price numeric(10,2) not null check (price >= 0),
  discount_price numeric(10,2) check (discount_price >= 0),
  discount_percent numeric(5,2) check (discount_percent between 0 and 100),
  discount_start timestamptz,
  discount_end timestamptz,
  stock_qty int not null default 0 check (stock_qty >= 0),
  low_stock_threshold int not null default 5,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  gender text not null default 'unisex' check (gender in ('unisex','men','women')),
  collection text,
  tags text[] not null default '{}',
  volume text default '50ml',
  concentration text default 'EDP',
  units_sold int not null default 0,
  created_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  path text not null,
  sort_order int not null default 0
);

create table product_notes (
  product_id uuid primary key references products(id) on delete cascade,
  top_notes text[] not null default '{}',
  heart_notes text[] not null default '{}',
  base_notes text[] not null default '{}'
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  reminder_sent_at timestamptz
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  qty int not null check (qty > 0 and qty <= 20),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percent','fixed')),
  value numeric(10,2) not null check (value > 0),
  expires_at timestamptz,
  max_uses int,
  used_count int not null default 0,
  is_active boolean not null default true
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  status order_status not null default 'PENDING_PAYMENT_VERIFICATION',
  subtotal numeric(10,2) not null,
  discount_total numeric(10,2) not null default 0,
  coupon_code text,
  shipping_fee numeric(10,2) not null,
  total numeric(10,2) not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  notes text,
  payment_method text not null default 'InstaPay/Mobile Wallet to 01016267377',
  transaction_reference_id text,
  payment_proof_path text,
  admin_note text,
  stock_deducted boolean not null default false,
  created_at timestamptz not null default now(),
  constraint proof_required check (transaction_reference_id is not null or payment_proof_path is not null)
);
create index on orders(user_id);
create index on orders(status, created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_title_snapshot text not null,
  unit_price_snapshot numeric(10,2) not null,
  discount_snapshot numeric(10,2) not null default 0,
  qty int not null check (qty > 0),
  line_total numeric(10,2) not null
);
create index on order_items(order_id);

create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  event_type text not null,
  message text,
  created_at timestamptz not null default now()
);

create table settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text not null default '201016267377',
  shipping_fee numeric(10,2) not null default 60,
  free_shipping_threshold numeric(10,2) not null default 3000,
  instagram text, facebook text, tiktok text,
  contact_email text default 'ofoftot@gmail.com',
  contact_phone text default '01016267377',
  announcement_en text, announcement_ar text
);
insert into settings (id) values (1);

-- auto-create profile on signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'customer');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function handle_new_user();

-- touch cart timestamp when items change
create or replace function touch_cart() returns trigger language plpgsql as $$
begin
  update carts set updated_at = now(), reminder_sent_at = null
  where id = coalesce(new.cart_id, old.cart_id);
  return null;
end $$;
create trigger cart_items_touch after insert or update or delete on cart_items
for each row execute function touch_cart();
