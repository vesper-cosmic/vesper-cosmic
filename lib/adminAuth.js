import "server-only";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminEmail } from "@/lib/auth";

/**
 * Server-side admin check for route handlers.
 * Returns null when the caller is an admin, otherwise the response to send:
 * 401 when not signed in, 404 for signed-in non-admins (don't reveal the route).
 */
export async function adminGuard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return null;
}
