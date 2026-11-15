"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminFrame } from "@/components/admin/useOrderCustoms";

export default function ShipmentsPage() {
  const [state, setState] = useState({ loading: true, shipments: [], error: "", configured: true, denied: false });

  useEffect(() => {
    fetch("/api/admin/shipments", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 404) return setState((s) => ({ ...s, loading: false, denied: true }));
        const body = await response.json();
        setState({ loading: false, shipments: body.shipments || [], error: body.error || "", configured: body.configured !== false, denied: false });
      })
      .catch(() => setState((s) => ({ ...s, loading: false, error: "載入失敗" })));
  }, []);

  return (
    <AdminFrame>
      <Link href="/admin" className="text-sm text-[#5B7893] underline">
        ← 訂單管理
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-[#1C2B48]">合併出貨 Shipments</h1>
      <p className="mt-1 text-sm text-[#35506B]">在訂單管理勾選同一位收件人的已付款訂單，按「合併出貨」建立。</p>

      {state.denied ? <p className="mt-4 text-sm text-[#A93226]">請用管理員帳號登入。</p> : null}
      {!state.configured ? <p className="mt-4 text-sm text-[#7A5410]">尚未設定 NOTION_SHIPMENTS_DATABASE_ID。</p> : null}
      {state.error ? <p className="mt-4 text-sm text-[#A93226]">{state.error}</p> : null}
      {state.loading ? <p className="mt-4 text-sm text-[#5B7893]">載入中…</p> : null}

      <ul className="mt-5 space-y-2">
        {state.shipments.map((shipment) => (
          <li key={shipment.shipmentNo} className="rounded border border-[#8EB1D1]/30 bg-white/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/admin/shipments/${encodeURIComponent(shipment.shipmentNo)}`} className="font-mono text-sm font-bold text-[#1C2B48] underline">
                {shipment.shipmentNo}
              </Link>
              <span className="text-xs text-[#35506B]">{shipment.status}</span>
            </div>
            <p className="mt-1 text-xs text-[#5B7893]">
              {shipment.orderIds.join("、")} {shipment.trackingNumber ? `· 追蹤 ${shipment.trackingNumber}` : ""}
            </p>
          </li>
        ))}
        {!state.loading && state.shipments.length === 0 ? <li className="text-sm text-[#5B7893]">還沒有出貨單。</li> : null}
      </ul>
    </AdminFrame>
  );
}
