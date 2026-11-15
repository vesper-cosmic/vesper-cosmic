"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminFrame } from "@/components/admin/useOrderCustoms";

const money = (n) => Math.round(Number(n || 0)).toLocaleString("zh-TW");
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

export default function CostReportPage() {
  const [month, setMonth] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/reports/cost${month ? `?month=${month}` : ""}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 404) return setError("請用管理員帳號登入。");
        const body = await response.json();
        if (!response.ok) return setError(body.error || "載入失敗");
        setError("");
        setData(body);
      })
      .catch(() => setError("載入失敗，請重新整理。"))
      .finally(() => setLoading(false));
  }, [month]);

  const t = data?.totals;
  const w = data?.warnings;

  return (
    <AdminFrame>
      <Link href="/admin" className="text-sm text-[#5B7893] underline">
        ← 訂單管理
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-[#1C2B48]">成本與毛利報表</h1>
      <p className="mt-1 text-sm text-[#35506B]">全部以新台幣計算。營收＝訂單金額（含運費收入）× 下單當下匯率。只計算「已付款」且未取消的訂單。</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold text-[#5B7893]">
          月份
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="ml-2 rounded border border-[#8EB1D1]/40 bg-white px-2 py-1.5 text-sm text-[#1C2B48]">
            <option value="">全部</option>
            {(data?.months || []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        {data?.todayRate ? (
          <span className="text-xs text-[#5B7893]">
            今日匯率 {data.todayRate.rate}（{data.todayRate.source === "live" ? "即時" : "備用"}）· PayPal 手續費 {data.feeConfig.percent}% + US${data.feeConfig.fixedUSD}
          </span>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm text-[#A93226]">{error}</p> : null}
      {loading && !data ? <p className="mt-4 text-sm text-[#5B7893]">載入中…</p> : null}

      {t ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card label="營收" value={`NT$${money(t.revenueTWD)}`} sub={`${t.orderCount} 張訂單`} />
            <Card label="總成本" value={`NT$${money(t.totalCostTWD)}`} />
            <Card label="毛利" value={`NT$${money(t.profitTWD)}`} good={t.profitTWD >= 0} bad={t.profitTWD < 0} />
            <Card label="毛利率" value={pct(t.marginPct)} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#35506B] sm:grid-cols-5">
            <Mini label="商品成本" value={t.productCostTWD} />
            <Mini label="PayPal 手續費" value={t.paypalFeeTWD} />
            <Mini label="郵資" value={t.postageTWD} />
            <Mini label="關稅與規費" value={t.dutyFeesTWD} />
            <Mini label="推薦分潤" value={t.referralTWD} />
          </div>

          {w.estimatedOrders > 0 || w.fallbackRateOrders > 0 || w.productsWithoutRecipe.length > 0 ? (
            <div className="mt-4 space-y-1 rounded border border-[#C77A0A]/40 bg-[#FDF6E3] p-3 text-xs text-[#7A5410]">
              {w.estimatedOrders > 0 ? <p>• {w.estimatedOrders} 張訂單尚未出貨，商品成本是用「現在的配方與平均成本」預估的，出貨後會固定下來。</p> : null}
              {w.fallbackRateOrders > 0 ? <p>• {w.fallbackRateOrders} 張訂單沒有記錄下單匯率（舊訂單或當時抓不到即時匯率），暫用備用匯率估算。</p> : null}
              {w.productsWithoutRecipe.length > 0 ? <p>• 這些商品還沒設定配方，成本以 0 計算，毛利會偏高：{w.productsWithoutRecipe.map((p) => p.name).join("、")}</p> : null}
            </div>
          ) : null}

          {data.inventory.configured ? (
            <p className="mt-4 text-sm text-[#1C2B48]">
              目前原料庫存價值：<strong>NT${money(data.inventory.totalValueTWD)}</strong>
              {data.inventory.lowCount > 0 ? <span className="ml-2 text-[#A93226]">（{data.inventory.lowCount} 項低庫存）</span> : null}
              {data.inventory.negativeCount > 0 ? <span className="ml-2 text-[#A93226]">（{data.inventory.negativeCount} 項庫存為負，請補進貨登記）</span> : null}
              <Link href="/admin/inventory" className="ml-2 underline text-xs">原料庫存 →</Link>
            </p>
          ) : null}

          <h2 className="mt-6 text-sm font-bold text-[#1C2B48]">目前上架商品的毛利（依今日匯率 {data.todayRate?.rate}、目前原料平均成本；不含郵資、關稅、分潤）</h2>
          <Table
            head={["商品", "售價 US$", "售價 NT$", "單件成本", "PayPal 費", "毛利", "毛利率"]}
            rows={(data.catalog || []).map((p) => [
              <span key="n">{p.name}{!p.hasRecipe ? <span className="ml-1 text-[11px] text-[#7A5410]" title="還沒設定成本配方，成本可能偏低">（未設配方）</span> : null}</span>,
              p.priceUSD.toFixed(2),
              money(p.priceTWD),
              money(p.unitCostTWD),
              money(p.paypalFeeTWD),
              <span key="m" className={p.marginTWD < 0 ? "text-[#A93226]" : ""}>{money(p.marginTWD)}</span>,
              <span key="p" className={p.marginPct < 0 ? "text-[#A93226]" : ""}>{pct(p.marginPct)}</span>,
            ])}
          />

          <h2 className="mt-6 text-sm font-bold text-[#1C2B48]">每月</h2>
          <Table
            head={["月份", "訂單", "營收", "成本", "毛利"]}
            rows={data.byMonth.map((m) => [m.month, m.orderCount, money(m.revenueTWD), money(m.totalCostTWD), money(m.profitTWD)])}
          />

          <h2 className="mt-6 text-sm font-bold text-[#1C2B48]">各商品（營收減商品成本，不含郵資與手續費）</h2>
          <Table
            head={["商品", "銷量", "營收", "商品成本", "毛利", "毛利率"]}
            rows={data.byProduct.map((p) => [p.name, p.quantity, money(p.revenueTWD), money(p.costTWD), money(p.grossProfitTWD), pct(p.marginPct)])}
          />

          <h2 className="mt-6 text-sm font-bold text-[#1C2B48]">每張訂單</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs text-[#1C2B48]">
              <thead className="text-[#5B7893]">
                <tr>
                  <th className="py-1.5 pr-2">訂單</th>
                  <th className="py-1.5 pr-2 text-right">US$</th>
                  <th className="py-1.5 pr-2 text-right">匯率</th>
                  <th className="py-1.5 pr-2 text-right">營收</th>
                  <th className="py-1.5 pr-2 text-right">商品</th>
                  <th className="py-1.5 pr-2 text-right">手續費</th>
                  <th className="py-1.5 pr-2 text-right">郵資＋稅</th>
                  <th className="py-1.5 pr-2 text-right">分潤</th>
                  <th className="py-1.5 pr-2 text-right">毛利</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.orderId} className="border-t border-[#8EB1D1]/20">
                    <td className="py-1.5 pr-2 font-mono">
                      <Link href={`/admin/orders/${encodeURIComponent(o.orderId)}`} className="underline">{o.orderId}</Link>
                      {o.shipmentNo ? <span className="ml-1 text-[#5B7893]">📦</span> : null}
                    </td>
                    <td className="py-1.5 pr-2 text-right">{o.amountUSD.toFixed(2)}</td>
                    <td className={`py-1.5 pr-2 text-right ${o.rateSource === "fallback" ? "text-[#7A5410]" : ""}`} title={o.rateSource === "fallback" ? "備用匯率" : "下單當下匯率"}>
                      {o.rate}{o.rateSource === "fallback" ? "*" : ""}
                    </td>
                    <td className="py-1.5 pr-2 text-right">{money(o.revenueTWD)}</td>
                    <td className={`py-1.5 pr-2 text-right ${o.costBasis === "estimate" ? "text-[#7A5410]" : ""}`} title={o.costBasis === "estimate" ? "預估（尚未出貨）" : "出貨時固定的成本"}>
                      {money(o.productCostTWD)}{o.costBasis === "estimate" ? "*" : ""}
                    </td>
                    <td className="py-1.5 pr-2 text-right">{money(o.paypalFeeTWD)}</td>
                    <td className="py-1.5 pr-2 text-right">{money(o.postageTWD + o.dutyFeesTWD)}</td>
                    <td className="py-1.5 pr-2 text-right">{money(o.referralTWD)}</td>
                    <td className={`py-1.5 pr-2 text-right font-bold ${o.profitTWD < 0 ? "text-[#A93226]" : ""}`}>{money(o.profitTWD)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-[#8B99A8]">* 表示估算：匯率用備用值，或商品成本是預估（尚未出貨）。合併出貨的郵資與關稅依訂單金額比例分攤。</p>
        </>
      ) : null}
    </AdminFrame>
  );
}

function Card({ label, value, sub, good, bad }) {
  return (
    <div className={`rounded border p-3 ${bad ? "border-[#C0392B]/40 bg-[#FDE8E6]" : good ? "border-[#2E8B57]/30 bg-[#E9F5EE]" : "border-[#8EB1D1]/30 bg-white/60"}`}>
      <p className="text-xs text-[#5B7893]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#1C2B48]">{value}</p>
      {sub ? <p className="text-[11px] text-[#5B7893]">{sub}</p> : null}
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded border border-[#8EB1D1]/25 bg-white/50 px-2 py-1.5">
      <span className="text-[#5B7893]">{label}</span> <strong className="text-[#1C2B48]">NT${money(value)}</strong>
    </div>
  );
}

function Table({ head, rows }) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm text-[#1C2B48]">
        <thead className="text-xs text-[#5B7893]">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`py-1.5 pr-2 ${i > 0 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t border-[#8EB1D1]/20">
              {row.map((cell, i) => (
                <td key={i} className={`py-1.5 pr-2 ${i > 0 ? "text-right font-mono" : ""}`}>{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr><td colSpan={head.length} className="py-3 text-sm text-[#5B7893]">沒有資料。</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
