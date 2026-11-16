"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminFrame, CheckList, LoadState, useShipmentCustoms } from "@/components/admin/useOrderCustoms";

const SERVICES = ["ePacket", "Air Parcel", "EMS"];
const input =
  "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";

export default function ShipmentPage() {
  const params = useParams();
  const shipmentNo = decodeURIComponent(params.shipmentId);
  const state = useShipmentCustoms(shipmentNo);
  const data = state.data;

  return (
    <AdminFrame>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/shipments" className="text-sm text-[#5B7893] underline">
            ← 出貨單
          </Link>
          <h1 className="mt-2 font-mono text-2xl font-bold text-[#1C2B48]">{shipmentNo}</h1>
          {data ? <p className="mt-1 text-sm text-[#35506B]">{data.shipment.status}</p> : null}
        </div>
        {data && data.shipment.status !== "❌ 已取消" ? (
          <Link
            href={`/admin/shipments/${encodeURIComponent(shipmentNo)}/ezpost?packaging=${data.shipment.packaging || "envelope"}`}
            className="rounded border border-[#1C2B48] bg-[#1C2B48] px-4 py-2 text-sm font-bold text-white hover:bg-[#2A3D60]"
          >
            EZPost Helper →
          </Link>
        ) : null}
      </div>

      {state.status !== "ready" ? <LoadState state={state} orderId={shipmentNo} /> : <Body data={data} shipmentNo={shipmentNo} reload={state.reload} />}
    </AdminFrame>
  );
}

function Body({ data, shipmentNo, reload }) {
  const { shipment } = data;
  const pending = shipment.status === "📦 待出貨";
  const cancelled = shipment.status === "❌ 已取消";
  const blocked = !data.validation.ok;
  const base = `/api/admin/shipments/${encodeURIComponent(shipmentNo)}`;
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(payload, { okText } = {}) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(base, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage([body.error, ...(body.failures || [])].filter(Boolean).join("\n") || "操作失敗");
        return null;
      }
      setMessage(okText || "已儲存。");
      await reload();
      return body;
    } catch {
      setMessage("網路錯誤，請再試一次。");
      return null;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <CheckList validation={data.validation} />

      <Documents base={base} data={data} blocked={blocked || cancelled} />

      <section className="grid gap-4 sm:grid-cols-2">
        <Card title="收件人 Ship to">
          <p className="font-semibold">{data.address.fullName || "—"}</p>
          <p>{data.address.addressLine1}</p>
          {data.address.addressLine2 ? <p>{data.address.addressLine2}</p> : null}
          <p>{[data.address.city, data.address.stateProvince, data.address.postalCode].filter(Boolean).join(", ")}</p>
          <p>{data.address.country}</p>
          <p className="mt-1">Tel: {data.address.phone || <span className="text-[#A93226]">（缺）</span>}</p>
        </Card>
        <Card title="包裹 Parcel">
          <p>訂單數：{data.orders.length}</p>
          <p>申報價值：${data.summary.totalValueUSD.toFixed(2)} USD（只含實體商品）</p>
          <p>
            淨重 {data.summary.netWeightG} g · 毛重 {data.summary.grossWeightG} g
          </p>
          <p>運費（另計）：${data.shippingChargedUSD.toFixed(2)} USD</p>
          <p className="mt-1 text-[#5B7893]">
            建議：{data.suggestion.service}，{data.suggestion.packaging === "box" ? "盒裝" : "信封"}（{data.suggestion.reason}）
          </p>
        </Card>
      </section>

      <Card title="包含的訂單 Orders">
        <ul className="divide-y divide-[#8EB1D1]/20">
          {data.orders.map((order) => (
            <li key={order.orderId} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <Link href={`/admin/orders/${encodeURIComponent(order.orderId)}`} className="font-mono text-sm font-bold text-[#1C2B48] underline">
                  {order.orderId}
                </Link>
                <p className="text-xs text-[#5B7893]">
                  {order.lines.map((line) => `${line.productName} × ${line.qty}`).join("、") || "（無實體商品）"}
                  {order.hasDigital ? " ＋數位商品（不寄送）" : ""}
                </p>
              </div>
              {pending ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => window.confirm(`把 ${order.orderId} 從這張出貨單移出？`) && call({ action: "remove-order", orderId: order.orderId }, { okText: "已移出訂單。" })}
                  className="rounded border border-[#C0392B]/40 bg-white px-2.5 py-1 text-xs font-semibold text-[#A93226] hover:bg-[#FDE8E6] disabled:opacity-50"
                >
                  拆分 Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="申報品項（合併後）Customs lines">
        {data.invoiceLines.length === 0 ? (
          <p className="text-[#5B7893]">沒有需要申報的實體商品。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="text-[#5B7893]">
                <tr>
                  <th className="py-1 pr-2">品名</th>
                  <th className="py-1 pr-2">HTSUS</th>
                  <th className="py-1 pr-2 text-right">數量</th>
                  <th className="py-1 pr-2 text-right">單價</th>
                  <th className="py-1 pr-2 text-right">小計</th>
                  <th className="py-1 text-right">重量 g</th>
                </tr>
              </thead>
              <tbody>
                {data.invoiceLines.map((line, i) => (
                  <tr key={i} className="border-t border-[#8EB1D1]/20">
                    <td className="py-1 pr-2">{line.description || <span className="text-[#A93226]">（缺）</span>}</td>
                    <td className="py-1 pr-2 font-mono">{line.htsus || <span className="text-[#A93226]">（缺）</span>}</td>
                    <td className="py-1 pr-2 text-right">{line.qty}</td>
                    <td className="py-1 pr-2 text-right">{line.unitValueUSD.toFixed(2)}</td>
                    <td className="py-1 pr-2 text-right">{line.totalValueUSD.toFixed(2)}</td>
                    <td className="py-1 text-right">{line.totalWeightG || <span className="text-[#A93226]">（缺）</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {cancelled ? null : <RecordForm key={shipment.shipmentNo + shipment.status} data={data} busy={busy} call={call} />}

      {pending ? (
        <ShipNow shipment={shipment} busy={busy} call={call} />
      ) : shipment.status === "🚚 已出貨" ? (
        <EmailPanel shipment={shipment} busy={busy} call={call} />
      ) : null}

      {pending ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => window.confirm("取消這張出貨單？訂單不會被改動。") && call({ action: "cancel" }, { okText: "出貨單已取消。" })}
          className="text-xs text-[#A93226] underline disabled:opacity-50"
        >
          取消出貨單
        </button>
      ) : null}

      {message ? <p className="whitespace-pre-line rounded border border-[#8EB1D1]/40 bg-white/70 p-3 text-sm text-[#1C2B48]">{message}</p> : null}
    </div>
  );
}

function Documents({ base, data, blocked }) {
  const [packaging, setPackaging] = useState(data.shipment.packaging || "envelope");
  const service = data.shipment.service || "";
  const button =
    "rounded border px-4 py-2 text-sm font-bold transition " +
    (blocked
      ? "pointer-events-none border-[#8EB1D1]/30 bg-[#C4D8E5] text-[#5B7893] opacity-60"
      : "border-[#8EB1D1] bg-[#8EB1D1] text-[#1C2B48] hover:bg-[#A7C7E7]");
  return (
    <Card title="文件 Documents">
      <div className="flex flex-wrap items-center gap-2">
        <a className={button} target="_blank" rel="noopener noreferrer" aria-disabled={blocked}
          href={`${base}/invoice.pdf?packaging=${packaging}${service ? `&service=${encodeURIComponent(service)}` : ""}`}>
          Commercial Invoice (PDF)
        </a>
        <a className={button} target="_blank" rel="noopener noreferrer" aria-disabled={blocked} href={`${base}/packing-list.pdf?packaging=${packaging}`}>
          Packing List (PDF)
        </a>
        <label className="ml-2 flex items-center gap-1.5 text-xs text-[#35506B]">
          包裝：
          <select value={packaging} onChange={(e) => setPackaging(e.target.value)} className="rounded border border-[#8EB1D1]/40 bg-white px-2 py-1">
            <option value="envelope">信封（+{data.defaults.packagingEnvelopeG} g）</option>
            <option value="box">盒子（+{data.defaults.packagingBoxG} g）</option>
          </select>
        </label>
      </div>
      <p className="mt-2 text-[11px] text-[#8B99A8]">
        整個包裹一份發票（標頭列出所有訂單編號）；裝箱單依訂單分組。若已填「包裹總重」，會以實際重量為準。
      </p>
    </Card>
  );
}

function RecordForm({ data, busy, call }) {
  const s = data.shipment;
  const [form, setForm] = useState({
    service: s.service || "",
    packaging: s.packaging || "",
    grossWeightG: s.grossWeightG ?? "",
    postageTWD: s.postageTWD ?? "",
    dutyFeesTWD: s.dutyFeesTWD ?? "",
    ezpostLabelNo: s.ezpostLabelNo || "",
    trackingNumber: s.trackingNumber || "",
  });
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  return (
    <Card title="出貨資料 Shipping record">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-[#5B7893]">
          寄送方式
          <select value={form.service} onChange={set("service")} className={`${input} mt-1`}>
            <option value="">—</option>
            {SERVICES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          包裝
          <select value={form.packaging} onChange={set("packaging")} className={`${input} mt-1`}>
            <option value="">—</option>
            <option value="envelope">envelope 信封</option>
            <option value="box">box 盒子</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          包裹總重 (g)（磅秤實重）
          <input type="number" min="0" value={form.grossWeightG} onChange={set("grossWeightG")} className={`${input} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          郵資 (TWD)
          <input type="number" min="0" value={form.postageTWD} onChange={set("postageTWD")} className={`${input} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          關稅與規費 (TWD)
          <input type="number" min="0" value={form.dutyFeesTWD} onChange={set("dutyFeesTWD")} className={`${input} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-[#5B7893]">
          EZPost 標籤號碼
          <input type="text" value={form.ezpostLabelNo} onChange={set("ezpostLabelNo")} className={`${input} mt-1 font-mono`} />
        </label>
        <label className="text-xs font-semibold text-[#5B7893] sm:col-span-3">
          追蹤號碼 Tracking number
          <input type="text" value={form.trackingNumber} onChange={set("trackingNumber")} className={`${input} mt-1 font-mono`} />
        </label>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => call({ action: "update", ...form })}
        className="mt-3 rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-1.5 text-sm font-bold text-[#1C2B48] hover:bg-[#A7C7E7] disabled:opacity-50"
      >
        儲存
      </button>
    </Card>
  );
}

function ShipNow({ shipment, busy, call }) {
  const [tracking, setTracking] = useState(shipment.trackingNumber || "");
  return (
    <Card title="標記已出貨 Mark shipped">
      <p className="text-xs text-[#35506B]">
        會把這張出貨單裡<strong>每一張訂單</strong>都改為「🚚 已出貨」並寫入追蹤號碼。<strong>不會自動寄信</strong>，出貨後再按下方的寄信按鈕才會寄。
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input type="text" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="追蹤號碼（必填）" className={`${input} max-w-xs font-mono`} />
        <button
          type="button"
          disabled={busy || !tracking.trim()}
          onClick={() =>
            window.confirm("確定要把所有訂單標為已出貨嗎？") &&
            call({ action: "mark-shipped", trackingNumber: tracking.trim() }, { okText: "已標為已出貨，所有訂單已更新。" })
          }
          className="rounded border border-[#1C2B48] bg-[#1C2B48] px-4 py-2 text-sm font-bold text-white hover:bg-[#2A3D60] disabled:opacity-50"
        >
          標記已出貨並更新訂單
        </button>
      </div>
    </Card>
  );
}

function EmailPanel({ shipment, busy, call }) {
  const [note, setNote] = useState("");
  const [attach, setAttach] = useState(false);
  return (
    <Card title="出貨通知信 Customer email">
      <p className="text-xs text-[#35506B]">
        每位顧客只寄<strong>一封</strong>，信裡列出他在這個包裹裡的所有訂單編號。
        {shipment.emailedAt ? <span className="ml-1 font-semibold text-[#7A5410]">（已在 {String(shipment.emailedAt).slice(0, 16).replace("T", " ")} 寄過）</span> : null}
      </p>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="給顧客的話（選填）" className={`${input} mt-2`} />
      <label className="mt-2 flex items-center gap-2 text-xs text-[#35506B]">
        <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} />
        附上商業發票 PDF
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm("確定要寄出貨通知信給顧客嗎？")) return;
          const body = await call({ action: "send-emails", note, attachInvoice: attach }, { okText: "" });
          if (body?.results) {
            alert(body.results.map((r) => `${r.email}：${r.success ? "已寄出" : r.skipped ? "未寄（顧客信件未啟用）" : `失敗 ${r.error}`}`).join("\n"));
          }
        }}
        className="mt-2 rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-bold text-[#1C2B48] hover:bg-[#A7C7E7] disabled:opacity-50"
      >
        寄出貨通知信
      </button>
    </Card>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded border border-[#8EB1D1]/30 bg-white/60 p-4 text-sm text-[#1C2B48]">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#5B7893]">{title}</h2>
      {children}
    </section>
  );
}
