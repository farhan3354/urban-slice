# Urban Slice Pizza — Kabirwala

A polished, responsive, production-minded **restaurant website + admin dashboard** for **Urban Slice Pizza** in Kabirwala, Punjab, Pakistan.

> ⚠️ **Demo notice:** The Google Maps listing could not be programmatically verified. All restaurant-specific facts — phone number, exact address, opening hours, prices, reviews, and social links — are clearly marked as **demo content** and are editable from the admin dashboard (`/admin → Settings`). A placeholder WhatsApp number `923000000000` is used until the owner confirms the real one. Do not represent demo content as official.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma (SQLite)**.

---

## Quick start

```bash
# 1. Install deps (already installed in this workspace)
bun install

# 2. Configure environment
cp .env.example .env
#   then edit .env (set ADMIN_BOOTSTRAP_EMAIL/PASSWORD)

# 3. Push DB schema + seed demo data
bun run db:push
bun run scripts/seed.ts

# 4. (Optional) Generate pizza/product images via the z-ai-web-dev-sdk
bun run scripts/gen-images.ts

# 5. Run dev server
bun run dev
```

Open the **Preview Panel** on the right (or click *Open in New Tab*). The only public route is `/`.

### Admin
- URL: `/admin`
- Login (demo): `admin@urbanslice.pk` / `admin123`
- Override via env: `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `ADMIN_BOOTSTRAP_NAME` (read on first login attempt if no admin exists yet).

---

## Resetting demo data

```bash
# Wipe and re-seed everything
rm -f db/custom.db
bun run db:push
bun run scripts/seed.ts
```

To regenerate images (idempotent — skips files that already exist):
```bash
bun run scripts/gen-images.ts
```

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Prisma ORM (SQLite for demo; switchable) |
| Auth | Custom cookie session + bcryptjs (httpOnly, rate-limited) |
| Cart | Zustand + localStorage (persist) |
| Charts | Recharts |
| Images | next/image + z-ai-web-dev-sdk (AI generation) |
| Icons | lucide-react |
| Validation | Zod (server) + native + custom (client) |

> **Note on MongoDB/Mongoose:** the existing workspace is configured for Prisma + SQLite. We kept Prisma (the stack the scaffold ships with) so the demo runs without extra services. The schema is provider-agnostic — switching to Postgres/Mongo is a `schema.prisma` change away.

---

## Project structure

```
prisma/schema.prisma            # AdminUser, Session, Category, Product, ProductOption(Group),
                                # Deal, Order, RestaurantSetting (key/value), AuditEvent
src/lib/
  db.ts                         # Prisma client singleton
  auth.ts                       # bcrypt sessions, rate limit, audit, bootstrap
  settings.ts                   # DEFAULT_SETTINGS + get/save + todayOpenLabel
  whatsapp.ts                   # order message builder + click-to-chat URL
  products.ts                   # serializeProduct() + effectivePrice
  cart-validate.ts              # server-trusted price recompute
  format.ts                     # formatPKR, dates, orderRef, slugify
  admin-guard.ts                 # requireAdmin() for API routes
src/app/
  layout.tsx                    # Poppins + Inter + ThemeProvider + Toaster
  globals.css                   # Urban Slice palette + utilities
  (site)/                       # PUBLIC website (route group)
    layout.tsx                  # AnnouncementBar + Header + Footer + WhatsApp float
    page.tsx                    # Homepage
    menu/                       # /menu, /menu/[slug]
    cart/, checkout/, order/,  # cart + WhatsApp checkout flow
    about/, contact/, deals/,
    delivery-info/, refund-policy/, privacy/, terms/
  admin/
    login/                      # public
    (dashboard)/                # protected, sidebar shell
      page.tsx                  # dashboard
      orders/, menu/, categories/, deals/, settings/, audit/
  api/
    settings, categories, products, deals, orders, whatsapp/url, cart/validate  # public
    admin/auth/{login,logout,me}, admin/{dashboard,products,categories,deals,orders,settings,audit,upload}
  robots.ts, sitemap.ts, manifest.ts
src/middleware.ts               # protects /admin/* (cookie presence)
src/components/site/            # public building blocks
src/components/admin/           # admin building blocks
scripts/seed.ts                 # demo data
scripts/gen-images.ts           # AI image generation (idempotent)
```

---

## Database design (summary)

- **AdminUser / Session** — hashed passwords, httpOnly session tokens, expiry, IP/UA tracking.
- **Category** — slug, order, active, imageUrl.
- **Product** — slug, basePrice, promoPrice (effective), featured/popular, available, prepTimeMin, tags.
- **ProductOptionGroup** — key (size/crust/toppings/dips/flavor), type (single/multiple), required, min/max.
- **ProductOption** — name, priceModifier, defaultSel, order.
- **Deal** — title, price, oldPrice, badge, couponCode, itemsJson (snapshot), date range, active.
- **Order** — orderRef (unique), customer snapshot, **itemsJson snapshot** (order stays accurate after menu changes), subtotal/deliveryFee/discount/total, status, internalNotes, timestamps.
- **RestaurantSetting** — single key/value row (`id="main"`) holding a JSON blob of all editable settings.
- **AuditEvent** — adminId, action, target, metadata, createdAt.

**Trusted pricing:** the client never submits totals. `/api/orders` and `/api/cart/validate` recompute the subtotal from DB product records; delivery fee is looked up from the configured `deliveryAreas`; coupons are validated against active `Deal` rows.

---

## Status workflow

```
pending_whatsapp → confirmed → preparing → ready → out_for_delivery → completed
        ↓               ↓           ↓            ↓          ↓
     cancelled      cancelled   cancelled    cancelled  cancelled
                                                                    ↑
                          cancelled → pending_whatsapp (reopen)
