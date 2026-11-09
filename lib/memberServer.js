import "server-only";

import { Client } from "@notionhq/client";
import { resolveDataSourceId } from "@/lib/notionDataSource";

/**
 * Members database (Notion) — Taiwan-only version
 *
 * 欄位設計：
 * - Email (title / email) — 會員唯一識別
 * - 顯示名稱 (rich_text)
 * - 生日 (date) — 會員生日
 * - 購物車 (rich_text) — JSON 字串，存會員購物車
 * - 預設收件人 (rich_text)
 * - 地址第一行 (rich_text)
 * - 地址第二行 (rich_text)
 * - 城市 (rich_text)
 * - 郵遞區號 (rich_text)
 * - 登入方式 (rich_text) — JSON 陣列，如 ["google"]
 * - 會員建立日期 (date)
 * - 最後登入 (date)
 * - 行銷訂閱 (checkbox)
 * - 推送通知許可 (checkbox)
 * - 推薦碼 (rich_text) — 唯一推薦碼，格式: USER-{用戶ID}
 * - 推薦人信箱 (email) — 誰推薦的這個會員
 * - 累計返利 (number) — 推薦返利累計金額（台幣）
 * - 購物車 (rich_text) — JSON 字串，存會員購物車
 * - 總消費金額 (number) — 累計購買金額（台幣）
 * - 訂單數 (number) — 總訂單數
 * - 上次購買日期 (date) — 上次下單日期
 * - 會員等級 (select) — 銅級 / 銀級 / 金級 / 白金級
 */

export function createMemberClient() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({ auth: process.env.NOTION_TOKEN });
}

// Makes sure the Notion database has every column this file writes to.
function memberDataSourceId(notion, databaseId) {
  return resolveDataSourceId(notion, databaseId, {
    title: "Email",
    properties: memberDatabaseProperties(),
    renames: OLD_BALANCE_COLUMNS,
  });
}

/**
 * Generate a unique referral code based on user email.
 * Format: USER-{first5chars of base32 encoded email hash}
 */
export function generateReferralCode(email) {
  const crypto = require("crypto");
  const hash = crypto
    .createHash("sha256")
    .update(email.toLowerCase())
    .digest();
  const base32 = hash
    .toString("base64")
    .replace(/[+/=]/g, "")
    .toUpperCase()
    .substring(0, 5);
  return `USER-${base32}`;
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
      data_source_id: await memberDataSourceId(notion, databaseId),
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

/**
 * Find the signed-in member, creating the record if it is missing (e.g. the
 * sign-in upsert failed earlier). Same return shape as findMemberByEmail.
 */
export async function findOrCreateMember(email, name = "") {
  const result = await findMemberByEmail(email);
  if (result?.skipped || result?.found) return result;

  const created = await upsertMember({ email, name });
  if (created?.skipped) return created;
  return findMemberByEmail(email);
}

/**
 * Create a minimal member record from order data if member doesn't exist
 * Used when an order from non-member customer has a referral code
 */
export async function createMemberFromOrder(email, customerName = "") {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing member database config." };
  }

  try {
    const existing = await findMemberByEmail(email);
    if (existing?.skipped) return existing;

    if (existing?.found) {
      return { skipped: false, created: false, member: existing.member };
    }

    const referralCode = generateReferralCode(email);
    const created = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Email: { title: [{ text: { content: email.toLowerCase() } }] },
        顯示名稱: richText(customerName || ""),
        生日: { date: null },
        購物車: richText(""),
        預設收件人: richText(customerName || ""),
        地址第一行: richText(""),
        地址第二行: richText(""),
        城市: richText(""),
        郵遞區號: richText(""),
        登入方式: richText(JSON.stringify(["order"])),
        會員建立日期: { date: { start: new Date().toISOString() } },
        最後登入: { date: { start: new Date().toISOString() } },
        行銷訂閱: { checkbox: false },
        推送通知許可: { checkbox: false },
        推薦碼: richText(referralCode),
        推薦人信箱: { email: "" },
        累計返利: { number: 0 },
        總消費金額: { number: 0 },
        訂單數: { number: 0 },
        上次購買日期: { date: null },
        會員等級: { select: { name: "銅級" } },
      },
    });

    return { skipped: false, created: true, member: parseMemberPage(created.properties) };
  } catch (error) {
    console.error("createMemberFromOrder failed:", error);
    return { skipped: true, reason: error.message || "Member creation from order failed." };
  }
}

