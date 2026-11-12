import { pdfResponse } from "@/lib/customs/pdfResponse";
import { renderPackingSlipPdf } from "@/lib/customs/render";

// Node runtime (not edge): @react-pdf/renderer is pure JavaScript — no
// headless Chromium — so it fits comfortably in a Vercel serverless function.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/orders/:orderId/packing-slip.pdf[?prices=1] */
export async function GET(request, { params }) {
  return pdfResponse(request, params, {
    render: (data, url) => renderPackingSlipPdf(data, { showPrices: url.searchParams.get("prices") === "1" }),
    filename: (data) => `packing-slip-${data.order.orderId}.pdf`,
  });
}
