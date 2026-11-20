import "server-only";

import { Client } from "@notionhq/client";
import { resolveDataSourceId } from "@/lib/notionDataSource";
import { findAllNotionOrders, safeSendEmail } from "@/lib/orderServer";
import { OWNER_EMAIL } from "@/lib/siteEmail";
import { SITE_URL } from "@/lib/siteUrl";
import { PR_STATUSES, prApplicationId, totalFollowers } from "@/lib/prProgram";

// Creator & Tester applications live in their own Notion database
// (NOTION_PR_DATABASE_ID). The full application is stored as JSON; a few
// columns are copied out so the list can be sorted and filtered in Notion too.

const COL = {
  title: "名稱",
  id: "申請編號",
  status: "狀態",
  email: "Email",
  phone: "電話",
  platforms: "平台",
  followers: "總追蹤數",
  testOrder: "可測試下單",
  publicDuration: "影片公開期間",
  data: "申請資料 (JSON)",
  note: "管理備註",
};

const SCHEMA = {
  title: COL.title,
  properties: {
    [COL.id]: { rich_text: {} },
    [COL.status]: { select: { options: PR_STATUSES.map((name) => ({ name })) } },
    [COL.email]: { email: {} },
    [COL.phone]: { phone_number: {} },
    [COL.platforms]: { multi_select: {} },
    [COL.followers]: { number: { format: "number" } },
    [COL.testOrder]: { rich_text: {} },
    [COL.publicDuration]: { rich_text: {} },
    [COL.data]: { rich_text: {} },
    [COL.note]: { rich_text: {} },
  },
};

function client() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({ auth: process.env.NOTION_TOKEN, fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }) });
}

export function prConfigured() {
  return Boolean(process.env.NOTION_TOKEN && process.env.NOTION_PR_DATABASE_ID);
}

const rich = (text) => ({
  rich_text: (String(text || "").match(/[\s\S]{1,1900}/g) || [""]).map((chunk) => ({ text: { content: chunk } })),
});
const plain = (prop) => (prop?.rich_text || prop?.title || []).map((t) => t.plain_text || "").join("");

async function sourceId(notion) {
  return resolveDataSourceId(notion, process.env.NOTION_PR_DATABASE_ID, SCHEMA);
}

/** Save a validated application. @returns {{ ok, applicationId?, error? }} */
export async function createPrApplication(app) {
  const notion = client();
  if (!notion || !prConfigured()) return { ok: false, error: "not-configured" };
  const applicationId = prApplicationId();
  const { website, ...stored } = app; // drop the honeypot
  const record = { ...stored, applicationId, submittedAt: new Date().toISOString() };
  const platforms = [...new Set(app.social.map((row) => row.platform).filter(Boolean))].map((name) => ({ name }));
  try {
    await notion.pages.create({
      parent: { type: "data_source_id", data_source_id: await sourceId(notion) },
      properties: {
        [COL.title]: { title: [{ text: { content: `${app.firstName} ${app.lastName}`.trim() } }] },
        [COL.id]: rich(applicationId),
        [COL.status]: { select: { name: PR_STATUSES[0] } },
        [COL.email]: { email: app.email },
        [COL.platforms]: { multi_select: platforms },
        [COL.followers]: { number: totalFollowers(app) },
        [COL.testOrder]: rich(app.agreements.testOrder ? "Yes (agreed)" : "No"),
        [COL.publicDuration]: rich(app.publicDuration),
        [COL.data]: rich(JSON.stringify(record)),
      },
    });
    return { ok: true, applicationId };
  } catch (error) {
    console.error("createPrApplication failed:", error.message);
    return { ok: false, error: "save-failed" };
  }
}

