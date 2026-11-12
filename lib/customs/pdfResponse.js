import "server-only";

import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { loadOrderCustoms } from "./context.js";

const NO_STORE = "no-store, max-age=0";

/**
 * Shared handler for the admin PDF routes. The PDFs contain the customer's
 * name, address and phone, so: admin only, never cached, nothing logged.
 */
export async function pdfResponse(request, params, { render, filename }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const url = new URL(request.url);
  const packaging = url.searchParams.get("packaging") === "box" ? "box" : "envelope";
  const result = await loadOrderCustoms(params.orderId, { packaging });
  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": NO_STORE } });
  }

  const { data } = result;
  if (!data.validation.ok) {
    return new NextResponse(
      ["This order can't be printed yet — fix these first:", "", ...data.validation.errors.map((e) => `• ${e}`)].join("\n"),
      { status: 422, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": NO_STORE } }
    );
  }

  const buffer = await render(data, url);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename(data)}"`,
      "Cache-Control": NO_STORE,
      "X-Robots-Tag": "noindex",
    },
  });
}
