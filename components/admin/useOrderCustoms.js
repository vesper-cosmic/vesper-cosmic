"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Load an order's customs data for the admin pages. The API enforces admin
 * access; this only shows the result. status: loading | ready | signin | denied | error
 */
export function useOrderCustoms(orderId, packaging = "envelope") {
  const [state, setState] = useState({ status: "loading", data: null, error: "" });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, status: prev.data ? "ready" : "loading" }));
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/customs?packaging=${packaging}`,
        { cache: "no-store" }
      );
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) return setState({ status: "signin", data: null, error: "" });
      if (response.status === 404 && !body?.order) {
        return setState({ status: "denied", data: null, error: body.error || "Not found." });
      }
      if (!response.ok) return setState({ status: "error", data: null, error: body.error || "Load failed." });
      setState({ status: "ready", data: body, error: "" });
    } catch {
      setState({ status: "error", data: null, error: "Network error — please try again." });
    }
  }, [orderId, packaging]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

export function AdminFrame({ children }) {
  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-8">
        {children}
      </div>
    </main>
  );
}

export function LoadState({ state, orderId }) {
  if (state.status === "loading") return <p className="text-sm text-[#5B7893]">載入中…</p>;
  if (state.status === "signin") {
    return (
      <p className="text-sm text-[#35506B]">
        請先
        <a className="mx-1 underline" href={`/auth/signin?callbackUrl=${encodeURIComponent(`/admin/orders/${orderId}`)}`}>
          以管理員帳號登入
        </a>
        。
      </p>
    );
  }
  return <p className="text-sm text-[#A93226]">{state.error || "找不到這筆訂單。"}</p>;
}

export function CheckList({ validation }) {
  if (!validation) return null;
  const { errors = [], warnings = [] } = validation;
  if (!errors.length && !warnings.length) {
    return <p className="rounded border border-[#2E8B57]/30 bg-[#E9F5EE] p-3 text-sm text-[#1F5E3B]">✓ 海關資料完整，可以產生文件。</p>;
  }
  return (
    <div className="space-y-2">
      {errors.length ? (
        <div className="rounded border border-[#C0392B]/40 bg-[#FDE8E6] p-3 text-sm text-[#7B241C]">
          <p className="font-semibold">必須先修正（PDF 已停用）：</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {warnings.length ? (
        <div className="rounded border border-[#C77A0A]/40 bg-[#FDF6E3] p-3 text-sm text-[#7A5410]">
          <p className="font-semibold">提醒（不影響產生文件）：</p>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
