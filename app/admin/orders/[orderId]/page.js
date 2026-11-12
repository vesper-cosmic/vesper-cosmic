"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminFrame, CheckList, LoadState, useOrderCustoms } from "@/components/admin/useOrderCustoms";

const SERVICES = ["ePacket", "Air Parcel", "EMS"];
const input =
  "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";

export default function AdminOrderDetailPage({ params }) {
  const orderId = decodeURIComponent(params.orderId);
  const [packaging, setPackaging] = useState("envelope");
  const [showPrices, setShowPrices] = useState(false);
  const state = useOrderCustoms(orderId, packaging);
  const data = state.data;

  return (
    <AdminFrame>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-[#5B7893] underline">
            ← 訂單管理
          </Link>
          <h1 className="mt-2 font-mono text-2xl font-bold text-[#1C2B48]">{orderId}</h1>
        </div>
        {data ? (
          <Link
            href={`/admin/orders/${encodeURIComponent(orderId)}/ezpost?packaging=${packaging}`}
            className="rounded border border-[#1C2B48] bg-[#1C2B48] px-4 py-2 text-sm font-bold text-white hover:bg-[#2A3D60]"
          >
            EZPost Helper →
          </Link>
        ) : null}
      </div>

      {state.status !== "ready" ? (
        <LoadState state={state} orderId={orderId} />
      ) : (
        <div className="space-y-5">
          <CheckList validation={data.validation} />

          <Documents
            orderId={orderId}
            data={data}
            packaging={packaging}
            setPackaging={setPackaging}
            showPrices={showPrices}
            setShowPrices={setShowPrices}
          />

          <section className="grid gap-4 sm:grid-cols-2">
            <Card title="收件人 Ship to">
              <p className="font-semibold">{data.address.fullName || "—"}</p>
              <p>{data.address.addressLine1}</p>
              {data.address.addressLine2 ? <p>{data.address.addressLine2}</p> : null}
              <p>{[data.address.city, data.address.stateProvince, data.address.postalCode].filter(Boolean).join(", ")}</p>
              <p>{data.address.country}</p>
              <p className="mt-1">Tel: {data.address.phone || <span className="text-[#A93226]">（缺）</span>}</p>
              <p className="text-[#5B7893]">{data.order.email}</p>
            </Card>
            <Card title="訂單 Order">
              <p>金額：${data.order.amountUSD.toFixed(2)} USD（含運費 ${data.shippingChargedUSD.toFixed(2)}）</p>
              <p>付款：{data.order.paymentStatus || "—"}</p>
              <p>PayPal：{data.order.paypalCaptureId || "—"}</p>
              <p>申報價值：${data.summary.totalValueUSD.toFixed(2)} USD</p>
              <p>
                淨重 {data.summary.netWeightG} g · 毛重 {data.summary.grossWeightG} g
              </p>
              {data.order.hasDigital ? <p className="text-[#5B7893]">含數位商品（不寄送、不申報）</p> : null}
            </Card>
          </section>

          <Card title="申報品項 Customs lines">
            {data.lines.length === 0 ? (
              <p className="text-[#5B7893]">沒有需要申報的實體商品。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="text-[#5B7893]">
                    <tr>
                      <th className="py-1 pr-2">品項</th>
                      <th className="py-1 pr-2">英文品名</th>
                      <th className="py-1 pr-2">HTSUS</th>
                      <th className="py-1 pr-2 text-right">數量</th>
                      <th className="py-1 pr-2 text-right">單價 USD</th>
                      <th className="py-1 text-right">重量 g</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lines.map((line, i) => (
                      <tr key={i} className="border-t border-[#8EB1D1]/20">
                        <td className="py-1.5 pr-2">{line.productName}</td>
                        <td className="py-1.5 pr-2">{line.description || <Missing />}</td>
                        <td className="py-1.5 pr-2 font-mono">{line.htsus || <Missing />}</td>
                        <td className="py-1.5 pr-2 text-right">{line.qty}</td>
                        <td className="py-1.5 pr-2 text-right">{line.unitValueUSD.toFixed(2)}</td>
                        <td className="py-1.5 text-right">{line.totalWeightG || <Missing />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-[11px] text-[#8B99A8]">缺資料請到「產品管理」編輯該產品的「海關資料」。</p>
          </Card>

          <ShippingRecord orderId={orderId} data={data} onSaved={state.reload} />
        </div>
      )}
    </AdminFrame>
  );
}

function Missing() {
  return <span className="text-[#A93226]">缺</span>;
}

function Card({ title, children }) {
  return (
    <section className="rounded border border-[#8EB1D1]/30 bg-white/60 p-4 text-sm text-[#1C2B48]">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#5B7893]">{title}</h2>
      {children}
    </section>
  );
}

function Documents({ orderId, data, packaging, setPackaging, showPrices, setShowPrices }) {
  const blocked = !data.validation.ok;
  const base = `/api/admin/orders/${encodeURIComponent(orderId)}`;
  const service = data.order.shippingRecord?.shippingService || "";
  const button =
    "rounded border px-4 py-2 text-sm font-bold transition " +
    (blocked
      ? "pointer-events-none border-[#8EB1D1]/30 bg-[#C4D8E5] text-[#5B7893] opacity-60"
      : "border-[#8EB1D1] bg-[#8EB1D1] text-[#1C2B48] hover:bg-[#A7C7E7]");
  return (
    <Card title="文件 Documents">
      <div className="flex flex-wrap items-center gap-2">
        <a
          className={button}
          href={`${base}/invoice.pdf?packaging=${packaging}${service ? `&service=${encodeURIComponent(service)}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={blocked}
        >
          Commercial Invoice (PDF)
        </a>
        <a
          className={button}
          href={`${base}/packing-slip.pdf${showPrices ? "?prices=1" : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={blocked}
        >
          Packing Slip (PDF)
        </a>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#35506B]">
        <label className="flex items-center gap-1.5">
          包裝：
          <select value={packaging} onChange={(e) => setPackaging(e.target.value)} className="rounded border border-[#8EB1D1]/40 bg-white px-2 py-1">
            <option value="envelope">信封（+{data.defaults.packagingEnvelopeG} g）</option>
            <option value="box">盒子（+{data.defaults.packagingBoxG} g）</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={showPrices} onChange={(e) => setShowPrices(e.target.checked)} />
          出貨單顯示價格
        </label>
      </div>
      <p className="mt-2 text-[11px] text-[#8B99A8]">
        PDF 會在新分頁開啟，可直接列印。任何能登入後台的裝置（電腦、手機）都能產生。若已填「包裹總重」，會以實際重量為準。
      </p>
    </Card>
  );
}

function ShippingRecord({ orderId, data, onSaved }) {
  const record = data.order.shippingRecord || {};
  const [form, setForm] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      shippingService: record.shippingService || "",
      grossWeightG: record.grossWeightG ?? "",
      postageTWD: record.postageTWD ?? "",
      dutyFeesTWD: record.dutyFeesTWD ?? "",
      ezpostLabelNo: record.ezpostLabelNo || "",
      trackingNumber: data.order.trackingNumber || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/customs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "儲存失敗");
      setMessage({ ok: true, text: "已儲存。" });
      onSaved();
    } catch (error) {
      setMessage({ ok: false, text: error.message });
    } finally {
      setSaving(false);
    }
  }

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Card title="寄件紀錄 Shipping record（寫入 Notion）">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-[#5B7893]">
          寄送方式
          <select value={form.shippingService || ""} onChange={set("shippingService")} className={input}>
            <option value="">—</option>
            {SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#5B7893]">
          包裹總重 (g)
          <input type="number" min="0" value={form.grossWeightG ?? ""} onChange={set("grossWeightG")} className={input} />
        </label>
        <label className="text-xs text-[#5B7893]">
          追蹤號碼
          <input type="text" value={form.trackingNumber || ""} onChange={set("trackingNumber")} className={`${input} font-mono`} />
        </label>
        <label className="text-xs text-[#5B7893]">
          郵資 (TWD)
          <input type="number" min="0" value={form.postageTWD ?? ""} onChange={set("postageTWD")} className={input} />
        </label>
        <label className="text-xs text-[#5B7893]">
          關稅與規費 (TWD)
          <input type="number" min="0" value={form.dutyFeesTWD ?? ""} onChange={set("dutyFeesTWD")} className={input} />
        </label>
        <label className="text-xs text-[#5B7893]">
          EZPost 標籤號碼
          <input type="text" value={form.ezpostLabelNo || ""} onChange={set("ezpostLabelNo")} className={`${input} font-mono`} />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        {message ? <span className={`text-xs ${message.ok ? "text-[#2E8B57]" : "text-[#C0392B]"}`}>{message.text}</span> : null}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded border border-[#1C2B48] bg-[#1C2B48] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {saving ? "儲存中…" : "儲存寄件紀錄"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[#8B99A8]">
        只改追蹤號碼不會寄信。要通知顧客出貨，請回訂單管理把狀態改成「🚚 已出貨」。
      </p>
    </Card>
  );
}
