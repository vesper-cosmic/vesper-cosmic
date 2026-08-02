import GoogleProvider from "next-auth/providers/google";
import { randomBytes } from "crypto";

/**
 * In production, never trust a NEXTAUTH_URL pointing at localhost.
 *
 * If this value was copied from .env.local to Vercel, NextAuth would sign
 * the OAuth callback as `http://localhost:3000/api/auth/callback/google`.
 * After the Google consent screen the browser would try to hit the user's
 * own machine, breaking the whole flow (error page / bounce back to home,
 * and repeated attempts produce "try signing in with a different account").
 *
 * NextAuth auto-detects the host from the request when NEXTAUTH_URL is not
 * set, so deleting a localhost URL in production is the safest option.
 */
const rawNextAuthUrl = process.env.NEXTAUTH_URL || "";
if (
  process.env.NODE_ENV === "production" &&
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?($|\/)/i.test(rawNextAuthUrl)
) {
  console.error(
    "[next-auth] Ignoring NEXTAUTH_URL pointing at localhost in production so the OAuth callback is built from the real request host. Please remove the localhost NEXTAUTH_URL from your Vercel environment variables."
  );
  delete process.env.NEXTAUTH_URL;
}

/**
 * Production-safe secret resolution.
 *
 * NextAuth v5 throws "MISSING_SECRET" (→ 500 on every /api/auth/* route)
 * when no secret is provided in production. This is the #1 cause of "server
 * error" on Google sign-in after deploying to Vercel but forgetting to set
 * the environment variable.
 *
 * We accept both NEXTAUTH_SECRET and AUTH_SECRET.
 *
 * In production we fail closed: if no secret is configured we throw so the
 * deployment is visibly broken instead of silently using a random secret
 * that changes between serverless instances and invalidates every session.
 * In development we fall back to a random secret so local testing works
 * without extra configuration.
 */
function resolveSecret() {
  const explicit = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (explicit) return explicit;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[next-auth] MISSING_SECRET — Set NEXTAUTH_SECRET (or AUTH_SECRET) in Vercel → Settings → Environment Variables. Refusing to start with a random secret in production because sessions would not persist across serverless instances."
    );
  }

  console.warn(
    "[next-auth] No NEXTAUTH_SECRET set. Using a random fallback secret for development only; sessions will not persist across restarts."
  );

  return randomBytes(32).toString("hex");
}

function googleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    console.error(
      "[next-auth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Google sign-in will not complete until these are set in your environment variables."
    );
  }

  return GoogleProvider({
    clientId,
    clientSecret,
  });
}

/**
 * Whether the given email belongs to a store admin.
 * Configure allowed admin emails via the ADMIN_EMAILS environment variable
 * (comma-separated list, e.g. "you@gmail.com,manager@example.com").
 * Used by the admin order-management dashboard and API routes.
 */
export function isAdminEmail(email) {
  const adminEmails = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(String(email || "").trim().toLowerCase());
}

if (process.env.NODE_ENV === "production") {
  // Log environment diagnostics in production so you can find this in
  // Vercel → Function Logs if anything is misconfigured.
  console.log("[next-auth] environment diagnostics:", {
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
    hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    hasSecret: Boolean(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET),
    nextauthUrl: process.env.NEXTAUTH_URL || "(auto-detected from request)",
  });
}

export const authOptions = {
  providers: [googleProvider()],
  session: {
    strategy: "jwt",
  },
  secret: resolveSecret(),
  // NOTE: No custom sign-in page exists, so we intentionally do NOT set
  // `pages.signIn`. If it pointed at "/shop", a failed/aborted Google login
  // would bounce the user to the shop (or appear to send them "home")
  // instead of showing the default NextAuth error screen.
  logger: {
    error(code, metadata) {
      console.error(`[next-auth][error] ${code}`, metadata);
    },
    warn(code) {
      console.warn(`[next-auth][warn] ${code}`);
    },
    debug(code, metadata) {
      console.debug(`[next-auth][debug] ${code}`, metadata);
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user id once at sign-in
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid;
      }
      return session;
    },
  },
};