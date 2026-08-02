import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminEmail } from "@/lib/auth";
import {
  createNotionProduct,
  deleteNotionProduct,
  findNotionProducts,
  updateNotionProduct,
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

  const result = await findNotionProducts();
  if (result?.skipped) {
    return NextResponse.json({ error: result.reason, products: [] }, { status: 200 });
  }
  return NextResponse.json({ products: result.products || [] });
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

  const result = await updateNotionProduct(id, payload);

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