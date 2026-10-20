-- =============================================================================
-- BN Shop — phone accessories + repair centre (Brunei)
-- Supabase / PostgreSQL schema, row-level security, server-only functions.
--
-- Security model
--   * Catalog tables: anyone can read active rows; only admins can write.
--   * Orders & repair requests are created ONLY through security-definer
--     functions that are executable by service_role (called from Next.js
--     server actions). Prices and totals are always computed here, never
--     trusted from the browser.
--   * Customers can read their own orders/repairs; admins can read/update all.
--   * Admin = profiles.role = 'admin' (set it once with SQL, see README).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Last 7 digits of a phone number (Brunei numbers are 7 digits).
create or replace function public.phone_local(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 7);
$$;

-- ---------------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  email       text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile row for every new auth user (phone OTP or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.phone,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger-only function: not callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Customers may edit their own profile but never their role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- Store settings (single row) & delivery districts
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id                 int primary key default 1 check (id = 1),
  shop_name          text not null default 'My Phone Shop',
  tagline            text not null default 'Phone accessories & repair · Brunei',
  whatsapp           text not null default '',
  phone              text not null default '',
  email              text not null default '',
  address            text not null default '',
  hours              text not null default '',
  maps_url           text not null default '',
  topbar             text not null default 'Cash on Delivery across Brunei-Muara, Tutong, Belait & Temburong',
  hero_badge         text not null default 'New arrivals',
  hero_title         text not null default 'New phone? Protect it on day one.',
  hero_text          text not null default 'Cases, screen protectors and fast chargers for iPhone, Samsung and Android. Order online, pay cash on delivery.',
  hero_image         text not null default '',
  delivery_note      text not null default '',
  warranty_note      text not null default '',
  bank_details       text not null default '',
  free_delivery_min  numeric(10, 2) not null default 0 check (free_delivery_min >= 0),
  updated_at         timestamptz not null default now()
);

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (id) values (1) on conflict do nothing;

create table public.districts (
  code    text primary key check (code ~ '^[A-Z]{2}$'),
  name    text not null,
  fee     numeric(10, 2) not null default 0 check (fee >= 0),
  eta     text not null default '',
  sort    int not null default 0,
  active  boolean not null default true
);

insert into public.districts (code, name, sort) values
  ('BM', 'Brunei-Muara', 1),
  ('TU', 'Tutong', 2),
  ('BE', 'Belait', 3),
  ('TE', 'Temburong', 4)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  image_url   text not null default '',
  sort        int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- "Shop by your phone" tags (iPhone, Samsung…)
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  image_url  text not null default '',
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(name) between 1 and 200),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description   text not null default '',
  category_id   uuid references public.categories (id) on delete set null,
  brand         text not null default '',
  price         numeric(10, 2) not null check (price >= 0),
  sale_price    numeric(10, 2) check (sale_price is null or sale_price >= 0),
  sale_ends_at  timestamptz,
  stock         int not null default 0 check (stock >= 0),
  sku           text not null default '',
  images        text[] not null default '{}',
  option_name   text not null default '',          -- e.g. "Colour" when the product has variants
  active        boolean not null default true,
  featured      boolean not null default false,
  sold_count    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint sale_below_price check (sale_price is null or sale_price < price)
);

create index products_category_idx on public.products (category_id);
create index products_active_created_idx on public.products (active, created_at desc);
create index products_sold_idx on public.products (sold_count desc);

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_tags (
  product_id uuid not null references public.products (id) on delete cascade,
  tag_id     uuid not null references public.tags (id) on delete cascade,
  primary key (product_id, tag_id)
);
create index product_tags_tag_idx on public.product_tags (tag_id);

-- Variants: one option per product (e.g. Colour: Black / White).
-- price NULL = use the product's current price (including any active sale).
create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  label       text not null check (length(label) between 1 and 80),
  price       numeric(10, 2) check (price is null or price >= 0),
  stock       int not null default 0 check (stock >= 0),
  sku         text not null default '',
  sort        int not null default 0,
  unique (product_id, label)
);
create index product_variants_product_idx on public.product_variants (product_id);

