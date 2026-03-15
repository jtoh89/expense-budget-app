import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/dashboard/subcategory-breakdown?year=2026&month=3
 * Returns subcategory spending breakdown for the given month
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
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Valid year and month (1-12) required" },
        { status: 400 }
      );
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const { data: txRows, error: txError } = await supabase
      .from("transactions")
      .select("card_id, sub_category_id, debit, credit")
      .gte("date", startDate)
      .lte("date", endDate);

    if (txError) throw txError;

    const cardIds = [...new Set((txRows ?? []).map((r) => r.card_id).filter(Boolean))];
    const subcategoryIds = [...new Set((txRows ?? []).map((r) => r.sub_category_id).filter(Boolean))];

    const cardMap: Record<string, string> = {};
    const allOwnersSet = new Set<string>();
    const { data: allCardsData } = await supabase.from("cards").select("id, owner");
    if (allCardsData) {
      for (const c of allCardsData) {
        if (c.id) cardMap[c.id] = c.owner ?? "";
        if (c.owner) allOwnersSet.add(c.owner);
      }
    }

    const subcategoryMap: Record<string, string> = {};
    if (subcategoryIds.length > 0) {
      const { data: subData } = await supabase
        .from("subcategories")
        .select("id, name")
        .in("id", subcategoryIds);
      if (subData) {
        for (const s of subData) {
          if (s.id) subcategoryMap[s.id] = s.name ?? "";
        }
      }
    }

    const { data: allocData } = await supabase
      .from("budget_allocations")
      .select("subcategory_id, monthly_budget")
      .eq("year", year);

    const budgetMap: Record<string, number> = {};
    if (allocData) {
      for (const a of allocData) {
        if (a.subcategory_id) {
          const val = Number(a.monthly_budget) || 0;
          budgetMap[a.subcategory_id] = val;
          const withoutSub = a.subcategory_id.replace(/^sub_/, "");
          if (withoutSub !== a.subcategory_id) budgetMap[withoutSub] = val;
          if (!a.subcategory_id.startsWith("sub_")) budgetMap["sub_" + a.subcategory_id] = val;
        }
      }
    }

    const getBudget = (subId: string): number => {
      if (subId === "__uncategorized__") return 0;
      if (budgetMap[subId] != null) return budgetMap[subId];
      const afterUnderscore = subId.split("_").pop();
      if (afterUnderscore && budgetMap[afterUnderscore] != null) return budgetMap[afterUnderscore];
      if (afterUnderscore && budgetMap["sub_" + afterUnderscore] != null) return budgetMap["sub_" + afterUnderscore];
      return 0;
    };

    type Agg = { byOwner: Record<string, number>; total: number };
    const agg: Record<string, Agg> = {};

    const addAmount = (subId: string | null, owner: string, amount: number) => {
      const key = subId ?? "__uncategorized__";
      if (!agg[key]) agg[key] = { byOwner: {}, total: 0 };
      agg[key].byOwner[owner] = (agg[key].byOwner[owner] ?? 0) + amount;
      agg[key].total += amount;
    };

    for (const r of txRows ?? []) {
      const owner = (r.card_id && cardMap[r.card_id]) || "Other";
      const amount = Number(r.debit) || 0;
      if (amount > 0) addAmount(r.sub_category_id, owner, amount);
    }

    const owners = [...allOwnersSet].sort();

    const formatSubName = (id: string) => {
      if (id === "__uncategorized__") return "Uncategorized";
      const mapped = subcategoryMap[id];
      if (mapped) return mapped;
      const afterUnderscore = id.split("_").pop();
      if (afterUnderscore) {
        return afterUnderscore.charAt(0).toUpperCase() + afterUnderscore.slice(1).toLowerCase();
      }
      return id;
    };

    const rows = Object.entries(agg).map(([subId, a]) => {
      const subName = formatSubName(subId);
      const budget = getBudget(subId);
      const budgetLeft = budget - a.total;
      const budgetUsed = budget > 0 ? Math.round((a.total / budget) * 100) : 0;

      const byOwner: Record<string, number> = {};
      for (const o of owners) {
        byOwner[o] = a.byOwner[o] ?? 0;
      }

      return {
        subCategory: subName,
        subCategoryId: subId === "__uncategorized__" ? null : subId,
        byOwner,
        total: a.total,
        budget,
        budgetLeft,
        budgetUsed,
        isOver: budgetLeft < 0,
      };
    });

    rows.sort((a, b) => b.total - a.total);

    const totals = rows.reduce(
      (acc, r) => ({
        byOwner: Object.fromEntries(
          owners.map((o) => [o, (acc.byOwner[o] ?? 0) + (r.byOwner[o] ?? 0)])
        ),
        total: acc.total + r.total,
        budget: acc.budget + r.budget,
        budgetLeft: acc.budgetLeft + r.budgetLeft,
      }),
      { byOwner: {} as Record<string, number>, total: 0, budget: 0, budgetLeft: 0 }
    );

    const totalBudgetUsed = totals.budget > 0 ? Math.round((totals.total / totals.budget) * 100) : 0;

    return NextResponse.json({
      year,
      month,
      monthName: new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" }),
      owners,
      rows,
      totals: {
        ...totals,
        budgetUsed: totalBudgetUsed,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/subcategory-breakdown error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategory breakdown" },
      { status: 500 }
    );
  }
}
