"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

const PAGE_SIZE = 10;

const FORM_TYPE_OPTIONS = [
  { id: "A", label: "A — Simple form" },
  { id: "B", label: "B — BaZi form" },
  { id: "C", label: "C — Digital curiosity form" },
];

const commonCategories = [
  { id: "nails", label: "Nails" },
  { id: "custom-nails", label: "Nails — Custom" },
  { id: "energy-bottles", label: "Energy Bottles" },
  { id: "custom-energy-bottles", label: "Energy Bottles — Custom" },
  { id: "sachets", label: "Sachets" },
  { id: "reports", label: "Digital Reports" },
  { id: "kits", label: "Kits" },
  { id: "sets", label: "Sets" },
];

function emptyForm() {
  return {
    name: "",
    slug: "",
    category: "",
    categoryLabel: "",
    productKind: "",
    formType: "A",
    price: "",
    originalPrice: "",
    currency: "USD",
    description: "",
    fulfillmentTime: "",
    fulfillmentMode: "Ready to Ship",
    intentionType: "single",
    availableIntentions: "",
    requiresBirthData: false,
    requiresShipping: true,
    requiresNailDetails: false,
    nailIntro: "",
    includes: "",
    badge: "",
    images: [],
    inventory: "",
    isNew: false,
  };
}

