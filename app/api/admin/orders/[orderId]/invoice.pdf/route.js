import { pdfResponse } from "@/lib/customs/pdfResponse";
import { renderInvoicePdf } from "@/lib/customs/render";

// Node runtime (not edge): @react-pdf/renderer is pure JavaScript — no
// headless Chromium — so it fits comfortably in a Vercel serverless function.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICES = ["ePacket", "Air Parcel", "EMS"];

/** GET /api/admin/orders/:orderId/invoice.pdf[?service=ePacket&packaging=box] */
export async function GET(request, { params }) {
  return pdfResponse(request, params, {
    render: (data, url) => {
      const service = url.searchParams.get("service");
      return renderInvoicePdf(data, { shippingService: SERVICES.includes(service) ? service : "" });
    },
    filename: (data) => `${data.invoiceNumber}.pdf`,
  });
}