export async function upsertMember({ email, name, defaultAddress = null, referredByEmail = null }) {
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

    const referralCode = generateReferralCode(email);
    const created = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Email: { title: [{ text: { content: email.toLowerCase() } }] },
        顯示名稱: richText(name || ""),
        生日: { date: null },
        購物車: richText(""),
        預設收件人: richText(""),
        地址第一行: richText(""),
        地址第二行: richText(""),
        城市: richText(""),
        郵遞區號: richText(""),
        登入方式: richText(""),
        會員建立日期: { date: { start: new Date().toISOString() } },
        最後登入: { date: { start: new Date().toISOString() } },
        行銷訂閱: { checkbox: false },
        推送通知許可: { checkbox: false },
        推薦碼: richText(referralCode),
        推薦人信箱: richText(referredByEmail ? referredByEmail.toLowerCase() : ""),
        累計返利: { number: 0 },
        總消費金額: { number: 0 },
        訂單數: { number: 0 },
        上次購買日期: { date: null },
        會員等級: { select: { name: "銅級" } },
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
 * Append a login method to a member's 登入方式 list (deduplicated).
 * For example: "google", "order".
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
/**
 * Find member by referral code
 */
export async function findMemberByReferralCode(referralCode) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing member database config." };
  }

  try {
    const queryResult = await notion.dataSources.query({
      data_source_id: await memberDataSourceId(notion, databaseId),
      filter: {
        property: "推薦碼",
        rich_text: { equals: referralCode.toUpperCase() },
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
    console.error("findMemberByReferralCode failed:", error);
    return { skipped: true, reason: error.message || "Referral code lookup failed." };
  }
}

/**
 * Update referrer info when a new member is referred
 */
// Referral balances mirrored into Notion so they are visible there.
// (The site always recalculates them from orders; these are a copy.)
export const BALANCE_COLUMNS = {
  available: "待提現分潤",
  pending: "待實現分潤",
  processing: "撥款處理中",
  lifetime: "歷史累積分潤",
};

// Earlier English column names, renamed to the Chinese ones if present.
const OLD_BALANCE_COLUMNS = {
  "Available to Withdraw": BALANCE_COLUMNS.available,
  Pending: BALANCE_COLUMNS.pending,
  "Payout Processing": BALANCE_COLUMNS.processing,
  "Lifetime Earnings": BALANCE_COLUMNS.lifetime,
};

/** Write the four referral balances to the member's Notion columns. */
export async function saveMemberBalances(pageId, balances) {
  const notion = createMemberClient();
  if (!notion || !pageId) return { skipped: true, reason: "Missing config." };
  const properties = {};
  for (const [key, name] of Object.entries(BALANCE_COLUMNS)) {
    properties[name] = { number: Number(balances[key]) || 0 };
  }
  await notion.pages.update({ page_id: pageId, properties });
  return { skipped: false };
}

/**
 * Save payout details and/or the withdrawal list on a member record.
 * `changes`: { payoutInfo?, withdrawals? }
 */
export async function saveMemberPayoutData(pageId, changes = {}) {
  const notion = createMemberClient();
  if (!notion || !pageId) return { skipped: true, reason: "Missing config." };

  const properties = {};
  if (changes.payoutInfo !== undefined) {
    properties.收款資訊 = longRichText(JSON.stringify(changes.payoutInfo));
  }
  if (changes.withdrawals !== undefined) {
    properties.提現紀錄 = longRichText(JSON.stringify(changes.withdrawals));
  }
  await notion.pages.update({ page_id: pageId, properties });
  return { skipped: false };
}

/** Members with at least one withdrawal still being processed. */
export async function findMembersWithWithdrawals({ processingOnly = true } = {}) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();
  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing member database config." };
  }

  try {
    const members = [];
    let cursor;
    do {
      const result = await notion.dataSources.query({
        data_source_id: await memberDataSourceId(notion, databaseId),
        filter: {
          property: "提現紀錄",
          rich_text: processingOnly
            ? { contains: '"status":"processing"' }
            : { is_not_empty: true },
        },
        start_cursor: cursor,
        page_size: 100,
      });
      for (const page of result.results) {
        members.push({ pageId: page.id, member: parseMemberPage(page.properties) });
      }
      cursor = result.has_more ? result.next_cursor : undefined;
    } while (cursor);
    return { skipped: false, members };
  } catch (error) {
    console.error("findMembersWithWithdrawals failed:", error);
    return { skipped: true, reason: error.message || "Withdrawal lookup failed." };
  }
}

