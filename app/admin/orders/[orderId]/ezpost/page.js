"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminFrame, CheckList, LoadState, useOrderCustoms } from "@/components/admin/useOrderCustoms";
import Helper from "@/components/admin/EzpostHelper";

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
      {state.status !== "ready" ? (
        <LoadState state={state} orderId={orderId} />
      ) : state.data.digitalOnly ? (
        <CheckList validation={state.data.validation} />
      ) : (
        <Helper data={state.data} />
      )}
    </AdminFrame>
  );
}
