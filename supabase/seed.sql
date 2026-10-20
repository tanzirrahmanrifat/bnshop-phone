-- Starter data. Safe to run once on a new project (SQL Editor → paste → Run).
-- Prices, delivery fees and stock are NOT seeded: set them in /admin.

-- Product categories
insert into public.categories (name, slug, sort) values
  ('Cases & Covers', 'cases-covers', 1),
  ('Screen Protectors', 'screen-protectors', 2),
  ('Chargers', 'chargers', 3),
  ('Cables', 'cables', 4),
  ('Power Banks', 'power-banks', 5),
  ('Earbuds & Audio', 'earbuds-audio', 6),
  ('Smartwatch & Straps', 'smartwatch-straps', 7),
  ('Car & Mounts', 'car-mounts', 8)
on conflict (slug) do nothing;

-- "Shop by your phone" tags
insert into public.tags (name, slug, sort) values
  ('iPhone', 'iphone', 1), ('Samsung', 'samsung', 2), ('Xiaomi', 'xiaomi', 3), ('Redmi', 'redmi', 4),
  ('OPPO', 'oppo', 5), ('vivo', 'vivo', 6), ('Huawei', 'huawei', 7), ('realme', 'realme', 8), ('HONOR', 'honor', 9)
on conflict (slug) do nothing;

-- Repair services
insert into public.repair_services (name, slug, description, duration, sort) values
  ('Screen replacement', 'screen-replacement', 'Cracked glass, lines, dead touch, black display', '30–60 min', 1),
  ('Battery replacement', 'battery-replacement', 'Fast drain, swelling, random shutdowns', '30 min', 2),
  ('Charging port', 'charging-port', 'Loose cable, slow or no charging', '45 min', 3),
  ('Back glass', 'back-glass', 'Cracked or shattered rear panel', '1–2 hrs', 4),
  ('Rear camera', 'rear-camera', 'Blurry, shaking, black, cracked lens', '45 min', 5),
  ('Front camera', 'front-camera', 'Selfie camera not working or blurry', '45 min', 6),
  ('Speaker & microphone', 'speaker-microphone', 'No sound, low volume, callers cannot hear', '45 min', 7),
  ('Buttons & vibration', 'buttons-vibration', 'Power, volume, vibration motor', '1 hr', 8),
  ('Water damage check', 'water-damage', 'Cleaning, diagnosis and restoration', '1–3 days', 9),
  ('Motherboard repair', 'motherboard', 'Chip-level repair for complex faults', '2–5 days', 10),
  ('Software & data', 'software-data', 'Boot loops, updates, data transfer', '1 hr', 11)
on conflict (slug) do nothing;

-- Repair brands
insert into public.repair_brands (name, slug, sort) values
  ('iPhone', 'iphone', 1), ('Samsung', 'samsung', 2), ('Xiaomi / Redmi', 'xiaomi-redmi', 3),
  ('OPPO', 'oppo', 4), ('vivo', 'vivo', 5), ('Huawei', 'huawei', 6), ('realme', 'realme', 7), ('HONOR', 'honor', 8)
on conflict (slug) do nothing;

-- Repair models (edit the list to match what you actually repair)
with m(brand, name, slug, series, sort) as (values
  ('iphone', 'iPhone 17 Pro Max', 'iphone-17-pro-max', 'iPhone 17 series', 1),
  ('iphone', 'iPhone 17 Pro', 'iphone-17-pro', 'iPhone 17 series', 2),
  ('iphone', 'iPhone Air', 'iphone-air', 'iPhone 17 series', 3),
  ('iphone', 'iPhone 17', 'iphone-17', 'iPhone 17 series', 4),
  ('iphone', 'iPhone 16 Pro Max', 'iphone-16-pro-max', 'iPhone 16 series', 5),
  ('iphone', 'iPhone 16 Pro', 'iphone-16-pro', 'iPhone 16 series', 6),
  ('iphone', 'iPhone 16 Plus', 'iphone-16-plus', 'iPhone 16 series', 7),
  ('iphone', 'iPhone 16', 'iphone-16', 'iPhone 16 series', 8),
  ('iphone', 'iPhone 16e', 'iphone-16e', 'iPhone 16 series', 9),
  ('iphone', 'iPhone 15 Pro Max', 'iphone-15-pro-max', 'iPhone 15 series', 10),
  ('iphone', 'iPhone 15 Pro', 'iphone-15-pro', 'iPhone 15 series', 11),
  ('iphone', 'iPhone 15 Plus', 'iphone-15-plus', 'iPhone 15 series', 12),
  ('iphone', 'iPhone 15', 'iphone-15', 'iPhone 15 series', 13),
  ('iphone', 'iPhone 14 Pro Max', 'iphone-14-pro-max', 'iPhone 14 series', 14),
  ('iphone', 'iPhone 14 Pro', 'iphone-14-pro', 'iPhone 14 series', 15),
  ('iphone', 'iPhone 14', 'iphone-14', 'iPhone 14 series', 16),
  ('iphone', 'iPhone 13 Pro Max', 'iphone-13-pro-max', 'iPhone 13 series', 17),
  ('iphone', 'iPhone 13', 'iphone-13', 'iPhone 13 series', 18),
  ('iphone', 'iPhone 12', 'iphone-12', 'iPhone 12 series', 19),
  ('iphone', 'iPhone 11', 'iphone-11', 'iPhone 11 series', 20),
  ('samsung', 'Galaxy S25 Ultra', 'galaxy-s25-ultra', 'Galaxy S', 1),
  ('samsung', 'Galaxy S25', 'galaxy-s25', 'Galaxy S', 2),
  ('samsung', 'Galaxy S24 Ultra', 'galaxy-s24-ultra', 'Galaxy S', 3),
  ('samsung', 'Galaxy S24', 'galaxy-s24', 'Galaxy S', 4),
  ('samsung', 'Galaxy Z Fold7', 'galaxy-z-fold7', 'Galaxy Z', 5),
  ('samsung', 'Galaxy Z Flip7', 'galaxy-z-flip7', 'Galaxy Z', 6),
  ('samsung', 'Galaxy A56', 'galaxy-a56', 'Galaxy A', 7),
  ('samsung', 'Galaxy A36', 'galaxy-a36', 'Galaxy A', 8),
  ('samsung', 'Galaxy A16', 'galaxy-a16', 'Galaxy A', 9),
  ('xiaomi-redmi', 'Redmi Note 14 Pro', 'redmi-note-14-pro', 'Redmi Note', 1),
  ('xiaomi-redmi', 'Redmi Note 14', 'redmi-note-14', 'Redmi Note', 2),
  ('xiaomi-redmi', 'Xiaomi 15', 'xiaomi-15', 'Xiaomi', 3)
)
insert into public.repair_models (brand_id, name, slug, series, sort)
select b.id, m.name, m.slug, m.series, m.sort
from m join public.repair_brands b on b.slug = m.brand
on conflict (brand_id, slug) do nothing;
