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

/**
 * POST /api/budgets
 * Body: { owner, year, copyFromOwner?, copyFromYear? }
 * Creates a new budget with id = owner-year. Returns 409 if duplicate.
 * Optionally copies income and allocations from copyFromOwner/copyFromYear.
 */
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { owner, year, copyFromOwner, copyFromYear } = body;

    if (!owner || typeof owner !== "string" || !owner.trim()) {
      return NextResponse.json({ error: "owner is required" }, { status: 400 });
    }

    const yearNum = parseInt(String(year), 10);
    if (isNaN(yearNum)) {
      return NextResponse.json({ error: "Valid year is required" }, { status: 400 });
    }

    const id = `${owner.trim()}-${yearNum}`;

    const { data: existing } = await supabase
      .from("budgets")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Budget already exists for ${owner} - ${yearNum}` },
        { status: 409 }
      );
    }

    let annualIncome: number | null = null;
    let otherIncome: number | null = null;
    let estimatedTaxes: number | null = null;

    if (copyFromOwner && copyFromYear) {
      const copyId = `${String(copyFromOwner).trim()}-${parseInt(String(copyFromYear), 10)}`;
      const { data: copyBudget } = await supabase
        .from("budgets")
        .select("annual_income, other_income, estimated_taxes")
        .eq("id", copyId)
        .single();

      if (copyBudget) {
        annualIncome = copyBudget.annual_income != null ? Number(copyBudget.annual_income) : null;
        otherIncome = copyBudget.other_income != null ? Number(copyBudget.other_income) : null;
        estimatedTaxes = copyBudget.estimated_taxes != null ? Number(copyBudget.estimated_taxes) : null;
      }
    }

    const { error: insertError } = await supabase.from("budgets").insert({
      id,
      owner: owner.trim(),
      year: yearNum,
      annual_income: annualIncome,
      other_income: otherIncome,
      estimated_taxes: estimatedTaxes,
    });

    if (insertError) throw insertError;

    if (copyFromOwner && copyFromYear) {
      const copyBudgetId = `${String(copyFromOwner).trim()}-${parseInt(String(copyFromYear), 10)}`;
      const { data: copyAllocs } = await supabase
        .from("budget_allocations")
        .select("subcategory_id, monthly_budget, annual_budget, irs_limit, employer_match")
        .eq("budget_id", copyBudgetId);

      if (copyAllocs && copyAllocs.length > 0) {
        const newAllocs = copyAllocs.map((a) => ({
          budget_id: id,
          subcategory_id: a.subcategory_id,
          year: yearNum,
          monthly_budget: a.monthly_budget ?? 0,
          annual_budget: a.annual_budget,
          irs_limit: a.irs_limit,
          employer_match: a.employer_match,
        }));

        const { error: allocError } = await supabase
          .from("budget_allocations")
          .insert(newAllocs);

        if (allocError) {
          console.error("Failed to copy allocations:", allocError);
        }
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
