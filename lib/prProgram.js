// Creator & Tester Program (PR) — shared options and validation.
// Used by the public application form, the API route and the admin page.
//
// The application only asks what we need to choose testers. Birth details,
// nail sizes, the full address and phone are collected later, when a selected
// tester places the (refunded) test order through the normal checkout.

export const PR_PRODUCT_NAME = "Custom BaZi Crystal Press-On Nails";

export const PR_PLATFORMS = ["Instagram", "TikTok", "YouTube", "Facebook", "Pinterest", "Threads", "X (Twitter)", "Blog / Website", "Other"];

export const PR_CONTENT_TYPES = [
  "Short video (Reels / TikTok / Shorts)",
  "Unboxing video",
  "Application tutorial",
  "Wear test update (after 1–2 weeks)",
  "Photo post / carousel",
  "Stories",
  "Long-form YouTube video",
  "Written blog review",
];

export const PR_PUBLIC_DURATIONS = ["12 months or longer", "6 months", "3 months", "I can't commit to a time"];

export const PR_POST_TIMELINES = ["Within 7 days of delivery", "Within 14 days of delivery", "Within 30 days of delivery"];

export const PR_PRESS_ON_EXPERIENCE = ["Never tried them", "Tried a few times", "I wear them regularly"];

export const PR_USAGE_RIGHTS = [
  { id: "repost", label: "Vesper Cosmos may repost my content on its social accounts (with credit)" },
  { id: "website", label: "Vesper Cosmos may show my content and review on its website" },
  { id: "ads", label: "I'm open to discussing use of my content in paid ads (agreed separately)" },
];

export const PR_STATUSES = ["🆕 新申請", "⭐ 候選", "✅ 已選中", "💳 測試下單中", "📦 已寄出", "🎬 已發布", "❌ 未入選"];

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export const PR_AGREEMENTS = ["adult", "usResident", "testOrder", "disclosure", "honest", "feedback", "privacy"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const s = (v, max = 500) => String(v ?? "").trim().slice(0, max);

export function emptyPrApplication() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    city: "",
    state: "",
    social: [{ platform: "", handle: "", followers: "" }],
    contentTypes: [],
    portfolio: "",
    publicDuration: "",
    postTimeline: "",
    usageRights: [],
    pressOnExperience: "",
    adhesiveSensitivity: "",
    about: "",
    heardFrom: "",
    agreements: Object.fromEntries(PR_AGREEMENTS.map((k) => [k, false])),
    website: "", // honeypot — must stay empty
  };
}

/** Clean an incoming application (trims, caps lengths, keeps only known options). */
export function normalizePrApplication(input = {}) {
  const pick = (value, list) => (list.includes(value) ? value : "");
  const pickMany = (values, list) => (Array.isArray(values) ? values.filter((v) => list.includes(v)) : []);
  return {
    firstName: s(input.firstName, 60),
    lastName: s(input.lastName, 60),
    email: s(input.email, 200).toLowerCase(),
    city: s(input.city, 100),
    state: pick(s(input.state, 2).toUpperCase(), US_STATES),
    social: (Array.isArray(input.social) ? input.social : [])
      .slice(0, 8)
      .map((row) => ({
        platform: pick(row?.platform, PR_PLATFORMS),
        handle: s(row?.handle, 200),
        followers: Math.max(0, Math.min(1e9, Math.round(Number(String(row?.followers ?? "").replace(/[^\d.]/g, "")) || 0))),
      }))
      .filter((row) => row.platform || row.handle),
    contentTypes: pickMany(input.contentTypes, PR_CONTENT_TYPES),
    portfolio: s(input.portfolio, 1000),
    publicDuration: pick(input.publicDuration, PR_PUBLIC_DURATIONS),
    postTimeline: pick(input.postTimeline, PR_POST_TIMELINES),
    usageRights: pickMany(input.usageRights, PR_USAGE_RIGHTS.map((r) => r.id)),
    pressOnExperience: pick(input.pressOnExperience, PR_PRESS_ON_EXPERIENCE),
    adhesiveSensitivity: s(input.adhesiveSensitivity, 300),
    about: s(input.about, 2000),
    heardFrom: s(input.heardFrom, 200),
    agreements: Object.fromEntries(PR_AGREEMENTS.map((k) => [k, Boolean(input.agreements?.[k])])),
    website: s(input.website, 200),
  };
}

/** Field errors for a normalized application ({} when valid). Keys match the form. */
export function validatePrApplication(app) {
  const e = {};
  if (!app.firstName) e.firstName = "First name is required.";
  if (!app.lastName) e.lastName = "Last name is required.";
  if (!EMAIL_RE.test(app.email)) e.email = "Enter a valid email.";
  if (!app.city) e.city = "City is required.";
  if (!app.state) e.state = "Choose your state.";

  const filled = app.social.filter((row) => row.platform && row.handle);
  if (!filled.length) e.social = "Add at least one account where you'll post.";
  if (!app.contentTypes.length) e.contentTypes = "Choose at least one type of content.";
  if (!app.publicDuration) e.publicDuration = "Choose one.";
  if (!app.postTimeline) e.postTimeline = "Choose one.";
  if (!app.pressOnExperience) e.pressOnExperience = "Choose one.";

  const a = app.agreements;
  if (!a.adult) e.adult = "You must be 18 or older.";
  if (!a.usResident) e.usResident = "We can only ship to US addresses for now.";
  if (!a.testOrder) e.testOrder = "The test order is part of the program.";
  if (!a.disclosure) e.disclosure = "Required — disclosure is a legal requirement.";
  if (!a.honest) e.honest = "Please confirm.";
  if (!a.feedback) e.feedback = "Please confirm.";
  if (!a.privacy) e.privacy = "Please agree so we can store your details.";
  return e;
}

/** Total followers across the listed accounts. */
export function totalFollowers(app) {
  return (app.social || []).reduce((sum, row) => sum + (Number(row.followers) || 0), 0);
}

/** PR-YYYYMMDD-XXXX (Taiwan date). */
export function prApplicationId(date = new Date(), random = Math.random) {
  const tw = new Date(date.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = Array.from({ length: 4 }, () => chars[Math.floor(random() * chars.length)]).join("");
  return `PR-${tw}-${code}`;
}
