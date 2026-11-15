import "server-only";

import { Client } from "@notionhq/client";
import { resolveDataSourceId } from "@/lib/notionDataSource";
import { normalizeSettings } from "@/lib/profit";

// Net-profit settings live in one row of the Notion "設定 Settings" database
// (NOTION_SETTINGS_DATABASE_ID): title = "profit", the JSON in the 設定值 column.
// Without the database the built-in defaults are used and saving is refused.

const TITLE = "名稱";
const VALUE = "設定值 (JSON)";
const KEY = "profit";
const SCHEMA = { title: TITLE, properties: { [VALUE]: { rich_text: {} } } };

function client() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({
    auth: process.env.NOTION_TOKEN,
    fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
  });
}

export function profitSettingsConfigured() {
  return Boolean(process.env.NOTION_TOKEN && process.env.NOTION_SETTINGS_DATABASE_ID);
}

async function findRow(notion, sourceId) {
  const found = await notion.dataSources.query({
    data_source_id: sourceId,
    filter: { property: TITLE, title: { equals: KEY } },
    page_size: 1,
  });
  return found.results?.[0] || null;
}

/** Effective settings: saved values over the defaults. Never throws. */
export async function loadProfitSettings() {
  const notion = client();
  if (!notion || !profitSettingsConfigured()) return { settings: normalizeSettings(), source: "default" };
  try {
    const sourceId = await resolveDataSourceId(notion, process.env.NOTION_SETTINGS_DATABASE_ID, SCHEMA);
    const row = await findRow(notion, sourceId);
    const json = (row?.properties?.[VALUE]?.rich_text || []).map((t) => t.plain_text || "").join("");
    return { settings: normalizeSettings(json ? JSON.parse(json) : {}), source: row ? "notion" : "default" };
  } catch (error) {
    console.error("loadProfitSettings failed:", error.message);
    return { settings: normalizeSettings(), source: "default", error: error.message };
  }
}

/** Save (normalised) settings. @returns {{ ok: boolean, settings?: object, error?: string }} */
export async function saveProfitSettings(input) {
  const notion = client();
  if (!notion || !profitSettingsConfigured()) return { ok: false, error: "尚未設定 NOTION_SETTINGS_DATABASE_ID。" };
  const settings = normalizeSettings(input);
  const json = JSON.stringify(settings);
  const rich = { rich_text: json.match(/[\s\S]{1,1900}/g).map((chunk) => ({ text: { content: chunk } })) };
  try {
    const sourceId = await resolveDataSourceId(notion, process.env.NOTION_SETTINGS_DATABASE_ID, SCHEMA);
    const row = await findRow(notion, sourceId);
    if (row) await notion.pages.update({ page_id: row.id, properties: { [VALUE]: rich } });
    else {
      await notion.pages.create({
        parent: { type: "data_source_id", data_source_id: sourceId },
        properties: { [TITLE]: { title: [{ text: { content: KEY } }] }, [VALUE]: rich },
      });
    }
    return { ok: true, settings };
  } catch (error) {
    console.error("saveProfitSettings failed:", error);
    return { ok: false, error: error.message || "Could not save the settings." };
  }
}
