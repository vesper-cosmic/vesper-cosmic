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

## Raw-material inventory and cost (原料庫存與成本)

- Three Notion databases under the "Vesper Cosmos" page: **原料 Materials**, **進貨紀錄 Purchases**, **庫存異動 Stock movements**. Env vars: `NOTION_MATERIALS_DATABASE_ID`, `NOTION_PURCHASES_DATABASE_ID`, `NOTION_STOCK_MOVEMENTS_DATABASE_ID` (connect each to the "Vesper Cosmic" integration; missing columns are added automatically).
- **/admin/inventory/purchase (進貨登記):** tick the materials bought, enter the quantity and the total paid (TWD) for each; one submission records the whole purchase (`VC-PUR-YYYYMMDD-NN`).
- **/admin/inventory:** stock, average unit cost and stock value per material, low-stock flags (安全庫存量), manual adjustments (stocktake or +/−), purchase history and the movement log.
- Stock = the sum of stock movements. Average cost = everything ever spent on the material ÷ everything ever bought (weighted across batches); using or adjusting stock never changes the unit cost.
- All money is TWD.

### Cost, margin and the report (成本與毛利)

- **Recipe:** in the product form, 成本配方 lists the raw materials one piece uses (plus optional packaging and labour, TWD). A bundle adds up its components. Recipes and costs are admin-only: they are stripped from the public product API and pages.
- **When an order ships** (status 🚚 已出貨, or a combined shipment is marked shipped) the recipe's materials are taken out of stock (耗用 movements) and the order's product cost is saved on the order (商品成本 / 成本明細), so later price changes never rewrite past profit. Doing it twice never deducts twice. Stock can go negative if purchases weren't registered; the inventory page flags it.
- **Cancelling** an order that has not shipped puts its finished-goods stock back (取消回補). Finished-goods stock changes are logged in 庫存異動.
- **Exchange rate:** each new order is stamped with the live USD→TWD rate (open.er-api.com) in 匯率 TWD/USD. If it can't be fetched the order uses `FX_FALLBACK_TWD_PER_USD` (default 32) and is marked 備用. The order columns are added to the Notion orders database automatically.
- **/admin/reports/cost:** per month, per product and per order — revenue (US$ × the order's rate), product cost, PayPal fee, postage, duties and referral commission, in TWD. Only paid, non-cancelled orders count. Orders not shipped yet use an estimated cost (marked *); combined-shipment postage and duties are split by order amount.
- **PayPal fee:** `PAYPAL_FEE_PERCENT` (default 4.4) + `PAYPAL_FEE_FIXED_USD` (default 0.30) — set these to your account's real rates.

### Bulk consumables and the decoration allowance (散裝耗材與裝飾補貼)

- Each material is **計數型** (counted: nail tips, bottles, corks, pouches, tool kits, boxes — exact quantity, deducted per product) or **散裝耗材** (bulk: ribbon, crystal chips, sealing wax, gel polish, gold foil).
- A bulk material's stock is in **packs**. Cost per product = pack average cost ÷ products per pack; each product made deducts 1 ÷ products-per-pack of a pack. In a recipe, a bulk line's quantity means "products' worth" (normally 1).
- **用完一包:** asks how many products the pack really made. The pack-yield estimate then becomes the average over all finished packs (`已用完包數`, `實際累計件數` in the Materials database); until the first one is reported, the typed 每包預估件數 is used. Stock drops to the whole unopened packs left.
- **Low stock (bulk):** estimated remaining products (packs × products per pack) below the material's 低庫存門檻(件).
- **裝飾補貼:** a fixed per-product allowance for small decorations (charms, nail stickers, crystal chips, gold foil), counted in the product's material cost. Blank = default NT$35 for press-on nail categories (`DEFAULT_DECORATION_TWD` in `lib/cost.js`), 0 elsewhere; an explicit value (even 0) always wins; bundles take their components' allowances.
- New Materials columns (added automatically): 追蹤方式, 每包預估件數, 低庫存門檻(件), 已用完包數, 實際累計件數.

#### Design note (not built): charm price tiers

Charms are not tracked individually. If wanted later, group them into tiers — budget / standard / premium — each with one average unit cost (a small "Charm tiers" table). A ready-made design would then list how many charms of each tier it uses (e.g. 4 standard + 1 premium), and its decoration allowance would be computed from those counts instead of the flat NT$35. `decorationAllowance()` in `lib/cost.js` is the single place to change.
