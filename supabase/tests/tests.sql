\set ON_ERROR_STOP 1
-- ---------- fixtures (as superuser) ----------
insert into auth.users (id, phone, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', '6737123456', '{"full_name":"Customer One"}'),
  ('22222222-2222-2222-2222-222222222222', '6738888888', '{}'),
  ('33333333-3333-3333-3333-333333333333', null, '{"name":"Admin Person"}');
update profiles set role = 'admin' where id = '33333333-3333-3333-3333-333333333333';

create or replace function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond then raise notice 'PASS  %', label; else raise exception 'FAIL  %', label; end if;
end $$;
create or replace function pg_temp.as_user(uid text, r text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), false);
  execute format('set role %I', r);
end $$;

select pg_temp.ok((select full_name from profiles where id='11111111-1111-1111-1111-111111111111') = 'Customer One', 'profile auto-created with name from metadata');
select pg_temp.ok((select phone from profiles where id='11111111-1111-1111-1111-111111111111') = '6737123456', 'profile phone copied');

-- ---------- admin writes catalog ----------
select pg_temp.as_user('33333333-3333-3333-3333-333333333333', 'authenticated');
update districts set fee = 3 where code = 'BM';
update districts set fee = 6 where code in ('TU','BE','TE');
insert into products (name, slug, price, sale_price, sale_ends_at, stock, category_id)
  values ('20W Charger', '20w-charger', 25, 19, now() + interval '2 days', 5, (select id from categories where slug='chargers'));
insert into products (name, slug, price, stock, option_name) values ('Clear Case', 'clear-case', 15, 0, 'Colour');
insert into product_variants (product_id, label, stock) select id, 'Black', 3 from products where slug='clear-case';
insert into product_variants (product_id, label, stock, price) select id, 'Gold', 1, 18 from products where slug='clear-case';
insert into products (name, slug, price, stock, active) values ('Hidden Item', 'hidden-item', 9, 10, false);
insert into products (name, slug, price, sale_price, sale_ends_at, stock) values ('Expired Sale', 'expired-sale', 10, 5, now() - interval '1 hour', 10);
select pg_temp.ok((select count(*) from products) = 4, 'admin sees all products incl. inactive');
reset role;

-- ---------- anon ----------
select pg_temp.as_user(null, 'anon');
select pg_temp.ok((select count(*) from product_list) = 3, 'anon: inactive product hidden from listing');
select pg_temp.ok((select effective_price from product_list where slug='20w-charger') = 19, 'anon: active sale price used');
select pg_temp.ok((select on_sale from product_list where slug='20w-charger'), 'anon: on_sale flag true');
select pg_temp.ok((select effective_price from product_list where slug='expired-sale') = 10, 'expired sale falls back to regular price');
select pg_temp.ok((select in_stock from product_list where slug='clear-case'), 'variant stock counts as in stock');
do $$ begin
  insert into categories (name, slug) values ('x','x');
  raise exception 'FAIL  anon insert should be blocked';
exception when insufficient_privilege then raise notice 'PASS  anon cannot insert categories (RLS)';
end $$;
do $$ begin
  perform place_order(null, '{}'::jsonb, '[]'::jsonb);
  raise exception 'FAIL  anon must not execute place_order';
exception when insufficient_privilege then raise notice 'PASS  anon cannot call place_order';
end $$;
do $$ begin
  perform hit_rate_limit('x', 1, 60);
  raise exception 'FAIL  anon must not execute hit_rate_limit';
exception when insufficient_privilege then raise notice 'PASS  anon cannot call hit_rate_limit';
end $$;
select pg_temp.ok((select count(*) from orders) = 0, 'anon sees no orders');
select pg_temp.ok((select count(*) from profiles) = 0, 'anon sees no profiles');
reset role;

-- ---------- customer ----------
select pg_temp.as_user('11111111-1111-1111-1111-111111111111', 'authenticated');
do $$ begin
  update profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';
  raise exception 'FAIL  role escalation not blocked';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'PASS  customer cannot make themselves admin (%)', sqlerrm;
end $$;
update profiles set full_name = 'Customer Renamed' where id = '11111111-1111-1111-1111-111111111111';
select pg_temp.ok((select full_name from profiles where id = '11111111-1111-1111-1111-111111111111') = 'Customer Renamed', 'customer can rename self');
select pg_temp.ok((select count(*) from profiles) = 1, 'customer sees only own profile');
update products set price = 1 where slug = '20w-charger';
reset role;
select pg_temp.ok((select price from products where slug='20w-charger') = 25, 'customer cannot change product price (RLS update filtered)');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111', 'authenticated');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('media', 'x.png');
  raise exception 'FAIL  customer upload should be blocked';
exception when insufficient_privilege then raise notice 'PASS  customer cannot upload to media bucket';
end $$;
reset role;
select pg_temp.as_user('33333333-3333-3333-3333-333333333333', 'authenticated');
insert into storage.objects (bucket_id, name) values ('media', 'products/a.png');
select pg_temp.ok(true, 'admin can upload to media bucket');
reset role;

