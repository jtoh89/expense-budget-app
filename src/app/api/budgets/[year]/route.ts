import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/budgets/[year]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { year } = await params;
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("budgets")
      .select("year, annual_income, other_income, estimated_taxes")
      .eq("year", yearNum)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(null);
      }
      throw error;
    }

    return NextResponse.json({
      year: data.year,
      annualIncome: Number(data.annual_income),
      otherIncome: Number(data.other_income),
      estimatedTaxes: Number(data.estimated_taxes),
    });
  } catch (error) {
    console.error("GET /api/budgets/[year] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/budgets/[year]
 * Body: { annualIncome?, otherIncome?, estimatedTaxes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { year } = await params;
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const body = await request.json();
    const { annualIncome, otherIncome, estimatedTaxes } = body;

    const updates: Record<string, unknown> = {};
    if (typeof annualIncome === "number") updates.annual_income = annualIncome;
    if (typeof otherIncome === "number") updates.other_income = otherIncome;
    if (typeof estimatedTaxes === "number") updates.estimated_taxes = estimatedTaxes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("budgets")
      .upsert(
        { year: yearNum, ...updates },
        { onConflict: "year" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/budgets/[year] error:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    );
  }
}
