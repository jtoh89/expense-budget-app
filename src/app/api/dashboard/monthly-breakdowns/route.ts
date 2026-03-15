import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

type Agg = { byOwner: Record<string, number>; total: number };

function buildRows(
  agg: Record<string, Agg>,
  owners: string[],
  getBudget: (subId: string) => number,
  formatSubName: (id: string) => string,
  budgetMultiplier = 1
) {
  const rows = Object.entries(agg).map(([subId, a]) => {
    const subName = formatSubName(subId);
    const baseBudget = getBudget(subId);
    const budget = baseBudget * budgetMultiplier;
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

  const totalBudgetUsed =
    totals.budget > 0 ? Math.round((totals.total / totals.budget) * 100) : 0;

  return {
    rows,
    totals: { ...totals, budgetUsed: totalBudgetUsed },
  };
}

/**
 * GET /api/dashboard/monthly-breakdowns?year=2026
 * Returns per-month breakdowns and YTD aggregated for the given year
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
    const year = parseInt(
      searchParams.get("year") || String(new Date().getFullYear()),
      10
    );

    if (isNaN(year)) {
      return NextResponse.json(
        { error: "Valid year required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const endMonth =
      year === now.getFullYear() ? now.getMonth() + 1 : 12;
    const startDate = `${year}-01-01`;
    const lastDay = new Date(year, 12, 0).getDate();
    const endDate = `${year}-12-${String(lastDay).padStart(2, "0")}`;

    const { data: txRows, error: txError } = await supabase
      .from("transactions")
      .select("date, card_id, sub_category_id, debit, credit")
      .gte("date", startDate)
      .lte("date", endDate);

    if (txError) throw txError;

    const cardMap: Record<string, string> = {};
    const allOwnersSet = new Set<string>();
    const { data: allCardsData } = await supabase
      .from("cards")
      .select("id, owner");
    if (allCardsData) {
      for (const c of allCardsData) {
        if (c.id) cardMap[c.id] = c.owner ?? "";
        if (c.owner) allOwnersSet.add(c.owner);
      }
    }

    const subcategoryIds = [
      ...new Set(
        (txRows ?? []).map((r) => r.sub_category_id).filter(Boolean)
      ),
    ];
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

    const owners = [...allOwnersSet].sort();

    const formatSubName = (id: string) => {
      if (id === "__uncategorized__") return "Uncategorized";
      const mapped = subcategoryMap[id];
      if (mapped) return mapped;
      const afterUnderscore = id.split("_").pop();
      if (afterUnderscore) {
        return (
          afterUnderscore.charAt(0).toUpperCase() +
          afterUnderscore.slice(1).toLowerCase()
        );
      }
      return id;
    };

    const addAmount = (
      agg: Record<string, Agg>,
      subId: string | null,
      owner: string,
      amount: number
    ) => {
      const key = subId ?? "__uncategorized__";
      if (!agg[key]) agg[key] = { byOwner: {}, total: 0 };
      agg[key].byOwner[owner] = (agg[key].byOwner[owner] ?? 0) + amount;
      agg[key].total += amount;
    };

    const byMonth: Record<
      number,
      Record<string, Agg>
    > = {};
    const ytdAgg: Record<string, Agg> = {};

    for (const r of txRows ?? []) {
      const owner = (r.card_id && cardMap[r.card_id]) || "Other";
      const amount = Number(r.debit) || 0;
      if (amount <= 0) continue;

      const month = parseInt(String(r.date).slice(5, 7), 10);
      if (!byMonth[month]) byMonth[month] = {};
      addAmount(byMonth[month], r.sub_category_id, owner, amount);
      if (month <= endMonth) {
        addAmount(ytdAgg, r.sub_category_id, owner, amount);
      }
    }

    const months: { month: number; monthName: string; rows: unknown[]; totals: unknown }[] = [];
    for (let m = 1; m <= 12; m++) {
      const agg = byMonth[m] ?? {};
      const { rows, totals } = buildRows(
        agg,
        owners,
        getBudget,
        formatSubName
      );
      months.push({
        month: m,
        monthName: new Date(year, m - 1, 1).toLocaleString("en-US", {
          month: "long",
        }),
        rows,
        totals,
      });
    }

    const { rows: ytdRows, totals: ytdTotals } = buildRows(
      ytdAgg,
      owners,
      getBudget,
      formatSubName,
      endMonth
    );

    return NextResponse.json({
      year,
      owners,
      months,
      ytd: { rows: ytdRows, totals: ytdTotals },
    });
  } catch (error) {
    console.error("GET /api/dashboard/monthly-breakdowns error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly breakdowns" },
      { status: 500 }
    );
  }
}