-- ---------- place_order (service_role) ----------
set role service_role;
select pg_temp.ok(hit_rate_limit('ip:1', 2, 60) and hit_rate_limit('ip:1', 2, 60) and not hit_rate_limit('ip:1', 2, 60), 'rate limit: 3rd hit in window blocked');

create temp table r1 as
select * from place_order('11111111-1111-1111-1111-111111111111',
  '{"name":"Siti","phone":"+673 712-3456","district":"tu","area":"Kg. Bukit Beruang","address":"No 12, Simpang 34","payment":"cod"}',
  (select jsonb_build_array(
     jsonb_build_object('product_id', (select id from products where slug='20w-charger'), 'qty', 2),
     jsonb_build_object('product_id', (select id from products where slug='clear-case'), 'variant_id', (select id from product_variants where label='Gold'), 'qty', 1))));
select pg_temp.ok((select total from r1) = 62, 'order total = 2×19 (sale) + 18 (variant price) + 6 (Tutong fee) = 62');
select pg_temp.ok((select order_no from r1) = 100001, 'order numbers start at 100001');
select pg_temp.ok((select stock from products where slug='20w-charger') = 3, 'product stock decremented');
select pg_temp.ok((select stock from product_variants where label='Gold') = 0, 'variant stock decremented');
select pg_temp.ok((select sold_count from products where slug='20w-charger') = 2, 'sold_count incremented');
select pg_temp.ok((select phone from orders where order_no=100001) = '+673 7123456', 'phone normalised to +673 7123456');
select pg_temp.ok((select count(*) from order_items where order_id=(select id from orders where order_no=100001)) = 2, 'two order lines saved');
select pg_temp.ok((select variant_label from order_items where variant_label <> '') = 'Gold', 'variant label stored on line');

do $$ begin
  perform place_order(null, '{"name":"A","phone":"7123456","district":"BM","area":"x","address":"y"}',
    jsonb_build_array(jsonb_build_object('product_id', (select id from products where slug='clear-case'), 'variant_id', (select id from product_variants where label='Gold'), 'qty', 1)));
  raise exception 'FAIL  out of stock not detected';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
  if sqlerrm like 'OUT_OF_STOCK:%' then raise notice 'PASS  out-of-stock variant rejected (%)', sqlerrm; else raise; end if;
end $$;
do $$ begin
  perform place_order(null, '{"name":"A","phone":"7123456","district":"BM","area":"x","address":"y"}',
    jsonb_build_array(jsonb_build_object('product_id', (select id from products where slug='clear-case'), 'qty', 1)));
  raise exception 'FAIL';
exception when others then
  if sqlerrm = 'INVALID:variant_required' then raise notice 'PASS  variant required for products with variants'; else raise; end if;
end $$;
do $$ begin
  perform place_order(null, '{"name":"A","phone":"12345","district":"BM","area":"x","address":"y"}',
    jsonb_build_array(jsonb_build_object('product_id', (select id from products where slug='20w-charger'), 'qty', 1)));
  raise exception 'FAIL';
exception when others then
  if sqlerrm = 'INVALID:phone' then raise notice 'PASS  invalid phone rejected'; else raise; end if;
end $$;
do $$ begin
  perform place_order(null, '{"name":"A","phone":"7123456","district":"BM","area":"x","address":"y"}',
    jsonb_build_array(jsonb_build_object('product_id', (select id from products where slug='hidden-item'), 'qty', 1)));
  raise exception 'FAIL';
exception when others then
  if sqlerrm = 'UNAVAILABLE:product' then raise notice 'PASS  inactive product cannot be ordered'; else raise; end if;
end $$;
do $$ begin
  perform place_order(null, '{"name":"A","phone":"7123456","district":"XX","area":"x","address":"y"}',
    jsonb_build_array(jsonb_build_object('product_id', (select id from products where slug='20w-charger'), 'qty', 1)));
  raise exception 'FAIL';
exception when others then
  if sqlerrm = 'INVALID:district' then raise notice 'PASS  unknown district rejected'; else raise; end if;
end $$;
select pg_temp.ok((select stock from products where slug='20w-charger') = 3, 'failed orders roll back (stock unchanged)');

-- free delivery threshold
reset role; update site_settings set free_delivery_min = 30; set role service_role;
create temp table r2 as select * from place_order(null, '{"name":"Guest","phone":"8888888","district":"BM","area":"Gadong","address":"Unit 3","payment":"bank"}',
  jsonb_build_array(jsonb_build_object('product_id', (select id from products where slug='20w-charger'), 'qty', 2)));
select pg_temp.ok((select total from r2) = 38, 'free delivery applied above threshold (38, fee 0)');
reset role; update site_settings set free_delivery_min = 0;

-- tracking
set role service_role;
select pg_temp.ok((track_order(100001, '7123456') ->> 'status') = 'pending', 'track_order: matching phone returns status');
select pg_temp.ok(track_order(100001, '8888888') is null, 'track_order: wrong phone returns nothing');
select pg_temp.ok((get_order_by_token((select tracking_token from r1)) -> 'items' -> 0 ->> 'name') = '20W Charger', 'get_order_by_token returns items');
reset role;

