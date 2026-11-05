import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { findMemberByEmail, upsertMember, setMemberPassword, addMemberLoginMethod } from "@/lib/memberServer";
import { hashPassword } from "@/lib/password";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const rateLimited = rateLimitResponse(request);
  if (rateLimited) return rateLimited;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { form: "Invalid request body." } },
      { status: 400 }
    );
  }

  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");

  const errors = {};
  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.email = "Please enter a valid email.";
  }
  if (!password || password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const existing = await findMemberByEmail(email);

    if (existing?.skipped) {
      return NextResponse.json(
        {
          errors: {
            form:
              existing.reason === "Missing member database config."
                ? "Membership is not available yet. Please try again later."
                : "We could not complete your registration. Please try again later.",
          },
        },
        { status: 500 }
      );
    }

    const passwordHash = hashPassword(password);

    if (existing?.found) {
      // The email already exists — this can happen when the user previously
      // signed in with Google. Instead of creating a separate account, we
      // link this email+password to the *same* member record, so the user
      // can sign in with either Google or email+password on one account.
      await setMemberPassword(email, passwordHash);
      await addMemberLoginMethod(email, "password");
      return NextResponse.json({
        success: true,
        linked: true,
        message: "This email is linked to your Google account. You can now also sign in with email and password.",
      });
    }

    // Fresh registration — create the member and store the password hash.
    const created = await upsertMember({ email, name: "" });
    if (created?.skipped) {
      return NextResponse.json(
        { errors: { form: "We could not complete your registration. Please try again later." } },
        { status: 500 }
      );
    }

    await setMemberPassword(email, passwordHash);
    await addMemberLoginMethod(email, "password");

    return NextResponse.json({ success: true, linked: false });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json(
      { errors: { form: "We could not complete your registration. Please try again later." } },
      { status: 500 }
    );
  }
}
