-- Helper: DB-level admin check. Requires role=admin, exact owner email, and MFA (aal2) session.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
  and (auth.jwt() ->> 'email') = 'ofoftot@gmail.com'
  and (auth.jwt() ->> 'aal') = 'aal2';
$$;

-- Prevent users from escalating their own role
create or replace function protect_role() returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'role cannot be changed';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on profiles
for each row execute function protect_role();

-- Enable RLS everywhere
alter table profiles enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_notes enable row level security;
alter table reviews enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table settings enable row level security;

-- profiles
create policy "own profile read" on profiles for select using (id = auth.uid() or is_admin());
create policy "own profile update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- catalog: public read of active products, admin full control
create policy "public read active products" on products for select using (is_active or is_admin());
create policy "admin write products" on products for all using (is_admin()) with check (is_admin());
create policy "public read images" on product_images for select using (true);
create policy "admin write images" on product_images for all using (is_admin()) with check (is_admin());
create policy "public read notes" on product_notes for select using (true);
create policy "admin write notes" on product_notes for all using (is_admin()) with check (is_admin());

-- reviews: public sees approved; users add own (unapproved); admin moderates
create policy "read approved reviews" on reviews for select using (is_approved or user_id = auth.uid() or is_admin());
create policy "insert own review" on reviews for insert with check (user_id = auth.uid() and is_approved = false);
create policy "admin moderate reviews" on reviews for update using (is_admin());
create policy "admin delete reviews" on reviews for delete using (is_admin());

-- carts
create policy "own cart" on carts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own cart items" on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()));

-- orders: customers read only. Inserts happen ONLY through create_order() (service role).
create policy "own orders read" on orders for select using (user_id = auth.uid() or is_admin());
create policy "admin update orders" on orders for update using (is_admin()) with check (is_admin());
create policy "own order items read" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin())));
create policy "own order events read" on order_events for select
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin())));

-- coupons: admin only (validated server-side via service role)
create policy "admin coupons" on coupons for all using (is_admin()) with check (is_admin());

-- settings: public read, admin write
create policy "public read settings" on settings for select using (true);
create policy "admin write settings" on settings for update using (is_admin()) with check (is_admin());

-- Effective unit price (applies scheduled discount window)
create or replace function effective_price(p products) returns numeric
language sql stable as $$
  select round(case
    when (p.discount_start is null or p.discount_start <= now())
     and (p.discount_end is null or p.discount_end >= now())
     and p.discount_price is not null then p.discount_price
    when (p.discount_start is null or p.discount_start <= now())
     and (p.discount_end is null or p.discount_end >= now())
     and p.discount_percent is not null then p.price * (1 - p.discount_percent/100)
    else p.price end, 2);
$$;

