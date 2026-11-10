import "server-only";

/**
 * PayPal Checkout (Orders API v2)
 * ───────────────────────────────
 * The customer approves the payment in PayPal's pop-up, then our server
 * captures it and checks the captured amount against the order stored in
 * Notion. Only a successful server-side capture marks an order paid.
 *
 * Env:
 *   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET — from developer.paypal.com
 *   PAYPAL_ENV — "live" for real payments; anything else uses the sandbox.
 */

const STORE = "Vesper Cosmos";

export function paypalCheckoutEnabled() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function paypalClientId() {
  return process.env.PAYPAL_CLIENT_ID || "";
}

function apiBase() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

let cachedToken = null; // { value, expiresAt }

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(`PayPal auth failed (${response.status}): ${data.error_description || data.error || ""}`);
  }
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) || 300) * 1000,
  };
  return cachedToken.value;
}

async function paypalRequest(path, { method = "GET", body, requestId } = {}) {
  const headers = {
    Authorization: `Bearer ${await accessToken()}`,
    "Content-Type": "application/json",
  };
  if (requestId) headers["PayPal-Request-Id"] = requestId;
  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

/** Create a PayPal order for the stored order's total (never a client amount). */
export async function createPaypalOrder({ orderId, amount, description }) {
  const value = Number(amount).toFixed(2);
  const result = await paypalRequest("/v2/checkout/orders", {
    method: "POST",
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          custom_id: orderId,
          invoice_id: orderId,
          description: String(description || `${STORE} order ${orderId}`).slice(0, 127),
          amount: { currency_code: "USD", value },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: STORE,
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        },
      },
    },
  });
  if (!result.ok || !result.data.id) {
    console.error("PayPal create order failed:", result.status, JSON.stringify(result.data));
    throw new Error("Could not start PayPal payment.");
  }
  return result.data.id;
}

/**
 * Capture an approved PayPal order. If it was already captured (double
 * click, retry) the existing capture is looked up instead.
 * Returns { status, captureId, amount, currency, customId }.
 */
export async function capturePaypalOrder(paypalOrderId) {
  const id = encodeURIComponent(paypalOrderId);
  let result = await paypalRequest(`/v2/checkout/orders/${id}/capture`, {
    method: "POST",
    requestId: `capture-${paypalOrderId}`,
  });

  const alreadyCaptured = (result.data?.details || []).some(
    (detail) => detail.issue === "ORDER_ALREADY_CAPTURED"
  );
  if (!result.ok && alreadyCaptured) {
    result = await paypalRequest(`/v2/checkout/orders/${id}`);
  }
  if (!result.ok) {
    console.error("PayPal capture failed:", result.status, JSON.stringify(result.data));
    const declined = (result.data?.details || []).some(
      (detail) => detail.issue === "INSTRUMENT_DECLINED"
    );
    return { status: declined ? "DECLINED" : "FAILED" };
  }

  const unit = result.data.purchase_units?.[0] || {};
  const capture = unit.payments?.captures?.[0] || {};
  return {
    status: capture.status || result.data.status,
    captureId: capture.id || "",
    amount: capture.amount?.value || unit.amount?.value || "",
    currency: capture.amount?.currency_code || unit.amount?.currency_code || "",
    customId: capture.custom_id || unit.custom_id || unit.reference_id || "",
  };
}
