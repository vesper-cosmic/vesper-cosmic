import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import InvoiceDocument from "./pdf/InvoiceDocument.jsx";
import PackingSlipDocument from "./pdf/PackingSlipDocument.jsx";

export function renderInvoicePdf(data, options = {}) {
  return renderToBuffer(<InvoiceDocument data={data} {...options} />);
}

export function renderPackingSlipPdf(data, options = {}) {
  return renderToBuffer(<PackingSlipDocument data={data} {...options} />);
}