-- Current selling price of a product (sale applies until sale_ends_at).
create or replace function public.effective_price(p public.products)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case
    when p.sale_price is not null and (p.sale_ends_at is null or p.sale_ends_at > now())
      then p.sale_price
    else p.price
  end;
$$;

-- Listing view: effective price + sale flag, filterable/sortable through the API.
-- security_invoker keeps the products table's RLS in force.
create view public.product_list
with (security_invoker = true)
as
select
  p.id, p.name, p.slug, p.category_id, p.brand, p.price, p.sale_price, p.sale_ends_at,
  p.stock, p.images, p.option_name, p.active, p.featured, p.sold_count, p.created_at,
  public.effective_price(p) as effective_price,
  (public.effective_price(p) < p.price) as on_sale,
  (p.stock > 0 or exists (
     select 1 from public.product_variants v where v.product_id = p.id and v.stock > 0
  )) as in_stock
from public.products p;

create table public.banners (
  id         uuid primary key default gen_random_uuid(),
  placement  text not null check (placement in ('hero', 'side', 'promo')),
  title      text not null default '',
  subtitle   text not null default '',
  cta_label  text not null default '',
  link       text not null default '',
  image_url  text not null default '',
  theme      text not null default 'dark' check (theme in ('dark', 'orange', 'green', 'blue')),
  sort       int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        bigint generated always as identity (start with 100001) unique,
  tracking_token  uuid not null default gen_random_uuid() unique,
  user_id         uuid references auth.users (id) on delete set null,
  customer_name   text not null,
  phone           text not null,
  email           text not null default '',
  district_code   text not null references public.districts (code),
  area            text not null,
  address         text not null,
  landmark        text not null default '',
  note            text not null default '',
  payment_method  text not null check (payment_method in ('cod', 'bank')),
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  subtotal        numeric(10, 2) not null,
  delivery_fee    numeric(10, 2) not null,
  total           numeric(10, 2) not null,
  admin_note      text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id             bigint generated always as identity primary key,
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  variant_id     uuid references public.product_variants (id) on delete set null,
  name           text not null,
  variant_label  text not null default '',
  unit_price     numeric(10, 2) not null,
  qty            int not null check (qty > 0),
  line_total     numeric(10, 2) not null
);
create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Repairs
-- ---------------------------------------------------------------------------
create table public.repair_brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  image_url  text not null default '',
  sort       int not null default 0,
  active     boolean not null default true
);

create table public.repair_models (
  id        uuid primary key default gen_random_uuid(),
  brand_id  uuid not null references public.repair_brands (id) on delete cascade,
  name      text not null,
  slug      text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  series    text not null default '',
  sort      int not null default 0,
  active    boolean not null default true,
  unique (brand_id, slug)
);
create index repair_models_brand_idx on public.repair_models (brand_id, sort);

create table public.repair_services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  duration    text not null default '',
  sort        int not null default 0,
  active      boolean not null default true
);

create table public.repair_prices (
  model_id    uuid not null references public.repair_models (id) on delete cascade,
  service_id  uuid not null references public.repair_services (id) on delete cascade,
  grade       text not null check (grade in ('compatible', 'oem', 'original')),
  price       numeric(10, 2) not null check (price >= 0),
  primary key (model_id, service_id, grade)
);

