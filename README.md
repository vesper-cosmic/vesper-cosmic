# Vesper Cosmic

Next.js App Router storefront and order intake flow for Vesper Cosmic.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Pages

- `/` basic home page
- `/shop` product overview
- `/order/[slug]` product-specific intake form
- `/checkout` review and PayPal redirect
- `/thank-you` payment completion page

## PayPal setup

The checkout currently uses PayPal.me placeholders:

```js
export const PAYPAL_ME_USERNAME = "YOUR_PAYPAL_ID";
```

Update `data/products.js` with your PayPal.me username. Example:

```js
export const PAYPAL_ME_USERNAME = "vespercosmic";
```

Checkout URLs are generated as:

```txt
https://www.paypal.com/paypalme/YOUR_PAYPAL_ID/AMOUNT
```

PayPal.me is good for a lightweight launch, but it does not provide a full
cart, webhook, or guaranteed automatic return flow. For production automation,
upgrade to PayPal Checkout API or payment links with a configured return URL.

## Images

Product images are temporary SVG placeholders in `public/images`. Replace them
with final product photography later and keep each product's `images` field as
an array of strings.

## Orders, email, and logistics

`app/api/create-order/route.js` currently:

- validates order details
- creates order IDs in `VC-YYYYMMDD-XXXX` format
- creates a Notion database row when `NOTION_TOKEN` and `NOTION_DATABASE_ID` are set
- sends customer and owner emails through Resend when `RESEND_API_KEY` is set
- returns a PayPal.me URL using `PAYPAL_ME`
- still stores a temporary in-memory copy as a fallback while running

Required Vercel environment variables:

```txt
NOTION_TOKEN=...
NOTION_DATABASE_ID=...
PAYPAL_ME=VesperCosmic
```

Optional Vercel environment variables:

```txt
RESEND_API_KEY=...
RESEND_FROM_EMAIL=vesper.cosmic.blueprint@gmail.com
RESEND_REPLY_TO=vesper.cosmic.blueprint@gmail.com
NOTION_SETUP_SECRET=...
```

Resend requires the `from` address to use a verified sending domain. Use
`vesper.cosmic.blueprint@gmail.com` as the sending address. Keep
`RESEND_REPLY_TO=vesper.cosmic.blueprint@gmail.com` so customer replies go to
the shop inbox.

Test email after deployment:

```bash
curl -X POST https://YOUR-VERCEL-DOMAIN.vercel.app/api/test-email \
  -H "Content-Type: application/json" \
  -H "x-setup-secret: YOUR_NOTION_SETUP_SECRET" \
  -d '{"to":"vesper.cosmic.blueprint@gmail.com"}'
```

## Notion setup

Use this endpoint to add the expected Notion properties:

```bash
curl -X POST https://YOUR-VERCEL-DOMAIN.vercel.app/api/notion-setup \
  -H "x-setup-secret: YOUR_NOTION_SETUP_SECRET"
```

In local development, `POST /api/notion-setup` can run without
`NOTION_SETUP_SECRET`. In production, set `NOTION_SETUP_SECRET` before calling
it.

The endpoint also attempts to create the requested views if the Notion API
returns a data source ID and the integration has sufficient access. If view
creation is blocked by permissions, create these manually in Notion:

- All Orders: table, sorted by 訂單日期 newest first
- Production Board: board, grouped by 製作狀態
- This Week: table, filtered to 製作狀態 is not ✅ Complete

For future tracking updates, use `PATCH /api/order` with:

```json
{
  "orderId": "VC-20260526-ABCD",
  "trackingNumber": "TRACKING123",
  "carrier": "USPS"
}
```

## Customs documents (commercial invoice, packing slip, EZPost helper)

Admin-only tools for shipping to the US with Chunghwa Post (DDP — we prepay
duties). From **訂單管理**, each order card links to:

- **/admin/orders/[orderId]** — customs checks, **Commercial Invoice (PDF)**,
  **Packing Slip (PDF)**, and the shipping record (service, gross weight,
  postage, duties & fees, EZPost label no., tracking) saved to Notion.
