"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminFrame, CheckList, LoadState, useOrderCustoms } from "@/components/admin/useOrderCustoms";
import { estimateLandedCost } from "@/lib/customs/lines";
import { stripHtsus } from "@/lib/customs/htsus";

// Fields in the order EZPost (中華郵政 EZPost) asks for them, each with a Copy button.

const kg3 = (grams) => ((Number(grams) || 0) / 1000).toFixed(3);

export default function EzpostHelperPage({ params }) {
  const orderId = decodeURIComponent(params.orderId);
  const search = useSearchParams();
  const packaging = search.get("packaging") === "box" ? "box" : "envelope";
  const state = useOrderCustoms(orderId, packaging);

  return (
    <AdminFrame>
      <div className="mb-5">
        <Link href={`/admin/orders/${encodeURIComponent(orderId)}`} className="text-sm text-[#5B7893] underline">
          ← 訂單 {orderId}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#1C2B48]">EZPost 填寫小幫手</h1>
        <p className="mt-1 text-sm text-[#35506B]">照順序一格一格複製貼上到 EZPost。</p>
      </div>
      {state.status !== "ready" ? <LoadState state={state} orderId={orderId} /> : <Helper data={state.data} />}
    </AdminFrame>
  );
}

function Helper({ data }) {
  const { address, seller, lines, summary, suggestion, defaults, order } = data;

  const sections = useMemo(() => {
    const out = [
      { title: "寄達國", rows: [["寄達國 Destination", "United States"]] },
      {
        title: "郵件種類",
        rows: [["建議郵件種類", suggestion.service]],
        note: `${suggestion.reason}（≤2 kg 且不易碎 → 國際e小包；含玻璃 → 國際航空包裹或國際快捷）`,
      },
      {
        title: "寄件人",
        rows: [
          ["寄件人姓名", seller.contactName || seller.businessName],
          ["地址", [seller.addressLine1, seller.addressLine2].filter(Boolean).join(" ")],
          ["城市", seller.city],
          ["郵遞區號", seller.postalCode],
          ["電話", seller.phone],
          ["Email", seller.email],
        ],
        note: "EZPost 沒有公司欄位 — 請在標籤上手寫 VESPER COSMOS。",
      },
      {
        title: "收件人",
        rows: [
          ["收件人姓名", address.fullName],
          ["地址一", address.addressLine1],
          ["地址二", address.addressLine2],
          ["城市 City", address.city],
          ["州 State", address.stateProvince],
          ["郵遞區號 ZIP", address.postalCode],
          ["電話", address.phone],
          ["Email", order.email],
        ],
      },
      { title: "物品種類", rows: [["物品種類", "商品"]], danger: "絕對不要選「禮品 (Gift)」— 這是銷售的商品。" },
      ...lines.map((line, i) => ({
        title: `品項 ${i + 1}：${line.productName}`,
        rows: [
          ["英文品名", line.description],
          ["數量", String(line.qty)],
          ["幣別", "USD"],
          ["單價", line.unitValueUSD.toFixed(2)],
          ["重量 kg", kg3(line.unitWeightG)],
          ["稅則號數（10 碼，無小數點）", stripHtsus(line.htsus)],
          ["原產國", line.origin],
        ],
      })),
      {
        title: "總重量",
        rows: [["總重量 kg", kg3(summary.grossWeightG)]],
        note: `品項淨重 ${kg3(summary.netWeightG)} kg + 包裝 ${kg3(summary.packagingWeightG)} kg。總重量必須 ≥ 品項重量總和。`,
      },
    ];
    return out;
  }, [address, seller, lines, summary, suggestion, order.email]);

  const allText = sections
    .map((section) => [`【${section.title}】`, ...section.rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)].join("\n"))
    .join("\n\n");

  return (
    <div className="space-y-4">
      <CheckList validation={data.validation} />

      <div className="flex justify-end">
        <CopyButton value={allText} label="Copy all as text" wide />
      </div>

      {sections.map((section) => (
        <section key={section.title} className="rounded border border-[#8EB1D1]/30 bg-white/60 p-4">
          <h2 className="mb-2 text-sm font-bold text-[#1C2B48]">{section.title}</h2>
          <dl className="space-y-1.5">
            {section.rows.map(([label, value]) => (
              <div key={label} className="flex flex-wrap items-center gap-2 border-b border-[#8EB1D1]/15 pb-1.5 last:border-0">
                <dt className="w-44 shrink-0 text-xs text-[#5B7893]">{label}</dt>
                <dd className="min-w-0 flex-1 break-words font-mono text-sm text-[#1C2B48]">
                  {value || <span className="font-sans text-xs text-[#A93226]">（空白）</span>}
                </dd>
                {value ? <CopyButton value={value} /> : null}
              </div>
            ))}
          </dl>
          {section.note ? <p className="mt-2 text-xs text-[#5B7893]">{section.note}</p> : null}
          {section.danger ? <p className="mt-2 text-sm font-bold text-[#C0392B]">⚠️ {section.danger}</p> : null}
        </section>
      ))}

      <LandedCost summary={summary} defaults={defaults} postageTWD={order.shippingRecord?.postageTWD} />
    </div>
  );
}

