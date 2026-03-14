import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Health check - verifies DB connection.
 * GET /api/health
 */
export async function GET() {
  if (!sql) {
    return NextResponse.json(
      { status: "error", database: "DATABASE_URL not configured" },
      { status: 503 }
    );
  }
  try {
    await sql`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("DB health check failed:", error);
    return NextResponse.json(
      { status: "error", database: "disconnected" },
      { status: 500 }
    );
  }
}
