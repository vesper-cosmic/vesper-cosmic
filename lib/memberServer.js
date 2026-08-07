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
 * - 密碼雜湊 (rich_text) — scrypt 雜湊，僅 email 登入使用
 * - 登入方式 (rich_text) — JSON 陣列，如 ["google", "password"]
 * - 會員建立日期 (date)
 * - 最後登入 (date)
 * - 行銷訂閱 (checkbox)
 * - 預設八字 (rich_text) — JSON 字串，存會員的默認出生資料（八字資料）
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

  try {
    const queryResult = await notion.dataSources.query({
      data_source_id: databaseId,
      filter: {
        property: "Email",
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
  } catch (error) {
    console.error("findMemberByEmail failed:", error);
    return { skipped: true, reason: error.message || "Member lookup failed." };
  }
}

export async function upsertMember({ email, name, defaultAddress = null }) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing member database config." };
  }

  try {
    const existing = await findMemberByEmail(email);
    if (existing?.skipped) return existing;

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
      parent: { database_id: databaseId },
      properties: {
        Email: { title: [{ text: { content: email.toLowerCase() } }] },
        顯示名稱: richText(name || ""),
        購物車: richText(""),
        預設收件人: richText(""),
        地址第一行: richText(""),
        地址第二行: richText(""),
        城市: richText(""),
        州省: richText(""),
        郵遞區號: richText(""),
        國家: richText(""),
        密碼雜湊: richText(""),
        登入方式: richText(""),
        會員建立日期: { date: { start: new Date().toISOString() } },
        最後登入: { date: { start: new Date().toISOString() } },
        行銷訂閱: { checkbox: false },
        ...(defaultAddress ? addressProperties(defaultAddress) : {}),
      },
    });

    return { skipped: false, created: true, member: parseMemberPage(created.properties) };
  } catch (error) {
    console.error("upsertMember failed:", error);
    return { skipped: true, reason: error.message || "Member upsert failed." };
  }
}

/**
 * Set (or clear) the password hash for a member.
 * Pass `null` to clear the hash entirely.
 */
export async function setMemberPassword(email, passwordHash) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };
  if (!email) return { skipped: true, reason: "Email is required." };

  try {
    const existing = await findMemberByEmail(email);
    if (existing?.skipped) return existing;
    if (!existing?.found) return { skipped: true, reason: "Member not found." };

    await notion.pages.update({
      page_id: existing.pageId,
      properties: {
        密碼雜湊: richText(passwordHash || ""),
      },
    });

    return { skipped: false, success: true };
  } catch (error) {
    console.error("setMemberPassword failed:", error);
    return { skipped: true, reason: error.message || "Password update failed." };
  }
}

/**
 * Append a login method to a member's 登入方式 list (deduplicated).
 * For example: "google", "password".
 */
export async function addMemberLoginMethod(email, method) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };

  try {
    const existing = await findMemberByEmail(email);
    if (existing?.skipped) return existing;
    if (!existing?.found) return { skipped: true, reason: "Member not found." };

    const methods = Array.isArray(existing.member?.loginMethods)
      ? existing.member.loginMethods
      : [];
    if (!methods.includes(method)) {
      methods.push(method);
    }

    await notion.pages.update({
      page_id: existing.pageId,
      properties: {
        登入方式: richText(JSON.stringify(methods)),
      },
    });

    return { skipped: false, success: true, loginMethods: methods };
  } catch (error) {
    console.error("addMemberLoginMethod failed:", error);
    return { skipped: true, reason: error.message || "Login method update failed." };
  }
}

export async function saveMemberCart(email, cartItems) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };
  if (!Array.isArray(cartItems)) {
    return { skipped: true, reason: "cartItems must be an array." };
  }

  try {
    const existing = await findMemberByEmail(email);
    if (existing?.skipped) return existing;

    if (!existing?.found) {
      const created = await upsertMember({ email, name: "", defaultAddress: null });
      if (created?.skipped) return created;
    }

    const fresh = await findMemberByEmail(email);
    if (fresh?.skipped) return fresh;
    if (!fresh?.found) return { skipped: true, reason: "Member not found after upsert." };

    await notion.pages.update({
      page_id: fresh.pageId,
      properties: {
        購物車: richText(JSON.stringify(cartItems)),
      },
    });

    return { skipped: false, success: true };
  } catch (error) {
    console.error("saveMemberCart failed:", error);
    return { skipped: true, reason: error.message || "Cart save failed." };
  }
}