create table public.repair_requests (
  id             uuid primary key default gen_random_uuid(),
  seq            bigint generated always as identity (start with 10001) unique,
  code           text generated always as ('R-' || seq::text) stored unique,
  user_id        uuid references auth.users (id) on delete set null,
  name           text not null,
  phone          text not null,
  brand_name     text not null default '',
  model_id       uuid references public.repair_models (id) on delete set null,
  model_name     text not null default '',
  services       text[] not null default '{}',
  grade          text not null default 'oem' check (grade in ('compatible', 'oem', 'original')),
  estimate       numeric(10, 2) not null default 0,
  needs_quote    boolean not null default false,
  mode           text not null check (mode in ('walkin', 'pickup')),
  district_code  text references public.districts (code),
  note           text not null default '',
  status         text not null default 'received'
                 check (status in ('received', 'diagnosis', 'approval', 'repairing', 'ready', 'completed', 'cancelled')),
  customer_note  text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index repair_requests_user_idx on public.repair_requests (user_id, created_at desc);
create index repair_requests_status_idx on public.repair_requests (status, created_at desc);

create trigger repair_requests_updated_at before update on public.repair_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Rate limiting (used by server actions; fixed window per key)
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  key           text primary key,
  window_start  timestamptz not null default now(),
  hits          int not null default 0
);

create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
                 when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
                 else r.hits + 1
               end,
        window_start = case
                 when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
                 else r.window_start
               end
  returning hits into v_hits;

  return v_hits <= p_max;
end;
$$;

-- ---------------------------------------------------------------------------
-- place_order: validates items, prices, stock; creates order atomically.
--   p_customer: { name, phone, email, district, area, address, landmark, note, payment }
--   p_items:    [ { product_id, variant_id|null, qty } ]
-- Errors are raised with a CODE: prefix so the app can show a friendly message.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(p_user_id uuid, p_customer jsonb, p_items jsonb)
returns table (order_no bigint, tracking_token uuid, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_name      text := btrim(coalesce(p_customer ->> 'name', ''));
  v_phone     text := public.phone_local(p_customer ->> 'phone');
  v_email     text := btrim(coalesce(p_customer ->> 'email', ''));
  v_district  text := upper(btrim(coalesce(p_customer ->> 'district', '')));
  v_area      text := btrim(coalesce(p_customer ->> 'area', ''));
  v_address   text := btrim(coalesce(p_customer ->> 'address', ''));
  v_landmark  text := btrim(coalesce(p_customer ->> 'landmark', ''));
  v_note      text := btrim(coalesce(p_customer ->> 'note', ''));
  v_payment   text := coalesce(p_customer ->> 'payment', 'cod');
  v_fee       numeric(10, 2);
  v_free_min  numeric(10, 2);
  v_subtotal  numeric(10, 2) := 0;
  v_order_id  uuid;
  v_item      jsonb;
  v_qty       int;
  v_product   public.products;
  v_variant   public.product_variants;
  v_unit      numeric(10, 2);
  v_lines     jsonb := '[]'::jsonb;
  v_line      jsonb;
begin
  if v_name = '' or length(v_name) > 120 then raise exception 'INVALID:name'; end if;
  if v_phone !~ '^[2-8][0-9]{6}$' then raise exception 'INVALID:phone'; end if;
  if v_area = '' or v_address = '' then raise exception 'INVALID:address'; end if;
  if v_payment not in ('cod', 'bank') then raise exception 'INVALID:payment'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'INVALID:cart_empty'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'INVALID:cart_too_large'; end if;

  select d.fee into v_fee from public.districts d where d.code = v_district and d.active;
  if not found then raise exception 'INVALID:district'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'qty')::int, 0);
    if v_qty < 1 or v_qty > 20 then raise exception 'INVALID:qty'; end if;

    select * into v_product from public.products p
      where p.id = (v_item ->> 'product_id')::uuid and p.active
      for update;
    if not found then raise exception 'UNAVAILABLE:product'; end if;

    if nullif(v_item ->> 'variant_id', '') is not null then
      select * into v_variant from public.product_variants v
        where v.id = (v_item ->> 'variant_id')::uuid and v.product_id = v_product.id
        for update;
      if not found then raise exception 'UNAVAILABLE:%', v_product.name; end if;
      if v_variant.stock < v_qty then raise exception 'OUT_OF_STOCK:% (%)', v_product.name, v_variant.label; end if;
      v_unit := coalesce(v_variant.price, public.effective_price(v_product));
      update public.product_variants set stock = stock - v_qty where id = v_variant.id;
      v_line := jsonb_build_object('product_id', v_product.id, 'variant_id', v_variant.id, 'name', v_product.name,
                                   'variant_label', v_variant.label, 'unit', v_unit, 'qty', v_qty);
    else
      if exists (select 1 from public.product_variants v where v.product_id = v_product.id) then
        raise exception 'INVALID:variant_required';
      end if;
      if v_product.stock < v_qty then raise exception 'OUT_OF_STOCK:%', v_product.name; end if;
      v_unit := public.effective_price(v_product);
      update public.products set stock = stock - v_qty where id = v_product.id;
      v_line := jsonb_build_object('product_id', v_product.id, 'variant_id', null, 'name', v_product.name,
                                   'variant_label', '', 'unit', v_unit, 'qty', v_qty);
    end if;

    update public.products set sold_count = sold_count + v_qty where id = v_product.id;
    v_subtotal := v_subtotal + v_unit * v_qty;
    v_lines := v_lines || v_line;
  end loop;

  select s.free_delivery_min into v_free_min from public.site_settings s where s.id = 1;
  if coalesce(v_free_min, 0) > 0 and v_subtotal >= v_free_min then
    v_fee := 0;
  end if;

  insert into public.orders (user_id, customer_name, phone, email, district_code, area, address, landmark, note,
                             payment_method, subtotal, delivery_fee, total)
  values (p_user_id, v_name, '+673 ' || v_phone, v_email, v_district, v_area, v_address, v_landmark, v_note,
          v_payment, v_subtotal, v_fee, v_subtotal + v_fee)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, variant_id, name, variant_label, unit_price, qty, line_total)
  select v_order_id,
         (l ->> 'product_id')::uuid,
         nullif(l ->> 'variant_id', '')::uuid,
         l ->> 'name',
         l ->> 'variant_label',
         (l ->> 'unit')::numeric,
         (l ->> 'qty')::int,
         (l ->> 'unit')::numeric * (l ->> 'qty')::int
  from jsonb_array_elements(v_lines) l;

  return query
    select o.order_no, o.tracking_token, o.total from public.orders o where o.id = v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_repair_request: estimate computed from repair_prices.
