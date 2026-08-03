import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { randomBytes } from "crypto";
import {
  findMemberByEmail,
  upsertMember,
  addMemberLoginMethod,
} from "@/lib/memberServer";
import { verifyPassword } from "@/lib/password";

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
 * Email + password sign in.
 *
 * Member lookup is keyed by email in Notion, which is the single source of
 * truth for a customer's identity. This means a user who first signed in
 * with Google and later registers the *same* email + password will be
 * linked to the exact same member (never a duplicate account), because
 * both login methods resolve to the same Notion member page.
 *
 * When an email was registered via Google only (no password hash stored),
 * we reject the credentials sign-in and the UI tells the user to use the
 * Google button instead.
 */
function credentialsProvider() {
  return CredentialsProvider({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email || "")
        .trim()
        .toLowerCase();
      const password = String(credentials?.password || "");

      if (!email || !password) return null;

      const result = await findMemberByEmail(email);
      if (result?.skipped) {
        console.error("[next-auth] Member lookup skipped:", result.reason);
        return null;
      }
      if (!result?.found) return null;

      const member = result.member;
      if (!member?.passwordHash) return null;

      if (!verifyPassword(password, member.passwordHash)) return null;

      return {
        id: member.email,
        email: member.email,
        name: member.name || "",
      };
    },
  });
}

/**
 * Whether the given email belongs to a store admin.
 * Configure allowed admin emails via the ADMIN_EMAILS environment variable
 * (comma-separated list, e.g. "vesper.cosmic.blueprint@gmail.com").
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
  providers: [credentialsProvider(), googleProvider()],
  session: {
    strategy: "jwt",
  },
  secret: resolveSecret(),
  pages: {
    signIn: "/auth/signin",
  },
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
    async signIn({ user, account }) {
      if (!user?.email) return false;

      // Google sign-in automatically creates (or updates) the member with
      // the same email, so a later email+password registration links to the
      // exact same member record instead of creating a duplicate.
      if (account?.provider === "google") {
        const result = await upsertMember({
          email: user.email,
          name: user.name || "",
        });
        if (result?.skipped) {
          console.error(
            "[next-auth] Member upsert skipped on Google sign-in:",
            result.reason
          );
        } else {
          await addMemberLoginMethod(user.email, "google");
        }
        return true;
      }

      if (account?.provider === "credentials") {
        await addMemberLoginMethod(user.email, "password");
        return true;
      }

      return false;
    },
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