```

Status transitions are enforced server-side in `PATCH /api/admin/orders/[id]`. `completed` is terminal.

---

## WhatsApp ordering flow

1. Customer adds items to cart (client-side, persisted in localStorage).
2. On `/checkout`, the form is validated client-side, then `POST /api/orders` creates the order with status `pending_whatsapp` and recomputes the total **server-side**.
3. The response returns a `whatsappUrl` (encoded message + the configured restaurant number).
4. The frontend opens WhatsApp (`window.open`) and redirects to `/order/success?ref=...`.
5. The restaurant confirms via WhatsApp and an admin moves the order to `confirmed`.
6. **We never mark an order paid or confirmed merely because WhatsApp opened.**

---

## SEO & local discovery

- Per-page `metadata` (title, description, Open Graph, Twitter).
- `LocalBusiness`/`Restaurant` JSON-LD on the homepage (verified fields only — no invented ratings).
- `Product` JSON-LD on each `/menu/[slug]`.
- Dynamic `sitemap.xml` (static + product + category routes) and `robots.txt` (disallows `/admin`, `/api`, cart/checkout).
- Web app manifest (`/manifest.webmanifest`).
- Canonical URLs via `metadataBase`.
- Semantic headings, descriptive alt text, mobile-first responsive.

---

## Admin security

- Passwords hashed with **bcryptjs** (10 rounds).
- Sessions stored in DB (not just signed cookies) — revocable, expiry-tracked.
- `httpOnly`, `sameSite=lax` cookies; `secure` auto-enabled in production.
- In-memory **rate limiting** on `/api/admin/auth/login` (8 attempts / 10 min per IP).
- All admin APIs enforce `requireAdmin()` server-side.
- Next.js middleware blocks `/admin/*` without a session cookie (real auth still happens in API/page).
- **No default admin credentials are shipped to production** — bootstrap is env-driven (`ADMIN_BOOTSTRAP_*`).
- Destructive admin actions are recorded in `AuditEvent`.

---

## Demo vs. live features

### ✅ Works in demo mode
- Full public site, menu, product customization, cart, checkout.
- WhatsApp ordering with server-built message + click-to-chat.
- Admin dashboard with stats, orders, full menu/categories/deals/settings CRUD.
- Image upload (saved to `/public/upload`).
- Order tracking page with auto-refresh.
- Audit log.

### 🔑 Requires owner confirmation / live credentials
- **WhatsApp number** — placeholder `923000000000`; set real number in *Settings → Contact*.
- **Phone, email, exact address, map link** — placeholders pending verification.
- **Menu items, prices, sizes, toppings** — demo data; replace via *Menu* management.
- **Opening hours** — demo; confirm in *Settings → Hours*.
- **Reviews / testimonials** — shown only as clearly-labeled demo; remove or replace with verified ones.
- **Online card payments** — NOT enabled. Do not advertise card payment until a real provider is integrated and policies updated.
- **Custom domain / HTTPS** — set `NEXT_PUBLIC_SITE_URL` and host on your domain.

---

## Owner checklist (info still required)

> Please confirm the following so demo content can be replaced with real data:

- [ ] Official WhatsApp business number (international format, e.g. `923XXXXXXXXX`).
- [ ] Official phone number(s) for click-to-call.
- [ ] Official contact email.
- [ ] Verified street address + Google Maps place link.
- [ ] Confirmed opening hours for each day.
- [ ] Official menu (names, descriptions, prices, sizes, crusts, toppings, add-ons).
- [ ] Verified product photos (or approval to use the AI-generated demo images).
- [ ] Delivery areas + per-area delivery fees + ETA.
- [ ] Minimum order value, free-delivery threshold, preparation time estimate.
- [ ] Active deals / coupons (titles, included items, prices, validity).
- [ ] Social media links (Facebook, Instagram, TikTok, YouTube).
- [ ] Restaurant story / About copy.
- [ ] Approved "Why Choose Us" claims (we only show generic ones until approved).
- [ ] Verified customer reviews (if any) — we will not publish unverified reviews.
- [ ] Decision on whether to enable online payments (requires a payment provider).
- [ ] Refund/cancellation policy aligned with the restaurant's actual practices.
- [ ] Official logo (currently using a generated placeholder).
- [ ] Announcement bar copy (current offers).

---

## License & credits

Demo project. Food/restaurant imagery generated with the z-ai-web-dev-sdk image API. Fonts: Poppins & Inter (Google Fonts). UI components: shadcn/ui.
