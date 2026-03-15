import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

const SORT_COLUMNS = ["date", "owner", "cardName", "description", "debit", "credit", "subCategory", "category"] as const;

/**
 * GET /api/transactions
 * Query params: page, limit, year, categoryId, sortBy, sortDir (asc|desc)
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get("sortBy") || "date";
    const sortDir = searchParams.get("sortDir") || "desc";
    const asc = sortDir === "asc";

    const validSortBy = SORT_COLUMNS.includes(sortBy as (typeof SORT_COLUMNS)[number]) ? sortBy : "date";

    let query = supabase
      .from("transactions")
      .select(
        "id, card_id, date, description, debit, credit, sub_category_id, cards(card_name, owner), subcategories(name, categories(name))",
        { count: "exact" }
      )
      .range(offset, offset + limit - 1);

    if (validSortBy === "date") {
      query = query.order("date", { ascending: asc }).order("description", { ascending: true });
    } else if (validSortBy === "description") {
      query = query.order("description", { ascending: asc }).order("date", { ascending: false });
    } else if (validSortBy === "debit") {
      query = query.order("debit", { ascending: asc }).order("date", { ascending: false });
    } else if (validSortBy === "credit") {
      query = query.order("credit", { ascending: asc }).order("date", { ascending: false });
    } else if (validSortBy === "owner") {
      query = query.order("owner", { ascending: asc, foreignTable: "cards" }).order("date", { ascending: false });
    } else if (validSortBy === "cardName") {
      query = query.order("card_name", { ascending: asc, foreignTable: "cards" }).order("date", { ascending: false });
    } else if (validSortBy === "subCategory" || validSortBy === "category") {
      query = query.order("name", { ascending: asc, foreignTable: "subcategories" }).order("date", { ascending: false });
    }

    const year = searchParams.get("year");
    const categoryId = searchParams.get("categoryId");
    if (year) query = query.eq("year", parseInt(year));
    if (categoryId) query = query.eq("sub_category_id", categoryId);

    const { data: rows, error, count } = await query;

    if (error) throw error;

    const total = count ?? 0;
    const transactions = (rows ?? []).map((r) => {
      const cardRaw = r.cards;
      const card = Array.isArray(cardRaw) ? cardRaw[0] : cardRaw;
      const subRaw = r.subcategories;
      const sub = Array.isArray(subRaw) ? subRaw[0] : subRaw;
      return {
        id: r.id,
        cardId: r.card_id,
        owner: card && "owner" in card ? card.owner : "—",
        cardName: card && "card_name" in card ? card.card_name : "—",
        date: r.date
          ? (() => {
              const d = new Date(r.date);
              return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()} ${d.getFullYear()}`;
            })()
          : "—",
        description: r.description || "—",
        debit: r.debit != null && Number(r.debit) > 0 ? formatCurrency(Number(r.debit)) : "",
        credit: r.credit != null && Number(r.credit) > 0 ? formatCurrency(Number(r.credit)) : "",
        subCategoryId: r.sub_category_id ?? null,
        subCategory: sub && "name" in sub ? sub.name : "—",
        category:
          sub && "categories" in sub && sub.categories
            ? (Array.isArray(sub.categories) ? sub.categories[0]?.name : (sub.categories as { name?: string }).name) || "—"
            : "—",
      };
    });

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Body: { cardId, date, description, debit?, credit?, subCategoryId? }
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
    const { cardId, date, description, debit, credit, subCategoryId } = body;

    if (!cardId || !date || !description) {
      return NextResponse.json(
        { error: "cardId, date, and description are required" },
        { status: 400 }
      );
    }

    const debitVal = debit != null ? Number(debit) : 0;
    const creditVal = credit != null ? Number(credit) : 0;
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();

    const id = `${date}_${description.replace(/\s/g, "_")}_${debitVal || creditVal}_${cardId}`.slice(
      0,
      255
    );

    const { error } = await supabase.from("transactions").upsert(
      {
        id,
        card_id: cardId,
        date,
        year,
        description,
        debit: debitVal,
        credit: creditVal,
        sub_category_id: subCategoryId || null,
      },
      { onConflict: "id" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
