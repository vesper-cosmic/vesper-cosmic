// Builds the AI design instruction for a custom nail order: the owner's fixed
// template + the calculated chart + the customer's requests. Pure, no I/O.
// Deliberately leaves out the customer's name, email, address and birthplace.

import { NAIL_DESIGN_TEMPLATE } from "@/data/nailDesignTemplate";
import { formatChartText } from "@/lib/baziChart";

const clean = (v) => String(v ?? "").trim();
const list = (v) => (Array.isArray(v) ? v.map(clean).filter(Boolean).join("、") : clean(v));

/**
 * Customer requests as plain lines, from one order item
 * (item.birth, item.nails, item.intention, item.notes as stored on the order).
 */
export function requestLines(item = {}) {
  const birth = item.birth || {};
  const nails = item.nails || {};
  const rows = [
    ["性別（生理）", birth.biologicalGender],
    ["想加強的面向", list(birth.baziIntentions) || clean(item.intention)],
    ["具體願望", birth.specificIntentions],
    ["指甲形狀", nails.nailShape],
    ["指甲長度", nails.nailLength],
    ["風格偏好", nails.stylePreference],
    ["混搭尺寸", nails.mixedSet ? "是" : ""],
    ["指甲備註", nails.nailNotes],
    ["訂單備註", item.notes],
  ];
  return rows.filter(([, v]) => clean(v)).map(([k, v]) => `${k}：${clean(v)}`);
}

/**
 * @param {{ chart: object, item?: object, yongshen?: string, extra?: string }} input
 * yongshen: the owner's own 喜用神 call, if any (overrides the AI's judgement).
 * extra: anything else the owner wants to add (colours, notes…).
 * crystals: [{ name, stock? }] — the crystals offered for this set; when given,
 * the AI may only pick crystals from this list.
 */
export function buildNailDesignPrompt({ chart, item = {}, yongshen = "", extra = "", crystals = [] }) {
  const requests = requestLines(item);
  const sections = [
    "## 本次客人資料",
    "### 八字排盤（系統計算，請直接採用）",
    formatChartText(chart),
    "### 喜用神",
    clean(yongshen) ? `設計師指定：${clean(yongshen)}` : "設計師未指定，請依命局旺衰、格局及生剋關係自行判斷，並說明理由。",
    "### 客人需求",
    requests.length ? requests.join("\n") : "（客人未填寫額外需求，請依命理分析選擇最適合的方向。）",
  ];
  const offered = (crystals || []).map((c) => clean(c?.name)).filter(Boolean);
  if (offered.length) {
    sections.push(
      "### 設計師可用的水晶／寶石（庫存內）",
      offered.map((n) => `- ${n}`).join("\n"),
      "水晶、寶石及鑲嵌物請只從上列挑選；不要使用清單以外的種類。可以不全部用上，也要考慮每一款在甲面上的大小與佩戴性。"
    );
  }
  if (clean(extra)) sections.push("### 設計師補充", clean(extra));
  return `${NAIL_DESIGN_TEMPLATE}\n\n---\n\n${sections.join("\n\n")}\n`;
}
