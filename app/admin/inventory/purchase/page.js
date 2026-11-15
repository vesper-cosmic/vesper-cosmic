"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminFrame } from "@/components/admin/useOrderCustoms";

const input =
  "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";
const NONE = "__none__";
const money = (n) => Number(n || 0).toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const todayInTaipei = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

export default function PurchasePage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState({}); // materialId → { checked, quantity, total }
  const [date, setDate] = useState(todayInTaipei());
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [problems, setProblems] = useState([]);
  const [done, setDone] = useState("");
  const [filter, setFilter] = useState("");
  const [newMaterial, setNewMaterial] = useState({ name: "", unit: "", category: "" });
  const [cats, setCats] = useState({}); // category → ticked for this purchase

  async function load() {
    try {
      const response = await fetch("/api/admin/inventory", { cache: "no-store" });
      if (response.status === 401 || response.status === 404) return setError("請用管理員帳號登入。");
      const data = await response.json();
      setMaterials((data.materials || []).filter((m) => m.active !== false));
      setError(data.configured === false ? "尚未設定原料庫存的 Notion 資料庫。" : data.error || "");
    } catch {
      setError("載入失敗，請重新整理。");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const setRow = (id, patch) => setRows((prev) => ({ ...prev, [id]: { checked: false, quantity: "", total: "", ...prev[id], ...patch } }));

  const picked = useMemo(
    () => materials.filter((m) => rows[m.id]?.checked),
    [materials, rows]
  );
  const grandTotal = picked.reduce((sum, m) => sum + (Number(rows[m.id]?.total) || 0), 0);
  const categories = useMemo(
    () => [...new Set(materials.map((m) => m.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant")),
    [materials]
  );
  const catKey = (m) => m.category || NONE;
  const ticked = Object.keys(cats).filter((k) => cats[k]);
  const needle = filter.trim().toLowerCase();
  // With no category ticked everything shows; otherwise only ticked categories
  // (plus anything already ticked in the list, so a pick never disappears).
  const visible = materials
    .filter((m) => ticked.length === 0 || ticked.includes(catKey(m)) || rows[m.id]?.checked)
    .filter((m) => !needle || [m.name, m.category].some((t) => String(t || "").toLowerCase().includes(needle)))
    .sort((a, b) => (a.category || "\uffff").localeCompare(b.category || "\uffff", "zh-Hant") || a.name.localeCompare(b.name, "zh-Hant"));

  async function addMaterial() {
    if (!newMaterial.name.trim()) return;
    setProblems([]);
    const response = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMaterial),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setProblems([data.error || "新增原料失敗"]);
    setNewMaterial({ name: "", unit: "", category: "" });
    await load();
    setRow(data.material.id, { checked: true });
  }

  async function submit() {
    setSaving(true);
    setProblems([]);
    setDone("");
    try {
      const response = await fetch("/api/admin/inventory/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          supplier,
          note,
          lines: picked.map((m) => ({ materialId: m.id, quantity: rows[m.id].quantity, totalTWD: rows[m.id].total })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setProblems(data.errors || [data.error || "儲存失敗"]);
      setDone(`已登記 ${data.purchaseNo}，共 ${data.purchase.lines.length} 項，合計 NT$${money(data.purchase.totalTWD)}。庫存與平均成本已更新。`);
      setRows({});
      setSupplier("");
      setNote("");
      await load();
    } catch {
      setProblems(["網路錯誤，請再試一次。"]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFrame>
      <Link href="/admin/inventory" className="text-sm text-[#5B7893] underline">
        ← 原料庫存
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-[#1C2B48]">進貨登記</h1>
      <p className="mt-1 text-sm text-[#35506B]">勾選這次買了哪些原料，填「買了多少」和「這一項總共花多少（新台幣）」。系統會自動算單價、更新庫存和平均成本。</p>

      {error ? <p className="mt-3 rounded border border-[#C0392B]/40 bg-[#FDE8E6] p-2 text-sm text-[#7B241C]">{error}</p> : null}
      {done ? <p className="mt-3 rounded border border-[#2E8B57]/30 bg-[#E9F5EE] p-2 text-sm text-[#1F5E3B]">✓ {done}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-[#5B7893]">
          進貨日期
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          供應商（選填）
          <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          備註（選填）
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={`${input} mt-1`} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[#1C2B48]">原料清單（已勾 {picked.length} 項）</h2>
        <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="搜尋原料（名稱、分類）" className={`${input} max-w-[14rem]`} />
      </div>

      {categories.length ? (
        <div className="mt-2 rounded border border-[#8EB1D1]/40 bg-white/60 p-3">
          <p className="text-xs font-semibold text-[#5B7893]">這次買了哪些類別？勾選後只顯示這些類別的原料（都不勾 = 顯示全部）</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {[...categories.map((c) => [c, c]), [NONE, "未分類"]].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-1.5 text-sm text-[#1C2B48]">
                <input type="checkbox" checked={Boolean(cats[key])} onChange={(e) => setCats((prev) => ({ ...prev, [key]: e.target.checked }))} />
                {label}
                <span className="text-xs text-[#5B7893]">({materials.filter((m) => catKey(m) === key).length})</span>
              </label>
            ))}
            {ticked.length ? (
              <button type="button" onClick={() => setCats({})} className="text-xs underline">
                清除類別
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {loading ? <p className="mt-3 text-sm text-[#5B7893]">載入中…</p> : null}
      <ul className="mt-2 space-y-2">
        {visible.map((m, i) => {
          const row = rows[m.id] || {};
          const unit = row.quantity > 0 && row.total !== "" ? Number(row.total) / Number(row.quantity) : null;
          return (
            <Fragment key={m.id}>
            {i === 0 || (visible[i - 1].category || "") !== (m.category || "") ? (
              <li className="pt-2 text-xs font-bold text-[#35506B]">{m.category || "未分類"}</li>
            ) : null}
            <li className={`rounded border p-3 ${row.checked ? "border-[#8EB1D1] bg-white" : "border-[#8EB1D1]/25 bg-white/50"}`}>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#1C2B48]">
                <input type="checkbox" checked={Boolean(row.checked)} onChange={(e) => setRow(m.id, { checked: e.target.checked })} />
                {m.name}
                <span className="text-xs font-normal text-[#5B7893]">
                  （單位：{m.unit || "—"}；目前庫存 {m.stock}，平均單價 NT${money(m.avgCostTWD)}）
                </span>
              </label>
              {row.checked ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <label className="text-xs text-[#5B7893]">
                    數量{m.unit ? `（${m.unit}）` : ""}
                    <input type="number" min="0" step="any" value={row.quantity ?? ""} onChange={(e) => setRow(m.id, { quantity: e.target.value })} className={`${input} mt-1`} />
                  </label>
                  <label className="text-xs text-[#5B7893]">
                    這一項總金額（NT$）
                    <input type="number" min="0" step="any" value={row.total ?? ""} onChange={(e) => setRow(m.id, { total: e.target.value })} className={`${input} mt-1`} />
                  </label>
                  <p className="self-end pb-2 text-xs text-[#35506B]">{unit != null && Number.isFinite(unit) ? `單價約 NT$${money(Math.round(unit * 10000) / 10000)} / ${m.unit || "單位"}` : "單價：—"}</p>
                </div>
              ) : null}
            </li>
            </Fragment>
          );
        })}
        {!loading && visible.length === 0 ? <li className="text-sm text-[#5B7893]">沒有符合的原料。下方可以新增。</li> : null}
      </ul>

      <details className="mt-3 rounded border border-dashed border-[#8EB1D1]/60 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#35506B]">＋ 新增一種原料</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_8rem_9rem_auto]">
          <input type="text" value={newMaterial.name} onChange={(e) => setNewMaterial((p) => ({ ...p, name: e.target.value }))} placeholder="原料名稱，例如 粉水晶碎石" className={input} />
          <input type="text" value={newMaterial.unit} onChange={(e) => setNewMaterial((p) => ({ ...p, unit: e.target.value }))} placeholder="單位（克、個…）" className={input} />
          <input type="text" list="purchase-categories" value={newMaterial.category} onChange={(e) => setNewMaterial((p) => ({ ...p, category: e.target.value }))} placeholder="分類（選填）" className={input} />
          <datalist id="purchase-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          <button type="button" onClick={addMaterial} className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-bold text-[#1C2B48] hover:bg-[#A7C7E7]">
            新增並勾選
          </button>
        </div>
      </details>

      {problems.length ? (
        <ul className="mt-4 list-disc rounded border border-[#C0392B]/40 bg-[#FDE8E6] p-3 pl-7 text-sm text-[#7B241C]">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}

      <div className="sticky bottom-3 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#1C2B48] bg-[#1C2B48] p-3 text-white">
        <span className="text-sm font-semibold">
          本次進貨 {picked.length} 項，合計 NT${money(grandTotal)}
        </span>
        <button
          type="button"
          disabled={saving || picked.length === 0}
          onClick={submit}
          className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-2 text-sm font-bold text-[#1C2B48] hover:bg-[#A7C7E7] disabled:opacity-50"
        >
          {saving ? "儲存中…" : "登記進貨"}
        </button>
      </div>
    </AdminFrame>
  );
}
