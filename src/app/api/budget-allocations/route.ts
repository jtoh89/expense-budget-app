import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/budget-allocations?year=2026
 * Returns all budget allocations for the given year
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
    const year = searchParams.get("year");
    const yearNum = year ? parseInt(year, 10) : NaN;
    if (isNaN(yearNum)) {
      return NextResponse.json({ error: "year query param required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("budget_allocations")
      .select("subcategory_id, year, monthly_budget, annual_budget, irs_limit, employer_match")
      .eq("year", yearNum);

    if (error) throw error;

    const allocations = (data ?? []).reduce(
      (acc, row) => {
        acc[row.subcategory_id] = {
          monthlyBudget: Number(row.monthly_budget),
          annualBudget: row.annual_budget != null ? Number(row.annual_budget) : null,
          irsLimit: row.irs_limit != null ? Number(row.irs_limit) : null,
          employerMatch: row.employer_match != null ? Number(row.employer_match) : null,
        };
        return acc;
      },
      {} as Record<string, { monthlyBudget: number; annualBudget: number | null; irsLimit: number | null; employerMatch: number | null }>
    );

    return NextResponse.json(allocations);
  } catch (error) {
    console.error("GET /api/budget-allocations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget allocations" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/budget-allocations
 * Body: { subcategoryId, year, monthlyBudget?, annualBudget?, irsLimit?, employerMatch? }
 * Upserts a single budget allocation
 */
export async function PATCH(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { subcategoryId, year, monthlyBudget, annualBudget, irsLimit, employerMatch } = body;

    if (!subcategoryId || !year) {
      return NextResponse.json(
        { error: "subcategoryId and year are required" },
        { status: 400 }
      );
    }

    const yearNum = parseInt(String(year), 10);
    if (isNaN(yearNum)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const updates = {
      monthly_budget: typeof monthlyBudget === "number" ? monthlyBudget : 0,
      annual_budget: typeof annualBudget === "number" ? annualBudget : null,
      irs_limit: typeof irsLimit === "number" ? irsLimit : null,
      employer_match: typeof employerMatch === "number" ? employerMatch : null,
    };

    const { data: existing } = await supabase
      .from("budget_allocations")
      .select("subcategory_id")
      .eq("subcategory_id", String(subcategoryId))
      .eq("year", yearNum)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("budget_allocations")
        .update(updates)
        .eq("subcategory_id", String(subcategoryId))
        .eq("year", yearNum);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("budget_allocations").insert({
        subcategory_id: String(subcategoryId),
        year: yearNum,
        ...updates,
      });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/budget-allocations error:", error);
    return NextResponse.json(
      { error: "Failed to update budget allocation" },
      { status: 500 }
    );
  }
}
