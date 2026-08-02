"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { ORDER_STATUSES, normalizedStatus } from "@/lib/orderStatus";

const STATUS_OPTIONS = ORDER_STATUSES;

export default function AdminPage() {
  const { status: authStatus } = useSession();
  const [orders, setOrders] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState("");
  const [saveMessage, setSaveMessage] = useState({});
  const [filter, setFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    (async () => {
      try {
        const response = await fetch("/api/admin/orders");
        const data = await response.json();
        if (response.status === 403) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(true);
        setLoadError(data?.error || "");
        setOrders(data?.orders || []);
      } catch {
        setLoadError("Failed to load orders.");
      }
    })();
  }, [authStatus]);

  async function handleSave(orderId) {
    const draft = drafts[orderId] || {};
    const status = draft.status;
    if (!status) return;

    const trackingNumber = draft.trackingNumber || "";
    setSavingId(orderId);
    setSaveMessage((prev) => ({ ...prev, [orderId]: "" }));

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status, trackingNumber }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSaveMessage((prev) => ({
          ...prev,
          [orderId]: { type: "error", text: data?.error || "Update failed." },
        }));
        return;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId
            ? { ...order, productionStatus: status, trackingNumber: trackingNumber || order.trackingNumber }
            : order
        )
      );
      setSaveMessage((prev) => ({
        ...prev,
        [orderId]: { type: "success", text: "已更新 / Updated" },
      }));
    } catch {
      setSaveMessage((prev) => ({
        ...prev,
        [orderId]: { type: "error", text: "Network error — please try again." },
      }));
    } finally {
      setSavingId("");
    }
  }

  if (authStatus === "loading") {
    return <AdminShell>Loading…</AdminShell>;
  }

  if (authStatus === "unauthenticated") {
    return (
      <AdminShell>
        <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <h1 className="text-2xl font-semibold text-[#1C2B48]">後台管理員登入</h1>
          <p className="mt-3 text-sm text-[#35506B]">請使用管理員 Google 帳號登入</p>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/admin" })}
            className="mt-6 rounded border border-[#8EB1D1] bg-[#8EB1D1] px-6 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7]"
          >
            Sign in
          </button>
        </div>
      </AdminShell>
    );
  }

  if (!isAdmin) {
    return (
      <AdminShell>
        <div className="rounded-lg border border-[#ffb8b1]/50 bg-[#2d171d] p-8 text-center">
          <h1 className="text-2xl font-semibold text-[#ffe1dd]">沒有權限</h1>
          <p className="mt-3 text-sm text-[#ffd0c9]">此帳號不是管理員。請使用管理員帳號登入。</p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin" })}
            className="mt-6 rounded border border-[#ffb8b1]/50 px-6 py-2.5 text-sm font-semibold text-[#ffe1dd] hover:bg-[#ffb8b1]/10"
          >
            Sign out
          </button>
        </div>
      </AdminShell>
    );
  }

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => normalizedStatus(order.productionStatus) === filter);

  return (
    <AdminShell>
      <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1C2B48]">訂單管理</h1>
            <p className="mt-2 text-sm text-[#35506B]">點選狀態更新每個顧客訂單的處理進度</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/products"
              className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#A7C7E7]"
            >
              產品管理 →
            </Link>
            <Link
              href="/shop"
              className="rounded border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
            >
              ← Back to Shop
            </Link>
          </div>
        </div>

        {loadError ? (
          <div className="mt-6 rounded border border-[#ffb8b1]/50 bg-[#2d171d] p-4 text-sm text-[#ffe1dd]">
            {loadError}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            全部 ({orders.length})
          </FilterPill>
          {STATUS_OPTIONS.map((status) => (
            <FilterPill
              key={status}
              active={filter === status}
              onClick={() => setFilter(filter === status ? "all" : status)}
            >
              {status} (
              {orders.filter((order) => normalizedStatus(order.productionStatus) === status).length}
              )
            </FilterPill>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <p className="mt-8 text-sm text-[#5B7893]">沒有訂單 / No orders found.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                draft={drafts[order.orderId] || {}}
                onChange={(patch) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [order.orderId]: { ...(prev[order.orderId] || {}), ...patch },
                  }))
                }
                onSave={() => handleSave(order.orderId)}
                saving={savingId === order.orderId}
                message={saveMessage[order.orderId]}
              />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function AdminShell({ children }) {
  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">{children}</div>
    </main>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-[#8EB1D1] bg-[#8EB1D1] text-[#1C2B48]"
          : "border-[#8EB1D1]/40 bg-white/60 text-[#5B7893] hover:bg-[#C4D8E5]"
      }`}
    >
      {children}
    </button>
  );
}

function OrderCard({ order, draft, onChange, onSave, saving, message }) {
  const status = draft.status ?? normalizedStatus(order.productionStatus) ?? "";
  const trackingNumber = draft.trackingNumber ?? order.trackingNumber ?? "";

  return (
    <div className="rounded border border-[#8EB1D1]/30 bg-white/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold text-[#1C2B48]">{order.orderId}</p>
          <p className="mt-1 text-sm font-semibold text-[#35506B]">{order.fullName}</p>
          <p className="truncate text-xs text-[#5B7893]">{order.email}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#1C2B48]">{order.productName}</p>
          <p className="text-xs text-[#5B7893]">
            {order.createdAt ? formatDate(order.createdAt) : "—"} · $
            {Number(order.amount || 0).toFixed(2)} USD
          </p>
          <p className="mt-1 text-xs text-[#5B7893]">付款: {order.paymentStatus || "—"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">
            處理狀態
          </label>
          <select
            value={status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          >
            <option value="">Select status…</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">
            郵政追蹤碼 (Postal Tracking)
          </label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => onChange({ trackingNumber: e.target.value })}
            placeholder="e.g. RC123456789TW"
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 font-mono text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
          <p className="mt-1 text-[11px] text-[#8B99A8]">
            客戶會在這裡看到追蹤碼：/track 訂單追蹤頁、帳戶頁、以及寄出通知
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs">
          {message?.type === "success" ? (
            <span className="text-[#2E8B57]">{message.text}</span>
          ) : message?.type === "error" ? (
            <span className="text-[#C0392B]">{message.text}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !status}
          className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-[#1C2B48] transition hover:bg-[#A7C7E7] disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}