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
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_REPLY_TO=vesper.cosmic.blueprint@gmail.com
NOTION_SETUP_SECRET=...
```

Resend requires the `from` address to use a verified sending domain. Use
`onboarding@resend.dev` only for early testing, then verify a custom domain in
Resend and set `RESEND_FROM_EMAIL` to an address on that domain. Keep
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
