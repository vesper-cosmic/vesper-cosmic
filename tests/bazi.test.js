import { describe, expect, it } from "vitest";
import { computeBaziChart, formatChartText } from "@/lib/baziChart";
import { findBirthCity } from "@/data/birthCities";
import { buildNailDesignPrompt, requestLines } from "@/lib/nailPrompt";

const pillars = (r) => r.chart.pillars.map((p) => p.pillar).join(" ");

describe("computeBaziChart", () => {
  it("2000-01-01 12:00 is 己卯 丙子 戊午 戊午 (before 立春, so the year is still 己卯)", () => {
    const r = computeBaziChart({ birthDate: "2000-01-01", birthTime: "12:00" });
    expect(r.ok).toBe(true);
    expect(pillars(r)).toBe("己卯 丙子 戊午 戊午");
    expect(r.chart.dayMaster).toBe("戊");
    expect(r.chart.dayMasterElement).toBe("土");
    expect(r.chart.season).toBe("冬");
  });

  it("23:30 counts as the next day's 子時 (day pillar moves on)", () => {
    const r = computeBaziChart({ birthDate: "2000-01-01", birthTime: "23:30" });
    expect(r.chart.pillars[2].pillar).toBe("己未");
    expect(r.chart.pillars[3].pillar).toBe("甲子");
  });

  it("daylight saving 'Yes' shifts the clock back an hour", () => {
    const r = computeBaziChart({ birthDate: "2000-01-01", birthTime: "13:10", daylightSavingTime: "Yes" });
    expect(r.chart.pillars[3].pillar).toBe("戊午"); // 12:10, not 13:10 (未時)
    expect(r.chart.usedClock).toContain("12:10");
  });

  it("counts eight visible characters", () => {
    const r = computeBaziChart({ birthDate: "1995-08-17", birthTime: "06:30" });
    const total = Object.values(r.chart.elementsSurface).reduce((a, b) => a + b, 0);
    expect(total).toBe(8);
  });

  it("rejects bad input", () => {
    expect(computeBaziChart({ birthDate: "", birthTime: "12:00" }).ok).toBe(false);
    expect(computeBaziChart({ birthDate: "2000-02-31", birthTime: "12:00" }).ok).toBe(false);
    expect(computeBaziChart({ birthDate: "2000-01-01", birthTime: "25:00" }).ok).toBe(false);
  });
});

describe("true solar time", () => {
  const birth = { birthDate: "2000-01-01", birthTime: "12:00" };

  it("Taipei: +6.2 min from longitude, −3 min equation of time → about 12:03", () => {
    const r = computeBaziChart(birth, { timeZone: "Asia/Taipei", longitude: 121.56 });
    expect(r.ok).toBe(true);
    expect(r.chart.solar.longitudeMin).toBeCloseTo(6.2, 1);
    expect(r.chart.usedClock).toMatch(/12:0[2-4]/);
    expect(r.chart.usedClock).toContain("真太陽時");
  });

  it("Los Angeles in July: summer time is undone → solar time around 11:0x, not 12", () => {
    const r = computeBaziChart({ birthDate: "2000-07-01", birthTime: "12:00" }, { timeZone: "America/Los_Angeles", longitude: -118.24 });
    expect(r.chart.solar.zoneOffsetMin).toBe(-420);
    expect(r.chart.usedClock).toMatch(/ 11:0\d/);
  });

  it("correction can move the hour pillar: Taipei 10:58 clock is ~11:01 solar → 午, not 巳", () => {
    const plain = computeBaziChart({ birthDate: "2000-01-01", birthTime: "10:58" });
    const solar = computeBaziChart({ birthDate: "2000-01-01", birthTime: "10:58" }, { timeZone: "Asia/Taipei", longitude: 121.56 });
    expect(plain.chart.pillars[3].branch).toBe("巳");
    expect(solar.chart.pillars[3].branch).toBe("午");
  });

  it("rejects an unknown zone or bad longitude", () => {
    expect(computeBaziChart(birth, { timeZone: "Nowhere/Land", longitude: 100 }).ok).toBe(false);
    expect(computeBaziChart(birth, { timeZone: "Asia/Taipei", longitude: 400 }).ok).toBe(false);
  });

  it("no place given → clock time, marked uncorrected", () => {
    expect(computeBaziChart(birth).chart.usedClock).toContain("未校正");
  });

  it("warns near a 時辰 boundary and near a 節氣", () => {
    expect(computeBaziChart({ birthDate: "2000-01-01", birthTime: "12:58" }).chart.warnings.join()).toContain("時辰交界");
    expect(computeBaziChart({ birthDate: "2000-01-01", birthTime: "12:00" }).chart.warnings.join()).not.toContain("時辰交界");
    expect(computeBaziChart({ birthDate: "2000-02-04", birthTime: "19:30" }).chart.warnings.join()).toContain("立春");
  });
});

describe("findBirthCity", () => {
  it("finds Taiwan and overseas cities, preferring the most specific name", () => {
    expect(findBirthCity("Taipei, Taiwan")).toMatchObject({ tz: "Asia/Taipei" });
    expect(findBirthCity("高雄市")).toMatchObject({ lon: 120.31 });
    expect(findBirthCity("Los Angeles, CA, USA")).toMatchObject({ tz: "America/Los_Angeles" });
    expect(findBirthCity("Taiwan")).toMatchObject({ tz: "Asia/Taipei" });
  });
  it("returns null when unknown or empty", () => {
    expect(findBirthCity("Smalltown, Nowhere")).toBeNull();
    expect(findBirthCity("")).toBeNull();
  });
});

describe("buildNailDesignPrompt", () => {
  const chart = computeBaziChart({ birthDate: "2000-01-01", birthTime: "12:00", biologicalGender: "Female" }).chart;
  const item = {
    birth: { biologicalGender: "Female", baziIntentions: ["Career"], specificIntentions: "面試順利" },
    nails: { nailShape: "Almond", nailLength: "Medium", stylePreference: "Minimalist", nailNotes: "喜歡紅色" },
    notes: "",
  };

  it("includes the template, the chart and the customer's requests", () => {
    const text = buildNailDesignPrompt({ chart, item });
    expect(text).toContain("女巫 Witch");
    expect(text).toContain("己卯 丙子 戊午 戊午".split(" ")[2]);
    expect(text).toContain("指甲長度：Medium");
    expect(text).toContain("喜歡紅色");
    expect(text).toContain("設計師未指定");
  });

  it("uses the owner's 喜用神 when given", () => {
    const text = buildNailDesignPrompt({ chart, item, yongshen: "用神水" });
    expect(text).toContain("設計師指定：用神水");
    expect(text).not.toContain("設計師未指定");
  });

  it("tells the AI not to recompute the pillars", () => {
    expect(buildNailDesignPrompt({ chart, item })).toContain("不得重新排盤");
  });

  it("limits crystals to the offered list, and omits the section when none", () => {
    const withList = buildNailDesignPrompt({ chart, item, crystals: [{ name: "月光石" }, { name: "黑曜石" }] });
    expect(withList).toContain("- 月光石");
    expect(withList).toContain("只從上列挑選");
    expect(buildNailDesignPrompt({ chart, item })).not.toContain("只從上列挑選");
  });

  it("never carries name, email or address", () => {
    const text = buildNailDesignPrompt({ chart, item: { ...item, fullName: "王小明", email: "a@b.com" } });
    expect(text).not.toContain("王小明");
    expect(text).not.toContain("a@b.com");
    expect(requestLines(item).join("\n")).not.toContain("@");
    expect(formatChartText(chart)).toContain("日主：戊");
  });
});