/** All applications, newest first, for the admin page. */
export async function listPrApplications() {
  const notion = client();
  if (!notion || !prConfigured()) return { ok: false, configured: false, applications: [] };
  try {
    const id = await sourceId(notion);
    const pages = [];
    let cursor;
    do {
      const res = await notion.dataSources.query({
        data_source_id: id,
        start_cursor: cursor,
        page_size: 100,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
      });
      pages.push(...res.results);
      cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);
    // Orders placed with the same email (the tester's test order).
    const ordersResult = await findAllNotionOrders();
    const ordersByEmail = new Map();
    for (const order of ordersResult.orders || []) {
      const key = String(order.email || "").toLowerCase();
      if (!key) continue;
      if (!ordersByEmail.has(key)) ordersByEmail.set(key, []);
      ordersByEmail.get(key).push({
        orderId: order.orderId,
        createdAt: order.createdAt,
        productName: order.productName,
        amount: order.amount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      });
    }

    const applications = pages.map((page) => {
      let data = {};
      try {
        data = JSON.parse(plain(page.properties[COL.data]) || "{}");
      } catch {
        data = {};
      }
      return {
        pageId: page.id,
        createdAt: page.created_time,
        status: page.properties[COL.status]?.select?.name || PR_STATUSES[0],
        note: plain(page.properties[COL.note]),
        ...data,
        applicationId: plain(page.properties[COL.id]) || data.applicationId || "",
        orders: ordersByEmail.get(String(data.email || "").toLowerCase()) || [],
      };
    });
    return { ok: true, configured: true, applications };
  } catch (error) {
    console.error("listPrApplications failed:", error.message);
    return { ok: false, configured: true, applications: [], error: error.message };
  }
}

/** Change status and/or the admin note of one application (by Notion page id). */
export async function updatePrApplication(pageId, { status, note }) {
  const notion = client();
  if (!notion || !prConfigured()) return { ok: false, error: "尚未設定 NOTION_PR_DATABASE_ID。" };
  if (!/^[0-9a-f-]{32,36}$/i.test(String(pageId || ""))) return { ok: false, error: "Invalid id." };
  const properties = {};
  if (status !== undefined) {
    if (!PR_STATUSES.includes(status)) return { ok: false, error: "Unknown status." };
    properties[COL.status] = { select: { name: status } };
  }
  if (note !== undefined) properties[COL.note] = rich(String(note).slice(0, 4000));
  try {
    // Make sure the page belongs to the PR database before writing.
    const page = await notion.pages.retrieve({ page_id: pageId });
    const expected = (await sourceId(notion)).replace(/-/g, "");
    const parent = String(page.parent?.data_source_id || page.parent?.database_id || "").replace(/-/g, "");
    const dbId = String(process.env.NOTION_PR_DATABASE_ID || "").replace(/-/g, "");
    if (parent !== expected && parent !== dbId) return { ok: false, error: "Not found." };
    await notion.pages.update({ page_id: pageId, properties });
    return { ok: true };
  } catch (error) {
    console.error("updatePrApplication failed:", error.message);
    return { ok: false, error: "Could not save." };
  }
}

/** Owner alert + applicant confirmation. Never throws. */
export async function sendPrApplicationEmails(app, applicationId) {
  const platforms = app.social
    .filter((row) => row.platform || row.handle)
    .map((row) => `- ${row.platform}: ${row.handle}${row.followers ? ` (${row.followers.toLocaleString("en-US")} followers)` : ""}`)
    .join("\n");

  await safeSendEmail({
    to: OWNER_EMAIL,
    replyTo: app.email,
    subject: `新的試用申請 ${applicationId} — ${app.firstName} ${app.lastName}`,
    text: [
      `申請編號：${applicationId}`,
      `姓名：${app.firstName} ${app.lastName}`,
      `所在地：${app.city}, ${app.state}`,
      `總追蹤數：${totalFollowers(app).toLocaleString("en-US")}`,
      "",
      "平台：",
      platforms,
      "",
      `內容形式：${app.contentTypes.join("、")}`,
      `影片公開期間：${app.publicDuration}`,
      `發布時程：${app.postTimeline}`,
      `穿戴甲經驗：${app.pressOnExperience}`,
      `指甲膠過敏：${app.adhesiveSensitivity || "無填寫"}`,
      "",
      `完整資料與審核：${SITE_URL}/admin/pr`,
    ].join("\n"),
  });

  await safeSendEmail({
    to: app.email,
    subject: "We received your Vesper Cosmos tester application",
    text: [
      `Hi ${app.firstName},`,
      "",
      `Thank you for applying to the Vesper Cosmos Creator & Tester Program. Your application number is ${applicationId}.`,
      "",
      "We read every application ourselves. If you're selected, we'll email you a link to place your test order — please use this same email address when you check out, so we can match your order to your application. Your birth details and nail sizes are entered at checkout, and the full amount is refunded through PayPal within 7 days.",
      "",
      "If you aren't selected this round, we'll keep your application for up to 12 months for future rounds unless you ask us to delete it.",
      "",
      "Questions? Just reply to this email.",
      "",
      "Vesper Cosmos",
    ].join("\n"),
  });
}
