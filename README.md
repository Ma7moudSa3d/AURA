# AURA — Luxury Perfume Store (Next.js + Supabase, free-tier only)

Bilingual (EN/AR, RTL), dark-gold storefront with manual InstaPay/Wallet payments (**01016267377**), owner-only admin
(**ofoftot@gmail.com**) protected by password + email OTP + TOTP, and an order email to the owner on every order.

## Architecture
```
Browser ── Next.js 14 (App Router, Server Components + Server Actions) ── Supabase (Postgres/Auth/Storage)
                         │                                                   ▲ RLS on every table
                         ├── Resend (free) → owner + customer emails (Nodemailer SMTP fallback)
                         └── GitHub Actions cron → POST /api/cron/abandoned-carts (Bearer CRON_TOKEN)
```
**Key decisions**
- **State: Zustand** (client cart + drawer only). Server data comes from Server Components, so React Query isn't needed.
- **Order totals** are computed inside the Postgres function `create_order()` from DB prices (incl. scheduled discounts, coupons, shipping). The function is executable only by `service_role`; clients cannot insert orders directly (no INSERT policy on `orders`).
- **Stock** is reserved (decremented) atomically at order creation with row locks, preventing oversell. It is restored on CANCELED/REFUNDED. The **low-stock email** fires when an order moves to PAID or CONFIRMED and stock ≤ threshold.
- **Admin defence in depth**: (1) middleware, (2) server layout `checkAdmin()`, (3) every admin action `requireAdmin()`, (4) RLS `is_admin()` requires `role='admin'` + email `ofoftot@gmail.com` + JWT `aal2` (TOTP verified). Email-OTP is enforced with a signed httpOnly cookie.
- Products have `title_en/title_ar` and `description_en/description_ar` (instead of a single `title`) for true bilingual content.
- Rate limiting is in-memory per serverless instance (fine for free tier; swap to Upstash Redis free for strict global limits).
- CSP uses `'unsafe-inline'` for scripts because Next.js inline bootstrap scripts need it (nonce-based CSP requires dynamic rendering of every page).

## Setup
### 1. Supabase
1. Create a free project at supabase.com.
2. SQL Editor → run `supabase/migrations/0001_schema.sql`, then `0002_rls_functions.sql` (creates tables, RLS, functions, storage buckets `product-images` (public) and `payment-proofs` (private) + policies).
3. Authentication → Providers → Email: enable, **Confirm email = ON**. URL Configuration: Site URL = your site URL; add `<site>/auth/callback` to Redirect URLs.
4. Authentication → Email Templates → **Magic Link**: include the code so the admin email-OTP works, e.g. add `<p>Your code: <b>{{ .Token }}</b></p>`.
5. Authentication → Multi-Factor: ensure **TOTP** is enabled (default).
6. Project Settings → API: copy URL, anon key, service_role key.

### 2. Resend (free)
Create an account **with ofoftot@gmail.com**, create an API key. Without a verified domain Resend only delivers to your own account email — enough for owner alerts. To email customers, verify a domain and set `EMAIL_FROM="AURA <orders@yourdomain.com>"`. Alternatively fill `SMTP_*` (e.g. Gmail app password / Brevo free) as fallback.

### 3. Local run
```bash
cp .env.example .env.local   # fill values; generate secrets with: openssl rand -hex 32
npm install
npm run dev
node --env-file=.env.local scripts/seed.mjs   # sample AR/EN products + WELCOME10 coupon
```

### 4. Create the owner admin account
1. Open `/signup` and register **ofoftot@gmail.com**; confirm the email.
2. In the Supabase SQL editor run:
   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = 'ofoftot@gmail.com');
   ```
3. Go to `/admin/login` (not linked anywhere): password → 6-digit code from email → scan the QR with an authenticator app on first use (TOTP enrollment) → dashboard. Anyone else gets a 404.
4. Upload product images from Admin → Products. Set WhatsApp number/shipping in Admin → Settings.

### 5. Deploy (Vercel free)
Import the repo, add all `.env.example` variables (set `NEXT_PUBLIC_SITE_URL` to the Vercel URL), deploy. Then update Supabase Site URL/Redirect URLs.

### 6. Abandoned-cart reminders
- Manual: Admin dashboard → "Send reminders now".
- Scheduled (free): in GitHub repo secrets add `SITE_URL` and `CRON_TOKEN` (same as env). `.github/workflows/cron.yml` runs daily.

## Order flow
Cart (guest OK) → Checkout (redirects to `/login?next=/checkout` if signed out) → shipping → payment instructions → transaction ref or screenshot → `createOrder` (zod-validated, rate-limited, totals from DB) → emails to owner + customer → success page → tracking at `/track`.

## Security checklist
Zod on all mutations · RLS everywhere · private proof bucket (owner-folder policy + admin signed URLs) · security headers · login/order/admin-OTP rate limits · CSV formula-injection guard · open-redirect guard on `next` · role-escalation trigger on `profiles`.

## Known limits / next steps
- No automated tests are included; test the full order and admin MFA flow against your Supabase project before launch.
- Payment is manual: verify every transfer before marking PAID.