-- ---------------------------------------------------------------------------
create or replace function public.create_repair_request(
  p_user_id     uuid,
  p_model_id    uuid,
  p_service_ids uuid[],
  p_grade       text,
  p_name        text,
  p_phone       text,
  p_mode        text,
  p_district    text,
  p_note        text
)
returns table (code text, estimate numeric, needs_quote boolean, brand_name text, model_name text, services text[])
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_model     public.repair_models;
  v_brand     public.repair_brands;
  v_phone     text := public.phone_local(p_phone);
  v_name      text := btrim(coalesce(p_name, ''));
  v_services  text[];
  v_estimate  numeric(10, 2);
  v_missing   int;
  v_id        uuid;
begin
  if v_name = '' or length(v_name) > 120 then raise exception 'INVALID:name'; end if;
  if v_phone !~ '^[2-8][0-9]{6}$' then raise exception 'INVALID:phone'; end if;
  if p_grade not in ('compatible', 'oem', 'original') then raise exception 'INVALID:grade'; end if;
  if p_mode not in ('walkin', 'pickup') then raise exception 'INVALID:mode'; end if;
  if not exists (select 1 from public.districts d where d.code = upper(p_district) and d.active) then
    raise exception 'INVALID:district';
  end if;
  if p_service_ids is null or cardinality(p_service_ids) = 0 or cardinality(p_service_ids) > 15 then
    raise exception 'INVALID:services';
  end if;

  select * into v_model from public.repair_models m where m.id = p_model_id and m.active;
  if not found then raise exception 'INVALID:model'; end if;
  select * into v_brand from public.repair_brands b where b.id = v_model.brand_id;

  select array_agg(s.name order by s.sort, s.name)
    into v_services
    from public.repair_services s
   where s.id = any (p_service_ids) and s.active
     and exists (select 1 from public.repair_prices rp where rp.model_id = v_model.id and rp.service_id = s.id);
  if v_services is null then raise exception 'INVALID:services'; end if;

  select coalesce(sum(rp.price), 0) into v_estimate
    from public.repair_prices rp
   where rp.model_id = v_model.id and rp.grade = p_grade and rp.service_id = any (p_service_ids);

  select count(*) into v_missing
    from public.repair_services s
   where s.id = any (p_service_ids) and s.active
     and exists (select 1 from public.repair_prices rp where rp.model_id = v_model.id and rp.service_id = s.id)
     and not exists (select 1 from public.repair_prices rp where rp.model_id = v_model.id and rp.service_id = s.id and rp.grade = p_grade);

  insert into public.repair_requests (user_id, name, phone, brand_name, model_id, model_name, services, grade,
                                      estimate, needs_quote, mode, district_code, note)
  values (p_user_id, v_name, '+673 ' || v_phone, coalesce(v_brand.name, ''), v_model.id, v_model.name, v_services,
          p_grade, v_estimate, v_missing > 0, p_mode, upper(p_district), left(btrim(coalesce(p_note, '')), 500))
  returning id into v_id;

  return query
    select r.code, r.estimate, r.needs_quote, r.brand_name, r.model_name, r.services
      from public.repair_requests r where r.id = v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public tracking (order no / repair ID + phone must match).
