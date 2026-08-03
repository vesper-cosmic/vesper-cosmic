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
    errors.email = "請輸入有效的 Email。";
  }
  if (!password || password.length < 8) {
    errors.password = "密碼至少需要 8 個字元。";
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
                ? "會員系統尚未設定完成，請稍後再試。"
                : "暫時無法完成註冊，請稍後再試。",
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
        message: "此 Email 已與 Google 帳號連結，現已可同時使用 Email + 密碼登入。",
      });
    }

    // Fresh registration — create the member and store the password hash.
    const created = await upsertMember({ email, name: "" });
    if (created?.skipped) {
      return NextResponse.json(
        { errors: { form: "暫時無法完成註冊，請稍後再試。" } },
        { status: 500 }
      );
    }

    await setMemberPassword(email, passwordHash);
    await addMemberLoginMethod(email, "password");

    return NextResponse.json({ success: true, linked: false });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json(
      { errors: { form: "暫時無法完成註冊，請稍後再試。" } },
      { status: 500 }
    );
  }
}
