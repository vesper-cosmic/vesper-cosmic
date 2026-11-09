"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value) =>
  value ? new Date(value).toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "short" }) : "—";

const STATUS_LABEL = {
  processing: { text: "待撥款", className: "bg-[#34507A] text-white" },
  paid: { text: "已撥款", className: "bg-[#2E8B57] text-white" },
  rejected: { text: "已退回", className: "bg-[#8B99A8] text-white" },
};

export default function AdminReferralsPage() {
  const { status: authStatus } = useSession();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState("processing");
  const [silent, setSilent] = useState({}); // withdrawal id → true = don't email

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/referrals");
      if (response.status === 403) {
        setLoadState("forbidden");
        return;
      }
      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
      setError(data.error || "");
      setLoadState("ready");
    } catch {
      setError("載入失敗，請重新整理");
      setLoadState("ready");
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") load();
    if (authStatus === "unauthenticated") setLoadState("forbidden");
  }, [authStatus, load]);

  async function update(entry, status) {
    const question =
      status === "paid"
        ? `確認已將 ${money(entry.amount)} 匯給 ${entry.memberEmail}？`
        : `退回這筆 ${money(entry.amount)} 的提現申請？金額會回到會員的可提現餘額。`;
    if (!window.confirm(question)) return;

    setBusyId(entry.id);
    setError("");
    try {
      const response = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberEmail: entry.memberEmail,
          withdrawalId: entry.id,
          status,
          notifyMember: !silent[entry.id],
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "更新失敗");
        return;
      }
      await load();
    } finally {
      setBusyId("");
    }
  }

  if (loadState === "forbidden") {
    return (
      <Shell>
        <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-8 text-center">
          <h1 className="text-2xl font-semibold text-[#1C2B48]">需要管理員權限</h1>
          <Link href="/admin" className="mt-4 inline-block text-sm text-[#5B7893] underline">
            回到後台
          </Link>
        </div>
      </Shell>
    );
  }

  const shown = filter === "all" ? withdrawals : withdrawals.filter((entry) => entry.status === filter);
  const pendingTotal = withdrawals
    .filter((entry) => entry.status === "processing")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  return (
    <Shell>
      <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1C2B48]">分潤提現</h1>
            <p className="mt-2 text-sm text-[#35506B]">
              待撥款合計 <strong>{money(pendingTotal)} USD</strong>。匯款後按「標記已撥款」。
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
          >
            ← 訂單管理
          </Link>
        </div>

        <div className="mt-4 rounded border border-[#8EB1D1]/25 bg-white/50 p-3 text-xs leading-5 text-[#5B7893]">
          分潤規則：商品資料庫的分潤欄位（每件，USD）× 數量。訂單「已付款」且「貨品已寄出」滿 8 天後，
          分潤自動變成會員的可提現金額；滿 $15 USD 可申請提現。
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["processing", "待撥款"],
            ["paid", "已撥款"],
            ["rejected", "已退回"],
            ["all", "全部"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === value
                  ? "border-[#8EB1D1] bg-[#8EB1D1] text-[#1C2B48]"
                  : "border-[#8EB1D1]/40 bg-white/60 text-[#5B7893] hover:bg-[#C4D8E5]"
              }`}
            >
              {label} ({value === "all" ? withdrawals.length : withdrawals.filter((entry) => entry.status === value).length})
            </button>
          ))}
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {loadState === "loading" ? (
          <p className="mt-6 text-sm text-[#5B7893]">載入中…</p>
        ) : shown.length === 0 ? (
          <p className="mt-6 text-sm text-[#5B7893]">沒有提現申請</p>
        ) : (
          <div className="mt-5 space-y-3">
            {shown.map((entry) => {
              const status = STATUS_LABEL[entry.status] || STATUS_LABEL.processing;
              const payout = entry.payout || {};
              return (
                <div key={entry.id} className="rounded border border-[#8EB1D1]/30 bg-white/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-[#5B7893]">{entry.id}</p>
                      <p className="mt-1 font-semibold text-[#1C2B48]">
                        {entry.memberName || "—"}{" "}
                        <span className="font-normal text-[#5B7893]">{entry.memberEmail}</span>
                      </p>
                      <p className="text-xs text-[#5B7893]">申請時間：{formatDate(entry.requestedAt)}</p>
                      {entry.paidAt ? (
                        <p className="text-xs text-[#5B7893]">撥款時間：{formatDate(entry.paidAt)}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#1C2B48]">{money(entry.amount)}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${status.className}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded bg-[#F3F6F8] p-3 text-sm text-[#35506B]">
                    <p>
                      PayPal：<span className="font-mono">{payout.paypalEmail || "—"}</span>
                    </p>
                  </div>

                  {entry.status === "processing" ? (
                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                      <label className="mr-auto flex items-center gap-2 text-xs text-[#35506B]">
                        <input
                          type="checkbox"
                          checked={!silent[entry.id]}
                          onChange={(e) =>
                            setSilent((prev) => ({ ...prev, [entry.id]: !e.target.checked }))
                          }
                        />
                        標記已撥款時寄信通知會員
                      </label>
                      <button
                        type="button"
                        disabled={busyId === entry.id}
                        onClick={() => update(entry, "rejected")}
                        className="rounded border border-[#8B99A8]/60 px-3 py-1.5 text-xs font-semibold text-[#5B7893] hover:bg-[#E8ECEF] disabled:opacity-40"
                      >
                        退回
                      </button>
                      <button
                        type="button"
                        disabled={busyId === entry.id}
                        onClick={() => update(entry, "paid")}
                        className="rounded border border-[#2E8B57] bg-[#2E8B57] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#256f46] disabled:opacity-40"
                      >
                        標記已撥款
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">{children}</div>
    </main>
  );
}
