import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/transactions/has-for-subcategory?subcategoryId=groceries&year=2026&owner=Jon
 * Returns { hasTransactions: boolean } - true if any transactions exist for that subcategory, year, and owner
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
    const subcategoryId = searchParams.get("subcategoryId");
    const year = searchParams.get("year");
    const owner = searchParams.get("owner");

    if (!subcategoryId || !year || !owner) {
      return NextResponse.json(
        { error: "subcategoryId, year, and owner are required" },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const { data: cardData } = await supabase
      .from("cards")
      .select("id")
      .eq("owner", owner);

    const cardIds = (cardData ?? []).map((c) => c.id).filter(Boolean);
    if (cardIds.length === 0) {
      return NextResponse.json({ hasTransactions: false });
    }

    const subcategoryVariants = [
      subcategoryId,
      `sub_${subcategoryId}`,
      subcategoryId.replace(/^sub_/, ""),
    ];
    const uniqueIds = [...new Set(subcategoryVariants)];

    const { data, error } = await supabase
      .from("transactions")
      .select("id")
      .eq("year", yearNum)
      .in("card_id", cardIds)
      .in("sub_category_id", uniqueIds)
      .limit(1);

    if (error) throw error;

    const hasTransactions = (data?.length ?? 0) > 0;
    return NextResponse.json({ hasTransactions });
  } catch (error) {
    console.error("GET /api/transactions/has-for-subcategory error:", error);
    return NextResponse.json(
      { error: "Failed to check transactions" },
      { status: 500 }
    );
  }
}
