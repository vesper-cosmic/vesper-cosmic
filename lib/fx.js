// USD → TWD exchange rate, fetched when an order is created so the order's
// revenue can be converted to TWD at that moment's rate.
//
// Source: open.er-api.com (free, no key). If it can't be reached in time the
// fixed fallback rate is used and the order is marked "fallback", so reports
// can tell an estimate from a real rate. Set FX_FALLBACK_TWD_PER_USD to change it.

const SOURCE_URL = "https://open.er-api.com/v6/latest/USD";

export function fallbackRate() {
  const n = Number(process.env.FX_FALLBACK_TWD_PER_USD);
  return Number.isFinite(n) && n > 20 && n < 50 ? n : 32;
}

/** A rate is believable if it is a number in a sane range for USD→TWD. */
export function isPlausibleRate(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 20 && n < 50;
}

/** @returns {Promise<{ rate: number, source: "live" | "fallback" }>} Never throws. */
export async function getUsdTwdRate({ timeoutMs = 3000, fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl(SOURCE_URL, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      const rate = Number(data?.rates?.TWD);
      if (data?.result === "success" && isPlausibleRate(rate)) {
        return { rate: Math.round(rate * 10000) / 10000, source: "live" };
      }
    }
  } catch {
    // Fall through to the fallback rate.
  }
  return { rate: fallbackRate(), source: "fallback" };
}
