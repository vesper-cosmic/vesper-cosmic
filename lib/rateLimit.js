import { NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding window per IP address. This is suitable for serverless
 * single-instance deployments and provides a basic layer of protection
 * against brute-force and spam attacks. For multi-instance deployments,
 * consider replacing with a Redis-backed limiter.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // max requests per window per IP

const buckets = new Map();

/**
 * Check whether the given IP is allowed to make another request.
 * Returns true if allowed, false if rate-limited.
 */
export function isRateLimited(ip) {
  const now = Date.now();
  const key = ip || "unknown";

  const bucket = buckets.get(key);
  if (!bucket) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (now - bucket.windowStart > WINDOW_MS) {
    // Window expired, reset
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    return true;
  }

  return false;
}

/**
 * Extracts the client IP from a Next.js request object.
 */
export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Middleware-style helper: returns a 429 response if the request is
 * rate-limited, otherwise null.
 */
export function rateLimitResponse(request) {
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json(
      { errors: { submit: "Too many requests. Please try again later." } },
      { status: 429 }
    );
  }
  return null;
}