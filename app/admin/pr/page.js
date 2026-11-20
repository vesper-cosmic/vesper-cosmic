"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminFrame } from "@/components/admin/useOrderCustoms";
import { PR_STATUSES, PR_USAGE_RIGHTS, totalFollowers } from "@/lib/prProgram";
import { formatNailSizing } from "@/lib/formOptions";

const SORTS = [
  ["new", "最新申請"],
  ["followers", "追蹤數多→少"],
];

function Row({ label, children }) {
  if (children === "" || children == null || (Array.isArray(children) && !children.length)) return null;
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2 py-1 text-sm">
      <dt className="text-[#5B7893]">{label}</dt>
      <dd className="whitespace-pre-line break-words text-[#1C2B48]">{children}</dd>
    </div>
  );
}

function Detail({ app, onSave }) {
  const [status, setStatus] = useState(app.status);
  const [note, setNote] = useState(app.note || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const b = app.birth || {};
  const n = app.nails || {};
  const a = app.address || {};
  const rights = (app.usageRights || []).map((id) => PR_USAGE_RIGHTS.find((r) => r.id === id)?.label || id);

  async function save() {
    setSaving(true);
    setMessage("");
    const ok = await onSave(app.pageId, { status, note });
    setSaving(false);
    setMessage(ok ? "已儲存" : "儲存失敗");
  }

  return (
    <div className="mt-3 grid gap-5 border-t border-[#8EB1D1]/30 pt-4 lg:grid-cols-2">
      <dl>
        <p className="mb-1 text-xs font-bold text-[#5B7893]">聯絡與寄送</p>
        <Row label="Email">{app.email}</Row>
        <Row label="電話">{app.phone}</Row>
        <Row label="地址">{[a.addressLine1, a.addressLine2, `${a.city}, ${a.stateProvince} ${a.postalCode}`, a.country].filter(Boolean).join("\n")}</Row>
        <p className="mb-1 mt-4 text-xs font-bold text-[#5B7893]">八字資料</p>
        <Row label="出生日期">{b.birthDate}</Row>
        <Row label="出生時間">{b.birthTimeUnknown ? "不知道" : b.birthTime}</Row>
        <Row label="出生地">{b.birthLocation}</Row>
        <Row label="性別">{b.biologicalGender}</Row>
        <Row label="夏令時間">{b.daylightSavingTime}</Row>
        <Row label="意圖">{(b.intentions || []).join("、")}</Row>
        <p className="mb-1 mt-4 text-xs font-bold text-[#5B7893]">指甲</p>
        <Row label="尺寸">{formatNailSizing(n)}</Row>
        <Row label="形狀 / 長度">{[n.nailShape, n.nailLength].filter(Boolean).join(" / ")}</Row>
        <Row label="風格">{n.stylePreference}</Row>
        <Row label="備註">{n.nailNotes}</Row>
        <Row label="膠過敏">{n.adhesiveSensitivity}</Row>
      </dl>
      <dl>
        <p className="mb-1 text-xs font-bold text-[#5B7893]">社群與合作</p>
        <Row label="帳號">
          {(app.social || [])
            .map((s) => `${s.platform}：${s.handle}${s.followers ? `（${Number(s.followers).toLocaleString()}）` : ""}`)
            .join("\n")}
        </Row>
        <Row label="內容形式">{(app.contentTypes || []).join("\n")}</Row>
        <Row label="作品連結">{app.portfolio}</Row>
        <Row label="發布時程">{app.postTimeline}</Row>
        <Row label="公開期間">{app.publicDuration}</Row>
        <Row label="內容授權">{rights.join("\n")}</Row>
        <Row label="測試下單">{app.testOrder}</Row>
        <Row label="穿戴甲經驗">{app.pressOnExperience}</Row>
        <Row label="自我介紹">{app.about}</Row>
        <Row label="得知管道">{app.heardFrom}</Row>

        <div className="mt-4 space-y-2 rounded border border-[#8EB1D1]/40 bg-white p-3">
          <label className="block text-xs font-bold text-[#5B7893]">
            狀態
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded border border-[#8EB1D1]/40 bg-white px-2 py-1.5 text-sm text-[#1C2B48]">
              {PR_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-[#5B7893]">
            管理備註（只有你看得到）
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded border border-[#8EB1D1]/40 bg-white px-2 py-1.5 text-sm text-[#1C2B48]" />
          </label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="rounded bg-[#1C2B48] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "儲存中…" : "儲存"}
            </button>
            {message ? <span className="text-xs text-[#35506B]">{message}</span> : null}
            <a href={`mailto:${app.email}?subject=${encodeURIComponent("Vesper Cosmos Creator & Tester Program")}`} className="ml-auto text-xs text-[#5B7893] underline">
              寄信給申請人
            </a>
          </div>
        </div>
      </dl>
    </div>
  );
}

export default function PrApplicationsPage() {
  const [state, setState] = useState({ loading: true, applications: [], configured: true, denied: false, error: "" });
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("new");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    fetch("/api/admin/pr-applications", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401 || res.status === 404) return setState((s) => ({ ...s, loading: false, denied: true }));
        const body = await res.json();
        setState({ loading: false, applications: body.applications || [], configured: body.configured !== false, denied: false, error: body.error || "" });
      })
      .catch(() => setState((s) => ({ ...s, loading: false, error: "載入失敗" })));
  }, []);

  async function saveApplication(pageId, patch) {
    const res = await fetch("/api/admin/pr-applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, ...patch }),
    });
    if (!res.ok) return false;
    setState((s) => ({ ...s, applications: s.applications.map((a) => (a.pageId === pageId ? { ...a, ...patch } : a)) }));
    return true;
  }

  const counts = useMemo(() => {
    const c = { all: state.applications.length };
    PR_STATUSES.forEach((s) => (c[s] = state.applications.filter((a) => a.status === s).length));
    return c;
  }, [state.applications]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.applications.filter(
      (a) =>
        (tab === "all" || a.status === tab) &&
        (!q ||
          [a.firstName, a.lastName, a.email, a.applicationId, ...(a.social || []).map((s) => s.handle)].join(" ").toLowerCase().includes(q))
    );
    return sort === "followers" ? [...list].sort((x, y) => totalFollowers(y) - totalFollowers(x)) : list;
  }, [state.applications, tab, sort, query]);

  return (
    <AdminFrame>
      <Link href="/admin" className="text-sm text-[#5B7893] underline">← 訂單管理</Link>
      <h1 className="mt-2 text-2xl font-bold text-[#1C2B48]">試用申請 Creator &amp; Tester</h1>
      <p className="mt-1 text-sm text-[#35506B]">
        申請頁：<a href="/creators" target="_blank" className="underline">/creators</a>。點一筆展開完整資料，改狀態和備註後按儲存。
      </p>

      {state.denied ? <p className="mt-4 text-sm text-[#A93226]">請用管理員帳號登入。</p> : null}
      {!state.configured ? (
        <p className="mt-4 rounded border border-[#E0B04A]/50 bg-[#FFF3D6] p-2 text-sm text-[#7A5410]">
          尚未設定 NOTION_PR_DATABASE_ID，申請表目前無法送出。
        </p>
      ) : null}
      {state.error ? <p className="mt-4 text-sm text-[#A93226]">{state.error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {[["all", "全部"], ...PR_STATUSES.map((s) => [s, s])].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              tab === id ? "border-[#1C2B48] bg-[#1C2B48] text-white" : "border-[#8EB1D1]/60 bg-white text-[#35506B]"
            }`}
          >
            {label} ({counts[id] || 0})
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋姓名、Email、帳號、申請編號"
          className="min-w-0 flex-1 rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm">
          {SORTS.map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

      {state.loading ? <p className="mt-4 text-sm text-[#5B7893]">載入中…</p> : null}

      <ul className="mt-4 space-y-2">
        {shown.map((app) => {
          const expanded = open === app.pageId;
          return (
            <li key={app.pageId} className="rounded border border-[#8EB1D1]/30 bg-white/70 p-3">
              <button type="button" onClick={() => setOpen(expanded ? null : app.pageId)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left">
                <span className="font-semibold text-[#1C2B48]">{app.firstName} {app.lastName}</span>
                <span className="font-mono text-xs text-[#5B7893]">{app.applicationId}</span>
                <span className="text-xs text-[#35506B]">{app.status}</span>
                <span className="text-xs text-[#35506B]">
                  {[...new Set((app.social || []).map((s) => s.platform))].join(" · ")} · 追蹤 {totalFollowers(app).toLocaleString()}
                </span>
                <span className="text-xs text-[#35506B]">測試下單：{app.testOrder || "—"}</span>
                <span className="ml-auto text-xs text-[#5B7893]">{new Date(app.createdAt).toLocaleDateString("zh-TW")} {expanded ? "▲" : "▼"}</span>
              </button>
              {expanded ? <Detail app={app} onSave={saveApplication} /> : null}
            </li>
          );
        })}
        {!state.loading && !shown.length && state.configured ? <li className="text-sm text-[#5B7893]">沒有符合的申請。</li> : null}
      </ul>
    </AdminFrame>
  );
}
