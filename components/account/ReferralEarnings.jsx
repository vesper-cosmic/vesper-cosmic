"use client";

import { useCallback, useEffect, useState } from "react";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const EMPTY_PAYOUT = { paypalEmail: "" };

/**
 * Account page: referral link, commission balances, history and withdrawals.
 */
export default function ReferralEarnings() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/member/referral");
      const body = await response.json();
      if (body?.referral) {
        setData(body.referral);
        setLoadError("");
      } else {
        setLoadError(body?.error || "Could not load your referral info.");
      }
    } catch {
      setLoadError("Could not load your referral info.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6">
        <h2 className="text-2xl font-semibold text-[#1C2B48]">Share & Earn</h2>
        <p className="mt-2 text-sm leading-6 text-[#5B7893]">
          Share your link or code. You earn a commission on every purchase your
          friends make — no limit.
        </p>

        {loadError ? (
          <p className="mt-4 text-sm text-red-500">{loadError}</p>
        ) : !data ? (
          <p className="mt-4 text-sm text-[#5B7893]">Loading your earnings…</p>
        ) : (
          <div className="mt-5 space-y-6">
            <ShareBox code={data.referralCode} />
            <Balances data={data} />
            <WithdrawPanel data={data} onDone={load} />
            <History history={data.history} maturityDays={data.maturityDays} />
            <Withdrawals withdrawals={data.withdrawals} />
          </div>
        )}
      </section>

      {data ? <HowItWorks data={data} /> : null}
    </>
  );
}

function ShareBox({ code }) {
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const link = `${origin}/shop?ref=${code}`;

  function copy(kind, value) {
    navigator.clipboard?.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <CopyField
        label="Your Referral Code"
        value={code || ""}
        mono
        copied={copied === "code"}
        onCopy={() => copy("code", code)}
      />
      <CopyField
        label="Your Referral Link"
        value={link}
        copied={copied === "link"}
        onCopy={() => copy("link", link)}
      />
    </div>
  );
}

function CopyField({ label, value, mono, copied, onCopy }) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={value}
          className={`min-w-0 flex-1 truncate rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] ${
            mono ? "font-mono" : ""
          }`}
        />
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded border border-[#8EB1D1] bg-[#8EB1D1] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1C2B48] transition hover:bg-[#A7C7E7]"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function Balances({ data }) {
  const { balances, minimumWithdrawal } = data;
  const shortfall = Math.max(0, minimumWithdrawal - balances.available);

  return (
    <div>
      <h3 className="text-lg font-semibold text-[#1C2B48]">Your Earnings</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Tile label="Available to Withdraw" value={balances.available} tone="green" />
        <Tile label="Pending" value={balances.pending} tone="amber" />
        <Tile label="Payout Processing" value={balances.processing} tone="blue" />
        <Tile label="Lifetime Earnings" value={balances.lifetime} tone="gray" />
      </div>
      <p className="mt-3 text-center text-sm text-[#5B7893]">
        {shortfall > 0
          ? `Withdraw once you reach ${money(minimumWithdrawal)} USD (${money(shortfall)} to go)`
          : `You can withdraw your ${money(balances.available)} USD balance now.`}
      </p>
    </div>
  );
}

const TILE_TONES = {
  green: "bg-[#E6F6EE] text-[#1E8A5A]",
  amber: "bg-[#FDF6E3] text-[#C77A0A]",
  blue: "bg-[#EEF2F8] text-[#34507A]",
  gray: "bg-[#ECEAE6] text-[#1C2B48]",
};

function Tile({ label, value, tone }) {
  return (
    <div className={`rounded-lg px-4 py-3 ${TILE_TONES[tone]}`}>
      <p className="text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold sm:text-3xl">{money(value)}</p>
    </div>
  );
}

