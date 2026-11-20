// Creator & Tester Program (PR) — shared options and validation.
// Used by the public application form, the API route and the admin page.

import {
  daylightSavingOptions,
  fortuneAreas,
  maxFortuneSelections,
  nailLengths,
  nailShapes,
  stylePreferences,
  validateNailSizing,
} from "./formOptions.js";

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

export const PR_TEST_ORDER = ["Yes", "Yes, but I'd like to talk about it first", "No"];

export const PR_PRESS_ON_EXPERIENCE = ["Never tried them", "Tried a few times", "I wear them regularly"];

export const PR_USAGE_RIGHTS = [
  { id: "repost", label: "Vesper Cosmos may repost my content on its social accounts (with credit)" },
  { id: "website", label: "Vesper Cosmos may show my content and review on its website" },
  { id: "ads", label: "I'm open to discussing use of my content in paid ads (agreed separately)" },
];

export const PR_STATUSES = ["🆕 新申請", "⭐ 候選", "✅ 已選中", "💳 測試下單中", "📦 已寄出", "🎬 已發布", "❌ 未入選"];

export const PR_GENDERS = ["Female", "Male"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()\-.]{7,20}$/;
const s = (v, max = 500) => String(v ?? "").trim().slice(0, max);

export function emptyPrApplication() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: { addressLine1: "", addressLine2: "", city: "", stateProvince: "", postalCode: "", country: "United States" },
    birth: { birthDate: "", birthTime: "", birthTimeUnknown: false, birthLocation: "", biologicalGender: "", daylightSavingTime: "", intentions: [] },
    nails: { sizeMode: "", standardSize: "", measurements: {}, nailShape: "", nailLength: "", stylePreference: "", nailNotes: "", adhesiveSensitivity: "" },
    social: [{ platform: "", handle: "", followers: "" }],
    contentTypes: [],
    portfolio: "",
    publicDuration: "",
    postTimeline: "",
    usageRights: [],
    testOrder: "",
    pressOnExperience: "",
    about: "",
    heardFrom: "",
    agreements: { adult: false, usResident: false, disclosure: false, honest: false, feedback: false, privacy: false },
    website: "", // honeypot — must stay empty
  };
}

/** Clean an incoming application (trims, caps lengths, keeps only known options). */
export function normalizePrApplication(input = {}) {
  const pick = (value, list) => (list.includes(value) ? value : "");
  const pickMany = (values, list) => (Array.isArray(values) ? values.filter((v) => list.includes(v)) : []);
  const a = input.address || {};
  const b = input.birth || {};
  const n = input.nails || {};
  const shapes = nailShapes.map((x) => x.id);
  return {
    firstName: s(input.firstName, 60),
    lastName: s(input.lastName, 60),
    email: s(input.email, 200).toLowerCase(),
    phone: s(input.phone, 30),
    address: {
      addressLine1: s(a.addressLine1, 200),
      addressLine2: s(a.addressLine2, 200),
      city: s(a.city, 100),
      stateProvince: s(a.stateProvince, 100),
      postalCode: s(a.postalCode, 20),
      country: "United States",
    },
    birth: {
      birthDate: /^\d{4}-\d{2}-\d{2}$/.test(b.birthDate) ? b.birthDate : "",
      birthTime: /^\d{2}:\d{2}$/.test(b.birthTime) ? b.birthTime : "",
      birthTimeUnknown: Boolean(b.birthTimeUnknown),
      birthLocation: s(b.birthLocation, 200),
      biologicalGender: pick(b.biologicalGender, PR_GENDERS),
      daylightSavingTime: pick(b.daylightSavingTime, daylightSavingOptions),
      intentions: pickMany(b.intentions, fortuneAreas).slice(0, maxFortuneSelections),
    },
    nails: {
      sizeMode: pick(n.sizeMode, ["standard", "custom"]),
      standardSize: s(n.standardSize, 4),
      measurements: Object.fromEntries(
        Object.entries(n.measurements || {}).map(([k, v]) => [k.slice(0, 20), s(v, 6)])
      ),
      nailShape: pick(n.nailShape, shapes),
      nailLength: pick(n.nailLength, nailLengths),
      stylePreference: pick(n.stylePreference, stylePreferences),
      nailNotes: s(n.nailNotes, 1000),
      adhesiveSensitivity: s(n.adhesiveSensitivity, 300),
    },
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
    testOrder: pick(input.testOrder, PR_TEST_ORDER),
    pressOnExperience: pick(input.pressOnExperience, PR_PRESS_ON_EXPERIENCE),
    about: s(input.about, 2000),
    heardFrom: s(input.heardFrom, 200),
    agreements: Object.fromEntries(
      ["adult", "usResident", "disclosure", "honest", "feedback", "privacy"].map((k) => [k, Boolean(input.agreements?.[k])])
    ),
    website: s(input.website, 200),
  };
}

/** Field errors for a normalized application ({} when valid). Keys match the form. */
export function validatePrApplication(app) {
  const e = {};
  if (!app.firstName) e.firstName = "First name is required.";
  if (!app.lastName) e.lastName = "Last name is required.";
  if (!EMAIL_RE.test(app.email)) e.email = "Enter a valid email.";
  if (!PHONE_RE.test(app.phone)) e.phone = "Enter a phone number (used only for the courier).";
  if (!app.address.addressLine1) e.addressLine1 = "Street address is required.";
  if (!app.address.city) e.city = "City is required.";
  if (!app.address.stateProvince) e.stateProvince = "State is required.";
  if (!/^\d{5}(-\d{4})?$/.test(app.address.postalCode)) e.postalCode = "Enter a 5-digit ZIP code.";

  if (!app.birth.birthDate) e.birthDate = "Date of birth is required.";
  if (!app.birth.birthTime && !app.birth.birthTimeUnknown) e.birthTime = "Choose your birth time, or tick “I don't know”.";
  if (!app.birth.birthLocation) e.birthLocation = "City and country of birth are required.";
  if (!app.birth.biologicalGender) e.biologicalGender = "Required for the BaZi chart.";
  if (!app.birth.daylightSavingTime) e.daylightSavingTime = "Choose one.";
  if (!app.birth.intentions.length) e.intentions = "Choose at least one intention.";

  const nailErrors = validateNailSizing(app.nails);
  Object.assign(e, nailErrors);
  if (!app.nails.nailShape) e.nailShape = "Choose a shape.";
  if (!app.nails.nailLength) e.nailLength = "Choose a length.";
  if (!app.nails.stylePreference) e.stylePreference = "Choose a style.";

  const filled = app.social.filter((row) => row.platform && row.handle);
  if (!filled.length) e.social = "Add at least one account where you'll post.";
  if (!app.contentTypes.length) e.contentTypes = "Choose at least one type of content.";
  if (!app.publicDuration) e.publicDuration = "Choose one.";
  if (!app.postTimeline) e.postTimeline = "Choose one.";
  if (!app.testOrder) e.testOrder = "Choose one.";
  if (!app.pressOnExperience) e.pressOnExperience = "Choose one.";

  const a = app.agreements;
  if (!a.adult) e.adult = "You must be 18 or older.";
  if (!a.usResident) e.usResident = "We can only ship to US addresses for now.";
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