-- ---------------------------------------------------------------------------
create or replace function public.track_order(p_order_no bigint, p_phone text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'order_no', o.order_no, 'status', o.status, 'created_at', o.created_at,
    'total', o.total, 'tracking_token', o.tracking_token
  )
  from public.orders o
  where o.order_no = p_order_no
    and public.phone_local(o.phone) = public.phone_local(p_phone)
    and length(public.phone_local(p_phone)) = 7;
$$;

create or replace function public.track_repair(p_code text, p_phone text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'code', r.code, 'status', r.status, 'model_name', r.model_name, 'services', r.services,
    'estimate', r.estimate, 'needs_quote', r.needs_quote, 'customer_note', r.customer_note,
    'created_at', r.created_at, 'updated_at', r.updated_at
  )
  from public.repair_requests r
  where r.code = upper(btrim(p_code))
    and public.phone_local(r.phone) = public.phone_local(p_phone)
    and length(public.phone_local(p_phone)) = 7;
$$;

-- Order confirmation page (by unguessable token).
create or replace function public.get_order_by_token(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'order_no', o.order_no, 'status', o.status, 'created_at', o.created_at,
    'customer_name', o.customer_name, 'phone', o.phone, 'district', d.name,
    'area', o.area, 'address', o.address, 'landmark', o.landmark,
    'payment_method', o.payment_method, 'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee, 'total', o.total,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.name, 'variant_label', i.variant_label, 'qty', i.qty,
        'unit_price', i.unit_price, 'line_total', i.line_total) order by i.id)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  join public.districts d on d.code = o.district_code
  where o.tracking_token = p_token;
$$;

