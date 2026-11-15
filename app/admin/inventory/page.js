"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminFrame } from "@/components/admin/useOrderCustoms";

const input =
  "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";
const money = (n) => Number(n || 0).toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const when = (value) => (value ? String(value).slice(0, 16).replace("T", " ") : "—");

export default function InventoryPage() {
  const [data, setData] = useState({ materials: [], summary: null, configured: true, error: "" });
  const [purchases, setPurchases] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState(null); // material id being edited
  const [adjusting, setAdjusting] = useState(null);
  const [usingUp, setUsingUp] = useState(null);
  const [message, setMessage] = useState("");
  const [newMaterial, setNewMaterial] = useState({ name: "", unit: "", safetyStock: "", mode: "計數", estimatedUnitsPerPack: "", lowUnits: "" });

  async function load() {
    try {
      const response = await fetch("/api/admin/inventory", { cache: "no-store" });
      if (response.status === 401 || response.status === 404) return setDenied(true);
      setData(await response.json());
      const [p, m] = await Promise.all([
        fetch("/api/admin/inventory/purchases", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
        fetch("/api/admin/inventory/movements", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
      ]);
      setPurchases(p.purchases || []);
      setMovements(m.movements || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function send(url, method, body, okText) {
    setMessage("");
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(result.error || "操作失敗");
      return false;
    }
    setMessage(okText);
    await load();
    return true;
  }

  const rows = data.materials.filter((m) => showInactive || m.active !== false);
  const s = data.summary;

  return (
    <AdminFrame>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-[#5B7893] underline">
            ← 訂單管理
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[#1C2B48]">原料庫存與成本</h1>
        </div>
        <Link href="/admin/inventory/purchase" className="rounded border border-[#1C2B48] bg-[#1C2B48] px-4 py-2 text-sm font-bold text-white hover:bg-[#2A3D60]">
          ＋ 進貨登記
        </Link>
      </div>

      {denied ? <p className="mt-4 text-sm text-[#A93226]">請用管理員帳號登入。</p> : null}
      {!data.configured ? <p className="mt-4 text-sm text-[#7A5410]">尚未設定原料庫存的 Notion 資料庫（NOTION_MATERIALS / PURCHASES / STOCK_MOVEMENTS_DATABASE_ID）。</p> : null}
      {data.error ? <p className="mt-4 text-sm text-[#A93226]">{data.error}</p> : null}
      {message ? <p className="mt-4 rounded border border-[#8EB1D1]/40 bg-white/70 p-2 text-sm text-[#1C2B48]">{message}</p> : null}

      {s ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="原料種類" value={s.materialCount} />
          <Stat label="庫存總價值" value={`NT$${money(s.totalValueTWD)}`} />
          <Stat label="低於安全庫存" value={s.lowCount} warn={s.lowCount > 0} />
          <Stat label="庫存為負" value={s.negativeCount} warn={s.negativeCount > 0} />
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[#1C2B48]">原料</h2>
        <label className="flex items-center gap-1.5 text-xs text-[#35506B]">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          顯示已停用
        </label>
      </div>
      {loading ? <p className="mt-2 text-sm text-[#5B7893]">載入中…</p> : null}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm text-[#1C2B48]">
          <thead className="text-xs text-[#5B7893]">
            <tr>
              <th className="py-1.5 pr-2">原料</th>
              <th className="py-1.5 pr-2 text-right">庫存</th>
              <th className="py-1.5 pr-2 text-right">平均單價 NT$</th>
              <th className="py-1.5 pr-2 text-right">庫存價值 NT$</th>
              <th className="py-1.5 pr-2 text-right">安全量</th>
              <th className="py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className={`border-t border-[#8EB1D1]/20 ${m.active === false ? "opacity-50" : ""}`}>
                <td className="py-2 pr-2">
                  {m.name} <span className="text-xs text-[#5B7893]">{m.unit}</span>
                  {m.mode === "散裝" ? <span className="ml-2 rounded-full bg-[#E8ECEF] px-2 py-0.5 text-[11px] font-semibold text-[#35506B]">散裝</span> : null}
                  {m.needsEstimate ? <span className="ml-2 rounded-full bg-[#FFF3D6] px-2 py-0.5 text-[11px] font-semibold text-[#7A5410]">請填每包預估件數</span> : null}
                  {m.low ? <span className="ml-2 rounded-full bg-[#FDE8E6] px-2 py-0.5 text-[11px] font-semibold text-[#A93226]">低庫存</span> : null}
                  {m.negative ? <span className="ml-2 rounded-full bg-[#FDE8E6] px-2 py-0.5 text-[11px] font-semibold text-[#A93226]">庫存為負</span> : null}
                </td>
                <td className={`py-2 pr-2 text-right font-mono ${m.low ? "font-bold text-[#A93226]" : ""}`}>
                  {m.stock}
                  {m.mode === "散裝" ? <span className="block text-[11px] font-normal text-[#5B7893]">約剩 {m.remainingUnits} 件份</span> : null}
                </td>
                <td className="py-2 pr-2 text-right font-mono">
                  {m.purchasedQty > 0 ? money(m.avgCostTWD) : "—"}
                  {m.mode === "散裝" ? <span className="block text-[11px] font-normal text-[#5B7893]">每件 {money(m.recipeUnitCostTWD)}（每包約 {m.unitsPerPack} 件）</span> : null}
                </td>
                <td className="py-2 pr-2 text-right font-mono">{money(m.stockValueTWD)}</td>
                <td className="py-2 pr-2 text-right font-mono">{m.mode === "散裝" ? (m.lowUnits ? `${m.lowUnits} 件` : "—") : m.safetyStock || "—"}</td>
                <td className="whitespace-nowrap py-2 text-right text-xs">
                  {m.mode === "散裝" ? (
                    <button type="button" onClick={() => { setUsingUp(usingUp === m.id ? null : m.id); setAdjusting(null); setEditing(null); }} className="mr-2 font-semibold underline">用完一包</button>
                  ) : null}
                  <button type="button" onClick={() => { setAdjusting(adjusting === m.id ? null : m.id); setEditing(null); setUsingUp(null); }} className="mr-2 underline">調整</button>
                  <button type="button" onClick={() => { setEditing(editing === m.id ? null : m.id); setAdjusting(null); }} className="underline">編輯</button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-sm text-[#5B7893]">還沒有原料。先在下方新增，或到「進貨登記」直接新增並進貨。</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {rows.map((m) =>
        usingUp === m.id ? (
          <UsedUpPanel key={`u-${m.id}`} material={m} onSave={(actualUnits) => send("/api/admin/inventory/used-up", "POST", { materialId: m.id, actualUnits }, "已記錄，下一包的預估件數已更新。").then((ok) => ok && setUsingUp(null))} onClose={() => setUsingUp(null)} />
        ) : editing === m.id ? (
          <EditPanel key={`e-${m.id}`} material={m} onSave={(fields) => send(`/api/admin/inventory/${m.id}`, "PATCH", fields, "已儲存。").then((ok) => ok && setEditing(null))} onClose={() => setEditing(null)} />
        ) : adjusting === m.id ? (
          <AdjustPanel key={`a-${m.id}`} material={m} onSave={(body) => send("/api/admin/inventory/adjustments", "POST", { materialId: m.id, ...body }, "已調整庫存。").then((ok) => ok && setAdjusting(null))} onClose={() => setAdjusting(null)} />
        ) : null
      )}

      <details className="mt-5 rounded border border-dashed border-[#8EB1D1]/60 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#35506B]">＋ 新增原料</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_7rem_8rem_auto]">
          <select value={newMaterial.mode} onChange={(e) => setNewMaterial((p) => ({ ...p, mode: e.target.value }))} className={`${input} sm:col-span-4`} aria-label="追蹤方式">
            <option value="計數">計數型（點得出個數：甲片、瓶子、軟木塞、袋子、盒子…）</option>
            <option value="散裝">散裝耗材（緞帶、水晶碎石、封蠟、凝膠、金箔…；每包估計能做幾件）</option>
          </select>
          <input type="text" value={newMaterial.name} onChange={(e) => setNewMaterial((p) => ({ ...p, name: e.target.value }))} placeholder="原料名稱" className={input} />
          <input type="text" value={newMaterial.unit} onChange={(e) => setNewMaterial((p) => ({ ...p, unit: e.target.value }))} placeholder="單位" className={input} />
          <input type="number" min="0" value={newMaterial.safetyStock} onChange={(e) => setNewMaterial((p) => ({ ...p, safetyStock: e.target.value, lowUnits: e.target.value }))} placeholder={newMaterial.mode === "散裝" ? "低庫存門檻（件份）" : "安全庫存量"} className={input} />
          {newMaterial.mode === "散裝" ? (
            <input type="number" min="1" step="any" value={newMaterial.estimatedUnitsPerPack} onChange={(e) => setNewMaterial((p) => ({ ...p, estimatedUnitsPerPack: e.target.value }))} placeholder="每包預估可做幾件" className={`${input} sm:col-span-2`} />
          ) : null}
          <button type="button" onClick={() => send("/api/admin/inventory", "POST", { ...newMaterial, lowUnits: newMaterial.mode === "散裝" ? newMaterial.safetyStock : "", safetyStock: newMaterial.mode === "散裝" ? "" : newMaterial.safetyStock }, "已新增原料。").then((ok) => ok && setNewMaterial({ name: "", unit: "", safetyStock: "", mode: "計數", estimatedUnitsPerPack: "", lowUnits: "" }))} className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-bold text-[#1C2B48] hover:bg-[#A7C7E7]">
            新增
          </button>
        </div>
      </details>

      <h2 className="mt-8 text-sm font-bold text-[#1C2B48]">最近的進貨</h2>
      <ul className="mt-2 space-y-2">
        {purchases.map((p) => (
          <li key={p.purchaseNo} className="rounded border border-[#8EB1D1]/30 bg-white/60 p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-mono font-bold">{p.purchaseNo}</span>
              <span className="text-xs text-[#5B7893]">{String(p.date || "").slice(0, 10)}{p.supplier ? ` · ${p.supplier}` : ""} · 合計 NT${money(p.totalTWD)}</span>
            </div>
            <p className="mt-1 text-xs text-[#35506B]">{p.lines.map((l) => `${l.name} ${l.quantity}${l.unit}（NT$${money(l.totalTWD)}）`).join("、")}</p>
          </li>
        ))}
        {purchases.length === 0 ? <li className="text-sm text-[#5B7893]">還沒有進貨紀錄。</li> : null}
      </ul>

      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-bold text-[#1C2B48]">庫存異動紀錄（最近 50 筆）</summary>
        <ul className="mt-2 divide-y divide-[#8EB1D1]/20 text-xs text-[#35506B]">
          {movements.map((m) => (
            <li key={m.id} className="flex flex-wrap justify-between gap-2 py-1.5">
              <span>{when(m.at)} · {m.type} · {m.targetName}</span>
              <span className={`font-mono ${m.quantity < 0 ? "text-[#A93226]" : "text-[#1F5E3B]"}`}>{m.quantity > 0 ? "+" : ""}{m.quantity}{m.note ? ` · ${m.note}` : ""}</span>
            </li>
          ))}
        </ul>
      </details>
    </AdminFrame>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div className={`rounded border p-3 ${warn ? "border-[#C0392B]/40 bg-[#FDE8E6]" : "border-[#8EB1D1]/30 bg-white/60"}`}>
      <p className="text-xs text-[#5B7893]">{label}</p>
      <p className={`mt-1 text-lg font-bold ${warn ? "text-[#A93226]" : "text-[#1C2B48]"}`}>{value}</p>
    </div>
  );
}

function EditPanel({ material, onSave, onClose }) {
  const [form, setForm] = useState({ name: material.name, unit: material.unit, safetyStock: material.safetyStock || "", active: material.active !== false, mode: material.mode || "計數", estimatedUnitsPerPack: material.estimatedUnitsPerPack || "", lowUnits: material.lowUnits || "" });
  return (
    <div className="mt-3 rounded border border-[#8EB1D1]/40 bg-white p-3">
      <p className="text-xs font-bold text-[#5B7893]">編輯「{material.name}」</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={input} aria-label="名稱" />
        <input type="text" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} className={input} aria-label="單位" />
        <input type="number" min="0" value={form.safetyStock} onChange={(e) => setForm((p) => ({ ...p, safetyStock: e.target.value }))} className={input} aria-label="安全庫存量" placeholder="安全庫存量" />
        <select value={form.mode} onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))} className={input} aria-label="追蹤方式">
          <option value="計數">計數型</option>
          <option value="散裝">散裝耗材</option>
        </select>
        {form.mode === "散裝" ? (
          <>
            <input type="number" min="1" step="any" value={form.estimatedUnitsPerPack} onChange={(e) => setForm((p) => ({ ...p, estimatedUnitsPerPack: e.target.value }))} className={input} aria-label="每包預估件數" placeholder="每包預估可做幾件（有實際紀錄後以平均為準）" />
            <input type="number" min="0" step="any" value={form.lowUnits} onChange={(e) => setForm((p) => ({ ...p, lowUnits: e.target.value }))} className={input} aria-label="低庫存門檻" placeholder="低庫存門檻（剩幾件份）" />
          </>
        ) : null}
        <label className="flex items-center gap-2 text-xs text-[#35506B]">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />
          使用中（取消勾選＝停用）
        </label>
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => onSave(form)} className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-1.5 text-sm font-bold text-[#1C2B48]">儲存</button>
        <button type="button" onClick={onClose} className="text-sm underline">取消</button>
      </div>
    </div>
  );
}

function AdjustPanel({ material, onSave, onClose }) {
  const [mode, setMode] = useState("counted");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  return (
    <div className="mt-3 rounded border border-[#8EB1D1]/40 bg-white p-3">
      <p className="text-xs font-bold text-[#5B7893]">調整「{material.name}」庫存（目前 {material.stock}{material.unit}）</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#35506B]">
        <label className="flex items-center gap-1"><input type="radio" checked={mode === "counted"} onChange={() => setMode("counted")} /> 盤點：實際剩下多少</label>
        <label className="flex items-center gap-1"><input type="radio" checked={mode === "delta"} onChange={() => setMode("delta")} /> 增減：加或減多少（負數＝減）</label>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} className={input} placeholder={mode === "counted" ? "實際數量" : "例如 -3 或 10"} />
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={input} placeholder="原因（選填，例如 打破、盤點誤差）" />
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => onSave(mode === "counted" ? { counted: value, note } : { delta: value, note })} className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-1.5 text-sm font-bold text-[#1C2B48]">送出</button>
        <button type="button" onClick={onClose} className="text-sm underline">取消</button>
      </div>
    </div>
  );
}

function UsedUpPanel({ material, onSave, onClose }) {
  const [actual, setActual] = useState("");
  return (
    <div className="mt-3 rounded border border-[#8EB1D1]/40 bg-white p-3">
      <p className="text-xs font-bold text-[#5B7893]">「{material.name}」這一包用完了</p>
      <p className="mt-1 text-xs text-[#35506B]">
        目前每包預估約 {material.unitsPerPack} 件。請填這包<strong>實際</strong>做了幾件；之後每包的預估會用所有已用完包數的平均。
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input type="number" min="1" step="any" value={actual} onChange={(e) => setActual(e.target.value)} className={`${input} max-w-[12rem]`} placeholder="這包實際做了幾件" />
        <button type="button" onClick={() => onSave(actual)} className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-1.5 text-sm font-bold text-[#1C2B48]">確認用完</button>
        <button type="button" onClick={onClose} className="text-sm underline">取消</button>
      </div>
    </div>
  );
}
