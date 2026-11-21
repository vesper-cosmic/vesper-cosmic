// Four Pillars (八字) chart from a birth date and time. Pure calculation, no I/O.
//
// The pillars come from a calendar library, not from an AI: stem/branch rules,
// solar terms (節氣) for the month pillar and the hour pillar are fixed maths.
// What this does NOT decide is 旺衰 and 喜用神 — those are judgement calls and
// stay with the designer / the prompt.
//
// Conventions (printed with the chart so the owner can check them):
//  - Without a time zone + longitude the time is used as typed (clock time).
//    With them it is converted to true solar time (see trueSolarTime).
//  - 23:00–23:59 counts as the NEXT day's 子時 (the common 晚子時 rule).
//  - Without a time zone, "Daylight saving: Yes" moves the clock back one hour.

import { Solar } from "lunar-javascript";

export const ELEMENTS = ["木", "火", "土", "金", "水"];

const STEM_ELEMENT = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };
const BRANCH_ELEMENT = { 子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水" };
// Month branch → season (月令).
const BRANCH_SEASON = {
  寅: "春", 卯: "春", 辰: "春末(土旺)", 巳: "夏", 午: "夏", 未: "夏末(土旺)",
  申: "秋", 酉: "秋", 戌: "秋末(土旺)", 亥: "冬", 子: "冬", 丑: "冬末(土旺)",
};

export const BAZI_CONVENTIONS = [
  "有填時區與經度時，已換算成真太陽時（經度差 + 均時差 + 當地當時的夏令/歷史時區）；沒填則以輸入的時鐘時間為準。",
  "23:00–23:59 的晚子時，日柱算隔天。",
  "沒有時區時，夏令時間選「Yes」會先把時間減一小時。",
  "月柱依節氣（非農曆初一）交接。",
];

/** Offset (ms) of an IANA time zone from UTC at an instant. Uses the tz database built into the runtime. */
export function zoneOffsetMs(timeZone, ms) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
  }).formatToParts(new Date(ms));
  const v = Object.fromEntries(parts.map((p) => [p.type, Number(p.value)]));
  return Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second) - Math.floor(ms / 1000) * 1000;
}

/** Equation of time in minutes (apparent − mean solar time), ±~1 min. */
export function equationOfTimeMinutes(utcMs) {
  const d = new Date(utcMs);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((utcMs - start) / 86400000);
  const b = ((360 / 365) * (dayOfYear - 81) * Math.PI) / 180;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/**
 * Wall-clock time in a zone → true solar time at a longitude.
 * @returns {{ ok: true, solarMs: number, longitudeMin: number, eotMin: number, zoneOffsetMin: number } | { ok: false, error: string }}
 */
export function trueSolarTime(wallUtcFieldsMs, timeZone, longitude) {
  const lon = Number(longitude);
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return { ok: false, error: "經度需介於 -180 到 180（東經為正、西經為負）。" };
  try {
    // Wall time → real instant (two passes so the offset is taken at the right moment).
    let utc = wallUtcFieldsMs - zoneOffsetMs(timeZone, wallUtcFieldsMs);
    utc = wallUtcFieldsMs - zoneOffsetMs(timeZone, utc);
    const eot = equationOfTimeMinutes(utc);
    const solarMs = utc + (lon / 15) * 3600 * 1000 + eot * 60 * 1000;
    return {
      ok: true,
      solarMs,
      eotMin: Math.round(eot * 10) / 10,
      zoneOffsetMin: Math.round((wallUtcFieldsMs - utc) / 60000),
      longitudeMin: Math.round((solarMs - eot * 60000 - wallUtcFieldsMs) / 60000 * 10) / 10,
    };
  } catch {
    return { ok: false, error: `不認得的時區：${timeZone}（請用 IANA 名稱，例如 Asia/Taipei）。` };
  }
}

const clean = (v) => String(v ?? "").trim();

/** "YYYY-MM-DD" + "HH:MM" → { y, m, d, hh, mm } or null. */
function parseBirth(birthDate, birthTime) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birthDate || "").trim());
  const t = /^(\d{1,2}):(\d{2})$/.exec(String(birthTime || "").trim());
  if (!d || !t) return null;
  const parts = { y: Number(d[1]), m: Number(d[2]), d: Number(d[3]), hh: Number(t[1]), mm: Number(t[2]) };
  if (parts.m < 1 || parts.m > 12 || parts.d < 1 || parts.d > 31 || parts.hh > 23 || parts.mm > 59) return null;
  return parts;
}

/**
 * @param {{ birthDate: string, birthTime: string, biologicalGender?: string, daylightSavingTime?: string }} birth
 * @param {{ timeZone?: string, longitude?: number|string }} [place] both given → true solar time
 * @returns {{ ok: true, chart: object } | { ok: false, error: string }}
 */
