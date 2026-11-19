"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isDigitalOnlyOrder } from "@/lib/orderDigital";
import {
  ADMIN_NEXT_STEPS,
  ADMIN_ORDER_STATUSES,
  ADMIN_STATUS_EMAIL,
  ADMIN_STATUS_PAYMENT,
  OS_CANCELLED,
  OS_COMPLETED,
  OS_ISSUE,
  OS_NEW,
  OS_PAID,
  OS_PAYMENT_NOTICE,
  OS_REVIEW,
  OS_SHIPPED,
  OS_VERIFIED_NOTICE,
  PAYMENT_PAID,
  adminOrderStatus,
  normalizedStatus,
} from "@/lib/orderStatus";

// Tabs that usually need you to do something.
const ACTION_TABS = [OS_NEW, OS_REVIEW, OS_PAID, OS_ISSUE];

// What switching to each status does, shown before you confirm.
const STATUS_EFFECT = {
  [OS_NEW]: "付款狀態改回「待付款」。",
  [OS_PAYMENT_NOTICE]: "表示已通知顧客付款。付款狀態維持「待付款」。顧客按「I've paid」後會自動變成「核帳中」。",
  [OS_REVIEW]: "付款狀態改為「待確認付款」，等你到 PayPal 核對。",
  [OS_PAID]: "你已在 PayPal 核對到款項。付款狀態改為「已付款」，顧客端顯示「訂單已接受」。",
  [OS_VERIFIED_NOTICE]: "通知顧客已確認收到款項。付款狀態為「已付款」。",
  [OS_SHIPPED]: "製作狀態改為「貨品已寄出」並記錄出貨日（推薦分潤從這天起算 8 天後可提現）。若尚未標記付款，也會一併改成「已付款」。",
  [OS_COMPLETED]: "訂單結案。顧客端顯示「Completed」。",
  [OS_ISSUE]: "只做標記，不改付款與製作狀態；推薦分潤暫停，直到你改回正常狀態。",
  [OS_CANCELLED]: "推薦分潤取消，顧客端顯示「Cancelled」。如果顧客已付款，請記得到 PayPal 退款。",
};

const CUSTOMER_STEPS = ["✅ 訂單已接受", "🎨 貨品製作中"];

