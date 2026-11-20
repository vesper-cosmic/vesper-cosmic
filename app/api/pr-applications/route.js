import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { normalizePrApplication, validatePrApplication } from "@/lib/prProgram";
import { createPrApplication, prConfigured, sendPrApplicationEmails } from "@/lib/prServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/pr-applications — public Creator & Tester application. */
export async function POST(request) {
  const limited = rateLimitResponse(request);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ errors: { submit: "Invalid request." } }, { status: 400 });
  }

  const app = normalizePrApplication(body);
  // Bots fill the hidden "website" field; pretend success and store nothing.
  if (app.website) return NextResponse.json({ ok: true, applicationId: "" });

  const errors = validatePrApplication(app);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });

  if (!prConfigured()) {
    return NextResponse.json(
      { errors: { submit: "Applications are not open yet. Please try again soon." } },
      { status: 503 }
    );
  }

  const saved = await createPrApplication(app);
  if (!saved.ok) {
    return NextResponse.json(
      { errors: { submit: "We couldn't save your application just now. Please try again in a moment." } },
      { status: 503 }
    );
  }

  await sendPrApplicationEmails(app, saved.applicationId);
  return NextResponse.json({ ok: true, applicationId: saved.applicationId });
}
