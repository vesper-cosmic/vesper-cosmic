"use client";

import { DEFAULT_DECORATION_TWD, decorationAllowance, productUnitCost } from "@/lib/cost";

const box =
  "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";

/**
 * The product form's recipe and cost block (admin only; never sent to shoppers):
 * which raw materials one finished piece uses, plus packaging and labour,
 * with the estimated unit cost at today's average material prices.
 */
export default function CostSection({ form, updateField, materials, products, editingId }) {
  const byId = Object.fromEntries(materials.map((m) => [m.id, m]));
  const costById = Object.fromEntries(materials.map((m) => [m.id, m.recipeUnitCostTWD]));
  const productsById = Object.fromEntries((products || []).map((p) => [p.id, p]));

  const draft = {
    id: editingId || "__draft__",
    cost: {
      recipe: (form.costRecipe || []).map((r) => ({ materialId: r.materialId, quantity: Number(r.quantity) || 0 })),
      packagingTWD: Number(form.costPackaging) || 0,
      laborTWD: Number(form.costLabor) || 0,
      decorationTWD: form.costDecoration === "" || form.costDecoration == null ? null : Number(form.costDecoration),
    },
    category: form.category,
    customs: { bundleComponents: form.bundleComponents || [] },
  };
  const estimate = productUnitCost(draft, productsById, costById);
  const setLine = (index, patch) =>
    updateField(
      "costRecipe",
      form.costRecipe.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );

  return (
    <section className="space-y-3 rounded border border-[#8EB1D1]/40 bg-[#F3F6F8] p-4">
      <h3 className="text-sm font-bold text-[#1C2B48]">成本配方 Recipe（做一個成品用多少原料；只有後台看得到）</h3>
      {materials.length === 0 ? (
        <p className="text-xs text-[#5B7893]">還沒有原料。到「原料庫存」新增原料並登記進貨後，這裡就能選。</p>
      ) : null}

      {(form.costRecipe || []).map((line, index) => {
        const material = byId[line.materialId];
        const lineCost = (Number(line.quantity) || 0) * (material?.recipeUnitCostTWD || 0);
        return (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_8rem_9rem_auto]">
            <select value={line.materialId} onChange={(e) => setLine(index, { materialId: e.target.value })} className={box}>
              <option value="">選擇原料…</option>
              {[...new Set(materials.map((m) => m.category || ""))]
                .sort((x, y) => (x || "\uffff").localeCompare(y || "\uffff", "zh-Hant"))
                .map((cat) => (
                  <optgroup key={cat} label={cat || "未分類"}>
                    {materials
                      .filter((m) => (m.category || "") === cat)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}（{m.unit || "單位"}）
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
            <input
              type="number"
              min="0"
              step="any"
              value={line.quantity}
              onChange={(e) => setLine(index, { quantity: e.target.value })}
              placeholder={material?.mode === "散裝" ? "做幾件份（通常 1）" : `用量${material?.unit ? `（${material.unit}）` : ""}`}
              className={box}
            />
            <p className="self-center text-xs text-[#35506B]">
              {material
                ? material.purchasedQty > 0
                  ? `≈ NT$${(Math.round(lineCost * 100) / 100).toLocaleString("zh-TW")}`
                  : "尚無進貨價"
                : "—"}
            </p>
            <button
              type="button"
              onClick={() =>
                updateField(
                  "costRecipe",
                  form.costRecipe.filter((_, i) => i !== index)
                )
              }
              className="rounded border border-[#8EB1D1]/40 bg-white px-3 text-sm text-[#A93226]"
              aria-label="移除"
            >
              ✕
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => updateField("costRecipe", [...(form.costRecipe || []), { materialId: "", quantity: "" }])}
        className="rounded border border-dashed border-[#8EB1D1] px-3 py-1 text-xs font-semibold text-[#35506B]"
      >
        ＋ 新增原料
      </button>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-[#5B7893]">
          裝飾補貼 NT$（每件；留空 = 預設，穿戴甲 {DEFAULT_DECORATION_TWD}）
          <input
            type="number"
            min="0"
            step="any"
            value={form.costDecoration}
            placeholder={`預設 ${decorationAllowance(draft)}`}
            onChange={(e) => updateField("costDecoration", e.target.value)}
            className={`${box} mt-1`}
          />
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          包材成本 NT$（每件，選填）
          <input
            type="number"
            min="0"
            step="any"
            value={form.costPackaging}
            onChange={(e) => updateField("costPackaging", e.target.value)}
            className={`${box} mt-1`}
          />
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          人工成本 NT$（每件，選填）
          <input
            type="number"
            min="0"
            step="any"
            value={form.costLabor}
            onChange={(e) => updateField("costLabor", e.target.value)}
            className={`${box} mt-1`}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-[#5B7893]">
          每件工時（分鐘；用於淨利估算）
          <input type="number" min="0" step="any" value={form.costLaborMinutes} onChange={(e) => updateField("costLaborMinutes", e.target.value)} className={`${box} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          包裝類型（留空 = 依類別預設）
          <select value={form.costShippingType} onChange={(e) => updateField("costShippingType", e.target.value)} className={`${box} mt-1`}>
            <option value="">預設</option>
            <option value="envelope">信封 Envelope</option>
            <option value="box">箱子 Box（易碎）</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          郵寄方式（留空 = 依類別預設）
          <select value={form.costPostageService} onChange={(e) => updateField("costPostageService", e.target.value)} className={`${box} mt-1`}>
            <option value="">預設</option>
            <option value="epacket">e小包 ePacket</option>
            <option value="airParcel">航空包裹 Air Parcel</option>
          </select>
        </label>
      </div>
      <p className="text-[11px] text-[#5B7893]">穿戴甲、香包、DIY 組預設信封＋e小包；能量瓶預設箱子＋航空包裹；數位商品不計郵寄。費率在「設定 → 淨利設定」。</p>

      <p className="text-sm text-[#1C2B48]">
        預估單件成本：<strong>NT${estimate.unitCostTWD.toLocaleString("zh-TW")}</strong>
        <span className="ml-2 text-xs text-[#5B7893]">
          （原料與裝飾補貼 {estimate.materialCostTWD} ＋ 包材人工 {estimate.extraTWD}；原料用目前平均單價）
        </span>
      </p>
      {form.bundleComponents?.length ? (
        <p className="text-xs text-[#5B7893]">這是組合商品：成本會自動加上各組成商品的成本。</p>
      ) : null}
      {estimate.missingMaterials.length ? <p className="text-xs text-[#A93226]">有原料找不到（可能已刪除）。</p> : null}
    </section>
  );
}