export default function AdminPage() {
  const { status: authStatus } = useSession();
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  // Combined shipments: selected order ids, which orders are already in a shipment
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [orderIndex, setOrderIndex] = useState({});
  const [productsById, setProductsById] = useState({});
  const [combining, setCombining] = useState(false);
  const [combineProblem, setCombineProblem] = useState(null);

  function toggleSelected(orderId) {
    setCombineProblem(null);
    setSelected((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]));
  }

  async function combineSelected() {
    setCombining(true);
    setCombineProblem(null);
    try {
      const response = await fetch("/api/admin/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selected }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.shipment?.shipmentNo) {
        router.push(`/admin/shipments/${encodeURIComponent(data.shipment.shipmentNo)}`);
        return;
      }
      setCombineProblem({ title: data.error || "無法建立出貨單。", errors: data.errors || [] });
    } catch {
      setCombineProblem({ title: "網路錯誤，請再試一次。", errors: [] });
    } finally {
      setCombining(false);
    }
  }

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch("/api/admin/shipments", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setOrderIndex(data?.orderIndex || {}))
      .catch(() => {});
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch("/api/products", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setProductsById(Object.fromEntries((data?.products || []).map((p) => [p.id, p]))))
      .catch(() => {});
  }, [authStatus]);

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
        setLoadError("訂單載入失敗，請重新整理。");
      } finally {
        setLoaded(true);
      }
    })();
  }, [authStatus]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(ADMIN_ORDER_STATUSES.map((s) => [s, 0]));
    for (const order of orders) result[adminOrderStatus(order)] += 1;
    return result;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (tab !== "all" && adminOrderStatus(order) !== tab) return false;
      if (!query) return true;
      return [order.orderId, order.fullName, order.email, order.productName, order.trackingNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [orders, tab, search]);

  function updateLocalOrder(orderId, patch) {
    setOrders((prev) =>
      prev.map((order) => (order.orderId === orderId ? { ...order, ...patch } : order))
    );
  }

  if (authStatus === "loading") {
    return <AdminShell>Loading…</AdminShell>;
  }

  if (authStatus === "unauthenticated") {
    return (
      <AdminShell>
        <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <h1 className="text-2xl font-semibold text-[#1C2B48]">後台管理員登入</h1>
          <p className="mt-3 text-sm text-[#35506B]">請使用管理員帳號登入</p>
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent("/admin")}`}
            className="mt-6 inline-block rounded border border-[#8EB1D1] bg-[#8EB1D1] px-6 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7]"
          >
            Sign in 登入
          </Link>
        </div>
      </AdminShell>
    );
  }

  if (!isAdmin) {
    return (
      <AdminShell>
        {loaded ? (
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
        ) : (
          "Loading…"
        )}
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1C2B48]">訂單管理</h1>
            <p className="mt-2 text-sm text-[#35506B]">用頁籤篩選訂單，在每張訂單上按「下一步」切換狀態</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/products"
              className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#A7C7E7]"
            >
              產品管理 →
            </Link>
            <Link
              href="/admin/reports/cost"
              className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#A7C7E7]"
            >
              成本報表 →
            </Link>
            <Link
              href="/admin/settings/profit"
              className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#A7C7E7]"
            >
              淨利設定 →
            </Link>
            <Link
              href="/admin/inventory"
              className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#A7C7E7]"
            >
              原料庫存 →
            </Link>
            <Link
              href="/admin/shipments"
              className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#A7C7E7]"
            >
              合併出貨 →
            </Link>
            <Link
              href="/admin/referrals"
              className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#A7C7E7]"
            >
              分潤提現 →
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

        <div role="tablist" aria-label="訂單狀態" className="mt-6 flex flex-wrap gap-2">
          <Tab active={tab === "all"} onClick={() => setTab("all")} label="全部" count={orders.length} />
          {ADMIN_ORDER_STATUSES.map((status) => (
            <Tab
              key={status}
              active={tab === status}
              onClick={() => setTab(status)}
              label={status}
              count={counts[status]}
              urgent={ACTION_TABS.includes(status) && counts[status] > 0}
            />
          ))}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋訂單編號、姓名、Email、商品或追蹤碼"
          aria-label="搜尋訂單"
          className="mt-4 w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
        />

        {visibleOrders.length === 0 ? (
          <p className="mt-8 text-sm text-[#5B7893]">
            {loaded ? "這個頁籤目前沒有訂單。" : "載入中…"}
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                onUpdated={updateLocalOrder}
                selected={selected.includes(order.orderId)}
                onToggle={() => toggleSelected(order.orderId)}
                shipmentNo={orderIndex[order.orderId] || ""}
                digital={isDigitalOnlyOrder(order.items, productsById)}
              />
            ))}
          </div>
        )}

        {selected.length > 0 ? (
          <div className="sticky bottom-3 z-10 mt-5 rounded-lg border border-[#1C2B48] bg-[#1C2B48] p-3 text-white shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">已選 {selected.length} 張訂單</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelected([]);
                    setCombineProblem(null);
                  }}
                  className="rounded border border-white/40 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
                >
                  清除
                </button>
                <button
                  type="button"
                  disabled={combining || selected.length < 2}
                  onClick={combineSelected}
                  className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-1.5 text-xs font-bold text-[#1C2B48] hover:bg-[#A7C7E7] disabled:opacity-50"
                >
                  {combining ? "檢查中…" : "合併出貨 Combine into one shipment"}
                </button>
              </div>
            </div>
            {selected.length < 2 ? <p className="mt-1 text-xs text-white/70">請至少勾選 2 張同一位收件人的已付款訂單。</p> : null}
            {combineProblem ? (
              <div className="mt-2 rounded bg-[#FDE8E6] p-2 text-xs text-[#7B241C]">
                <p className="font-semibold">{combineProblem.title}</p>
                <ul className="mt-1 list-disc pl-4">
                  {combineProblem.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
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

function Tab({ active, onClick, label, count, urgent }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-[#1C2B48] bg-[#1C2B48] text-white"
          : "border-[#8EB1D1]/40 bg-white/60 text-[#35506B] hover:bg-[#C4D8E5]"
      }`}
    >
      {label}{" "}
      <span
        className={`ml-0.5 inline-block min-w-[1.25rem] rounded-full px-1.5 text-center ${
          urgent && !active ? "bg-[#C0392B] text-white" : active ? "bg-white/20" : "bg-[#D6E4EE]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === OS_CANCELLED
      ? "bg-[#ECECEC] text-[#6B6B6B]"
      : status === OS_ISSUE
      ? "bg-[#FDE8E6] text-[#A93226]"
      : status === OS_COMPLETED || status === OS_SHIPPED
      ? "bg-[#E3F1E8] text-[#256f46]"
      : status === OS_REVIEW || status === OS_NEW
      ? "bg-[#FDF6E3] text-[#7A5410]"
      : "bg-[#D6E4EE] text-[#1C2B48]";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function OrderCard({ order, onUpdated, selected = false, onToggle, shipmentNo = "", digital = false }) {
  const current = adminOrderStatus(order);
  const items = Array.isArray(order.items) ? order.items : [];
  const nextSteps = ADMIN_NEXT_STEPS[current] || [];

  const [target, setTarget] = useState("");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [attachInvoice, setAttachInvoice] = useState(false);
  const [reportFiles, setReportFiles] = useState([]); // PDFs to email (digital orders)
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const production = normalizedStatus(order.productionStatus);
  const showCustomerStep =
    [OS_PAID, OS_VERIFIED_NOTICE, OS_ISSUE].includes(current) && production !== "🚚 貨品已寄出";

  function choose(status) {
    setTarget(status);
    setNote("");
    setNotify(true);
    setMessage(null);
    setTrackingNumber(order.trackingNumber || "");
    setReportFiles([]);
  }

  async function confirm() {
    if (!target) return;
    if (target === OS_SHIPPED && !digital && !trackingNumber.trim()) {
      if (!window.confirm("還沒填郵政追蹤碼，確定要先標記已出貨嗎？")) return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
          orderId: order.orderId,
          orderStatus: target,
          trackingNumber: target === OS_SHIPPED && !digital ? trackingNumber.trim() : "",
          note,
          notifyCustomer: Boolean(ADMIN_STATUS_EMAIL[target]) && notify,
          attachInvoice: target === OS_SHIPPED && !digital && notify && attachInvoice,
      };
      const withFiles = digital && target === OS_SHIPPED && reportFiles.length > 0;
      let request;
      if (withFiles) {
        const form = new FormData();
        form.append("payload", JSON.stringify(payload));
        reportFiles.forEach((file) => form.append("reports", file));
        request = { method: "PATCH", body: form };
      } else {
        request = { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
      }
      const response = await fetch("/api/admin/orders", request);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: "error", text: data?.error || "更新失敗，請再試一次。" });
        return;
      }

      const patch = { orderStatus: target };
      const payment = ADMIN_STATUS_PAYMENT[target];
      if (payment) patch.paymentStatus = payment;
      if (target === OS_SHIPPED || target === OS_COMPLETED) {
        patch.productionStatus = "🚚 貨品已寄出";
        if (!order.shippingDate) patch.shippingDate = new Date().toISOString();
      } else if (payment === PAYMENT_PAID && (!production || production === "📋 訂單已發出")) {
        patch.productionStatus = "✅ 訂單已接受";
      }
      if (target === OS_SHIPPED && !digital && trackingNumber.trim()) patch.trackingNumber = trackingNumber.trim();
      onUpdated(order.orderId, patch);

      const emailText = data?.email?.success
        ? "，已寄信給顧客"
        : data?.email && !data.email.success
        ? `，但信件沒寄出：${data.email.reason || data.email.error || "請檢查 Gmail 設定"}`
        : "";
      setMessage({ type: data?.email && !data.email.success ? "error" : "success", text: `已改成「${target}」${emailText}` });
      setTarget("");
    } catch {
      setMessage({ type: "error", text: "網路錯誤，請再試一次。" });
    } finally {
      setSaving(false);
    }
  }

  async function changeCustomerStep(status) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: "error", text: data?.error || "更新失敗" });
        return;
      }
      onUpdated(order.orderId, { productionStatus: status });
      setMessage({ type: "success", text: `顧客端進度已改成「${status}」` });
    } catch {
      setMessage({ type: "error", text: "網路錯誤，請再試一次。" });
    } finally {
      setSaving(false);
    }
  }

  // Paid orders (PayPal confirms them automatically) don't need the manual
  // "payment notice" / "verified notice" steps.
  const paid = order.paymentStatus === PAYMENT_PAID;
  const otherStatuses = ADMIN_ORDER_STATUSES.filter(
    (status) =>
      status !== current &&
      !nextSteps.includes(status) &&
      !(paid && (status === OS_PAYMENT_NOTICE || status === OS_VERIFIED_NOTICE))
  );
  const emailLabel = digital && target === OS_SHIPPED ? "電子商品完成通知信（不含追蹤碼）" : ADMIN_STATUS_EMAIL[target];

  return (
    <div className="rounded border border-[#8EB1D1]/30 bg-white/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              disabled={Boolean(shipmentNo)}
              aria-label={`選取 ${order.orderId} 合併出貨`}
              title={shipmentNo ? `已在出貨單 ${shipmentNo}` : "勾選以合併出貨"}
            />
            <p className="font-mono text-sm font-bold text-[#1C2B48]">{order.orderId}</p>
            <StatusBadge status={current} />
            {shipmentNo ? (
              <Link
                href={`/admin/shipments/${encodeURIComponent(shipmentNo)}`}
                className="rounded-full border border-[#8EB1D1] bg-[#C4D8E5]/60 px-2 py-0.5 text-[11px] font-semibold text-[#35506B] hover:bg-[#C4D8E5]"
              >
                📦 {shipmentNo}
              </Link>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold">
            {digital ? (
              <span className="rounded border border-[#8EB1D1]/50 bg-[#E8ECEF] px-2 py-0.5 text-[#35506B]">電子商品（不需寄送）</span>
            ) : (
              <>
            <Link href={`/admin/orders/${encodeURIComponent(order.orderId)}`} className="rounded border border-[#8EB1D1]/50 bg-white px-2 py-0.5 text-[#35506B] hover:bg-[#C4D8E5]">
              Commercial Invoice / Packing Slip (PDF)
            </Link>
            <Link href={`/admin/orders/${encodeURIComponent(order.orderId)}/ezpost`} className="rounded border border-[#8EB1D1]/50 bg-white px-2 py-0.5 text-[#35506B] hover:bg-[#C4D8E5]">
              EZPost Helper
            </Link>
              </>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-[#35506B]">{order.fullName}</p>
          <p className="truncate text-xs text-[#5B7893]">{order.email}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#1C2B48]">
            {items.length > 1 ? `${order.productName} (+${items.length - 1} more)` : order.productName}
          </p>
          <p className="text-xs text-[#5B7893]">
            {formatDate(order.createdAt)} · ${Number(order.amount || 0).toFixed(2)} USD
          </p>
          <p className="mt-1 text-[11px] text-[#8B99A8]">
            付款：{order.paymentStatus || "—"} · 顧客端進度：{production || "—"}
          </p>
          {order.trackingNumber ? (
            <p className="mt-1 font-mono text-[11px] text-[#5B7893]">追蹤碼：{order.trackingNumber}</p>
          ) : null}
          {order.paypalCaptureId ? (
            <p className="mt-1 font-mono text-[11px] text-[#2E8B57]">
              PayPal 已自動確認收款：{order.paypalCaptureId}
            </p>
          ) : null}
          {order.referrerEmail && order.referralReward > 0 ? (
            <p className="mt-1 text-[11px] text-[#5B7893]">
              推薦分潤 ${Number(order.referralReward).toFixed(2)} → {order.referrerEmail}
            </p>
          ) : null}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-3 rounded border border-[#8EB1D1]/20 bg-[#F3F6F8] p-3">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#35506B]">訂單明細</p>
          <ul className="space-y-1">
            {items.map((item, index) => (
              <li key={`${item.productId}-${index}`} className="text-xs text-[#5B7893]">
                {index + 1}. {item.productName} × {item.quantity || 1}
                {item.intention ? <span className="text-[#8B99A8]"> — {item.intention}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Status controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {nextSteps.length ? <span className="text-xs font-semibold text-[#5B7893]">下一步：</span> : null}
        {nextSteps.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => choose(status)}
            disabled={saving}
            className={`rounded border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
              target === status
                ? "border-[#1C2B48] bg-[#1C2B48] text-white"
                : status === OS_CANCELLED || status === OS_ISSUE
                ? "border-[#C0392B]/40 bg-white text-[#A93226] hover:bg-[#FDE8E6]"
                : "border-[#8EB1D1] bg-[#8EB1D1] text-[#1C2B48] hover:bg-[#A7C7E7]"
            }`}
          >
            {digital && status === OS_SHIPPED ? "🚚 已出貨（電子報告已寄出）" : status}
          </button>
        ))}
        {current === OS_SHIPPED ? (
          <button
            type="button"
            onClick={() => choose(OS_SHIPPED)}
            className="rounded border border-[#8EB1D1]/50 bg-white px-3 py-1.5 text-xs font-semibold text-[#35506B] hover:bg-[#C4D8E5]"
          >
            {digital ? "重寄報告 PDF" : "更新追蹤碼"}
          </button>
        ) : null}
        <select
          value=""
          onChange={(e) => e.target.value && choose(e.target.value)}
          disabled={saving}
          aria-label="改成其他狀態"
          className="rounded border border-[#8EB1D1]/40 bg-white px-2 py-1.5 text-xs text-[#35506B]"
        >
          <option value="">其他狀態…</option>
          {otherStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {target ? (
        <div className="mt-3 space-y-3 rounded border border-[#1C2B48]/20 bg-[#F7F9FB] p-3">
          <p className="text-sm text-[#1C2B48]">
            改成 <strong>{target}</strong>
          </p>
          <p className="text-xs leading-5 text-[#35506B]">{digital && target === OS_SHIPPED ? "電子商品不用寄包裹：只會改成「已出貨」並記錄出貨日，不需要追蹤碼。選擇報告 PDF 後，系統會用固定的英文信件模板自動寄給顧客並附上 PDF；沒有 PDF 時也可以在附加說明貼下載連結。" : STATUS_EFFECT[target]}</p>

          {target === OS_SHIPPED && digital ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5B7893]">報告 PDF（選填，可多選；會自動附在通知信裡）</label>
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const total = files.reduce((sum, f) => sum + f.size, 0);
                  if (files.length > 5 || total > 4 * 1024 * 1024) {
                    setMessage({ type: "error", text: "PDF 最多 5 個、合計 4 MB 內。太大的請改用下載連結貼在附加說明。" });
                    e.target.value = "";
                    setReportFiles([]);
                    return;
                  }
                  setMessage(null);
                  setReportFiles(files);
                  if (files.length) setNotify(true);
                }}
                className="block w-full text-xs text-[#35506B]"
              />
              {reportFiles.length ? (
                <ul className="mt-1 text-[11px] text-[#5B7893]">
                  {reportFiles.map((f) => (
                    <li key={f.name}>📎 {f.name}（{(f.size / 1024).toFixed(0)} KB）</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {target === OS_SHIPPED && !digital ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5B7893]">郵政追蹤碼</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. RC123456789TW"
                className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 font-mono text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
              />
              <p className="mt-1 text-[11px] text-[#8B99A8]">顧客會在 /track、帳戶頁和出貨通知信看到追蹤碼</p>
            </div>
          ) : null}

          {emailLabel ? (
            <>
              <label className="flex items-start gap-2 text-xs text-[#35506B]">
                <input type="checkbox" checked={notify} disabled={reportFiles.length > 0} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5" />
                <span>
                  寄信通知顧客：{emailLabel}
                  {target === OS_SHIPPED && current === OS_SHIPPED && !digital ? "（只有追蹤碼改變時才會寄）" : ""}
                  <br />
                  <span className="text-[#8B99A8]">不勾選＝只改狀態（例如你已經用其他方式通知過顧客）</span>
                </span>
              </label>
              {notify && target === OS_SHIPPED && !digital ? (
                <label className="flex items-center gap-2 text-xs text-[#35506B]">
                  <input type="checkbox" checked={attachInvoice} onChange={(e) => setAttachInvoice(e.target.checked)} />
                  Attach commercial invoice PDF（附上商業發票 PDF）
                </label>
              ) : null}
              {notify ? (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5B7893]">
                    附加說明（選填，會放進信裡，請用英文）
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder={
                      target === OS_CANCELLED
                        ? "e.g. The crystal you chose is out of stock."
                        : digital && target === OS_SHIPPED
                        ? "e.g. Download your report here: https://…"
                        : "e.g. Your set will be ready in about 10 days."
                    }
                    className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
                  />
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-[11px] text-[#8B99A8]">這個狀態不會寄信給顧客。</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTarget("")}
              disabled={saving}
              className="rounded border border-[#8EB1D1]/50 bg-white px-4 py-2 text-xs font-semibold text-[#35506B] hover:bg-[#C4D8E5]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={saving}
              className="rounded border border-[#1C2B48] bg-[#1C2B48] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#2A3D60] disabled:opacity-40"
            >
              {saving ? "更新中…" : "確認更新"}
            </button>
          </div>
        </div>
      ) : null}

      {showCustomerStep && !target ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#5B7893]">
          <span>顧客端製作進度：</span>
          {CUSTOMER_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => changeCustomerStep(step)}
              disabled={saving || production === step}
              className={`rounded-full border px-2.5 py-1 font-semibold transition ${
                production === step
                  ? "border-[#8EB1D1] bg-[#8EB1D1] text-[#1C2B48]"
                  : "border-[#8EB1D1]/40 bg-white text-[#5B7893] hover:bg-[#C4D8E5]"
              }`}
            >
              {step}
            </button>
          ))}
        </div>
      ) : null}

      {message ? (
        <p className={`mt-3 text-xs ${message.type === "success" ? "text-[#2E8B57]" : "text-[#C0392B]"}`}>
          {message.text}
        </p>
      ) : null}
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
