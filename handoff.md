# Inventory Management Web App — Handoff Brief

## Project summary

Build a barcode/QR-scanning inventory management web app for a small business. Staff use their phone browser to scan items in (when receiving shipments) and out (when selling), with stock tracked per location.

## Scale and constraints

- **Products:** under 100 SKUs
- **Users:** 2–5 people
- **Cost target:** $0/month — must run on free tiers
- **Devices:** phones (camera scanning) + occasional desktop use
- **Offline:** not required for v1

## Recommended stack

- **Frontend:** Next.js (App Router) deployed on **Vercel** (free tier)
- **Backend + database + auth:** **Supabase** free tier (Postgres, auth, RLS, JS client)
- **Barcode scanning:** `html5-qrcode` or `@zxing/browser` — runs in the phone browser using `getUserMedia`. Requires HTTPS (Vercel provides this).
- **Styling:** Tailwind CSS (or whatever the agent prefers — not load-bearing)

If the agent has a strong reason to swap any of this, fine, but the constraint is: free tier hosting, hosted Postgres with auth, browser-based scanner.

## Data model

Four tables. Quantities live **only** in `stock`, never on `products`.

### `products`

- `id` (uuid, pk)
- `barcode` (text, unique, indexed) — the SKU identifier; same barcode for every physical unit of the same product
- `name` (text)
- `unit` (text, e.g. "each", "box", "kg")
- `low_stock_threshold` (int, nullable)
- `notes` (text, nullable)
- `archived` (bool, default false) — soft delete; never hard-delete because `movements` references this
- `created_at`, `updated_at` (timestamptz)

### `locations`

- `id` (uuid, pk)
- `name` (text, unique)
- `description` (text, nullable)
- `archived` (bool, default false)
- `created_at`

### `stock`

- `product_id` (uuid, fk → products)
- `location_id` (uuid, fk → locations)
- `quantity` (int, check `>= 0`)
- `updated_at` (timestamptz)
- **Composite primary key** on `(product_id, location_id)` — one row per product-location combination
- Rows are created lazily on first stock-in at a given location

### `movements`

- `id` (uuid, pk)
- `product_id` (uuid, fk → products)
- `location_id` (uuid, fk → locations)
- `change` (int, non-zero) — negative for out, positive for in
- `user_id` (uuid, fk → auth.users)
- `reason` (text, nullable) — suggested values: `received`, `sale`, `transfer_in`, `transfer_out`, `damaged`, `return`, `adjustment`
- `transfer_group_id` (uuid, nullable) — links the two halves of a transfer
- `note` (text, nullable)
- `created_at` (timestamptz)

### Constraints and invariants

- `stock.quantity >= 0` (check constraint) — prevents negative stock from a fat-finger scan
- Every `movements` insert must be paired with a corresponding `stock` upsert. **Wrap in a Postgres function (RPC)** so it's atomic — don't do it client-side.
- Transfers between locations write **two** `movements` rows (one negative, one positive) sharing the same `transfer_group_id`, inside a single transaction.

### Suggested RPC functions

- `apply_movement(p_product_id, p_location_id, p_change, p_reason, p_note)` — inserts movement, upserts stock, all in one transaction
- `transfer_stock(p_product_id, p_from_location, p_to_location, p_quantity, p_note)` — writes paired movements with shared `transfer_group_id`
- `stocktake_adjust(p_product_id, p_location_id, p_actual_quantity, p_note)` — writes an adjustment movement equal to `actual - current` and sets stock to `actual`

## Auth and permissions

- Email/password auth via Supabase Auth
- All app users are authenticated; no public access
- **Row-level security on every table from day 1.** Suggested baseline:
  - Authenticated users can `SELECT` everything
  - Authenticated users can `INSERT`/`UPDATE` `stock` and `movements` via the RPC functions only
  - `products` and `locations` writes restricted to a future `admin` role (for v1, all authenticated users can write — note this for hardening later)

## Pages and routes

### `/` — Dashboard / stock view

- Joins `products × stock × locations`
- Shows: product name, location, quantity, low-stock indicator
- Filter by location, search by name/barcode
- Highlights rows where `quantity <= low_stock_threshold`

### `/scan` — Primary scanner (most-used page)

