"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminFrame, LoadState, useShipmentCustoms } from "@/components/admin/useOrderCustoms";
import Helper from "@/components/admin/EzpostHelper";

export default function ShipmentEzpostPage({ params }) {
  const shipmentNo = decodeURIComponent(params.shipmentId);
  const search = useSearchParams();
  const packaging = search.get("packaging") === "box" ? "box" : search.get("packaging") === "envelope" ? "envelope" : "";
  const state = useShipmentCustoms(shipmentNo, packaging);

  return (
    <AdminFrame>
      <div className="mb-5">
        <Link href={`/admin/shipments/${encodeURIComponent(shipmentNo)}`} className="text-sm text-[#5B7893] underline">
          ← 出貨單 {shipmentNo}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#1C2B48]">EZPost 填寫小幫手（合併出貨）</h1>
        <p className="mt-1 text-sm text-[#35506B]">整個包裹只填一次：品項已合併、總重量含包材。</p>
      </div>
      {state.status !== "ready" ? (
        <LoadState state={state} orderId={shipmentNo} />
      ) : (
        <Helper data={state.data} />
      )}
    </AdminFrame>
  );
}
