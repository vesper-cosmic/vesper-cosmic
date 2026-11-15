import "server-only";

import { Client } from "@notionhq/client";
import { resolveDataSourceId } from "@/lib/notionDataSource";
import { CUSTOMS_PRESETS, resolvePresets } from "./presets.js";

// Admin overrides for the customs presets, kept in the Notion
// "Customs Presets" database (NOTION_CUSTOMS_PRESETS_DATABASE_ID).
// One row per preset: the title is the preset id (e.g. "press-on-nails").
// Without the database the code presets are used as they are.

const COLUMNS = {
  description: "海關品名 Description",
  htsus: "HTSUS",
  weight: "單件重量 (g)",
  fragile: "易碎",
};

const SCHEMA_PROPERTIES = {
  [COLUMNS.description]: { rich_text: {} },
  [COLUMNS.htsus]: { rich_text: {} },
  [COLUMNS.weight]: { number: { format: "number" } },
  [COLUMNS.fragile]: { checkbox: {} },
};

const PRESET_IDS = new Set(CUSTOMS_PRESETS.map((p) => p.id));

function client() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({
    auth: process.env.NOTION_TOKEN,
    // Never serve a cached Notion response (Next.js caches server fetches).
    fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
  });
}

function databaseId() {
  return process.env.NOTION_CUSTOMS_PRESETS_DATABASE_ID || "";
}

const text = (property) =>
  (property?.rich_text || property?.title || []).map((item) => item.plain_text || "").join("");

async function dataSource(notion) {
  const id = await resolveDataSourceId(notion, databaseId(), { properties: SCHEMA_PROPERTIES });
  const source = await notion.dataSources.retrieve({ data_source_id: id });
  const titleName = Object.entries(source.properties).find(([, p]) => p.type === "title")?.[0];
  return { id, titleName };
}

/**
 * Effective presets: code defaults with the admin's overrides applied.
 * Returns { presets, source: "notion" | "code", error? } and never throws,
 * so the product form keeps working when Notion is unreachable.
 */
export async function loadPresets() {
  const notion = client();
  if (!notion || !databaseId()) {
    return { presets: resolvePresets(), source: "code" };
  }
  try {
    const { id, titleName } = await dataSource(notion);
    const overrides = {};
    let cursor;
    do {
      const page = await notion.dataSources.query({ data_source_id: id, page_size: 100, start_cursor: cursor });
      for (const row of page.results || []) {
        const key = text(row.properties?.[titleName]).trim();
        if (!PRESET_IDS.has(key)) continue;
        overrides[key] = {
          customsDescription: text(row.properties?.[COLUMNS.description]),
          htsus: text(row.properties?.[COLUMNS.htsus]),
          unitWeightG: row.properties?.[COLUMNS.weight]?.number ?? null,
          fragile: row.properties?.[COLUMNS.fragile]?.checkbox,
        };
      }
      cursor = page.has_more ? page.next_cursor || undefined : undefined;
    } while (cursor);
    return { presets: resolvePresets(overrides), source: "notion" };
  } catch (error) {
    console.error("loadPresets failed:", error);
    return { presets: resolvePresets(), source: "code", error: error.message || "Could not read presets." };
  }
}

/** Save one preset's overrides (creates or updates its row). */
export async function savePreset(id, values) {
  if (!PRESET_IDS.has(id)) return { ok: false, error: "Unknown preset." };
  const notion = client();
  if (!notion || !databaseId()) {
    return { ok: false, error: "尚未設定 NOTION_CUSTOMS_PRESETS_DATABASE_ID。" };
  }
  const rich = (value) => ({ rich_text: [{ text: { content: String(value || "").slice(0, 1900) } }] });
  const weight = Number(values.unitWeightG);
  try {
    const { id: sourceId, titleName } = await dataSource(notion);
    const properties = {
      [COLUMNS.description]: rich(String(values.customsDescription || "").trim()),
      [COLUMNS.htsus]: rich(String(values.htsus || "").replace(/[\s.]/g, "")),
      [COLUMNS.weight]: { number: Number.isFinite(weight) && weight > 0 ? weight : null },
      [COLUMNS.fragile]: { checkbox: Boolean(values.fragile) },
    };
    const existing = await notion.dataSources.query({
      data_source_id: sourceId,
      filter: { property: titleName, title: { equals: id } },
      page_size: 1,
    });
    const row = existing.results?.[0];
    if (row) {
      await notion.pages.update({ page_id: row.id, properties });
    } else {
      await notion.pages.create({
        parent: { type: "data_source_id", data_source_id: sourceId },
        properties: { [titleName]: { title: [{ text: { content: id } }] }, ...properties },
      });
    }
    return { ok: true };
  } catch (error) {
    console.error("savePreset failed:", error);
    return { ok: false, error: error.message || "Could not save the preset." };
  }
}