- **Location selector at top**, defaults to last-used (persist in `localStorage` per user)
- **Mode toggle:** Stock In / Take Out / Transfer
- Camera viewport using `html5-qrcode` or `@zxing/browser`
- On successful scan:
  - Look up product by barcode
  - **If found:** display name + current quantity at selected location, with quantity input (default 1) and submit button
  - **If not found:** prompt "Unknown barcode — add new product?" with inline form pre-filled with the scanned barcode
- After submit: clear form, keep camera active, ready for next scan (do **not** navigate away)
- Transfer mode: shows "from location" and "to location" selectors, calls `transfer_stock` RPC

### `/products` — Product catalog

- List, create, edit, archive products
- No quantity shown here — this is just the catalog

### `/locations` — Location management

- Simple CRUD for locations

### `/history` — Movement log

- Filterable by product, location, user, date range, reason
- Read-only view of `movements` joined with product + location + user names

### `/stocktake` — Reconciliation flow

- Pick a location, walk through products, enter actual count, submit
- Calls `stocktake_adjust` RPC for any deltas

## Key UX requirements

These are the ones that make or break daily usability:

1. **Scan flow must stay on the camera.** Open `/scan` once, scan many items in succession. Submit clears the form but keeps the camera live.
2. **Quantity defaults to 1** but is easy to change for receiving shipments (typing "50" should be one tap into the field).
3. **Last-used location is remembered per user** across sessions.
4. **Camera requires HTTPS** — Vercel handles this automatically; flag it if testing locally.
5. **Optimistic UI on submit** with rollback on error — staff shouldn't wait on a network round-trip between scans.

## Build order

Each step should be deployable and testable before moving on.

1. **Setup:** Provision Supabase project, create all four tables with constraints, write the three RPC functions, set RLS policies, deploy a Next.js skeleton to Vercel with Supabase Auth wired in. Seed 2–3 locations manually.
2. **Products + Locations CRUD:** Plain forms, no scanner. Verify writes hit the database. Add a few test products with real barcodes.
3. **Stock view (`/`):** Join query, location filter, low-stock highlighting.
4. **Scanner (`/scan`):** Stock in + take out modes only. Test on actual phones (iOS Safari and Android Chrome).
5. **Transfer mode + history page.**
6. **Stocktake flow.**
7. **Polish:** loading states, error toasts, mobile layout pass, low-stock email or in-app notification (optional).

## Business rules / domain notes

- **One barcode per product (SKU), not per physical unit.** All 50 widgets share the same barcode. Scanning 50 of the same item = scan once, enter quantity 50.
- **No serialised inventory** in v1. If a future requirement to track individual units appears (warranty, etc.), that's a schema change — flag it as out of scope.
- **The app only knows what users tell it.** Every physical event needs a corresponding scan, or numbers drift. The stocktake flow is the reconciliation safety net.
- **Multi-pack barcodes:** if a case of 12 has a different barcode than the individual unit, treat them as the same product but multiply on scan. For v1, assume single-unit barcodes only and document this as a limitation.

## Out of scope for v1

Listed so the agent doesn't accidentally build them:

- Purchase orders / supplier management
- Customer-facing sales / POS / payment
- Reporting and analytics beyond the history page
- Offline mode / PWA with sync queue
- Serialised (per-unit) inventory tracking
- Multi-tenancy (this is a single-business app)
- Role-based admin permissions (everyone authenticated can do everything in v1)
- Native mobile apps

## Open questions for the user before/during build

- Do products have manufacturer barcodes already, or will the user print their own QR codes? (Affects whether "add new product on unknown scan" is rare or common.)
- Should low-stock trigger an email notification, or is a dashboard indicator enough?
- Any product categories or tags needed in v1, or is flat list fine for under 100 products?
- Should `/history` be visible to all users or admin-only?

## Definition of done for v1

- All four tables created with constraints and RLS
- A user can: log in, add a product, scan its barcode at a location, stock in 50, take out 1, transfer 10 to another location, view it all in `/history`, and run a stocktake
- Works on a real iPhone in Safari and a real Android phone in Chrome
- Deployed to Vercel with a custom domain (or vercel.app subdomain)
- Total monthly cost: $0