-- Server-only functions: callable by service_role (Next.js server actions), not by browsers.
revoke execute on function public.place_order(uuid, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.create_repair_request(uuid, uuid, uuid[], text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.track_order(bigint, text) from public, anon, authenticated;
revoke execute on function public.track_repair(text, text) from public, anon, authenticated;
revoke execute on function public.get_order_by_token(uuid) from public, anon, authenticated;
revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.place_order(uuid, jsonb, jsonb) to service_role;
grant execute on function public.create_repair_request(uuid, uuid, uuid[], text, text, text, text, text, text) to service_role;
grant execute on function public.track_order(bigint, text) to service_role;
grant execute on function public.track_repair(text, text) to service_role;
grant execute on function public.get_order_by_token(uuid) to service_role;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.site_settings     enable row level security;
alter table public.districts         enable row level security;
alter table public.categories        enable row level security;
alter table public.tags              enable row level security;
alter table public.products          enable row level security;
alter table public.product_tags      enable row level security;
alter table public.product_variants  enable row level security;
alter table public.banners           enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.repair_brands     enable row level security;
alter table public.repair_models     enable row level security;
alter table public.repair_services   enable row level security;
alter table public.repair_prices     enable row level security;
alter table public.repair_requests   enable row level security;
alter table public.rate_limits       enable row level security;  -- no policies: service_role only

-- Profiles
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own or admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Public catalog: read
create policy "settings: public read"   on public.site_settings    for select using (true);
create policy "districts: public read"  on public.districts        for select using (active or public.is_admin());
create policy "categories: public read" on public.categories       for select using (active or public.is_admin());
create policy "tags: public read"       on public.tags             for select using (true);
create policy "products: public read"   on public.products         for select using (active or public.is_admin());
create policy "product_tags: public read" on public.product_tags   for select using (true);
create policy "variants: public read"   on public.product_variants for select using (true);
create policy "banners: public read"    on public.banners          for select using (active or public.is_admin());
create policy "repair_brands: public read"   on public.repair_brands   for select using (active or public.is_admin());
create policy "repair_models: public read"   on public.repair_models   for select using (active or public.is_admin());
create policy "repair_services: public read" on public.repair_services for select using (active or public.is_admin());
create policy "repair_prices: public read"   on public.repair_prices   for select using (true);

-- Admin: full write on catalog & settings
create policy "settings: admin write"   on public.site_settings    for all using (public.is_admin()) with check (public.is_admin());
create policy "districts: admin write"  on public.districts        for all using (public.is_admin()) with check (public.is_admin());
create policy "categories: admin write" on public.categories       for all using (public.is_admin()) with check (public.is_admin());
create policy "tags: admin write"       on public.tags             for all using (public.is_admin()) with check (public.is_admin());
create policy "products: admin write"   on public.products         for all using (public.is_admin()) with check (public.is_admin());
create policy "product_tags: admin write" on public.product_tags   for all using (public.is_admin()) with check (public.is_admin());
create policy "variants: admin write"   on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "banners: admin write"    on public.banners          for all using (public.is_admin()) with check (public.is_admin());
create policy "repair_brands: admin write"   on public.repair_brands   for all using (public.is_admin()) with check (public.is_admin());
create policy "repair_models: admin write"   on public.repair_models   for all using (public.is_admin()) with check (public.is_admin());
create policy "repair_services: admin write" on public.repair_services for all using (public.is_admin()) with check (public.is_admin());
create policy "repair_prices: admin write"   on public.repair_prices   for all using (public.is_admin()) with check (public.is_admin());

-- Orders: customers read their own; admins read/update. Creation only via place_order().
create policy "orders: read own or admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders: admin update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
create policy "order_items: read own or admin" on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- Repair requests: same pattern.
create policy "repairs: read own or admin" on public.repair_requests
  for select using (user_id = auth.uid() or public.is_admin());
create policy "repairs: admin update" on public.repair_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: public "media" bucket for product/banner/brand images (admin upload)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media: admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "media: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "media: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin: cancel an order and return its items to stock (atomic, once).
-- ---------------------------------------------------------------------------
create or replace function public.admin_cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  select o.status into v_status from public.orders o where o.id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_status = 'cancelled' then return; end if;

  update public.product_variants v
     set stock = v.stock + i.qty
    from public.order_items i
   where i.order_id = p_order_id and i.variant_id = v.id;

  update public.products p
     set stock = p.stock + i.qty
    from public.order_items i
   where i.order_id = p_order_id and i.variant_id is null and i.product_id = p.id;

  update public.products p
     set sold_count = greatest(0, p.sold_count - s.qty)
    from (select product_id, sum(qty)::int as qty from public.order_items
           where order_id = p_order_id and product_id is not null group by product_id) s
   where p.id = s.product_id;

  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

revoke execute on function public.admin_cancel_order(uuid) from public, anon;
grant execute on function public.admin_cancel_order(uuid) to authenticated;
