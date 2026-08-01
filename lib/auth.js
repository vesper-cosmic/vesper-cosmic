import GoogleProvider from "next-auth/providers/google";
import { randomBytes } from "crypto";

/**
 * Production-safe secret resolution.
 *
 * NextAuth v4 throws "MISSING_SECRET" (→ 500 on every /api/auth/* route)
 * when no secret is provided in production. This is the #1 cause of "server
 * error" on Google sign-in after deploying to Vercel but forgetting to set
 * the environment variable.
 *
 * We accept both NEXTAUTH_SECRET and AUTH_SECRET, and fall back to a random
 * secret so the auth endpoints never hard-fail. (A random secret changes
 * between serverless instances, so sessions may not survive cold starts —
 * set a real value in Vercel to make sessions stable.)
 */
function resolveSecret() {
  const explicit = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (explicit) return explicit;

  console.error(
    "[next-auth] MISSING_SECRET — Please set NEXTAUTH_SECRET (or AUTH_SECRET) in Vercel → Settings → Environment Variables. Using a random fallback secret; sessions may not persist across cold starts."
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
    allowDangerousEmailAccountLinking: true,
  });
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
  pages: {
    signIn: "/shop",
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
