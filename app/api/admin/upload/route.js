import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { authOptions, isAdminEmail } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions accept ~4.5MB bodies.
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  // Auth comes from BLOB_READ_WRITE_TOKEN, or from BLOB_STORE_ID plus the
  // OIDC token Vercel injects into functions.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return NextResponse.json(
      {
        error:
          "尚未設定圖片儲存空間：請在 Vercel → Storage 建立 Blob 並連結到專案（BLOB_STORE_ID 或 BLOB_READ_WRITE_TOKEN）。",
      },
      { status: 500 }
    );
  }

  let file;
  try {
    const formData = await request.formData();
    file = formData.get("file");
  } catch {
    return NextResponse.json({ error: "無法讀取上傳內容。" }, { status: 400 });
  }

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "請選擇圖片檔案。" }, { status: 400 });
  }
  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "僅支援 JPG、PNG、WebP、GIF、AVIF 圖片。" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "圖片不可超過 4MB。" }, { status: 413 });
  }

  try {
    const blob = await put(`products/${Date.now()}.${extension}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json(
      { error: error.message || "圖片上傳失敗。" },
      { status: 500 }
    );
  }
}