export async function updateMemberReferrer(memberEmail, referrerEmail) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };

  try {
    const member = await findMemberByEmail(memberEmail);
    if (member?.skipped) return member;
    if (!member?.found) return { skipped: true, reason: "Member not found." };

    await notion.pages.update({
      page_id: member.pageId,
      properties: {
        推薦人信箱: richText(referrerEmail.toLowerCase()),
      },
    });

    return { skipped: false, success: true };
  } catch (error) {
    console.error("updateMemberReferrer failed:", error);
    return { skipped: true, reason: error.message || "Referrer update failed." };
  }
}

/**
 * Update member's birthday (stored as date)
 */
export async function updateMemberBirthday(email, birthdayISO) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };

  try {
    const existing = await findMemberByEmail(email);
    if (existing?.skipped) return existing;
    if (!existing?.found) return { skipped: true, reason: "Member not found." };

    await notion.pages.update({
      page_id: existing.pageId,
      properties: {
        生日: birthdayISO ? { date: { start: birthdayISO } } : { date: null },
      },
    });

    return { skipped: false, success: true };
  } catch (error) {
    console.error("updateMemberBirthday failed:", error);
    return { skipped: true, reason: error.message || "Birthday update failed." };
  }
}

/**
 * Update member spending and order count after purchase
 * Also updates member level based on total spending
 */
export async function updateMemberPurchaseStats(email, orderAmount) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };
  if (typeof orderAmount !== "number" || orderAmount < 0) {
    return { skipped: true, reason: "Invalid order amount." };
  }

  try {
    const existing = await findMemberByEmail(email);
    if (existing?.skipped) return existing;
    if (!existing?.found) return { skipped: true, reason: "Member not found." };

    const member = existing.member;
    const newTotalSpending = (member.totalSpending || 0) + orderAmount;
    const newOrderCount = (member.orderCount || 0) + 1;
    const newMemberLevel = calculateMemberLevel(newTotalSpending);

    await notion.pages.update({
      page_id: existing.pageId,
      properties: {
        總消費金額: { number: newTotalSpending },
        訂單數: { number: newOrderCount },
        上次購買日期: { date: { start: new Date().toISOString() } },
        會員等級: { select: { name: newMemberLevel } },
      },
    });

    return {
      skipped: false,
      success: true,
      totalSpending: newTotalSpending,
      orderCount: newOrderCount,
      memberLevel: newMemberLevel,
    };
  } catch (error) {
    console.error("updateMemberPurchaseStats failed:", error);
    return { skipped: true, reason: error.message || "Purchase stats update failed." };
  }
}

/**
 * Calculate member level based on total spending (in TWD)
 * 銅級: 0 - 999
 * 銀級: 1000 - 4999
 * 金級: 5000 - 14999
 * 白金級: 15000+
 */
export function calculateMemberLevel(totalSpending) {
  if (totalSpending >= 15000) return "白金級";
  if (totalSpending >= 5000) return "金級";
  if (totalSpending >= 1000) return "銀級";
  return "銅級";
}

/**
 * Add referral reward to referrer
 */
export async function addReferralReward(referrerEmail, amount) {
  const notion = createMemberClient();
  const databaseId = await getMembersDatabaseId();

  if (!notion || !databaseId) return { skipped: true, reason: "Missing config." };

  try {
    const referrer = await findMemberByEmail(referrerEmail);
    if (referrer?.skipped) return referrer;
    if (!referrer?.found) return { skipped: true, reason: "Referrer not found." };

    const currentReward = referrer.member?.totalReferralReward || 0;
    const newReward = currentReward + amount;

    await notion.pages.update({
      page_id: referrer.pageId,
      properties: {
        累計返利: { number: newReward },
      },
    });

    return { skipped: false, success: true, totalReward: newReward };
  } catch (error) {
    console.error("addReferralReward failed:", error);
    return { skipped: true, reason: error.message || "Reward update failed." };
  }
}