export function computeBaziChart(birth, place = {}) {
  const p = parseBirth(birth?.birthDate, birth?.birthTime);
  if (!p) return { ok: false, error: "出生日期或時間格式不正確（需要 YYYY-MM-DD 與 HH:MM）。" };

  let date = new Date(Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm));
  if (date.getUTCMonth() !== p.m - 1) return { ok: false, error: "出生日期不存在。" };

  const wantSolar = Boolean(clean(place?.timeZone)) && clean(place?.longitude) !== "";
  let solar = null;
  let dst = false;
  if (wantSolar) {
    const t = trueSolarTime(date.getTime(), clean(place.timeZone), place.longitude);
    if (!t.ok) return { ok: false, error: t.error };
    solar = { ...t, timeZone: clean(place.timeZone), longitude: Number(place.longitude) };
    date = new Date(Math.round(t.solarMs / 60000) * 60000);
  } else {
    // No place: clock time is used; "DST: Yes" means one hour ahead of standard time.
    dst = String(birth?.daylightSavingTime || "") === "Yes";
    if (dst) date = new Date(date.getTime() - 3600 * 1000);
  }
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();

  const eight = Solar.fromYmdHms(y, m, d, hh, mm, 0).getLunar().getEightChar();
  eight.setSect(1); // 晚子時 → next day's day pillar

  const rows = [
    { key: "year", label: "年柱", pillar: eight.getYear(), hidden: eight.getYearHideGan() },
    { key: "month", label: "月柱", pillar: eight.getMonth(), hidden: eight.getMonthHideGan() },
    { key: "day", label: "日柱", pillar: eight.getDay(), hidden: eight.getDayHideGan() },
    { key: "hour", label: "時柱", pillar: eight.getTime(), hidden: eight.getTimeHideGan() },
  ].map((r) => ({
    key: r.key,
    label: r.label,
    pillar: r.pillar,
    stem: r.pillar[0],
    branch: r.pillar[1],
    stemElement: STEM_ELEMENT[r.pillar[0]],
    branchElement: BRANCH_ELEMENT[r.pillar[1]],
    hiddenStems: r.hidden,
  }));

  // Element counts: the 8 visible characters, and again with hidden stems.
  const surface = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));
  const withHidden = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));
  for (const r of rows) {
    surface[r.stemElement] += 1;
    surface[r.branchElement] += 1;
    withHidden[r.stemElement] += 1;
    for (const h of r.hiddenStems) withHidden[STEM_ELEMENT[h]] += 1;
  }

  // Warnings: a few minutes of clock error here flips a pillar.
  const warnings = [];
  const r = (hh * 60 + mm + 60) % 120; // 0 = exactly on a 時辰 boundary (23:00, 01:00, 03:00 …)
  const toBoundary = Math.min(r, 120 - r);
  if (toBoundary <= 15) {
    warnings.push(`時間離時辰交界只有約 ${toBoundary} 分鐘，時柱（23 點附近連日柱）可能因為幾分鐘的誤差而改變，建議跟客人確認出生時間。`);
  }
  const lunar = Solar.fromYmdHms(y, m, d, hh, mm, 0).getLunar();
  const here = Date.UTC(y, m - 1, d, hh, mm);
  const nearJie = [lunar.getPrevJie(true), lunar.getNextJie(true)]
    .map((j) => {
      const s = j.getSolar();
      return { name: j.getName(), diffH: Math.abs(here - Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute())) / 3600000 };
    })
    .find((j) => j.diffH <= 3);
  if (nearJie) warnings.push(`出生時間離節氣「${nearJie.name}」只有約 ${nearJie.diffH.toFixed(1)} 小時，月柱（或年柱）可能換邊，請特別核對。`);

  const dayRow = rows[2];
  const monthRow = rows[1];
  return {
    ok: true,
    chart: {
      pillars: rows,
      dayMaster: dayRow.stem,
      dayMasterElement: dayRow.stemElement,
      monthBranch: monthRow.branch,
      season: BRANCH_SEASON[monthRow.branch],
      elementsSurface: surface,
      elementsWithHidden: withHidden,
      missingSurface: ELEMENTS.filter((e) => surface[e] === 0),
      usedClock: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}${dst ? "（已扣夏令一小時）" : solar ? "（真太陽時）" : "（未校正，時鐘時間）"}`,
      inputClock: `${birth.birthDate} ${String(p.hh).padStart(2, "0")}:${String(p.mm).padStart(2, "0")}`,
      solar,
      warnings,
      gender: birth?.biologicalGender || "",
    },
  };
}

/** The chart as plain text for the prompt. */
export function formatChartText(chart) {
  const line = (r) =>
    `${r.label}：${r.pillar}（${r.stem}${r.stemElement}／${r.branch}${r.branchElement}；藏干 ${r.hiddenStems.join("、") || "—"}）`;
  const counts = (obj) => ELEMENTS.map((e) => `${e}${obj[e]}`).join(" ");
  return [
    ...chart.pillars.map(line),
    `日主：${chart.dayMaster}（${chart.dayMasterElement}）`,
    `月令：${chart.monthBranch}月（${chart.season}）`,
    `五行數量（僅天干地支八字）：${counts(chart.elementsSurface)}`,
    `五行數量（含地支藏干）：${counts(chart.elementsWithHidden)}`,
    `八字中完全沒出現的五行：${chart.missingSurface.length ? chart.missingSurface.join("、") : "無"}`,
    `排盤採用的時間：${chart.usedClock}` +
      (chart.solar
        ? `（輸入 ${chart.inputClock}，時區 ${chart.solar.timeZone}，經度 ${chart.solar.longitude}°，經度差 ${chart.solar.longitudeMin >= 0 ? "+" : ""}${chart.solar.longitudeMin} 分，均時差 ${chart.solar.eotMin >= 0 ? "+" : ""}${chart.solar.eotMin} 分）`
        : ""),
    ...(chart.warnings?.length ? [`注意：${chart.warnings.join(" ")}`] : []),
    `排盤規則：${BAZI_CONVENTIONS.join(" ")}`,
  ].join("\n");
}
