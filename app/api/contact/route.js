import { NextResponse } from "next/server";
import { Resend } from "resend";

const ownerEmail = "vesper.cosmic.blueprint@gmail.com";
const storeName = "Vesper Cosmos";

// Simple in-memory rate limiter: max 5 submissions per IP per 10 minutes.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.startedAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { startedAt: now, count: 1 });
    return false;
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

export async function POST(request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, errors: { submit: "Too many requests. Please try again later." } },
      { status: 429 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const orderNumber = String(payload.orderNumber || "").trim();
  const message = String(payload.message || "").trim();

  const errors = {};
  if (!name) errors.name = "Name is required.";
  if (!emailPattern.test(email)) errors.email = "Enter a valid email.";
  if (!message) errors.message = "Message is required.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 400 });
  }

  const ownerText = [
    "New contact message",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Order number: ${orderNumber || "N/A"}`,
    "",
    "Message",
    message,
  ].join("\n");

  const customerText = [
    storeName,
    "",
    `Hi ${name},`,
    "",
    "Thank you for reaching out. We have received your message and will get back to you within 24–48 hours (Monday – Friday, GMT+8).",
    "",
    "For your records:",
    `Email: ${email}`,
    `Order number: ${orderNumber || "N/A"}`,
    "",
    "Your message",
    message,
    "",
    "If your inquiry is urgent, please reply to this email.",
    "",
    "With love,",
    "Team Vesper",
    storeName,
    ownerEmail,
  ].join("\n");

  const from = `${storeName} <${
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
  }>`;

  const results = await Promise.all([
    sendWithResend({
      from,
      to: ownerEmail,
      replyTo: email,
      subject: `${storeName} — Contact message from ${name}`,
      text: ownerText,
    }),
    sendWithResend({
      from,
      to: email,
      replyTo: ownerEmail,
      subject: `${storeName} — We received your message`,
      text: customerText,
    }),
  ]);

  const [ownerResult, customerResult] = results;

  return NextResponse.json({
    success: Boolean(ownerResult.success && customerResult.success),
    ownerResult,
    customerResult,
  });
}

async function sendWithResend({ from, to, replyTo, subject, text }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("Email placeholder:", { to, subject, text });
      return { success: true, skipped: true, reason: "Missing RESEND_API_KEY." };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const response = await resend.emails.send({
      from,
      to,
      replyTo,
      subject,
      html: plainTextToHtml(text),
      text,
    });

    if (response.error) {
      console.error("Email failed:", response.error);
      return {
        success: false,
        error: response.error.message || String(response.error),
      };
    }

    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error("Email failed:", error);
    return { success: false, error: error.message };
  }
}

function plainTextToHtml(text) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.65;color:#1C2B48;white-space:pre-wrap">${escapeHtml(
    text
  )}</div>`;
}

function escapeHtml(value) {
  const entities = {
    "&": "&" + "#38;",
    "<": "&" + "#60;",
    ">": "&" + "#62;",
    '"': "&" + "#34;",
    "'": "&" + "#39;",
  };
  return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}