/** Subscribe / unsubscribe the member from marketing emails (行銷訂閱). */
export async function setMemberMarketingOptIn(email, optIn, name = "") {
  const notion = createMemberClient();
  if (!notion) return { skipped: true, reason: "Missing config." };

  const found = await findOrCreateMember(email, name);
  if (found?.skipped) return found;
  if (!found?.found) return { skipped: true, reason: "Member not found." };

  await notion.pages.update({
    page_id: found.pageId,
    properties: { 行銷訂閱: { checkbox: Boolean(optIn) } },
  });
  return { skipped: false, marketingOptIn: Boolean(optIn) };
}

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
    生日: { date: {} },
    購物車: { rich_text: {} },
    預設收件人: { rich_text: {} },
    地址第一行: { rich_text: {} },
    地址第二行: { rich_text: {} },
    城市: { rich_text: {} },
    郵遞區號: { rich_text: {} },
    登入方式: { rich_text: {} },
    會員建立日期: { date: {} },
    最後登入: { date: {} },
    行銷訂閱: { checkbox: {} },
    推送通知許可: { checkbox: {} },
    推薦碼: { rich_text: {} },
    收款資訊: { rich_text: {} },
    提現紀錄: { rich_text: {} },
    ...Object.fromEntries(
      Object.values(BALANCE_COLUMNS).map((name) => [name, { number: { format: "dollar" } }])
    ),
    推薦人信箱: { rich_text: {} },
    累計返利: { number: {} },
    總消費金額: { number: {} },
    訂單數: { number: {} },
    上次購買日期: { date: {} },
    會員等級: { select: {} },
  };
}

function parseMemberPage(properties) {
  const email = textOf(properties["Email"]) || textOf(properties["email"]) || "";
  const birthdateStr = properties["生日"]?.date?.start || null;

  return {
    email: String(email).toLowerCase(),
    name: textOf(properties["顯示名稱"]) || "",
    birthday: birthdateStr ? new Date(birthdateStr).toISOString().split("T")[0] : null,
    cart: parseCart(properties["購物車"]),
    loginMethods: parseLoginMethods(properties["登入方式"]),
    defaultAddress: {
      fullName: textOf(properties["預設收件人"]) || "",
      addressLine1: textOf(properties["地址第一行"]) || "",
      addressLine2: textOf(properties["地址第二行"]) || "",
      city: textOf(properties["城市"]) || "",
      postalCode: textOf(properties["郵遞區號"]) || "",
    },
    marketingOptIn: Boolean(properties["行銷訂閱"]?.checkbox),
    pushNotificationOptIn: Boolean(properties["推送通知許可"]?.checkbox),
    referralCode: textOf(properties["推薦碼"]) || "",
    referredByEmail: textOf(properties["推薦人信箱"]) || "",
    totalReferralReward: properties["累計返利"]?.number || 0,
    payoutInfo: parseJson(textOf(properties["收款資訊"]), null),
    withdrawals: parseJson(textOf(properties["提現紀錄"]), []),
    storedBalances: Object.fromEntries(
      Object.entries(BALANCE_COLUMNS).map(([key, name]) => [key, properties[name]?.number ?? null])
    ),
    totalSpending: properties["總消費金額"]?.number || 0,
    orderCount: properties["訂單數"]?.number || 0,
    lastPurchaseDate: properties["上次購買日期"]?.date?.start || null,
    memberLevel: properties["會員等級"]?.select?.name || "銅級",
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
    郵遞區號: richText(String(address.postalCode || "")),
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

function parseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Long text split into ≤1900-character pieces (Notion's limit is 2000).
function longRichText(content) {
  const characters = Array.from(content || "");
  const chunks = [];
  for (let index = 0; index < characters.length; index += 1900) {
    chunks.push({ text: { content: characters.slice(index, index + 1900).join("") } });
  }
  return { rich_text: chunks.length ? chunks : [{ text: { content: "" } }] };
}

function richText(content) {
  return { rich_text: [{ text: { content: content || "" } }] };
}