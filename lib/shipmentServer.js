import "server-only";

import { Client } from "@notionhq/client";
import { resolveDataSourceId } from "@/lib/notionDataSource";
import {
  SHIPMENT_CANCELLED,
  SHIPMENT_PENDING,
  SHIPMENT_SHIPPED,
  formatShipmentNo,
} from "@/lib/customs/shipments";

// Combined shipments live in the Notion "Shipments" database
// (NOTION_SHIPMENTS_DATABASE_ID): one row per parcel. The row's 訂單編號
// column lists the order numbers in the parcel; orders themselves are not
// changed until the shipment is marked shipped.

export const SHIPMENT_COLUMNS = {
  title: "出貨編號",
  orders: "訂單編號",
  recipient: "收件人",
  service: "寄送方式",
  packaging: "包裝",
  grossWeightG: "包裹總重 (g)",
  trackingNumber: "追蹤號碼",
  ezpostLabelNo: "EZPost 標籤號碼",
  postageTWD: "郵資 (TWD)",
  dutyFeesTWD: "關稅與規費 (TWD)",
  shippedAt: "出貨時間",
  createdAt: "建立時間",
  emailedAt: "通知信已寄",
  status: "狀態",
};

const C = SHIPMENT_COLUMNS;
const SERVICES = ["ePacket", "Air Parcel", "EMS"];
const PACKAGINGS = ["envelope", "box"];

const SCHEMA_PROPERTIES = {
  [C.orders]: { rich_text: {} },
  [C.recipient]: { rich_text: {} },
  [C.service]: { select: { options: SERVICES.map((name) => ({ name })) } },
  [C.packaging]: { select: { options: PACKAGINGS.map((name) => ({ name })) } },
  [C.grossWeightG]: { number: { format: "number" } },
  [C.trackingNumber]: { rich_text: {} },
  [C.ezpostLabelNo]: { rich_text: {} },
  [C.postageTWD]: { number: { format: "number" } },
  [C.dutyFeesTWD]: { number: { format: "number" } },
  [C.shippedAt]: { date: {} },
  [C.createdAt]: { date: {} },
  [C.emailedAt]: { date: {} },
  [C.status]: {
    select: { options: [SHIPMENT_PENDING, SHIPMENT_SHIPPED, SHIPMENT_CANCELLED].map((name) => ({ name })) },
  },
};

function client() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({
    auth: process.env.NOTION_TOKEN,
    // Never serve a cached Notion response (Next.js caches server fetches).
    fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
  });
}

const databaseId = () => process.env.NOTION_SHIPMENTS_DATABASE_ID || "";

export function shipmentsConfigured() {
  return Boolean(process.env.NOTION_TOKEN && databaseId());
}

function sourceId(notion) {
  return resolveDataSourceId(notion, databaseId(), { title: C.title, properties: SCHEMA_PROPERTIES });
}

const rich = (value) => ({ rich_text: [{ text: { content: String(value || "").slice(0, 1900) } }] });
const text = (property) =>
  (property?.rich_text || property?.title || []).map((item) => item.plain_text || "").join("");
