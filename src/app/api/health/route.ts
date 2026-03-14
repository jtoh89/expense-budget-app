import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * Health check - verifies Supabase connection.
 * GET /api/health
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { status: "error", database: "Supabase URL/key not configured" },
      { status: 503 }
    );
  }
  try {
    const { error } = await supabase.from("categories").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("DB health check failed:", error);
    return NextResponse.json(
      { status: "error", database: "disconnected" },
      { status: 500 }
    );
  }
}
