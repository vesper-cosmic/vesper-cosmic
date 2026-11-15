import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDate, pdfTheme as t } from "../pdfTheme.js";
import { KIT_CONTENTS } from "./PackingSlipDocument.jsx";

// Packing list for a combined shipment (several orders, one parcel). Goes
// inside the parcel, so it is customer-friendly: items grouped by order number.

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: t.fonts.sans, fontSize: 10, color: t.navy, lineHeight: 1.45 },
  band: { borderBottomWidth: 2, borderColor: t.champagne, paddingBottom: 10, marginBottom: 14 },
  wordmark: { fontFamily: t.fonts.serifBold, fontSize: 22, lineHeight: 1.2, letterSpacing: 4, textAlign: "center" },
  tagline: { fontFamily: t.fonts.serifItalic, fontSize: 11, textAlign: "center", color: t.slate, marginTop: 6 },
  row: { flexDirection: "row", gap: 16, marginBottom: 14 },
  col: { flex: 1 },
  label: { fontFamily: t.fonts.sansBold, fontSize: 9, color: t.slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  card: { backgroundColor: t.mistBlueLight, borderRadius: 6, padding: 12, marginBottom: 12 },
  orderHead: { fontFamily: t.fonts.sansBold, marginTop: 6, marginBottom: 2 },
  item: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderColor: t.mistBlue },
  total: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, fontFamily: t.fonts.sansBold },
  bold: { fontFamily: t.fonts.sansBold },
  heading: { fontFamily: t.fonts.serifBold, fontSize: 13, marginBottom: 4 },
  note: { fontSize: 9.5, color: t.slate },
  duties: { backgroundColor: t.champagneLight, borderRadius: 6, padding: 10, textAlign: "center", fontFamily: t.fonts.sansBold, marginBottom: 12 },
  thanks: { fontFamily: t.fonts.serifItalic, fontSize: 14, textAlign: "center", marginTop: 6 },
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 9, color: t.slate, textAlign: "center" },
});

export default function PackingListDocument({ data }) {
  const { shipment, orders, address, kitContents } = data;
  const totalItems = orders.reduce((sum, order) => sum + order.itemCount, 0);
  const hasNails = kitContents.some((k) => /nail/i.test(`${k.name} ${k.includes}`));
  const extras = kitContents.filter((k) => k.includes);

  return (
    <Document title={`Packing List ${shipment.shipmentNo}`} author="VESPER COSMOS">
      <Page size="LETTER" style={s.page}>
        <View style={s.band}>
          <Text style={s.wordmark}>VESPER COSMOS</Text>
          <Text style={s.tagline}>Handmade in Taiwan</Text>
        </View>

        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.label}>Shipment</Text>
            <Text style={s.bold}>{shipment.shipmentNo}</Text>
            <Text>
              {orders.length} {orders.length === 1 ? "order" : "orders"} in this parcel
            </Text>
          </View>
          <View style={s.col}>
            <Text style={s.label}>Ship to</Text>
            <Text style={s.bold}>{address.fullName}</Text>
            <Text>{address.addressLine1}</Text>
            {address.addressLine2 ? <Text>{address.addressLine2}</Text> : null}
            <Text>{[address.city, address.stateProvince, address.postalCode].filter(Boolean).join(", ")}</Text>
            <Text>{address.country}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.heading}>In this parcel</Text>
          {orders.map((order) => (
            <View key={order.orderId} wrap={false}>
              <Text style={s.orderHead}>
                Order {order.orderId} · placed {formatDate(order.createdAt)}
              </Text>
              {order.lines.map((line, i) => (
                <View key={i} style={s.item}>
                  <Text>{line.productName}</Text>
                  <Text>× {line.qty}</Text>
                </View>
              ))}
            </View>
          ))}
          <View style={s.total}>
            <Text>Total items</Text>
            <Text>{totalItems}</Text>
          </View>
        </View>

        {extras.length || hasNails ? (
          <View style={s.card}>
            <Text style={s.heading}>What&apos;s inside</Text>
            {extras.map((k, i) => (
              <Text key={i} style={s.note}>
                • {k.name}: {k.includes}
              </Text>
            ))}
            {hasNails && !extras.some((k) => /application kit/i.test(k.includes)) ? (
              <Text style={s.note}>• {KIT_CONTENTS}</Text>
            ) : null}
          </View>
        ) : null}

        <Text style={s.duties}>Duties prepaid — nothing to pay on delivery.</Text>

        <Text style={s.thanks}>Thank you for supporting a small, handmade studio.</Text>

        <Text style={s.footer} fixed>
          Returns: unopened ready-made items within 14 days of delivery; custom pieces are final sale
          unless damaged or defective. Contact us within 48 hours of delivery if anything arrives
          damaged. Full policy: vespercosmos.com/returns
        </Text>
      </Page>
    </Document>
  );
}
