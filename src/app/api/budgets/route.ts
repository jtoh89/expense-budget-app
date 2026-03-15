import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/budgets
 * Returns available budget years from the budgets table
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("budgets")
      .select("year")
      .order("year", { ascending: false });

    if (error) throw error;

    const years = (data ?? []).map((r) => r.year).filter((y): y is number => typeof y === "number");
    return NextResponse.json(years);
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget years" },
      { status: 500 }
    );
  }
}
