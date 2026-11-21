"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminFrame } from "@/components/admin/useOrderCustoms";
import { computeBaziChart, BAZI_CONVENTIONS, ELEMENTS } from "@/lib/baziChart";
import { buildNailDesignPrompt, requestLines } from "@/lib/nailPrompt";
import { findBirthCity } from "@/data/birthCities";

const box =
  "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";

const hasBirth = (item) => Boolean(item?.birth?.birthDate);

function DesignPromptInner() {
  const params = useSearchParams();
  const wanted = params.get("order") || "";
  const [orders, setOrders] = useState(null);
  const [denied, setDenied] = useState(false);
  const [orderId, setOrderId] = useState(wanted);
  const [itemIndex, setItemIndex] = useState(0);
  const [yongshen, setYongshen] = useState("");
  const [extra, setExtra] = useState("");
  const [copied, setCopied] = useState(false);
  const [useSolar, setUseSolar] = useState(true);
  const [timeZone, setTimeZone] = useState("");
  const [longitude, setLongitude] = useState("");
  const [cityNote, setCityNote] = useState("");
  const [crystals, setCrystals] = useState(null); // null = not loaded / inventory off
  const [pickedCrystals, setPickedCrystals] = useState({});

  useEffect(() => {
    fetch("/api/admin/orders", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403 || r.status === 404) return setDenied(true);
        const body = await r.json();
        setOrders((body.orders || []).filter((o) => (o.items || []).some(hasBirth)));
      })
      .catch(() => setOrders([]));
  }, []);

  // Crystals in stock (inventory category containing 水晶).
  useEffect(() => {
    fetch("/api/admin/inventory", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return;
        const body = await r.json();
        const list = (body.materials || []).filter((m) => m.active !== false && /水晶/.test(m.category || "") && m.stock > 0);
        setCrystals(list);
        setPickedCrystals(Object.fromEntries(list.map((m) => [m.id, true])));
      })
      .catch(() => {});
  }, []);

  const order = useMemo(() => (orders || []).find((o) => o.orderId === orderId) || null, [orders, orderId]);
  const birthItems = useMemo(() => (order?.items || []).map((item, index) => ({ item, index })).filter(({ item }) => hasBirth(item)), [order]);
  const item = (birthItems.find(({ index }) => index === itemIndex) || birthItems[0])?.item || null;

  // Fill place fields from the typed birthplace whenever the order/item changes.
  useEffect(() => {
    const found = findBirthCity(item?.birth?.birthLocation);
    setTimeZone(found ? found.tz : "");
    setLongitude(found ? String(found.lon) : "");
    setCityNote(found ? `依「${item.birth.birthLocation}」帶入（${found.match}）` : item ? `找不到「${item.birth.birthLocation || ""}」，請手動填時區與經度，或不校正` : "");
    setUseSolar(Boolean(found));
  }, [item]);

  const result = useMemo(
    () => (item ? computeBaziChart(item.birth, useSolar ? { timeZone, longitude } : {}) : null),
    [item, useSolar, timeZone, longitude]
  );
  const crystalList = useMemo(
    () => (crystals || []).filter((m) => pickedCrystals[m.id]).map((m) => ({ name: m.name, stock: m.stock })),
    [crystals, pickedCrystals]
  );
  const prompt = useMemo(
    () => (result?.ok ? buildNailDesignPrompt({ chart: result.chart, item, yongshen, extra, crystals: crystalList }) : ""),
    [result, item, yongshen, extra, crystalList]
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (denied) {
    return <p className="text-sm text-[#A93226]">需要管理員權限。請先登入。</p>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-[#1C2B48]">✨ 命理美甲設計指令</h1>
        <Link href="/admin" className="text-xs underline">← 回訂單後台</Link>
      </div>
      <p className="mt-1 text-xs text-[#5B7893]">
        四柱由程式依出生資料排出，不經過 AI。複製下面的指令貼到你的 AI，產出設計完整版。
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#35506B]">
          訂單
          <select className={`${box} mt-1`} value={orderId} onChange={(e) => { setOrderId(e.target.value); setItemIndex(0); }}>
            <option value="">{orders === null ? "載入中…" : "選擇訂單"}</option>
            {(orders || []).map((o) => (
              <option key={o.orderId} value={o.orderId}>
                {o.orderId} · {o.fullName}
              </option>
            ))}
          </select>
        </label>
        {birthItems.length > 1 ? (
          <label className="block text-xs font-semibold text-[#35506B]">
            商品
            <select className={`${box} mt-1`} value={itemIndex} onChange={(e) => setItemIndex(Number(e.target.value))}>
              {birthItems.map(({ item: it, index }) => (
                <option key={index} value={index}>
                  {it.productName}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {result && !result.ok ? <p className="mt-4 text-sm text-[#A93226]">{result.error}</p> : null}

      {result?.ok ? (
        <>
          <section className="mt-5 rounded-lg border border-[#8EB1D1]/35 bg-white/70 p-4">
            <p className="text-xs font-semibold text-[#35506B]">
              排盤結果 · {item.birth.birthDate} {item.birth.birthTime} · {item.birth.biologicalGender || "—"} · 夏令：{item.birth.daylightSavingTime || "—"}
            </p>
            <div className="mt-3 rounded border border-[#8EB1D1]/30 bg-[#E8ECEF] p-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#35506B]">
                <input type="checkbox" checked={useSolar} onChange={(e) => setUseSolar(e.target.checked)} />
                真太陽時校正（出生地：{item.birth.birthLocation || "—"}）
              </label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="block text-[11px] text-[#5B7893]">
                  時區（IANA）
                  <input className={`${box} mt-1`} value={timeZone} onChange={(e) => setTimeZone(e.target.value)} placeholder="Asia/Taipei" disabled={!useSolar} />
                </label>
                <label className="block text-[11px] text-[#5B7893]">
                  經度（東經為正、西經為負）
                  <input className={`${box} mt-1`} value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="121.56" inputMode="decimal" disabled={!useSolar} />
                </label>
              </div>
              <p className="mt-2 text-[11px] text-[#5B7893]">{cityNote}</p>
              <p className="mt-1 text-xs text-[#1C2B48]">
                輸入時間 {result.chart.inputClock} → 排盤採用 {result.chart.usedClock}
                {result.chart.solar
                  ? `（經度差 ${result.chart.solar.longitudeMin >= 0 ? "+" : ""}${result.chart.solar.longitudeMin} 分、均時差 ${result.chart.solar.eotMin >= 0 ? "+" : ""}${result.chart.solar.eotMin} 分、當時時區 UTC${result.chart.solar.zoneOffsetMin >= 0 ? "+" : ""}${result.chart.solar.zoneOffsetMin / 60}）`
                  : ""}
              </p>
            </div>
            {result.chart.warnings.map((w) => (
              <p key={w} className="mt-2 rounded border border-[#C0842B]/50 bg-[#FFF6E0] px-3 py-2 text-xs font-semibold text-[#7A4B00]">⚠ {w}</p>
            ))}
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {result.chart.pillars.map((p) => (
                <div key={p.key} className="rounded border border-[#8EB1D1]/30 bg-[#E8ECEF] p-2">
                  <p className="text-[11px] text-[#5B7893]">{p.label}</p>
                  <p className="mt-1 text-xl font-semibold text-[#1C2B48]">{p.stem}</p>
                  <p className="text-xl font-semibold text-[#1C2B48]">{p.branch}</p>
                  <p className="mt-1 text-[11px] text-[#5B7893]">{p.stemElement}／{p.branchElement}</p>
                  <p className="text-[11px] text-[#5B7893]">藏 {p.hiddenStems.join("")}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#1C2B48]">
              日主 {result.chart.dayMaster}（{result.chart.dayMasterElement}）· 月令 {result.chart.monthBranch}（{result.chart.season}）
            </p>
            <p className="mt-1 text-xs text-[#1C2B48]">
              五行（八字）：{ELEMENTS.map((e) => `${e}${result.chart.elementsSurface[e]}`).join(" ")}　含藏干：
              {ELEMENTS.map((e) => `${e}${result.chart.elementsWithHidden[e]}`).join(" ")}
            </p>
            <ul className="mt-2 list-disc pl-5 text-[11px] text-[#5B7893]">
              {BAZI_CONVENTIONS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-semibold text-[#35506B]">客人需求（會寫進指令）</p>
            <ul className="mt-1 list-disc pl-5 text-xs text-[#1C2B48]">
              {requestLines(item).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          {crystals !== null ? (
            <section className="mt-4 rounded-lg border border-[#8EB1D1]/35 bg-white/70 p-4">
              <p className="text-xs font-semibold text-[#35506B]">這次開放的水晶（來自原料庫存，分類含「水晶」且有庫存）</p>
              {crystals.length === 0 ? (
                <p className="mt-1 text-xs text-[#5B7893]">沒有符合的原料。到原料庫存把水晶的「分類」設成含「水晶」的名稱（例如「水晶類」）。</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {crystals.map((m) => (
                    <label key={m.id} className="flex items-center gap-1.5 rounded border border-[#8EB1D1]/40 bg-white px-2 py-1 text-xs text-[#1C2B48]">
                      <input type="checkbox" checked={Boolean(pickedCrystals[m.id])} onChange={(e) => setPickedCrystals((prev) => ({ ...prev, [m.id]: e.target.checked }))} />
                      {m.name}
                      <span className="text-[#5B7893]">（{m.stock}{m.unit || ""}）</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[11px] text-[#5B7893]">一個都不勾，指令就不限制水晶種類。</p>
            </section>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#35506B]">
              喜用神（選填，你自己判斷的話填這裡）
              <input className={`${box} mt-1`} value={yongshen} onChange={(e) => setYongshen(e.target.value)} placeholder="例如：用神水、喜神金；忌火" />
            </label>
            <label className="block text-xs font-semibold text-[#35506B]">
              補充（選填，例如庫存水晶、指定色）
              <input className={`${box} mt-1`} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="例如：可用水晶：月光石、黑曜石" />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#35506B]">完整指令（{prompt.length.toLocaleString()} 字）</p>
            <button type="button" onClick={copy} className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] hover:bg-[#A7C7E7]">
              {copied ? "已複製 ✓" : "複製指令"}
            </button>
          </div>
          <textarea readOnly value={prompt} rows={14} className={`${box} mt-2 font-mono text-xs`} />
        </>
      ) : null}

      {orders && orders.length === 0 ? <p className="mt-4 text-sm text-[#5B7893]">目前沒有含出生資料的訂單。</p> : null}
    </>
  );
}

export default function DesignPromptPage() {
  return (
    <AdminFrame>
      <Suspense fallback={<p className="text-sm text-[#5B7893]">載入中…</p>}>
        <DesignPromptInner />
      </Suspense>
    </AdminFrame>
  );
}
