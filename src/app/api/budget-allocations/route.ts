import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/budget-allocations?year=2026&owner=default
 * Returns all budget allocations for the given year (and owner).
 * budget_id = owner-year (e.g. default-2026)
 */
export async function GET(request: NextRequest) {
	if (!supabase) {
		return NextResponse.json({ error: "Database not configured" }, { status: 503 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const year = searchParams.get("year");
		const owner = searchParams.get("owner") || "default";
		const yearNum = year ? parseInt(year, 10) : NaN;
		if (isNaN(yearNum)) {
			return NextResponse.json({ error: "year query param required" }, { status: 400 });
		}

		const budgetId = `${owner}-${yearNum}`;

		const { data, error } = await supabase
			.from("budget_allocations")
			.select("subcategory_id, budget_id, year, monthly_budget, annual_budget")
			.eq("budget_id", budgetId);

		if (error) throw error;

		const allocations = (data ?? []).reduce(
			(acc, row) => {
				acc[row.subcategory_id] = {
					monthlyBudget: Number(row.monthly_budget),
					annualBudget: row.annual_budget != null ? Number(row.annual_budget) : null,
				};
				return acc;
			},
			{} as Record<string, { monthlyBudget: number; annualBudget: number | null }>,
		);

		return NextResponse.json(allocations);
	} catch (error) {
		console.error("GET /api/budget-allocations error:", error);
		return NextResponse.json({ error: "Failed to fetch budget allocations" }, { status: 500 });
	}
}

/**
 * PATCH /api/budget-allocations
 * Body: { subcategoryId, year, owner?, monthlyBudget?, annualBudget? }
 * Upserts a single budget allocation
 */
export async function PATCH(request: NextRequest) {
	if (!supabase) {
		return NextResponse.json({ error: "Database not configured" }, { status: 503 });
	}

	try {
		const body = await request.json();
		const { subcategoryId, year, owner = "default", monthlyBudget, annualBudget } = body;

		if (!subcategoryId || !year) {
			return NextResponse.json({ error: "subcategoryId and year are required" }, { status: 400 });
		}

		const yearNum = parseInt(String(year), 10);
		if (isNaN(yearNum)) {
			return NextResponse.json({ error: "Invalid year" }, { status: 400 });
		}

		const budgetId = `${owner}-${yearNum}`;

		const updates = {
			budget_id: budgetId,
			year: yearNum,
			monthly_budget: typeof monthlyBudget === "number" ? monthlyBudget : 0,
			annual_budget: typeof annualBudget === "number" ? annualBudget : null,
		};

		const { data: existing } = await supabase
			.from("budget_allocations")
			.select("subcategory_id")
			.eq("budget_id", budgetId)
			.eq("subcategory_id", String(subcategoryId))
			.limit(1)
			.maybeSingle();

		if (existing) {
			const { error } = await supabase
				.from("budget_allocations")
				.update(updates)
				.eq("budget_id", budgetId)
				.eq("subcategory_id", String(subcategoryId));
			if (error) throw error;
		} else {
			const { error } = await supabase.from("budget_allocations").insert({
				subcategory_id: String(subcategoryId),
				...updates,
			});
			if (error) throw error;
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("PATCH /api/budget-allocations error:", error);
		return NextResponse.json({ error: "Failed to update budget allocation" }, { status: 500 });
	}
}

/**
 * DELETE /api/budget-allocations
 * Body: { subcategoryId, year, owner? }
 */
export async function DELETE(request: NextRequest) {
	if (!supabase) {
		return NextResponse.json({ error: "Database not configured" }, { status: 503 });
	}

	try {
		const body = await request.json();
		const { subcategoryId, year, owner = "default" } = body;

		if (!subcategoryId || !year) {
			return NextResponse.json({ error: "subcategoryId and year are required" }, { status: 400 });
		}

		const yearNum = parseInt(String(year), 10);
		if (isNaN(yearNum)) {
			return NextResponse.json({ error: "Invalid year" }, { status: 400 });
		}

		const budgetId = `${owner}-${yearNum}`;

		const { error } = await supabase.from("budget_allocations").delete().eq("budget_id", budgetId).eq("subcategory_id", String(subcategoryId));

		if (error) throw error;

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("DELETE /api/budget-allocations error:", error);
		return NextResponse.json({ error: "Failed to delete budget allocation" }, { status: 500 });
	}
}
