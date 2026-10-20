# BN Shop — Next.js + Supabase

Phone accessories store and repair centre for Brunei.

- **Storefront:** home, shop, categories, "shop by your phone", product pages with options, cart, Cash on Delivery checkout with Brunei districts, order page, tracking.
- **Repair finder:** brand → model → repair parts with prices by part quality → booking (site or WhatsApp) → tracking by repair ID.
- **Accounts:** sign in with an SMS one-time code (+673) or Google; order and repair history.
- **Admin (`/admin`):** dashboard, orders, products (options, images, flash-sale schedule), categories, phone tags, banners, repair requests, repair brands/models/price grid, settings, delivery fees per district.

Stack: Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS 4, Supabase (Postgres, Auth, Storage), deployed on Vercel.

---

## 1. Create the Supabase project

1. Create a project at supabase.com (region close to Brunei, e.g. Singapore).
2. **Database:** open **SQL Editor**, paste `supabase/migrations/20261019000000_init.sql`, then click **Run**.
   - Alternative, with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.
3. **Starter data (optional):** run `supabase/seed.sql` the same way. It adds categories, phone tags, repair services, brands and a model list. It adds **no** prices; you set those in `/admin`.
4. **Storage:** the migration creates the public `media` bucket. Only admins can upload to it.

## 2. Auth settings (Supabase dashboard → Authentication)

**Phone (SMS one-time code)**
1. Go to **Sign In / Providers → Phone** and enable it.
2. Choose an SMS provider (Supabase supports Twilio, Twilio Verify, MessageBird, Vonage and Textlocal) and enter its credentials.
3. Check with the provider that it delivers to Brunei (+673) and what each SMS costs.
4. Sending real SMS is paid. Supabase also has built-in rate limits for OTP; review them under **Rate Limits**.

**Google**
1. In Google Cloud Console, create an OAuth client (type: Web).
2. Add the authorized redirect URI `https://<your-project>.supabase.co/auth/v1/callback`.
3. In Supabase, go to **Sign In / Providers → Google**, enable it, and paste the client ID and secret.

**URL configuration**
1. Set **Site URL** to your live address, e.g. `https://yourshop.com`.
2. Under **Redirect URLs**, add:
   - `https://yourshop.com/auth/callback`
   - `http://localhost:3000/auth/callback`

## 3. Run locally

Requirements: Node.js 20.9 or newer.

```bash
cp .env.example .env.local      # fill in the 4 values (Supabase → Project Settings → API)
npm install
npm run dev                     # http://localhost:3000
npm run build                   # production build check
npm run typecheck && npm run lint
```

| Variable | Where it's used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server. Use the anon or publishable key (safe to expose). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Used solely to call the order/repair/tracking database functions. Never prefix it with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | Login redirects, sitemap, SEO. No trailing slash. |

Pages read data during the build, so the Supabase variables must be set before `npm run build`.

## 4. Make yourself admin

1. Sign in once on the site (phone or Google).
2. In the Supabase SQL Editor, run:

```sql
-- by phone (Supabase stores it without "+")
update public.profiles set role = 'admin' where phone = '6737123456';
-- or by Google email
update public.profiles set role = 'admin' where email = 'you@gmail.com';
```

3. Open `/admin`.
4. Set these first:
   - **Settings & delivery:** shop name, WhatsApp number (+673…), fee per district, bank details.
   - **Repair brands, models & prices:** fill the price grid for the models you repair.
   - **Products:** add products.

## 5. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project → Import** the repository. The framework is detected automatically.
3. Add the 4 environment variables. For `NEXT_PUBLIC_SITE_URL`, use your production URL.
4. Click **Deploy**.
5. Add your domain under **Settings → Domains**.
6. Update the Supabase Site URL and redirect URL (step 2).

After deploy, submit `https://yourshop.com/sitemap.xml` in Google Search Console.

---

## How it fits together

- **Prices are never trusted from the browser.** Orders go through the `place_order()` database function, which:
  - re-reads prices (including active sales) and checks stock,
  - locks rows,
  - computes the delivery fee and free-delivery threshold,
  - writes the order atomically.
- Repair estimates are computed the same way by `create_repair_request()`.
- These functions can only be executed with the service-role key, so only this app's server actions can call them, and each call is rate-limited per IP.
- **Row-level security:**
  - Shoppers can read active catalog rows.
  - Signed-in customers can read their own orders and repairs.
  - Only admins can write catalog, settings, orders and repair data.
  - A customer cannot make themselves admin; a trigger blocks it.
- **Cancelling an order** in admin uses `admin_cancel_order()`, which returns stock exactly once.
- **Storefront pages are cached** (revalidated every 60–300 s). Admin changes call `revalidatePath`, so they appear immediately.
- **The cart lives in the browser** (localStorage). Cart and checkout show server-checked prices and stock.

## Tests

`supabase/tests/` contains 58 SQL checks: security rules, order totals and stock, sales, free delivery, variant rules, tracking, repair estimates, rate limiting, admin cancel. See its README for how to run them against any PostgreSQL 15+.

## Known limits and next steps

- **No online card payment.** Payment is COD or bank transfer. Adding a card gateway means a new payment method plus a webhook that marks orders paid.
- **No email or SMS notifications for new orders.** Admins see them in `/admin`. You can add a Supabase Database Webhook or Edge Function to send WhatsApp or email alerts.
- **Images upload as-is (max 5 MB).** Next.js resizes them on display.