-- order visibility
select pg_temp.as_user('11111111-1111-1111-1111-111111111111', 'authenticated');
select pg_temp.ok((select count(*) from orders) = 1, 'customer sees only own order');
select pg_temp.ok((select count(*) from order_items) = 2, 'customer sees own order items only');
update orders set status = 'delivered';
reset role;
select pg_temp.ok((select status from orders where order_no=100001) = 'pending', 'customer cannot change order status');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222', 'authenticated');
select pg_temp.ok((select count(*) from orders) = 0, 'other customer sees no orders');
reset role;
select pg_temp.as_user('33333333-3333-3333-3333-333333333333', 'authenticated');
update orders set status = 'confirmed' where order_no = 100001;
select pg_temp.ok((select count(*) from orders) = 2, 'admin sees all orders');
reset role;
select pg_temp.ok((select status from orders where order_no=100001) = 'confirmed', 'admin can update order status');

-- ---------- repairs ----------
select pg_temp.as_user('33333333-3333-3333-3333-333333333333', 'authenticated');
insert into repair_prices (model_id, service_id, grade, price)
select m.id, s.id, g.grade, g.price
from repair_models m, repair_services s,
     (values ('compatible', 120), ('oem', 180), ('original', 320)) g(grade, price)
where m.slug='iphone-15-pro' and s.slug='screen-replacement';
insert into repair_prices (model_id, service_id, grade, price)
select m.id, s.id, g.grade, g.price
from repair_models m, repair_services s, (values ('compatible', 45), ('oem', 65)) g(grade, price)
where m.slug='iphone-15-pro' and s.slug='battery-replacement';
reset role;

set role service_role;
create temp table rr as select * from create_repair_request(
  '11111111-1111-1111-1111-111111111111',
  (select id from repair_models where slug='iphone-15-pro'),
  array[(select id from repair_services where slug='screen-replacement'), (select id from repair_services where slug='battery-replacement')],
  'oem', 'Hafiz', '712 3456', 'pickup', 'be', 'Cracked top-left');
select pg_temp.ok((select estimate from rr) = 245 and not (select needs_quote from rr), 'repair estimate OEM = 180 + 65 = 245');
select pg_temp.ok((select code from rr) = 'R-10001', 'repair code starts at R-10001');
create temp table rr2 as select * from create_repair_request(null,
  (select id from repair_models where slug='iphone-15-pro'),
  array[(select id from repair_services where slug='screen-replacement'), (select id from repair_services where slug='battery-replacement')],
  'original', 'Hafiz', '7123456', 'walkin', 'BM', '');
select pg_temp.ok((select estimate from rr2) = 320 and (select needs_quote from rr2), 'original grade: 320 + battery needs quote');
do $$ begin
  perform create_repair_request(null, (select id from repair_models where slug='iphone-15-pro'),
    array[(select id from repair_services where slug='back-glass')], 'oem', 'A', '7123456', 'walkin', 'BM', '');
  raise exception 'FAIL';
exception when others then
  if sqlerrm = 'INVALID:services' then raise notice 'PASS  service without any price for model rejected'; else raise; end if;
end $$;
select pg_temp.ok((track_repair('r-10001', '+6737123456') ->> 'model_name') = 'iPhone 15 Pro', 'track_repair: code case-insensitive + phone match');
select pg_temp.ok(track_repair('R-10001', '8888888') is null, 'track_repair: wrong phone returns nothing');
reset role;
select pg_temp.as_user('11111111-1111-1111-1111-111111111111', 'authenticated');
select pg_temp.ok((select count(*) from repair_requests) = 1, 'customer sees own repair request only');
reset role;
select pg_temp.as_user(null, 'anon');
select pg_temp.ok((select count(*) from repair_prices) = 5, 'anon can read repair prices');
select pg_temp.ok((select count(*) from repair_requests) = 0, 'anon cannot read repair requests');
reset role;

-- ---------- admin cancel restores stock ----------
select pg_temp.as_user('11111111-1111-1111-1111-111111111111', 'authenticated');
do $$ begin
  perform admin_cancel_order((select id from orders where order_no = 100001));
  raise exception 'FAIL customer cancel allowed';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'PASS  customer cannot use admin_cancel_order (%)', sqlerrm;
end $$;
reset role;
select pg_temp.as_user('33333333-3333-3333-3333-333333333333', 'authenticated');
select admin_cancel_order((select id from orders where order_no = 100001));
select admin_cancel_order((select id from orders where order_no = 100001));
reset role;
select pg_temp.ok((select status from orders where order_no=100001) = 'cancelled', 'admin cancel sets status');
select pg_temp.ok((select stock from products where slug='20w-charger') = 3, 'cancel returns product stock once (1 + 2 = 3)');
select pg_temp.ok((select stock from product_variants where label='Gold') = 1, 'cancel returns variant stock');
select pg_temp.ok((select sold_count from products where slug='20w-charger') = 2, 'cancel reduces sold_count (4 - 2 = 2)');
