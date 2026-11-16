import { pdfResponse } from "@/lib/customs/pdfResponse";
import { renderInvoicePdf } from "@/lib/customs/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICES = ["ePacket", "Air Parcel", "EMS"];

/** GET /api/admin/shipments/:shipmentId/invoice.pdf[?packaging=box&service=EMS] — one invoice for the whole parcel. */
export async function GET(request, context) {
  const params = await context.params;
  return pdfResponse(request, params, {
    shipment: true,
    render: (data, url) => {
      const service = url.searchParams.get("service");
      return renderInvoicePdf(data, { shippingService: SERVICES.includes(service) ? service : "" });
    },
    filename: (data) => `${data.invoiceNumber}.pdf`,
  });
}
