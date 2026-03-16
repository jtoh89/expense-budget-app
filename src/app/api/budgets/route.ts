import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/budgets
 * Returns available budget years from the budgets table.
 * Query: ?owner=yin (optional - filter by owner)
 * Query: ?owners=true (optional - return distinct owners instead of years)
 */
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const listOwners = searchParams.get("owners") === "true";

    if (listOwners) {
      const { data, error } = await supabase
        .from("budgets")
        .select("owner")
        .order("owner");

      if (error) throw error;

      const owners = [...new Set((data ?? []).map((r) => r.owner).filter(Boolean))].sort();
      return NextResponse.json(owners);
    }

    let query = supabase
      .from("budgets")
      .select("year")
      .order("year", { ascending: false });

    if (owner) {
      query = query.eq("owner", owner);
    }

    const { data, error } = await query;

    if (error) throw error;

    const years = (data ?? []).map((r) => r.year).filter((y): y is number => typeof y === "number");
    const uniqueYears = [...new Set(years)].sort((a, b) => b - a);
    return NextResponse.json(uniqueYears);
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget years" },
      { status: 500 }
    );
  }
}