- **/admin/orders/[orderId]/ezpost** — every EZPost field in order with Copy
  buttons, "Copy all as text", and a landed-cost estimate (EZPost is
  authoritative).

PDFs are generated on the server (`@react-pdf/renderer`, Node runtime), so they
work from any device that can sign in to the admin. They contain customer
details: admin only, `Cache-Control: no-store`, never stored.

Per-product customs data (customs description, HTSUS, unit weight, origin,
value override, bundle components) is edited in **產品管理 → 海關資料** and
stored inside the product JSON. Suggested HTSUS codes are unverified — check
them at https://hts.usitc.gov.

Env vars (see `.env.example`): `SELLER_BUSINESS_NAME`, `SELLER_CONTACT_NAME`,
`SELLER_ADDRESS_LINE1`, `SELLER_ADDRESS_LINE2`, `SELLER_CITY`,
`SELLER_POSTAL_CODE`, `SELLER_COUNTRY`, `SELLER_PHONE`, `SELLER_EMAIL`,
`SELLER_TAX_ID` (optional), `DEFAULT_PACKAGING_WEIGHT_ENVELOPE_G` (30),
`DEFAULT_PACKAGING_WEIGHT_BOX_G` (150), `CUSTOMS_DEFAULT_DUTY_RATE` (0.10),
`CUSTOMS_ENTRY_FEE_USD` (2).

Tests: `npm test` (vitest).

### Customs presets (海關預設)

One-click defaults for a product's customs data (description, HTSUS, unit weight, origin):
press-on nails, energy bottle, crystal sachet, DIY kit (needs classification) and digital.

- Code defaults live in `lib/customs/presets.js`. **HTSUS codes there are unverified suggestions — confirm at hts.usitc.gov.**
- Edit them without code at **/admin/settings/customs-presets** (description, HTSUS, unit weight, fragile). Edits are stored in the Notion "Customs Presets" database: set `NOTION_CUSTOMS_PRESETS_DATABASE_ID` and connect the database to the "Vesper Cosmic" integration. Without it the code defaults are used and the page is read-only.
- In the product form: 海關資料 → 套用海關預設. Empty fields are filled; existing values are only replaced after a confirmation. The applied preset is saved on the product (`customs.preset`).
- Product list → 批次套用海關預設 previews every change and writes nothing until confirmed; non-empty fields are kept unless "overwrite" is ticked.
- After editing a preset, "同步到使用此預設的商品" previews and applies it to the products using it.
- The invoice and EZPost helper merge lines with the same HTSUS, description, origin and unit value; the packing slip lists every item.

### Combined shipments (合併出貨)

Several paid orders for the same recipient can go in one parcel.

- Setup: the Notion "Shipments" database (`NOTION_SHIPMENTS_DATABASE_ID`), connected to the "Vesper Cosmic" integration. Columns are added automatically if missing.
- 訂單管理 → tick two or more orders → **合併出貨**. Allowed only if every order is paid, not shipped, not already in a shipment, and has the same recipient name, address, city, state, ZIP and country; otherwise the field that differs is shown.
- `/admin/shipments/[VC-SHP-YYYYMMDD-NN]`: one Commercial Invoice (all order numbers in the header, merged customs lines, goods actually paid; shipping charged shown separately), a Packing List grouped by order, and one EZPost helper for the whole parcel (gross weight = items + packaging).
- Service suggestion: fragile goods → air parcel / express in a box; ≤ 2 kg and not fragile → ePacket in an envelope.
- **標記已出貨** sets every order to 🚚 已出貨 with the tracking number — it sends no email. **寄出貨通知信** (separate button) sends one email per customer listing their order numbers.
- **拆分** removes an order from a shipment before it is marked shipped. Single-order shipping is unchanged (no shipment record).
- The EZPost line limit (40) is an unverified assumption: `EZPOST_MAX_LINES` in `lib/customs/validate.js`.