export async function updateMemberDefaultAddress(email, defaultAddress) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };

  try {
    const existing = await findMemberByEmail(email);
    if (existing?.skipped) return existing;

    if (!existing?.found) {
      const created = await upsertMember({ email, name: "", defaultAddress });
      if (created?.skipped) return created;
      return { skipped: false, success: true };
    }

    await notion.pages.update({
      page_id: existing.pageId,
      properties: addressProperties(defaultAddress),
    });

    return { skipped: false, success: true };
  } catch (error) {
    console.error("updateMemberDefaultAddress failed:", error);
    return { skipped: true, reason: error.message || "Address update failed." };
  }
}

/**
 * Set (or clear) the default birth data (八字資料) for a member.
 * Stores the core BaZi birth fields so future orders can pre-fill.
 * Pass `null` to clear the stored default birth data entirely.
 */
export async function updateMemberDefaultBirthData(email, birthData) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };

  try {
    const existing = await findMemberByEmail(email);
    if (existing?.skipped) return existing;

    if (!existing?.found) {
      await upsertMember({ email, name: "" });
      const fresh = await findMemberByEmail(email);
      if (fresh?.skipped) return fresh;
      if (!fresh?.found) {
        return { skipped: true, reason: "Member not found after upsert." };
      }
      await notion.pages.update({
        page_id: fresh.pageId,
        properties: birthDataProperties(birthData),
      });
      return { skipped: false, success: true };
    }

    await notion.pages.update({
      page_id: existing.pageId,
      properties: birthDataProperties(birthData),
    });

    return { skipped: false, success: true };
  } catch (error) {
    console.error("updateMemberDefaultBirthData failed:", error);
    return { skipped: true, reason: error.message || "Birth data update failed." };
  }
}

export async function setupMembersDatabase() {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) {
    throw new Error("Missing NOTION_TOKEN or NOTION_MEMBERS_DATABASE_ID.");
  }

  const dataSourceResult = await notion.databases.update({
    database_id: databaseId,
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
    密碼雜湊: { rich_text: {} },
    登入方式: { rich_text: {} },
    會員建立日期: { date: {} },
    最後登入: { date: {} },
    行銷訂閱: { checkbox: {} },
    預設八字: { rich_text: {} },
  };
}

function parseMemberPage(properties) {
  const email = textOf(properties["Email"]) || textOf(properties["email"]) || "";
  return {
    email: String(email).toLowerCase(),
    name: textOf(properties["顯示名稱"]) || "",
    cart: parseCart(properties["購物車"]),
    passwordHash: textOf(properties["密碼雜湊"]) || "",
    loginMethods: parseLoginMethods(properties["登入方式"]),
    defaultAddress: {
      fullName: textOf(properties["預設收件人"]) || "",
      addressLine1: textOf(properties["地址第一行"]) || "",
      addressLine2: textOf(properties["地址第二行"]) || "",
      city: textOf(properties["城市"]) || "",
      stateProvince: textOf(properties["州省"]) || "",
      postalCode: textOf(properties["郵遞區號"]) || "",
      country: textOf(properties["國家"]) || "",
    },
    defaultBirthData: parseBirthData(properties["預設八字"]),
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

function parseBirthData(property) {
  const raw = textOf(property);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      birthDate: String(parsed.birthDate || ""),
      birthTime: String(parsed.birthTime || ""),
      biologicalGender: String(parsed.biologicalGender || ""),
      daylightSavingTime: String(parsed.daylightSavingTime || ""),
      birthLocation: String(parsed.birthLocation || ""),
    };
  } catch {
    return null;
  }
}

function birthDataProperties(birthData = null) {
  if (!birthData) {
    return { 預設八字: richText("") };
  }
  return {
    預設八字: richText(
      JSON.stringify({
        birthDate: String(birthData.birthDate || ""),
        birthTime: String(birthData.birthTime || ""),
        biologicalGender: String(birthData.biologicalGender || ""),
        daylightSavingTime: String(birthData.daylightSavingTime || ""),
        birthLocation: String(birthData.birthLocation || ""),
      })
    ),
  };
}

function parseLoginMethods(property) {
  const raw = textOf(property);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((m) => typeof m === "string") : [];
  } catch {
    // Legacy/empty value
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