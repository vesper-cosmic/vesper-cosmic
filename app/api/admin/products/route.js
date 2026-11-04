import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminEmail } from "@/lib/auth";
import {
  createNotionProduct,
  deleteNotionProduct,
  findAdminProducts,
  updateNotionProduct,
  updateProductStock,
} from "@/lib/productServer";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const result = await findAdminProducts();
  return NextResponse.json(result);
}

export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { submit: "Invalid JSON payload." } },
      { status: 400 }
    );
  }

  const result = await createNotionProduct(payload);

  if (result?.skipped) {
    return NextResponse.json(
      { error: result.reason, ok: false },
      { status: 400 }
    );
  }

  if (result?.error) {
    return NextResponse.json(
      { error: result.error, errors: result.errors, ok: false },
      { status: 422 }
    );
  }

  return NextResponse.json(
    { ok: true, product: result.product, message: "Product created." },
    { status: 201 }
  );
}

export async function PATCH(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { submit: "Invalid JSON payload." } },
      { status: 400 }
    );
  }

  const id = String(payload.id || "").trim();
  if (!id) {
    return NextResponse.json(
      { errors: { id: "Product id is required." } },
      { status: 422 }
    );
  }

  // mode "stock" only touches 上架中 / 庫存 (list toggles); otherwise full edit.
  const result =
    payload.mode === "stock"
      ? await updateProductStock(id, pickStockChanges(payload))
      : await updateNotionProduct(id, payload);

  if (result?.skipped) {
    return NextResponse.json(
      { error: result.reason, ok: false },
      { status: 400 }
    );
  }

  if (result?.error) {
    return NextResponse.json(
      { error: result.error, errors: result.errors, ok: false },
      { status: 422 }
    );
  }

  return NextResponse.json({
    ok: true,
    product: result.product,
    message: "Product updated.",
  });
}

export async function DELETE(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = String(searchParams.get("id") || "").trim();
  if (!id) {
    return NextResponse.json(
      { errors: { id: "Product id is required." } },
      { status: 422 }
    );
  }

  const result = await deleteNotionProduct(id);

  if (result?.skipped) {
    return NextResponse.json(
      { error: result.reason, ok: false },
      { status: 400 }
    );
  }

  if (result?.error) {
    return NextResponse.json({ error: result.error, ok: false }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    message: "Product deleted.",
  });
}

function pickStockChanges(payload) {
  const changes = {};
  if ("published" in payload) changes.published = payload.published;
  if ("inventory" in payload) changes.inventory = payload.inventory;
  return changes;
}