export default function AdminProductsPage() {
  const { status: authStatus } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  // List state
  const [deletingId, setDeletingId] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    loadProducts();
  }, [authStatus]);

  async function loadProducts() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/admin/products");
      const data = await response.json();
      if (response.status === 403) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(true);
      setLoadError(data?.error || "");
      setProducts(data?.products || []);
    } catch {
      setLoadError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setFormErrors({});
    setFormMessage({ type: "", text: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      category: product.category || "",
      categoryLabel: product.categoryLabel || "",
      productKind: product.productKind || "",
      formType: product.formType || "A",
      price: product.price ?? "",
      originalPrice: product.originalPrice ?? "",
      currency: product.currency || "USD",
      description: product.description || "",
      fulfillmentTime: product.fulfillmentTime || "",
      fulfillmentMode: product.fulfillmentMode || "",
      intentionType: product.intentionType === "bazi" ? "bazi" : "single",
      availableIntentions: Array.isArray(product.availableIntentions)
        ? product.availableIntentions.join(", ")
        : "",
      requiresBirthData: Boolean(product.requiresBirthData),
      requiresShipping: Boolean(product.requiresShipping),
      requiresNailDetails: Boolean(product.requiresNailDetails),
      nailIntro: product.nailIntro || "",
      includes: product.includes || "",
      badge: product.badge || "",
      images: Array.isArray(product.images) ? product.images.map(String) : [],
      inventory: product.inventory ?? "",
      isNew: Boolean(product.isNew),
    });
    setFormErrors({});
    setFormMessage({ type: "", text: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCheckbox(key) {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function addImageField() {
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
  }

  function updateImageField(index, value) {
    setForm((prev) => {
      const next = [...prev.images];
      next[index] = value;
      return { ...prev, images: next };
    });
  }

  function removeImageField(index) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage({ type: "", text: "" });
    setFormErrors({});

    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      inventory: form.inventory === "" ? null : Number(form.inventory),
      availableIntentions: form.availableIntentions
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      images: Array.isArray(form.images)
        ? form.images.map((item) => String(item || "").trim()).filter(Boolean)
        : [],
    };

    try {
      const response = await fetch("/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormErrors(data.errors || {});
        setFormMessage({
          type: "error",
          text: data.error || "Unable to save product.",
        });
        return;
      }

      setFormMessage({
        type: "success",
        text: editingId ? "產品已更新 / Product updated." : "產品已上架 / Product created.",
      });
      setEditingId(null);
      setForm(emptyForm());
      await loadProducts();
    } catch {
      setFormMessage({ type: "error", text: "Network error — please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    const target = products.find((p) => p.id === id);
    if (!window.confirm(`確定刪除「${target?.name || id}」？此操作無法復原。`)) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Delete failed.");
        return;
      }
      await loadProducts();
    } catch {
      alert("Network error — please try again.");
    } finally {
      setDeletingId("");
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
            onClick={() => signIn("google", { callbackUrl: "/admin/products" })}
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
            onClick={() => signOut({ callbackUrl: "/admin/products" })}
            className="mt-6 rounded border border-[#ffb8b1]/50 px-6 py-2.5 text-sm font-semibold text-[#ffe1dd] hover:bg-[#ffb8b1]/10"
          >
            Sign out
          </button>
        </div>
      </AdminShell>
    );
  }

  const paginated = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  return (
    <AdminShell>
      <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1C2B48]">產品管理</h1>
            <p className="mt-2 text-sm text-[#35506B]">
              在網頁上直接上架新產品、編輯或刪除既有產品
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="rounded border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
            >
              ← 訂單管理
            </Link>
            <Link
              href="/shop"
              className="rounded border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
            >
              Shop →
            </Link>
          </div>
        </div>

        {loadError ? (
          <div className="mt-6 rounded border border-[#ffb8b1]/50 bg-[#2d171d] p-4 text-sm text-[#ffe1dd]">
            {loadError}
          </div>
        ) : null}

        {/* ── Product form ── */}
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#1C2B48]">
              {editingId ? "編輯產品 / Edit Product" : "上架新產品 / Create New Product"}
            </h2>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded border border-[#8EB1D1]/40 px-3 py-1.5 text-xs font-semibold text-[#35506B] hover:bg-[#C4D8E5]"
              >
                ✕ 取消編輯
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            {formMessage.text ? (
              <p
                className={`rounded border p-3 text-sm ${
                  formMessage.type === "success"
                    ? "border-[#2E8B57]/40 bg-[#EAF6EF] text-[#2E8B57]"
                    : "border-[#ffb8b1]/50 bg-[#2d171d] text-[#ffe1dd]"
                }`}
              >
                {formMessage.text}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="產品名稱 * Product Name" error={formErrors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Crystal Energy Set"
                  className={inputClass(!!formErrors.name)}
                />
              </Field>
              <Field label="Slug（網址 / URL 後綴）" error={formErrors.slug}>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="留空自動產生"
                  className={inputClass(!!formErrors.slug)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="分類 * Category" error={formErrors.category}>
                <select
                  value={form.category}
                  onChange={(e) => {
                    const selected = commonCategories.find((c) => c.id === e.target.value);
                    updateField("category", e.target.value);
                    if (selected) updateField("categoryLabel", selected.label);
                  }}
                  className={inputClass(!!formErrors.category)}
                >
                  <option value="">選擇分類…</option>
                  {commonCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="分類顯示名稱 Category Label" error={formErrors.categoryLabel}>
                <input
                  type="text"
                  value={form.categoryLabel}
                  onChange={(e) => updateField("categoryLabel", e.target.value)}
                  placeholder="e.g. Nails"
                  className={inputClass(!!formErrors.categoryLabel)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="售價 USD * Price" error={formErrors.price}>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="88"
                  className={inputClass(!!formErrors.price)}
                />
              </Field>
              <Field label="原價 Original Price（可選）">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.originalPrice}
                  onChange={(e) => updateField("originalPrice", e.target.value)}
                  placeholder="留空表示無折扣"
                  className={inputClass()}
                />
              </Field>
              <Field label="幣別 Currency">
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className={inputClass()}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="表單類型 Form Type">
                <select
                  value={form.formType}
                  onChange={(e) => updateField("formType", e.target.value)}
                  className={inputClass()}
                >
                  {FORM_TYPE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="訂單商品名稱 Product Kind">
                <input
                  type="text"
                  value={form.productKind}
                  onChange={(e) => updateField("productKind", e.target.value)}
                  placeholder="留空使用產品名稱"
                  className={inputClass()}
                />
              </Field>
            </div>

            <Field label="產品描述 Description" error={formErrors.description}>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows="3"
                placeholder="About this product…"
                className={inputClass(!!formErrors.description)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="製作時間 Fulfillment Time">
                <input
                  type="text"
                  value={form.fulfillmentTime}
                  onChange={(e) => updateField("fulfillmentTime", e.target.value)}
                  placeholder="Ships within 3–5 business days"
                  className={inputClass()}
                />
              </Field>
              <Field label="出貨模式 Fulfillment Mode">
                <select
                  value={form.fulfillmentMode}
                  onChange={(e) => updateField("fulfillmentMode", e.target.value)}
                  className={inputClass()}
                >
                  <option>Ready to Ship</option>
                  <option>Made to Order</option>
                  <option>Digital Delivery</option>
                </select>
              </Field>
              <Field label="標籤 Badge（可選）">
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => updateField("badge", e.target.value)}
                  placeholder="e.g. Custom / New"
                  className={inputClass()}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="意圖類型 Intention Type">
                <select
                  value={form.intentionType}
                  onChange={(e) => updateField("intentionType", e.target.value)}
                  className={inputClass()}
                >
                  <option value="single">Single — 顧客選擇單一意圖</option>
                  <option value="bazi">BaZi — 依八字自動客製</option>
                </select>
              </Field>
              <Field
                label="可用意圖 Available Intentions（逗號分隔）"
                error={formErrors.availableIntentions}
              >
                <input
                  type="text"
                  value={form.availableIntentions}
                  onChange={(e) => updateField("availableIntentions", e.target.value)}
                  placeholder="Health & Energy, Career & Growth"
                  className={inputClass(!!formErrors.availableIntentions)}
                />
              </Field>
            </div>

            <CheckboxGrid>
              <CheckboxPill
                checked={form.requiresBirthData}
                onChange={() => toggleCheckbox("requiresBirthData")}
                label="需要出生資料（八字）"
              />
              <CheckboxPill
                checked={form.requiresShipping}
                onChange={() => toggleCheckbox("requiresShipping")}
                label="需要寄送（實體商品）"
              />
              <CheckboxPill
                checked={form.requiresNailDetails}
                onChange={() => toggleCheckbox("requiresNailDetails")}
                label="需要指甲尺寸"
              />
              <CheckboxPill
                checked={form.isNew}
                onChange={() => toggleCheckbox("isNew")}
                label="標示為新品"
              />
            </CheckboxGrid>

            {form.requiresNailDetails ? (
              <Field label="指甲說明 Nail Intro">
                <textarea
                  value={form.nailIntro}
                  onChange={(e) => updateField("nailIntro", e.target.value)}
                  rows="2"
                  placeholder="Instructions shown on the checkout form…"
                  className={inputClass()}
                />
              </Field>
            ) : null}

            <Field label="內容物 Includes">
              <input
                type="text"
                value={form.includes}
                onChange={(e) => updateField("includes", e.target.value)}
                placeholder="10 press-on nails, nail glue, mini file…"
                className={inputClass()}
              />
            </Field>

            <Field label="產品圖片 Product Images" error={formErrors.images}>
              <div className="space-y-2">
                {form.images.length === 0 ? (
                  <p className="rounded border border-dashed border-[#8EB1D1]/40 bg-white/40 px-3 py-5 text-center text-sm text-[#5B7893]">
                    尚未新增圖片。點擊下方「＋ 新增圖片」貼上圖片網址。
                  </p>
                ) : null}
                {form.images.map((imageUrl, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {String(imageUrl || "").trim() ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={String(imageUrl).trim()}
                        alt={`Product image ${index + 1}`}
                        className="h-12 w-12 shrink-0 rounded border border-[#8EB1D1]/30 bg-white object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded border border-dashed border-[#8EB1D1]/30 bg-white/40" />
                    )}
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => updateImageField(index, e.target.value)}
                      placeholder="https://… 或 /images/xxx.png"
                      className={inputClass(false, "font-mono")}
                    />
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="shrink-0 rounded border border-[#C0392B]/40 px-2 py-1.5 text-xs font-semibold text-[#C0392B] transition hover:bg-[#C0392B]/10"
                      title="移除圖片"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="rounded border border-[#8EB1D1]/40 px-3 py-1.5 text-xs font-semibold text-[#35506B] transition hover:bg-[#C4D8E5]"
                >
                  ＋ 新增圖片
                </button>
              </div>
            </Field>

            <Field label="庫存 Inventory（可選，留空表示不限制）">
              <input
                type="number"
                min="0"
                value={form.inventory}
                onChange={(e) => updateField("inventory", e.target.value)}
                placeholder="e.g. 20"
                className={inputClass()}
              />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7] disabled:opacity-60"
            >
              {submitting
                ? "Saving…"
                : editingId
                ? "儲存變更 / Save Changes"
                : "上架產品 / Publish Product"}
            </button>
          </form>
        </section>

        {/* ── Product list ── */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#1C2B48]">
            全部產品 ({products.length})
          </h2>

          {loading ? (
            <p className="mt-4 text-sm text-[#5B7893]">Loading…</p>
          ) : products.length === 0 ? (
            <p className="mt-4 text-sm text-[#5B7893]">
              尚未上架任何產品。使用上方表單建立第一個產品。
            </p>
          ) : (
            <>
              <div className="mt-4 space-y-3">
                {paginated.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    expanded={expandedId === product.id}
                    onToggle={() =>
                      setExpandedId(expandedId === product.id ? null : product.id)
                    }
                    onEdit={() => startEdit(product)}
                    onDelete={() => handleDelete(product.id)}
                    deleting={deletingId === product.id}
                  />
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded border border-[#8EB1D1]/40 px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-[#5B7893]">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded border border-[#8EB1D1]/40 px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
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

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-[#C0392B]">{error}</p> : null}
    </div>
  );
}

function CheckboxGrid({ children }) {
  return (
    <div className="flex flex-wrap gap-2 rounded border border-[#8EB1D1]/25 bg-[#C4D8E5]/50 p-3">
      {children}
    </div>
  );
}

function CheckboxPill({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#8EB1D1]/40 bg-white/70 px-3 py-1.5 text-sm text-[#35506B]">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function ProductRow({ product, expanded, onToggle, onEdit, onDelete, deleting }) {
  return (
    <div className="rounded border border-[#8EB1D1]/30 bg-white/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {product.isNew ? (
              <span className="rounded-full bg-[#8EB1D1] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1C2B48]">
                New
              </span>
            ) : null}
            {product.badge ? (
              <span className="rounded-full border border-[#8EB1D1]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5B7893]">
                {product.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-semibold text-[#1C2B48]">{product.name}</p>
          <p className="text-xs text-[#5B7893]">
            ${Number(product.price || 0).toFixed(2)} {product.currency} ·{" "}
            {product.categoryLabel || product.category} · {product.productKind}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-[#8EB1D1]">/{product.slug}</p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onToggle}
            className="rounded border border-[#8EB1D1]/40 px-3 py-1.5 text-xs font-semibold text-[#35506B] hover:bg-[#C4D8E5]"
          >
            {expanded ? "收起 ▲" : "詳情 ▼"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-3 py-1.5 text-xs font-bold text-[#1C2B48] transition hover:bg-[#A7C7E7]"
          >
            編輯
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded border border-[#C0392B]/40 px-3 py-1.5 text-xs font-semibold text-[#C0392B] transition hover:bg-[#C0392B]/10 disabled:opacity-50"
          >
            {deleting ? "刪除中…" : "刪除"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 rounded bg-[#EAF2F8] p-4 text-sm text-[#35506B]">
          {product.description ? (
            <p className="leading-6">{product.description}</p>
          ) : (
            <p className="text-[#8EB1D1]">無描述 / No description.</p>
          )}
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <MiniInfo label="產品類型" value={product.productKind} />
            <MiniInfo label="表單類型" value={`Form ${product.formType}`} />
            <MiniInfo label="出貨模式" value={product.fulfillmentMode} />
            <MiniInfo label="製作時間" value={product.fulfillmentTime} />
            <MiniInfo
              label="需要寄送"
              value={product.requiresShipping ? "✅ 是" : "❌ 否"}
            />
            <MiniInfo
              label="需要出生資料"
              value={product.requiresBirthData ? "✅ 是" : "❌ 否"}
            />
            <MiniInfo
              label="需要指甲尺寸"
              value={product.requiresNailDetails ? "✅ 是" : "❌ 否"}
            />
            <MiniInfo
              label="意圖類型"
              value={product.intentionType === "bazi" ? "BaZi" : "Single"}
            />
            <MiniInfo
              label="庫存"
              value={product.inventory == null ? "不限" : product.inventory}
            />
            <MiniInfo label="原始價格" value={product.originalPrice ? `$${product.originalPrice}` : "—"} />
          </dl>
          {Array.isArray(product.availableIntentions) &&
          product.availableIntentions.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8EB1D1]">
                可用意圖
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {product.availableIntentions.map((intention) => (
                  <span
                    key={intention}
                    className="rounded-full border border-[#8EB1D1]/30 bg-white/70 px-2 py-0.5 text-xs text-[#35506B]"
                  >
                    {intention}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {Array.isArray(product.images) && product.images.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8EB1D1]">
                圖片 ({product.images.length})
              </p>
              <div className="mt-1 flex gap-2">
                {product.images.map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="h-14 w-14 rounded border border-[#8EB1D1]/25 object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <dt className="text-[#8EB1D1]">{label}</dt>
      <dd className="text-[#1C2B48]">{value || "—"}</dd>
    </div>
  );
}

function inputClass(hasError, extra = "") {
  return [
    "w-full rounded border bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]",
    hasError ? "border-[#C0392B]" : "border-[#8EB1D1]/40",
    extra,
  ].join(" ");
}