-- Atomic order creation. Totals are computed here from DB prices only.
-- Callable ONLY by the service role (the Next.js server after verifying the session).
create or replace function create_order(
  p_user_id uuid, p_email text, p_name text, p_phone text,
  p_address1 text, p_address2 text, p_city text, p_notes text,
  p_txn_ref text, p_proof_path text, p_coupon text, p_items jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_order uuid := gen_random_uuid();
  v_subtotal numeric := 0; v_list_total numeric := 0;
  v_disc numeric := 0; v_coupon_disc numeric := 0;
  v_ship numeric; v_total numeric;
  v_s settings; v_c coupons; v_p products;
  v_item jsonb; v_qty int; v_unit numeric;
begin
  if p_txn_ref is null and p_proof_path is null then
    raise exception 'payment proof required';
  end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'empty cart'; end if;
  select * into v_s from settings where id = 1;

  insert into orders (id, user_id, subtotal, shipping_fee, total, customer_name, customer_email,
    customer_phone, address_line1, address_line2, city, notes, transaction_reference_id, payment_proof_path)
  values (v_order, p_user_id, 0, 0, 0, p_name, p_email, p_phone, p_address1, p_address2, p_city, p_notes,
    nullif(p_txn_ref,''), p_proof_path);

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty < 1 or v_qty > 20 then raise exception 'bad qty'; end if;
    select * into v_p from products where id = (v_item->>'product_id')::uuid and is_active for update;
    if not found then raise exception 'product unavailable'; end if;
    if v_p.stock_qty < v_qty then raise exception 'insufficient stock: %', v_p.title_en; end if;
    v_unit := effective_price(v_p);
    insert into order_items (order_id, product_id, product_title_snapshot, unit_price_snapshot,
      discount_snapshot, qty, line_total)
    values (v_order, v_p.id, v_p.title_en, v_p.price, v_p.price - v_unit, v_qty, v_unit * v_qty);
    update products set stock_qty = stock_qty - v_qty, units_sold = units_sold + v_qty where id = v_p.id;
    v_subtotal := v_subtotal + v_unit * v_qty;
    v_list_total := v_list_total + v_p.price * v_qty;
  end loop;
  v_disc := v_list_total - v_subtotal;

  if p_coupon is not null and p_coupon <> '' then
    select * into v_c from coupons where upper(code) = upper(p_coupon) and is_active for update;
    if not found or (v_c.expires_at is not null and v_c.expires_at < now())
       or (v_c.max_uses is not null and v_c.used_count >= v_c.max_uses) then
      raise exception 'invalid coupon';
    end if;
    v_coupon_disc := least(v_subtotal, case when v_c.type = 'percent'
      then round(v_subtotal * v_c.value / 100, 2) else v_c.value end);
    update coupons set used_count = used_count + 1 where id = v_c.id;
  end if;

  v_ship := case when (v_subtotal - v_coupon_disc) >= v_s.free_shipping_threshold then 0 else v_s.shipping_fee end;
  v_total := v_subtotal - v_coupon_disc + v_ship;

  update orders set subtotal = v_subtotal, discount_total = v_disc + v_coupon_disc,
    coupon_code = nullif(p_coupon,''), shipping_fee = v_ship, total = v_total, stock_deducted = true
  where id = v_order;

  insert into order_events (order_id, event_type, message)
  values (v_order, 'CREATED', 'Order placed, pending payment verification');

  -- clear cart
  delete from cart_items where cart_id in (select id from carts where user_id = p_user_id);
  return v_order;
end $$;

revoke all on function create_order from public, anon, authenticated;
grant execute on function create_order to service_role;

-- Restore stock when an order is canceled/refunded (called by admin status update)
create or replace function restore_stock(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and auth.uid() is not null then raise exception 'forbidden'; end if;
  if exists (select 1 from orders where id = p_order and stock_deducted) then
    update products p set stock_qty = p.stock_qty + oi.qty, units_sold = greatest(0, p.units_sold - oi.qty)
    from order_items oi where oi.order_id = p_order and oi.product_id = p.id;
    update orders set stock_deducted = false where id = p_order;
  end if;
end $$;

-- Analytics (admin only)
create or replace function admin_analytics(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'revenue', coalesce((select sum(total) from orders where status in ('PAID','CONFIRMED','SHIPPED','DELIVERED')),0),
    'orders', (select count(*) from orders),
    'pending', (select count(*) from orders where status = 'PENDING_PAYMENT_VERIFICATION'),
    'aov', coalesce((select avg(total) from orders where status in ('PAID','CONFIRMED','SHIPPED','DELIVERED')),0),
    'daily', coalesce((select jsonb_agg(d order by d.day) from (
        select date_trunc('day', created_at)::date as day, sum(total) as revenue, count(*) as orders
        from orders where created_at > now() - make_interval(days => p_days)
          and status not in ('CANCELED','REFUNDED') group by 1) d), '[]'),
    'weekly', coalesce((select jsonb_agg(d order by d.day) from (
        select date_trunc('week', created_at)::date as day, sum(total) as revenue, count(*) as orders
        from orders where status not in ('CANCELED','REFUNDED') group by 1) d), '[]'),
    'monthly', coalesce((select jsonb_agg(d order by d.day) from (
        select date_trunc('month', created_at)::date as day, sum(total) as revenue, count(*) as orders
        from orders where status not in ('CANCELED','REFUNDED') group by 1) d), '[]'),
    'best', coalesce((select jsonb_agg(b) from (
        select oi.product_title_snapshot as title, sum(oi.qty) as units, sum(oi.line_total) as revenue
        from order_items oi join orders o on o.id = oi.order_id
        where o.status not in ('CANCELED','REFUNDED') group by 1 order by 2 desc limit 10) b), '[]')
  ) into r;
  return r;
end $$;
grant execute on function admin_analytics to authenticated;

-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('product-images','product-images', true),
  ('payment-proofs','payment-proofs', false)
on conflict (id) do nothing;

create policy "admin manage product images" on storage.objects for all
  using (bucket_id = 'product-images' and is_admin()) with check (bucket_id = 'product-images' and is_admin());
create policy "public read product images" on storage.objects for select using (bucket_id = 'product-images');

-- payment proofs: path = <user_id>/<filename>. Owner uploads/reads own folder; admin reads all.
create policy "owner upload proof" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner or admin read proof" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- Admin may append audit events (customers cannot)
create policy "admin insert events" on order_events for insert with check (is_admin());
