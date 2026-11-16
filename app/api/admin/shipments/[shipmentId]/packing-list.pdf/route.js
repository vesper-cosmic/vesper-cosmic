import { pdfResponse } from "@/lib/customs/pdfResponse";
import { renderPackingListPdf } from "@/lib/customs/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/shipments/:shipmentId/packing-list.pdf — items grouped by order. */
export async function GET(request, context) {
  const params = await context.params;
  return pdfResponse(request, params, {
    shipment: true,
    render: (data) => renderPackingListPdf(data),
    filename: (data) => `Packing-List-${data.shipment.shipmentNo}.pdf`,
  });
}