function WithdrawPanel({ data, onDone }) {
  const canWithdraw = data.balances.available >= data.minimumWithdrawal;
  const [open, setOpen] = useState(false);
  const [payout, setPayout] = useState(() => ({
    ...EMPTY_PAYOUT,
    paypalEmail: data.payoutInfo?.paypalEmail || "",
  }));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) =>
    setPayout((prev) => ({ ...prev, [field]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors({});
    setMessage(null);
    try {
      const response = await fetch("/api/member/referral/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutInfo: payout }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(body.errors || {});
        setMessage({ type: "error", text: body.error || "Please check the highlighted fields." });
        return;
      }
      setMessage({
        type: "success",
        text: `Request received — ${money(body.withdrawal.amount)} USD will be sent within 5 business days.`,
      });
      setOpen(false);
      onDone();
    } catch {
      setMessage({ type: "error", text: "Network error — please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {message ? (
        <p
          className={`mb-3 rounded px-3 py-2 text-sm ${
            message.type === "success" ? "bg-[#E6F6EE] text-[#1E8A5A]" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {!open ? (
        <button
          type="button"
          disabled={!canWithdraw}
          onClick={() => setOpen(true)}
          className="w-full rounded border border-[#1E8A5A] bg-[#1E8A5A] px-4 py-2.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#187049] disabled:cursor-not-allowed disabled:border-[#B9C8D6] disabled:bg-[#D4DFE8] disabled:text-[#8B99A8]"
        >
          Withdraw {money(data.balances.available)}
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-[#8EB1D1]/30 bg-white/60 p-4">
          <p className="text-sm font-semibold text-[#1C2B48]">
            Withdraw {money(data.balances.available)} USD
          </p>

          <PayoutField label="PayPal Email" error={errors.paypalEmail}>
            <input
              type="email"
              value={payout.paypalEmail}
              onChange={update("paypalEmail")}
              placeholder="you@example.com"
              className={INPUT}
            />
          </PayoutField>
          <p className="text-xs text-[#5B7893]">
            Payouts are sent via PayPal only. Make sure this email matches your PayPal account.
          </p>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded border border-[#1E8A5A] bg-[#1E8A5A] px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#187049] disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Request Payout"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border border-[#8EB1D1]/50 px-4 py-2 text-sm font-semibold text-[#5B7893] hover:bg-[#C4D8E5]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const INPUT =
  "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";

function PayoutField({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">
        {label}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

function History({ history = [], maturityDays }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-[#1C2B48]">Commission History</h3>
      {history.length ? (
        <ul className="mt-2 divide-y divide-[#8EB1D1]/20 rounded border border-[#8EB1D1]/20 bg-white/60">
          {history.map((entry, index) => (
            <li key={`${entry.date}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="text-[#1C2B48]">Order from {entry.friend}</p>
                <p className="text-xs text-[#5B7893]">{formatDate(entry.date)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-[#1C2B48]">+{money(entry.amount)}</p>
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    entry.status === "available" ? "text-[#1E8A5A]" : "text-[#C77A0A]"
                  }`}
                >
                  {entry.status === "available"
                    ? "Available"
                    : entry.availableOn
                    ? `Pending · ${formatDate(entry.availableOn)}`
                    : `Pending · ${maturityDays} days after delivery`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#5B7893]">No commissions yet. Share your link to start earning.</p>
      )}
    </div>
  );
}

const WITHDRAWAL_STATUS = {
  processing: { label: "Processing", className: "text-[#34507A]" },
  paid: { label: "Paid", className: "text-[#1E8A5A]" },
  rejected: { label: "Returned to balance", className: "text-[#8B99A8]" },
};

function Withdrawals({ withdrawals = [] }) {
  if (!withdrawals.length) return null;
  return (
    <div>
      <h3 className="text-lg font-semibold text-[#1C2B48]">Payouts</h3>
      <ul className="mt-2 divide-y divide-[#8EB1D1]/20 rounded border border-[#8EB1D1]/20 bg-white/60">
        {withdrawals.map((entry) => {
          const status = WITHDRAWAL_STATUS[entry.status] || WITHDRAWAL_STATUS.processing;
          return (
            <li key={entry.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="text-[#1C2B48]">PayPal</p>
                <p className="text-xs text-[#5B7893]">
                  Requested {formatDate(entry.requestedAt)}
                  {entry.paidAt ? ` · Paid ${formatDate(entry.paidAt)}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-[#1C2B48]">{money(entry.amount)}</p>
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${status.className}`}>
                  {status.label}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HowItWorks({ data }) {
  const { maturityDays, minimumWithdrawal } = data;
  return (
    <section className="rounded-lg bg-[#F5F2EE] p-6 text-sm leading-7 text-[#5B5048]">
      <h3 className="font-semibold text-[#3D342D]">💡 How It Works</h3>
      <ul className="mt-1">
        <li>✓ Share your referral link (or your referral code) with friends</li>
        <li>✓ Friends shop through your link, or enter your code at checkout</li>
        <li>
          ✓ You earn the product&apos;s commission on <strong>every purchase</strong>
        </li>
        <li>✓ No limit on purchases — perfect for group buys!</li>
      </ul>

      <h3 className="mt-5 font-semibold text-[#3D342D]">📊 Earnings Status</h3>
      <ul className="mt-1">
        <li>
          <strong className="text-[#1E8A5A]">Available to Withdraw</strong> — orders shipped
          more than {maturityDays} days ago; ready to withdraw
        </li>
        <li>
          <strong className="text-[#C77A0A]">Pending</strong> — your friend has ordered;
          becomes available {maturityDays} days after the order ships
        </li>
        <li>
          <strong className="text-[#34507A]">Payout Processing</strong> — withdrawals you
          requested that are being paid out (within 5 business days)
        </li>
        <li>
          <strong className="text-[#3D342D]">Lifetime Earnings</strong> — everything you have
          earned since joining
        </li>
      </ul>

      <h3 className="mt-5 font-semibold text-[#3D342D]">✅ Withdrawals</h3>
      <ul className="mt-1">
        <li>✓ Withdraw once your available balance reaches {money(minimumWithdrawal)} USD</li>
        <li>✓ Paid to your PayPal account within 5 business days</li>
      </ul>
    </section>
  );
}
