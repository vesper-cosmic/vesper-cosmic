"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminFrame } from "@/components/admin/useOrderCustoms";

const box =
  "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";

const SERVICES = [
  ["epacket", "e小包 ePacket"],
  ["airParcel", "航空包裹 Air Parcel"],
];

export default function ProfitSettingsPage() {
  const [s, setS] = useState(null);
  const [defaults, setDefaults] = useState(null);
  const [info, setInfo] = useState({ configured: true, source: "", error: "" });
  const [denied, setDenied] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/profit", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 404) return setDenied(true);
        const body = await r.json();
        setS(body.settings);
        setDefaults(body.defaults);
        setInfo({ configured: body.configured, source: body.source, error: body.error });
      })
      .catch(() => setMessage("載入失敗，請重新整理。"));
  }, []);

  const set = (patch) => setS((prev) => ({ ...prev, ...patch }));
  const setPack = (key, patch) => setS((prev) => ({ ...prev, packaging: { ...prev.packaging, [key]: { ...prev.packaging[key], ...patch } } }));
  const setPostage = (key, patch) => setS((prev) => ({ ...prev, postage: { ...prev.postage, [key]: { ...prev.postage[key], ...patch } } }));
  const setBracket = (key, index, col, value) =>
    setPostage(key, { brackets: s.postage[key].brackets.map((b, i) => (i === index ? (col === 0 ? [value, b[1]] : [b[0], value]) : b)) });

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings/profit", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(body.error || "儲存失敗");
      setS(body.settings);
      setInfo((prev) => ({ ...prev, source: "notion" }));
      setMessage("已儲存。成本與毛利報表會用新的數值。");
    } finally {
      setSaving(false);
    }
  }

  if (denied) return <AdminFrame><p className="text-sm text-[#A93226]">請用管理員帳號登入。</p></AdminFrame>;

  return (
    <AdminFrame>
      <Link href="/admin/reports/cost" className="text-sm text-[#5B7893] underline">
        ← 成本報表
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-[#1C2B48]">淨利設定</h1>
      <p className="mt-1 text-sm text-[#35506B]">成本與毛利報表「目前上架商品」的淨利估算會用這裡的數值。所有金額為新台幣（另有標示的除外）。</p>
      {!info.configured ? <p className="mt-3 rounded border border-[#E0B04A]/50 bg-[#FFF3D6] p-2 text-sm text-[#7A5410]">尚未設定 NOTION_SETTINGS_DATABASE_ID，目前顯示的是預設值，無法儲存。</p> : null}
      {info.error ? <p className="mt-3 text-sm text-[#A93226]">{info.error}</p> : null}
      {message ? <p className="mt-3 rounded border border-[#8EB1D1]/40 bg-white/70 p-2 text-sm text-[#1C2B48]">{message}</p> : null}

      {s ? (
        <div className="mt-4 space-y-6">
          <section className="grid gap-3 sm:grid-cols-3">
            <Field label="時薪 NT$">
              <input type="number" min="0" step="any" value={s.hourlyRateTWD} onChange={(e) => set({ hourlyRateTWD: e.target.value })} className={box} />
            </Field>
            <Field label="每單行銷費 NT$">
              <input type="number" min="0" step="any" value={s.marketingPerOrderTWD} onChange={(e) => set({ marketingPerOrderTWD: e.target.value })} className={box} />
            </Field>
            <Field label="每包裹報關行費 NT$（估計值，待 EZPost 確認）">
              <input type="number" min="0" step="any" value={s.brokerFeeTWD} onChange={(e) => set({ brokerFeeTWD: e.target.value })} className={box} />
            </Field>
            <Field label="美國入口規費 US$（每包裹）">
              <input type="number" min="0" step="any" value={s.entryFeeUSD} onChange={(e) => set({ entryFeeUSD: e.target.value })} className={box} />
            </Field>
            <Field label="預估關稅率 %">
              <input type="number" min="0" step="any" value={s.dutyRatePct} onChange={(e) => set({ dutyRatePct: e.target.value })} className={box} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-[#1C2B48]">
              <input type="checkbox" checked={s.includeReferral} onChange={(e) => set({ includeReferral: e.target.checked })} />
              淨利計入推薦分潤（用各商品的分潤金額）
            </label>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#1C2B48]">包材（依包裝類型）</h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {[
                ["envelope", "信封 Envelope"],
                ["box", "箱子 Box（易碎）"],
              ].map(([key, label]) => (
                <div key={key} className="grid grid-cols-2 gap-2 rounded border border-[#8EB1D1]/30 bg-white/60 p-3">
                  <p className="col-span-2 text-xs font-bold text-[#5B7893]">{label}</p>
                  <Field label="成本 NT$">
                    <input type="number" min="0" step="any" value={s.packaging[key].costTWD} onChange={(e) => setPack(key, { costTWD: e.target.value })} className={box} />
                  </Field>
                  <Field label="重量 g">
                    <input type="number" min="0" step="any" value={s.packaging[key].weightG} onChange={(e) => setPack(key, { weightG: e.target.value })} className={box} />
                  </Field>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#1C2B48]">郵資表（NT$）</h2>
            <div className="mt-2 grid gap-3 lg:grid-cols-2">
              {SERVICES.map(([key, label]) => {
                const t = s.postage[key];
                return (
                  <div key={key} className="rounded border border-[#8EB1D1]/30 bg-white/60 p-3">
                    <p className="text-xs font-bold text-[#5B7893]">{label}</p>
                    <div className="mt-2 space-y-1.5">
                      {t.brackets.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-[#35506B]">
                          ≤
                          <input type="number" min="1" step="any" value={b[0]} onChange={(e) => setBracket(key, i, 0, e.target.value)} className={`${box} max-w-[6rem]`} aria-label="重量上限 g" />
                          g →
                          <input type="number" min="0" step="any" value={b[1]} onChange={(e) => setBracket(key, i, 1, e.target.value)} className={`${box} max-w-[6rem]`} aria-label="郵資 NT$" />
                          <button type="button" onClick={() => setPostage(key, { brackets: t.brackets.filter((_, j) => j !== i) })} className="text-[#A93226]" aria-label="移除">✕</button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const last = t.brackets[t.brackets.length - 1] || [0, 0];
                          setPostage(key, { brackets: [...t.brackets, [Number(last[0]) + Number(t.extraStepG || 100), Number(last[1]) + Number(t.extraTWD || 0)]] });
                        }}
                        className="rounded border border-dashed border-[#8EB1D1] px-3 py-1 text-xs font-semibold text-[#35506B]"
                      >
                        ＋ 新增級距
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Field label="之後每多 g">
                        <input type="number" min="1" step="any" value={t.extraStepG} onChange={(e) => setPostage(key, { extraStepG: e.target.value })} className={box} />
                      </Field>
                      <Field label="加收 NT$">
                        <input type="number" min="0" step="any" value={t.extraTWD} onChange={(e) => setPostage(key, { extraTWD: e.target.value })} className={box} />
                      </Field>
                      <Field label="上限 g（空 = 無）">
                        <input type="number" min="0" step="any" value={t.maxG ?? ""} onChange={(e) => setPostage(key, { maxG: e.target.value })} className={box} />
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={saving || !info.configured} onClick={save} className="rounded border border-[#1C2B48] bg-[#1C2B48] px-5 py-2 text-sm font-bold text-white hover:bg-[#2A3D60] disabled:opacity-50">
              {saving ? "儲存中…" : "儲存"}
            </button>
            <button type="button" onClick={() => defaults && setS(defaults)} className="text-sm underline">
              還原成預設值（按儲存才會生效）
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#5B7893]">載入中…</p>
      )}
    </AdminFrame>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-xs font-semibold text-[#5B7893]">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}
