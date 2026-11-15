"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminFrame } from "@/components/admin/useOrderCustoms";
import PresetPlanDialog from "@/components/admin/PresetPlanDialog";
import { planBulkApply } from "@/lib/customs/presets";
import { formatHtsus, isValidHtsus, stripHtsus } from "@/lib/customs/htsus";
import { CUSTOMS_DESCRIPTION_MAX, findBlocklistedWords } from "@/lib/customs/keywords";

const box =
  "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";

export default function CustomsPresetsSettingsPage() {
  const [presets, setPresets] = useState([]);
  const [source, setSource] = useState("");
  const [loadError, setLoadError] = useState("");
  const [products, setProducts] = useState([]);
  const [forbidden, setForbidden] = useState(false);
  const [syncId, setSyncId] = useState("");
  const [overwrite, setOverwrite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function load() {
    const [presetResponse, productResponse] = await Promise.all([
      fetch("/api/admin/customs-presets"),
      fetch("/api/admin/products"),
    ]);
    if (presetResponse.status === 403) {
      setForbidden(true);
      return;
    }
    const presetData = await presetResponse.json();
    setPresets(presetData.presets || []);
    setSource(presetData.source || "");
    setLoadError(presetData.error || "");
    const productData = await productResponse.json().catch(() => ({}));
    setProducts(productData.products || []);
  }

  useEffect(() => {
    load().catch(() => setLoadError("載入失敗。"));
  }, []);

  async function syncApply(rows) {
    setBusy(true);
    let ok = 0;
    const failed = [];
    for (const row of rows) {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row.product, id: row.product.id, customs: row.next }),
      }).catch(() => null);
      if (response?.ok) ok += 1;
      else failed.push(row.product.name);
    }
    setBusy(false);
    setResult(`已更新 ${ok} 個商品。${failed.length ? `失敗：${failed.join("、")}` : ""}`);
    await load();
  }

  if (forbidden) {
    return (
      <AdminFrame>
        <p className="text-sm text-[#A93226]">沒有權限。請用管理員帳號登入。</p>
      </AdminFrame>
    );
  }

  return (
    <AdminFrame>
      <div className="mb-5">
        <Link href="/admin/products" className="text-sm text-[#5B7893] underline">
          ← 產品管理
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#1C2B48]">海關預設 Customs presets</h1>
        <p className="mt-1 text-sm text-[#35506B]">
          修改後按「儲存」，之後套用預設的商品就會用新值。HTSUS 為未驗證的建議值，請到 hts.usitc.gov 確認。
        </p>
        {source === "code" ? (
          <p className="mt-2 rounded border border-[#C77A0A]/40 bg-[#FDF6E3] p-2 text-xs text-[#7A5410]">
            目前顯示程式內建預設，尚未連上 Notion「Customs Presets」資料庫
            {loadError ? `（${loadError}）` : "（請設定 NOTION_CUSTOMS_PRESETS_DATABASE_ID，並在 Notion 把資料庫連線給 Vesper Cosmic）"}，所以還不能儲存。
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        {presets
          .filter((preset) => preset.isPhysical)
          .map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              canSave={source === "notion"}
              usedBy={products.filter((p) => p.customs?.preset === preset.id).length}
              onSaved={(updated, id) => {
                setPresets(updated);
                setSyncId(id);
                setResult("");
              }}
              onSync={() => {
                setSyncId(preset.id);
                setResult("");
              }}
            />
          ))}
      </div>

      {syncId ? (
        <PresetPlanDialog
          title="同步到使用此預設的商品 Sync to products using this preset"
          rows={planBulkApply(products, presets, { mode: "sync", presetId: syncId, overwrite })}
          overwrite={overwrite}
          onOverwriteChange={setOverwrite}
          onApply={syncApply}
          onClose={() => setSyncId("")}
          busy={busy}
          result={result}
        />
      ) : null}
    </AdminFrame>
  );
}

function PresetCard({ preset, canSave, usedBy, onSaved, onSync }) {
  const [form, setForm] = useState({
    customsDescription: preset.customsDescription,
    htsus: preset.htsus ? formatHtsus(preset.htsus) : "",
    unitWeightG: preset.unitWeightG ?? "",
    fragile: Boolean(preset.fragile),
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const blocked = findBlocklistedWords(form.customsDescription);
  const htsusBad = form.htsus.trim() && !isValidHtsus(form.htsus);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/customs-presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preset.id, ...form, htsus: stripHtsus(form.htsus) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "儲存失敗");
      setMessage("已儲存。");
      onSaved(data.presets, preset.id);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded border border-[#8EB1D1]/30 bg-white/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[#1C2B48]">
          {preset.label} <span className="font-mono text-xs font-normal text-[#5B7893]">({preset.id})</span>
        </h2>
        <span className="text-xs text-[#5B7893]">使用此預設的商品：{usedBy}</span>
      </div>
      {preset.needsClassification ? (
        <p className="mt-2 inline-block rounded-full bg-[#FDF6E3] px-2.5 py-0.5 text-xs font-semibold text-[#7A5410] ring-1 ring-[#C77A0A]/40">
          需要分類 Needs classification
        </p>
      ) : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#5B7893] sm:col-span-2">
          海關品名（英文）Description
          <input type="text" value={form.customsDescription} onChange={set("customsDescription")} className={`${box} mt-1`} />
          {form.customsDescription.length > CUSTOMS_DESCRIPTION_MAX ? (
            <span className="mt-1 block font-normal text-[#7A5410]">超過 {CUSTOMS_DESCRIPTION_MAX} 字。</span>
          ) : null}
          {blocked.length ? <span className="mt-1 block font-normal text-[#7A5410]">⚠️ 偵測到不適合的詞：{blocked.join("、")}</span> : null}
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          HTSUS（10 碼）
          <input type="text" inputMode="numeric" value={form.htsus} onChange={set("htsus")} className={`${box} mt-1`} />
          {htsusBad ? <span className="mt-1 block font-normal text-[#A93226]">必須剛好 10 碼數字</span> : null}
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          單件重量 Unit weight (g)
          <input type="number" min="1" step="1" value={form.unitWeightG} onChange={set("unitWeightG")} className={`${box} mt-1`} />
          {form.unitWeightG === "" ? <span className="mt-1 block font-normal text-[#A93226]">尚未填重量</span> : null}
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-[#5B7893]">
          <input type="checkbox" checked={form.fragile} onChange={set("fragile")} />
          易碎 Fragile（建議用航空包裹或快捷）
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!canSave || saving || htsusBad}
          className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-1.5 text-sm font-bold text-[#1C2B48] hover:bg-[#A7C7E7] disabled:opacity-50"
        >
          {saving ? "儲存中…" : "儲存"}
        </button>
        <button
          type="button"
          onClick={onSync}
          className="rounded border border-[#8EB1D1]/60 bg-white px-3 py-1.5 text-xs font-semibold text-[#35506B] hover:bg-[#C4D8E5]"
        >
          同步到使用此預設的商品 Sync to products
        </button>
        {message ? <span className="text-xs text-[#35506B]">{message}</span> : null}
      </div>
    </section>
  );
}
