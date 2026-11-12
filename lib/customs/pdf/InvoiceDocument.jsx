import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatHtsus } from "../htsus.js";
import { formatDate, kg, money, pdfTheme as t } from "../pdfTheme.js";

// Commercial invoice — English, US Letter, black on white, nothing under 9pt.

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: t.fonts.sans, fontSize: 9, color: t.black, lineHeight: 1.35 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  wordmark: { fontFamily: t.fonts.serifBold, fontSize: 16, letterSpacing: 3 },
  title: { fontFamily: t.fonts.sansBold, fontSize: 18, lineHeight: 1.2, textAlign: "right", marginBottom: 4 },
  meta: { textAlign: "right" },
  row: { flexDirection: "row", gap: 12, marginBottom: 10 },
  box: { flex: 1, borderWidth: 1, borderColor: t.black, padding: 8 },
  shipment: { borderWidth: 1, borderColor: t.black, padding: 8, marginBottom: 10 },
  boxTitle: { fontFamily: t.fonts.sansBold, fontSize: 9, marginBottom: 4, textTransform: "uppercase" },
  bold: { fontFamily: t.fonts.sansBold },
  table: { borderWidth: 1, borderColor: t.black, marginTop: 4 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: t.rule },
  th: { fontFamily: t.fonts.sansBold, padding: 4, backgroundColor: "#EEEEEE" },
  td: { padding: 4 },
  totals: { marginTop: 8, alignSelf: "flex-end", width: 260 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  declared: { marginTop: 6, fontFamily: t.fonts.sansBold, fontSize: 10 },
  declaration: { marginTop: 16, borderTopWidth: 1, borderColor: t.black, paddingTop: 8 },
  signRow: { flexDirection: "row", gap: 24, marginTop: 22 },
  signCell: { flex: 1, borderTopWidth: 1, borderColor: t.black, paddingTop: 3 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 9, color: t.grey, textAlign: "center" },
});

const COLUMNS = [
  { key: "n", label: "#", width: "4%" },
  { key: "description", label: "Description", width: "30%" },
  { key: "htsus", label: "HTSUS", width: "13%" },
  { key: "origin", label: "Origin", width: "9%" },
  { key: "qty", label: "Qty", width: "6%", align: "right" },
  { key: "unit", label: "Unit USD", width: "12%", align: "right" },
  { key: "total", label: "Total USD", width: "13%", align: "right" },
  { key: "weight", label: "Net kg", width: "13%", align: "right" },
];

function Cell({ col, header, children }) {
  return (
    <Text style={[header ? s.th : s.td, { width: col.width, textAlign: col.align || "left" }]}>{children}</Text>
  );
}

function Lines({ children }) {
  return children.filter(Boolean).map((line, i) => <Text key={i}>{line}</Text>);
}

export default function InvoiceDocument({ data, shippingService = "", generatedAt = new Date() }) {
  const { order, address, seller, lines, summary, shippingChargedUSD, invoiceNumber } = data;
  const record = order.shippingRecord || {};
  const service = shippingService || record.shippingService || "________";
  const goods = summary.totalValueUSD;

  return (
    <Document title={`Commercial Invoice ${invoiceNumber}`} author={seller.businessName}>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.wordmark}>VESPER COSMOS</Text>
          </View>
          <View>
            <Text style={s.title}>COMMERCIAL INVOICE</Text>
            <Text style={s.meta}>Invoice No.: {invoiceNumber}</Text>
            <Text style={{ textAlign: "right" }}>Invoice date: {formatDate(generatedAt)}</Text>
            <Text style={{ textAlign: "right" }}>
              Order No.: {order.orderId} · Order date: {formatDate(order.createdAt)}
            </Text>
            <Text style={{ textAlign: "right" }}>
              Payment ref. (PayPal): {order.paypalCaptureId || "PayPal — see order " + order.orderId}
            </Text>
            <Text style={{ textAlign: "right" }}>Currency: USD</Text>
          </View>
        </View>

        <View style={s.row}>
          <View style={s.box}>
            <Text style={s.boxTitle}>Seller / Exporter</Text>
            <Lines>
              {[
                seller.businessName,
                seller.contactName,
                seller.addressLine1,
                seller.addressLine2,
                [seller.city, seller.postalCode].filter(Boolean).join(" "),
                seller.country,
                seller.phone && `Tel: ${seller.phone}`,
                seller.email && `Email: ${seller.email}`,
                seller.taxId && `Tax ID: ${seller.taxId}`,
              ]}
            </Lines>
          </View>
          <View style={s.box}>
            <Text style={s.boxTitle}>Buyer / Consignee</Text>
            <Lines>
              {[
                address.fullName,
                address.addressLine1,
                address.addressLine2,
                [address.city, address.stateProvince, address.postalCode].filter(Boolean).join(", "),
                address.country,
                address.phone && `Tel: ${address.phone}`,
                order.email && `Email: ${order.email}`,
              ]}
            </Lines>
          </View>
        </View>

        <View style={s.shipment}>
          <Text style={s.boxTitle}>Shipment</Text>
          <Text>
            Carrier: Chunghwa Post · Service: {service} · Tracking No.: {order.trackingNumber || "________"}
          </Text>
          <Text>
            Packages: 1 · Gross weight: {kg(summary.grossWeightG)} kg · Net weight: {kg(summary.netWeightG)} kg
          </Text>
          <Text>Terms: DDP — duties &amp; fees prepaid by sender via Chunghwa Post</Text>
          <Text>Reason for export: Sale of goods</Text>
        </View>

        <View style={s.table}>
          <View style={s.tr} fixed>
            {COLUMNS.map((col) => (
              <Cell key={col.key} col={col} header>
                {col.label}
              </Cell>
            ))}
          </View>
          {lines.map((line, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <Cell col={COLUMNS[0]}>{i + 1}</Cell>
              <Cell col={COLUMNS[1]}>{line.description}</Cell>
              <Cell col={COLUMNS[2]}>{formatHtsus(line.htsus)}</Cell>
              <Cell col={COLUMNS[3]}>{line.origin}</Cell>
              <Cell col={COLUMNS[4]}>{line.qty}</Cell>
              <Cell col={COLUMNS[5]}>{line.unitValueUSD.toFixed(2)}</Cell>
              <Cell col={COLUMNS[6]}>{line.totalValueUSD.toFixed(2)}</Cell>
              <Cell col={COLUMNS[7]}>{kg(line.totalWeightG)}</Cell>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text>Goods value</Text>
            <Text>{money(goods)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>Shipping charged (separate)</Text>
            <Text>{money(shippingChargedUSD)}</Text>
          </View>
          <View style={[s.totalRow, { borderTopWidth: 1, borderColor: t.black }]}>
            <Text style={s.bold}>Invoice total</Text>
            <Text style={s.bold}>{money(goods + shippingChargedUSD)}</Text>
          </View>
        </View>
        <Text style={s.declared}>Total declared customs value (goods only): USD {goods.toFixed(2)}</Text>

        <View style={s.declaration}>
          <Text>
            I declare that the information on this invoice is true and correct, and that the goods
            described originate in Taiwan.
          </Text>
          <View style={s.signRow}>
            <Text style={s.signCell}>Signature</Text>
            <Text style={s.signCell}>Name: {seller.contactName || seller.businessName}</Text>
            <Text style={s.signCell}>Date: {formatDate(generatedAt)}</Text>
          </View>
        </View>

        <Text style={s.footer} fixed>
          Digital products (if any) are not included in this shipment or declared value.
        </Text>
      </Page>
    </Document>
  );
}
