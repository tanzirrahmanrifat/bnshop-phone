-- Flexible repair booking
-- 1. create_repair_request: a customer may describe an "other problem" instead of (or as well as)
--    picking priced repairs. With a description and no priced repairs, the request needs a quote.
-- 2. create_custom_repair_request: quote request for a phone that is not in the model list.

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
  v_note      text := left(btrim(coalesce(p_note, '')), 500);
  v_ids       uuid[] := coalesce(p_service_ids, '{}');
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
  if cardinality(v_ids) > 15 then raise exception 'INVALID:services'; end if;
  -- Either at least one repair, or a description of the problem.
  if cardinality(v_ids) = 0 and length(v_note) < 5 then raise exception 'INVALID:services'; end if;

  select * into v_model from public.repair_models m where m.id = p_model_id and m.active;
  if not found then raise exception 'INVALID:model'; end if;
  select * into v_brand from public.repair_brands b where b.id = v_model.brand_id;

  select coalesce(array_agg(s.name order by s.sort, s.name), '{}')
    into v_services
    from public.repair_services s
   where s.id = any (v_ids) and s.active
     and exists (select 1 from public.repair_prices rp where rp.model_id = v_model.id and rp.service_id = s.id);
  if cardinality(v_ids) > 0 and cardinality(v_services) = 0 then raise exception 'INVALID:services'; end if;

  select coalesce(sum(rp.price), 0) into v_estimate
    from public.repair_prices rp
   where rp.model_id = v_model.id and rp.grade = p_grade and rp.service_id = any (v_ids);

  select count(*) into v_missing
    from public.repair_services s
   where s.id = any (v_ids) and s.active
     and exists (select 1 from public.repair_prices rp where rp.model_id = v_model.id and rp.service_id = s.id)
     and not exists (select 1 from public.repair_prices rp where rp.model_id = v_model.id and rp.service_id = s.id and rp.grade = p_grade);

  if cardinality(v_ids) = 0 then
    v_services := array['Other problem'];
    v_missing := 1;
  end if;

  insert into public.repair_requests (user_id, name, phone, brand_name, model_id, model_name, services, grade,
                                      estimate, needs_quote, mode, district_code, note)
  values (p_user_id, v_name, '+673 ' || v_phone, coalesce(v_brand.name, ''), v_model.id, v_model.name, v_services,
          p_grade, v_estimate, v_missing > 0, p_mode, upper(p_district), v_note)
  returning id into v_id;

  return query
    select r.code, r.estimate, r.needs_quote, r.brand_name, r.model_name, r.services
      from public.repair_requests r where r.id = v_id;
end;
$$;

create or replace function public.create_custom_repair_request(
  p_user_id  uuid,
  p_brand    text,
  p_model    text,
  p_issue    text,
  p_name     text,
  p_phone    text,
  p_mode     text,
  p_district text
)
returns table (code text, brand_name text, model_name text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_phone text := public.phone_local(p_phone);
  v_name  text := btrim(coalesce(p_name, ''));
  v_brand text := left(btrim(coalesce(p_brand, '')), 60);
  v_model text := left(btrim(coalesce(p_model, '')), 80);
  v_issue text := left(btrim(coalesce(p_issue, '')), 500);
  v_id    uuid;
begin
  if v_name = '' or length(v_name) > 120 then raise exception 'INVALID:name'; end if;
  if v_phone !~ '^[2-8][0-9]{6}$' then raise exception 'INVALID:phone'; end if;
  if v_model = '' then raise exception 'INVALID:model'; end if;
  if length(v_issue) < 5 then raise exception 'INVALID:issue'; end if;
  if p_mode not in ('walkin', 'pickup') then raise exception 'INVALID:mode'; end if;
  if not exists (select 1 from public.districts d where d.code = upper(p_district) and d.active) then
    raise exception 'INVALID:district';
  end if;

  insert into public.repair_requests (user_id, name, phone, brand_name, model_id, model_name, services, grade,
                                      estimate, needs_quote, mode, district_code, note)
  values (p_user_id, v_name, '+673 ' || v_phone, v_brand, null, v_model, array['Quote request'], 'oem',
          0, true, p_mode, upper(p_district), v_issue)
  returning id into v_id;

  return query select r.code, r.brand_name, r.model_name from public.repair_requests r where r.id = v_id;
end;
$$;

revoke execute on function public.create_custom_repair_request(uuid, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_custom_repair_request(uuid, text, text, text, text, text, text, text) to service_role;
