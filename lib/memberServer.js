import "server-only";

import { Client } from "@notionhq/client";

/**
 * Members database (Notion)
 *
 * 欄位設計：
 * - Email (title / email) — 會員唯一識別
 * - 顯示名稱 (rich_text)
 * - 購物車 (rich_text) — JSON 字串，存會員購物車
 * - 預設收件人 (rich_text)
 * - 地址第一行 (rich_text)
 * - 地址第二行 (rich_text)
 * - 城市 (rich_text)
 * - 州省 (rich_text)
 * - 郵遞區號 (rich_text)
 * - 國家 (rich_text)
 * - 會員建立日期 (date)
 * - 最後登入 (date)
 * - 行銷訂閱 (checkbox)
 */

export function createMemberClient() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({ auth: process.env.NOTION_TOKEN });
}

export async function getMembersDatabaseId() {
  return process.env.NOTION_MEMBERS_DATABASE_ID || "";
}

export async function findMemberByEmail(email) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing member database config." };
  }

  const { dataSourceId, titlePropertyName } = await getMemberDataSourceContext(
    notion,
    databaseId
  );

  const queryResult = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: titlePropertyName,
      title: { equals: email.toLowerCase() },
    },
    page_size: 1,
  });

  const page = queryResult.results?.[0];

  if (!page?.id) {
    return { skipped: false, found: false };
  }

  return {
    skipped: false,
    found: true,
    pageId: page.id,
    member: parseMemberPage(page.properties),
  };
}

export async function upsertMember({ email, name, defaultAddress = null }) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing member database config." };
  }

  const { dataSourceId, titlePropertyName } = await getMemberDataSourceContext(
    notion,
    databaseId
  );

  const existing = await findMemberByEmail(email);

  if (existing?.found) {
    const updated = await notion.pages.update({
      page_id: existing.pageId,
      properties: {
        最後登入: { date: { start: new Date().toISOString() } },
        ...(name ? { 顯示名稱: richText(name) } : {}),
        ...(defaultAddress ? addressProperties(defaultAddress) : {}),
      },
    });
    return { skipped: false, updated: true, member: parseMemberPage(updated.properties) };
  }

  const created = await notion.pages.create({
    parent: { data_source_id: dataSourceId },
    properties: {
      [titlePropertyName]: { email: email.toLowerCase() },
      顯示名稱: richText(name || ""),
      購物車: richText(""),
      預設收件人: richText(""),
      地址第一行: richText(""),
      地址第二行: richText(""),
      城市: richText(""),
      州省: richText(""),
      郵遞區號: richText(""),
      國家: richText(""),
      會員建立日期: { date: { start: new Date().toISOString() } },
      最後登入: { date: { start: new Date().toISOString() } },
      行銷訂閱: { checkbox: false },
      ...(defaultAddress ? addressProperties(defaultAddress) : {}),
    },
  });

  return { skipped: false, created: true, member: parseMemberPage(created.properties) };
}

export async function saveMemberCart(email, cartItems) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };
  if (!Array.isArray(cartItems)) {
    return { skipped: true, reason: "cartItems must be an array." };
  }

  const existing = await findMemberByEmail(email);
  if (existing?.skipped || !existing?.found) {
    await upsertMember({ email, name: "", defaultAddress: null });
  }

  const fresh = await findMemberByEmail(email);
  if (!fresh?.found) return { skipped: true, reason: "Member not found after upsert." };

  await notion.pages.update({
    page_id: fresh.pageId,
    properties: {
      購物車: richText(JSON.stringify(cartItems)),
    },
  });

  return { skipped: false, success: true };
}

export async function updateMemberDefaultAddress(email, defaultAddress) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };

  const existing = await findMemberByEmail(email);
  if (existing?.skipped || !existing?.found) {
    await upsertMember({ email, name: "", defaultAddress });
    return { skipped: false, success: true };
  }

  await notion.pages.update({
    page_id: existing.pageId,
    properties: addressProperties(defaultAddress),
  });

  return { skipped: false, success: true };
}

export async function setupMembersDatabase() {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) {
    throw new Error("Missing NOTION_TOKEN or NOTION_MEMBERS_DATABASE_ID.");
  }

  const { dataSourceId } = await getMemberDataSourceContext(notion, databaseId);

  const dataSourceResult = await notion.dataSources.update({
    data_source_id: dataSourceId,
    properties: memberDatabaseProperties(),
  });

  return { dataSourceResult };
}

export function memberDatabaseProperties() {
  return {
    顯示名稱: { rich_text: {} },
    購物車: { rich_text: {} },
    預設收件人: { rich_text: {} },
    地址第一行: { rich_text: {} },
    地址第二行: { rich_text: {} },
    城市: { rich_text: {} },
    州省: { rich_text: {} },
    郵遞區號: { rich_text: {} },
    國家: { rich_text: {} },
    會員建立日期: { date: {} },
    最後登入: { date: {} },
    行銷訂閱: { checkbox: {} },
  };
}

function parseMemberPage(properties) {
  const email = textOf(properties["Email"]) || textOf(properties["email"]) || "";
  return {
    email: String(email).toLowerCase(),
    name: textOf(properties["顯示名稱"]) || "",
    cart: parseCart(properties["購物車"]),
    defaultAddress: {
      fullName: textOf(properties["預設收件人"]) || "",
      addressLine1: textOf(properties["地址第一行"]) || "",
      addressLine2: textOf(properties["地址第二行"]) || "",
      city: textOf(properties["城市"]) || "",
      stateProvince: textOf(properties["州省"]) || "",
      postalCode: textOf(properties["郵遞區號"]) || "",
      country: textOf(properties["國家"]) || "",
    },
    marketingOptIn: Boolean(properties["行銷訂閱"]?.checkbox),
  };
}

function parseCart(property) {
  const raw = textOf(property);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addressProperties(address = {}) {
  return {
    預設收件人: richText(String(address.fullName || "")),
    地址第一行: richText(String(address.addressLine1 || "")),
    地址第二行: richText(String(address.addressLine2 || "")),
    城市: richText(String(address.city || "")),
    州省: richText(String(address.stateProvince || "")),
    郵遞區號: richText(String(address.postalCode || "")),
    國家: richText(String(address.country || "")),
  };
}

async function getMemberDataSourceContext(notion, databaseId) {
  const database = await notion.databases.retrieve({ database_id: databaseId });
  const dataSourceId = database.data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error("No Notion data source found for this database.");
  }

  const dataSource = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });
  const titlePropertyName =
    Object.entries(dataSource.properties || {}).find(
      ([, property]) => property.type === "title"
    )?.[0] || "Name";

  return { dataSourceId, titlePropertyName };
}

function textOf(property) {
  if (!property) return "";
  if (property.type === "email") return property.email || "";
  if (property.type === "rich_text") {
    return (property.rich_text || []).map((item) => item.plain_text || "").join("");
  }
  if (property.type === "title") {
    return (property.title || []).map((item) => item.plain_text || "").join("");
  }
  if (property.type === "select") return property.select?.name || "";
  return "";
}

function richText(content) {
  return { rich_text: [{ text: { content: content || "" } }] };
}