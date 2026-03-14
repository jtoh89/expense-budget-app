import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/transactions
 * Query params: page, limit, year, month, categoryId, sort (newest|oldest)
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
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const offset = (page - 1) * limit;
    const sort = searchParams.get("sort") || "newest";

    let query = supabase
      .from("transactions")
      .select(
        "id, card_id, date, description, debit, credit, cards(card_name, owner), subcategories(name, categories(name))",
        { count: "exact" }
      )
      .order("date", { ascending: sort === "oldest" })
      .order("description", { ascending: true })
      .range(offset, offset + limit - 1);

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
        card: card && "owner" in card && "card_name" in card ? `${card.owner} - ${card.card_name}` : "—",
        date: r.date
          ? new Date(r.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
        description: r.description || "—",
        debit: r.debit != null && Number(r.debit) > 0 ? `$${Number(r.debit)}` : "",
        credit: r.credit != null && Number(r.credit) > 0 ? `$${Number(r.credit)}` : "",
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
