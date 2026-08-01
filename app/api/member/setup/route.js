import { NextResponse } from "next/server";
import { setupMembersDatabase } from "@/lib/memberServer";

export async function POST() {
  try {
    const result = await setupMembersDatabase();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Member database setup failed:", error);
    return NextResponse.json(
      { error: error.message || "Member database setup failed." },
      { status: 500 }
    );
  }
}