const number = (value) => {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function parseShipment(page) {
  const p = page.properties || {};
  return {
    pageId: page.id,
    shipmentNo: text(p[C.title]),
    orderIds: text(p[C.orders]).split(/[,\s]+/).filter(Boolean),
    recipient: text(p[C.recipient]),
    service: p[C.service]?.select?.name || "",
    packaging: p[C.packaging]?.select?.name || "",
    grossWeightG: p[C.grossWeightG]?.number ?? null,
    trackingNumber: text(p[C.trackingNumber]),
    ezpostLabelNo: text(p[C.ezpostLabelNo]),
    postageTWD: p[C.postageTWD]?.number ?? null,
    dutyFeesTWD: p[C.dutyFeesTWD]?.number ?? null,
    shippedAt: p[C.shippedAt]?.date?.start || null,
    createdAt: p[C.createdAt]?.date?.start || page.created_time || null,
    emailedAt: p[C.emailedAt]?.date?.start || null,
    status: p[C.status]?.select?.name || SHIPMENT_PENDING,
  };
}

/** Every shipment (newest first), cancelled ones included. */
export async function listShipments() {
  const notion = client();
  if (!notion || !databaseId()) return { skipped: true, reason: "尚未設定 NOTION_SHIPMENTS_DATABASE_ID。", shipments: [] };
  try {
    const id = await sourceId(notion);
    const shipments = [];
    let cursor;
    do {
      const page = await notion.dataSources.query({ data_source_id: id, page_size: 100, start_cursor: cursor });
      shipments.push(...(page.results || []).map(parseShipment));
      cursor = page.has_more ? page.next_cursor || undefined : undefined;
    } while (cursor);
    shipments.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return { skipped: false, shipments };
  } catch (error) {
    console.error("listShipments failed:", error);
    return { skipped: true, reason: error.message || "Could not load shipments.", shipments: [] };
  }
}

/** { [orderId]: shipmentNo } for orders that are in an active (not cancelled) shipment. */
export function shipmentIndex(shipments) {
  const index = {};
  for (const shipment of shipments || []) {
    if (shipment.status === SHIPMENT_CANCELLED) continue;
    for (const orderId of shipment.orderIds) index[orderId] = shipment.shipmentNo;
  }
  return index;
}

export async function findShipment(shipmentNo) {
  const notion = client();
  if (!notion || !databaseId()) return { skipped: true, reason: "尚未設定 NOTION_SHIPMENTS_DATABASE_ID。" };
  try {
    const result = await notion.dataSources.query({
      data_source_id: await sourceId(notion),
      filter: { property: C.title, title: { equals: shipmentNo } },
      page_size: 1,
    });
    const page = result.results?.[0];
    return page ? { skipped: false, found: true, shipment: parseShipment(page) } : { skipped: false, found: false };
  } catch (error) {
    console.error("findShipment failed:", error);
    return { skipped: true, reason: error.message || "Shipment lookup failed." };
  }
}

/** Create a shipment (status 待出貨) for the given order ids. */
export async function createShipment({ orderIds, recipient, service = "", packaging = "" }) {
  const notion = client();
  if (!notion || !databaseId()) return { skipped: true, reason: "尚未設定 NOTION_SHIPMENTS_DATABASE_ID。" };
  try {
    const id = await sourceId(notion);
    const now = new Date();
    const prefix = formatShipmentNo(now, 0).slice(0, -2); // "VC-SHP-YYYYMMDD-"
    const today = await notion.dataSources.query({
      data_source_id: id,
      filter: { property: C.title, title: { starts_with: prefix } },
      page_size: 100,
    });
    let seq = (today.results?.length || 0) + 1;
    let shipmentNo = formatShipmentNo(now, seq);
    const taken = new Set((today.results || []).map((page) => text(page.properties?.[C.title])));
    while (taken.has(shipmentNo)) shipmentNo = formatShipmentNo(now, ++seq);

    const properties = {
      [C.title]: { title: [{ text: { content: shipmentNo } }] },
      [C.orders]: rich(orderIds.join(", ")),
      [C.recipient]: rich(recipient),
      [C.status]: { select: { name: SHIPMENT_PENDING } },
      [C.createdAt]: { date: { start: now.toISOString() } },
    };
    if (SERVICES.includes(service)) properties[C.service] = { select: { name: service } };
    if (PACKAGINGS.includes(packaging)) properties[C.packaging] = { select: { name: packaging } };

    const page = await notion.pages.create({
      parent: { type: "data_source_id", data_source_id: id },
      properties,
    });
    return { skipped: false, shipment: parseShipment(page) };
  } catch (error) {
    console.error("createShipment failed:", error);
    return { skipped: true, reason: error.message || "Could not create the shipment." };
  }
}

/**
 * Update a shipment. `fields` may contain: orderIds, service, packaging,
 * grossWeightG, postageTWD, dutyFeesTWD, ezpostLabelNo, trackingNumber,
 * shippedAt, emailedAt, status. Only the keys present are written.
 */
export async function updateShipment(pageId, fields = {}) {
  const notion = client();
  if (!notion || !databaseId()) return { skipped: true, reason: "尚未設定 NOTION_SHIPMENTS_DATABASE_ID。" };
  const properties = {};
  if ("orderIds" in fields) properties[C.orders] = rich((fields.orderIds || []).join(", "));
  if ("service" in fields) {
    properties[C.service] = { select: SERVICES.includes(fields.service) ? { name: fields.service } : null };
  }
  if ("packaging" in fields) {
    properties[C.packaging] = { select: PACKAGINGS.includes(fields.packaging) ? { name: fields.packaging } : null };
  }
  for (const key of ["grossWeightG", "postageTWD", "dutyFeesTWD"]) {
    if (key in fields) properties[C[key]] = { number: number(fields[key]) };
  }
  for (const key of ["ezpostLabelNo", "trackingNumber"]) {
    if (key in fields) properties[C[key]] = rich(String(fields[key] || "").trim().slice(0, 64));
  }
  for (const key of ["shippedAt", "emailedAt"]) {
    if (key in fields) properties[C[key]] = { date: fields[key] ? { start: fields[key] } : null };
  }
  if ("status" in fields) properties[C.status] = { select: { name: fields.status } };

  try {
    await notion.pages.update({ page_id: pageId, properties });
    return { skipped: false };
  } catch (error) {
    console.error("updateShipment failed:", error);
    return { skipped: true, reason: error.message || "Could not update the shipment." };
  }
}
