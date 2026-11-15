"use client";

import { useState } from "react";

const FIELD_LABELS = {
  description: "品名",
  htsus: "HTSUS",
  unitWeightG: "重量 g",
  origin: "原產國",
};

const show = (value) => (value === "" || value === null || value === undefined ? "—" : String(value));

/**
 * Preview + confirm for applying customs presets to many products.
 * `rows` come from planBulkApply(); `onApply(rows)` saves the ones that change.
 * Nothing is written until the admin clicks the confirm button.
 */
export default function PresetPlanDialog({ title, rows, overwrite, onOverwriteChange, onApply, onClose, busy, result }) {
  const [confirmed, setConfirmed] = useState(false);
  const actionable = rows.filter((row) => !row.skipped);
  const changing = actionable.filter((row) => row.changes.length > 0 || row.current.preset !== row.presetId);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#1C2B48]/60 px-3 py-8">
      <div className="w-full max-w-4xl rounded-lg bg-[#E8ECEF] p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#1C2B48]">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-[#5B7893] underline">
            關閉
          </button>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-[#35506B]">
          <input type="checkbox" checked={overwrite} onChange={(e) => onOverwriteChange(e.target.checked)} />
          覆蓋現有的不同值 Overwrite non-empty fields（預設只填空白欄位）
        </label>

        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-[#5B7893]">沒有符合的商品。</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs text-[#1C2B48]">
              <thead className="text-[#5B7893]">
                <tr>
                  <th className="border-b border-[#8EB1D1]/30 py-1.5 pr-2">商品</th>
                  <th className="border-b border-[#8EB1D1]/30 py-1.5 pr-2">預設</th>
                  <th className="border-b border-[#8EB1D1]/30 py-1.5 pr-2">目前值</th>
                  <th className="border-b border-[#8EB1D1]/30 py-1.5">套用後</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.product.id} className="align-top">
                    <td className="border-b border-[#8EB1D1]/15 py-2 pr-2 font-semibold">{row.product.name}</td>
                    <td className="border-b border-[#8EB1D1]/15 py-2 pr-2 font-mono">{row.presetId || "—"}</td>
                    <td className="border-b border-[#8EB1D1]/15 py-2 pr-2">
                      {Object.keys(FIELD_LABELS).map((field) => (
                        <div key={field}>
                          <span className="text-[#5B7893]">{FIELD_LABELS[field]}：</span>
                          {show(row.current[field])}
                        </div>
                      ))}
                    </td>
                    <td className="border-b border-[#8EB1D1]/15 py-2">
                      {row.skipped ? (
                        <span className="text-[#5B7893]">略過 — {row.skipped}</span>
                      ) : (
                        <>
                          {row.changes.map((change) => (
                            <div key={change.field} className={change.action === "overwrite" ? "text-[#A93226]" : "text-[#1F5E3B]"}>
                              {FIELD_LABELS[change.field]}：{show(change.to)}
                              {change.action === "overwrite" ? "（覆蓋）" : "（填入）"}
                            </div>
                          ))}
                          {row.changes.length === 0 ? <div className="text-[#5B7893]">只記錄所用預設</div> : null}
                          {row.conflicts.map((conflict) => (
                            <div key={conflict.field} className="text-[#7A5410]">
                              {FIELD_LABELS[conflict.field]}：保留現有值（預設是 {show(conflict.to)}）
                            </div>
                          ))}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result ? (
          <p className="mt-3 rounded border border-[#8EB1D1]/40 bg-white/60 p-2 text-sm text-[#35506B]">{result}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-[#35506B]">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            我已檢查預覽，確認要更新 {changing.length} 個商品
          </label>
          <button
            type="button"
            disabled={!confirmed || busy || changing.length === 0}
            onClick={() => onApply(changing)}
            className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-bold text-[#1C2B48] hover:bg-[#A7C7E7] disabled:opacity-50"
          >
            {busy ? "套用中…" : `套用到 ${changing.length} 個商品`}
          </button>
        </div>
      </div>
    </div>
  );
}
