import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDate, money, pdfTheme as t } from "../pdfTheme.js";

// Packing slip — goes inside the parcel, so it's customer-friendly and
// brand-styled. Prices are hidden unless showPrices is set.

export const KIT_CONTENTS = "Application kit: mini nail file, wooden cuticle stick, jelly adhesive tabs";

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: t.fonts.sans, fontSize: 10, color: t.navy, lineHeight: 1.45 },
  band: { borderBottomWidth: 2, borderColor: t.champagne, paddingBottom: 10, marginBottom: 14 },
  wordmark: { fontFamily: t.fonts.serifBold, fontSize: 22, lineHeight: 1.2, letterSpacing: 4, textAlign: "center" },
  tagline: { fontFamily: t.fonts.serifItalic, fontSize: 11, textAlign: "center", color: t.slate, marginTop: 6 },
  row: { flexDirection: "row", gap: 16, marginBottom: 14 },
  col: { flex: 1 },
  label: { fontFamily: t.fonts.sansBold, fontSize: 9, color: t.slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  card: { backgroundColor: t.mistBlueLight, borderRadius: 6, padding: 12, marginBottom: 12 },
  item: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderColor: t.mistBlue },
  bold: { fontFamily: t.fonts.sansBold },
  heading: { fontFamily: t.fonts.serifBold, fontSize: 13, marginBottom: 4 },
  note: { fontSize: 9.5, color: t.slate },
  duties: { backgroundColor: t.champagneLight, borderRadius: 6, padding: 10, textAlign: "center", fontFamily: t.fonts.sansBold, marginBottom: 12 },
  thanks: { fontFamily: t.fonts.serifItalic, fontSize: 14, textAlign: "center", marginTop: 6 },
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 9, color: t.slate, textAlign: "center" },
});

export default function PackingSlipDocument({ data, showPrices = false }) {
  const { order, address, kitContents } = data;
  const shippedItems = data.lines.length
    ? data.lines.map((line) => ({ name: line.productName, qty: line.qty, total: line.totalValueUSD }))
    : [];
  const hasNails = kitContents.some((k) => /nail/i.test(`${k.name} ${k.includes}`));
  const extras = kitContents.filter((k) => k.includes);

  return (
    <Document title={`Packing Slip ${order.orderId}`} author="VESPER COSMOS">
      <Page size="LETTER" style={s.page}>
        <View style={s.band}>
          <Text style={s.wordmark}>VESPER COSMOS</Text>
          <Text style={s.tagline}>Handmade in Taiwan</Text>
        </View>

        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.label}>Order</Text>
            <Text style={s.bold}>{order.orderId}</Text>
            <Text>Placed {formatDate(order.createdAt)}</Text>
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
          {shippedItems.map((item, i) => (
            <View key={i} style={s.item}>
              <Text>
                {item.name} × {item.qty}
              </Text>
              {showPrices ? <Text>{money(item.total)}</Text> : null}
            </View>
          ))}
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

        {hasNails ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={s.heading}>Nail prep &amp; care</Text>
            <Text style={s.note}>
              Before applying, clean your natural nails and make sure they are completely dry (soap and
              water or your own rubbing alcohol both work). Gently file the nail surface, press each nail
              on for 30 seconds, and avoid hot water for the first hour. Store your set in its box to
              reuse it.
            </Text>
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
