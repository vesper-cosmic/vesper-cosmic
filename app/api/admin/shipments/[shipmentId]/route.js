import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { findNotionOrder, setAdminOrderStatus, updateOrderShippingRecord } from "@/lib/orderServer";
import { OS_SHIPPED } from "@/lib/orderStatus";
import { syncOrderReferrer } from "@/lib/referral";
import { consumeMaterialsForOrder } from "@/lib/costServer";
import { sendCombinedShippedEmail } from "@/lib/customerEmails";
import { findShipment, updateShipment } from "@/lib/shipmentServer";
import { loadShipmentCustoms } from "@/lib/customs/shipmentContext";
import { renderInvoicePdf } from "@/lib/customs/render";
import {
  SHIPMENT_CANCELLED,
  SHIPMENT_ID_PATTERN,
  SHIPMENT_PENDING,
  SHIPMENT_SHIPPED,
} from "@/lib/customs/shipments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };
const json = (body, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

/** The shipment with its orders, merged customs lines, checks and EZPost data. */
export async function GET(request, { params }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const packaging = new URL(request.url).searchParams.get("packaging");
  const result = await loadShipmentCustoms(params.shipmentId, {
    packaging: packaging === "box" || packaging === "envelope" ? packaging : undefined,
  });
  if (result.status !== 200) return json({ error: result.error }, result.status);
  return json(result.data);
}

/**
 * Body: { action, ... }
 *   update        { service, packaging, grossWeightG, postageTWD, dutyFeesTWD, ezpostLabelNo, trackingNumber }
 *   remove-order  { orderId }                       (before it is shipped)
 *   cancel        {}                                (before it is shipped)
 *   mark-shipped  { trackingNumber, shippedAt? }    sets every order to 已出貨; sends NO email
 *   send-emails   { note?, attachInvoice?, force? } one email per customer, only when asked
 */
export async function PATCH(request, { params }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const shipmentNo = String(params.shipmentId || "").trim().toUpperCase();
  if (!SHIPMENT_ID_PATTERN.test(shipmentNo)) return json({ error: "Invalid shipment ID." }, 400);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid JSON." }, 400);

  const found = await findShipment(shipmentNo);
  if (found?.skipped) return json({ error: found.reason }, 503);
  if (!found?.found) return json({ error: "Shipment not found." }, 404);
  const shipment = found.shipment;
  if (shipment.status === SHIPMENT_CANCELLED) return json({ error: "這張出貨單已取消。" }, 409);

  switch (body.action) {
    case "update": {
      const allowed = ["service", "packaging", "grossWeightG", "postageTWD", "dutyFeesTWD", "ezpostLabelNo", "trackingNumber"];
      const fields = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
      const result = await updateShipment(shipment.pageId, fields);
      return result.skipped ? json({ error: result.reason }, 503) : json({ ok: true });
    }

    case "remove-order": {
      if (shipment.status !== SHIPMENT_PENDING) return json({ error: "已出貨，不能再拆分。" }, 409);
      const orderId = String(body.orderId || "").trim();
      if (!shipment.orderIds.includes(orderId)) return json({ error: "這張訂單不在此出貨單。" }, 404);
      if (shipment.orderIds.length <= 1) return json({ error: "至少要留一張訂單，要放棄請按「取消出貨單」。" }, 422);
      const result = await updateShipment(shipment.pageId, { orderIds: shipment.orderIds.filter((id) => id !== orderId) });
      return result.skipped ? json({ error: result.reason }, 503) : json({ ok: true });
    }

    case "cancel": {
      if (shipment.status !== SHIPMENT_PENDING) return json({ error: "已出貨，不能取消。" }, 409);
      const result = await updateShipment(shipment.pageId, { status: SHIPMENT_CANCELLED });
      return result.skipped ? json({ error: result.reason }, 503) : json({ ok: true });
    }

    case "mark-shipped": {
      if (shipment.status !== SHIPMENT_PENDING) return json({ error: "這張出貨單已經出貨。" }, 409);
      const trackingNumber = String(body.trackingNumber || shipment.trackingNumber || "").trim().slice(0, 64);
      if (!trackingNumber) return json({ error: "請先填寫追蹤號碼。" }, 422);
      const shippedAt = body.shippedAt ? new Date(body.shippedAt).toISOString() : new Date().toISOString();

      // Orders first: if one fails, the shipment stays pending and this can be retried.
      const failures = [];
      for (const orderId of shipment.orderIds) {
        const status = await setAdminOrderStatus({ orderId, orderStatus: OS_SHIPPED, trackingNumber });
        if (status?.skipped) {
          failures.push(`${orderId}：${status.reason}`);
          continue;
        }
        const record = await updateOrderShippingRecord(orderId, {
          shippingService: shipment.service,
          ezpostLabelNo: shipment.ezpostLabelNo,
          trackingNumber,
        });
        if (record?.skipped) failures.push(`${orderId}：${record.reason}`);
        await syncOrderReferrer(orderId);
      }
      // (Material deduction happens below, only once every order saved.)
      if (failures.length) return json({ error: "部分訂單更新失敗，出貨單尚未標為已出貨，可再按一次重試。", failures }, 502);

      const result = await updateShipment(shipment.pageId, { status: SHIPMENT_SHIPPED, trackingNumber, shippedAt });
      if (result.skipped) return json({ error: result.reason }, 503);
      // Take the materials out of stock and save each order's cost (never blocks shipping).
      const stock = [];
      for (const orderId of shipment.orderIds) stock.push({ orderId, ...(await consumeMaterialsForOrder(orderId)) });
      return json({ ok: true, orders: shipment.orderIds.length, stock });
    }

    case "send-emails": {
      if (shipment.status !== SHIPMENT_SHIPPED) return json({ error: "請先標記為已出貨。" }, 409);
      if (shipment.emailedAt && body.force !== true) {
        return json({ error: "已經寄過通知信了。", alreadySent: shipment.emailedAt }, 409);
      }
      const note = String(body.note || "").trim().slice(0, 2000);

      // One email per customer, listing the orders of theirs in this parcel.
      const customers = new Map();
      for (const orderId of shipment.orderIds) {
        const order = await findNotionOrder(orderId);
        if (!order?.found || !order.order.email) continue;
        const key = order.order.email.toLowerCase();
        const entry = customers.get(key) || { email: order.order.email, fullName: order.order.fullName, orderIds: [] };
        entry.orderIds.push(orderId);
        customers.set(key, entry);
      }

      let attachments = [];
      if (body.attachInvoice === true) {
        const data = await loadShipmentCustoms(shipmentNo);
        if (data.status !== 200 || !data.data.validation.ok) {
          return json({ error: "商業發票無法產生（請先補齊海關資料）。信件未寄出。" }, 422);
        }
        attachments = [{ filename: `${data.data.invoiceNumber}.pdf`, content: await renderInvoicePdf(data.data), contentType: "application/pdf" }];
      }

      const results = [];
      for (const customer of customers.values()) {
        const sent = await sendCombinedShippedEmail(customer, customer.orderIds, shipment.trackingNumber, note, { attachments });
        results.push({ email: customer.email, orders: customer.orderIds, success: Boolean(sent?.success), skipped: Boolean(sent?.skipped), error: sent?.error || sent?.reason || "" });
      }
      if (results.length > 0 && results.every((r) => r.success)) {
        await updateShipment(shipment.pageId, { emailedAt: new Date().toISOString() });
      }
      return json({ ok: true, results });
    }

    default:
      return json({ error: "Unknown action." }, 400);
  }
}