function LandedCost({ summary, defaults, postageTWD }) {
  const [inputs, setInputs] = useState({
    postageTWD: postageTWD ?? "",
    fxTWDperUSD: 32,
    dutyRate: defaults.dutyRate,
    entryFeeUSD: defaults.entryFeeUSD,
    brokerFeeUSD: 0,
  });
  const est = estimateLandedCost({ totalValueUSD: summary.totalValueUSD, ...inputs });
  const set = (key) => (e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }));
  const field = "w-full rounded border border-[#8EB1D1]/40 bg-white px-2 py-1.5 text-sm";

  return (
    <section className="rounded border border-[#C77A0A]/40 bg-[#FDF6E3] p-4 text-sm text-[#5B4210]">
      <h2 className="font-bold">稅費預估 — Estimate — EZPost is authoritative</h2>
      <p className="mt-1 text-xs">實際關稅與規費以 EZPost 下單時計算的金額為準，這裡只是粗估。</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        <label className="text-xs">
          郵資 TWD
          <input type="number" value={inputs.postageTWD} onChange={set("postageTWD")} className={field} />
        </label>
        <label className="text-xs">
          匯率 TWD/USD
          <input type="number" step="0.01" value={inputs.fxTWDperUSD} onChange={set("fxTWDperUSD")} className={field} />
        </label>
        <label className="text-xs">
          關稅率
          <input type="number" step="0.01" value={inputs.dutyRate} onChange={set("dutyRate")} className={field} />
        </label>
        <label className="text-xs">
          入境規費 USD
          <input type="number" step="0.01" value={inputs.entryFeeUSD} onChange={set("entryFeeUSD")} className={field} />
        </label>
        <label className="text-xs">
          代理費 USD
          <input type="number" step="0.01" value={inputs.brokerFeeUSD} onChange={set("brokerFeeUSD")} className={field} />
        </label>
      </div>
      <p className="mt-3">
        申報價值 ${summary.totalValueUSD.toFixed(2)} → 關稅約 ${est.dutyUSD.toFixed(2)} + 規費 ${est.feesUSD.toFixed(2)} + 郵資約 $
        {est.postageUSD.toFixed(2)} ＝ <strong>約 ${est.totalUSD.toFixed(2)} USD（約 NT${est.totalTWD}）</strong>
      </p>
    </section>
  );
}

function CopyButton({ value, label = "Copy", wide = false }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older mobile browsers: fall back to a hidden textarea.
      const area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`shrink-0 rounded border border-[#8EB1D1] bg-white px-2.5 py-1 text-xs font-semibold text-[#35506B] hover:bg-[#C4D8E5] ${
        wide ? "px-4 py-2 text-sm" : ""
      }`}
    >
      {copied ? "✓ 已複製" : label}
    </button>
  );
}
