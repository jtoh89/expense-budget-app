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
    const useEmbedSort = ["date", "description", "debit", "credit"].includes(validSortBy);

    let query = supabase
      .from("transactions")
      .select("id, card_id, date, description, debit, credit, sub_category_id", { count: "exact" })
      .range(offset, offset + limit - 1);

    if (useEmbedSort) {
      if (validSortBy === "date") {
        query = query.order("date", { ascending: asc }).order("description", { ascending: true });
      } else if (validSortBy === "description") {
        query = query.order("description", { ascending: asc }).order("date", { ascending: false });
      } else if (validSortBy === "debit") {
        query = query.order("debit", { ascending: asc }).order("date", { ascending: false });
      } else if (validSortBy === "credit") {
        query = query.order("credit", { ascending: asc }).order("date", { ascending: false });
      }
    } else {
      query = query.order("date", { ascending: false });
    }

    const year = searchParams.get("year");
    const categoryId = searchParams.get("categoryId");
    const incompleteOnly = searchParams.get("incompleteOnly") === "true";
    const ownersParam = searchParams.get("owners");
    const ownersFilter = ownersParam ? ownersParam.split(",").map((o) => o.trim()).filter(Boolean) : [];

    if (year) query = query.eq("year", parseInt(year));
    if (categoryId) query = query.eq("sub_category_id", categoryId);
    if (incompleteOnly) query = query.is("sub_category_id", null);

    if (ownersFilter.length > 0) {
      const { data: cardData } = await supabase
        .from("cards")
        .select("id")
        .in("owner", ownersFilter);
      const cardIds = (cardData ?? []).map((c) => c.id).filter(Boolean);
      if (cardIds.length > 0) {
        query = query.in("card_id", cardIds);
      } else {
        query = query.eq("card_id", "__none__");
      }
    }

    const { data: rows, error, count } = await query;

    if (error) throw error;

    const cardIds = [...new Set((rows ?? []).map((r) => r.card_id).filter(Boolean))];
    const subcategoryIds = [...new Set((rows ?? []).map((r) => r.sub_category_id).filter(Boolean))];

    const cardMap: Record<string, { card_name: string; owner: string }> = {};
    if (cardIds.length > 0) {
      const { data: cardData } = await supabase
        .from("cards")
        .select("id, card_name, owner")
        .in("id", cardIds);
      if (cardData) {
        for (const c of cardData) {
          if (c.id) cardMap[c.id] = { card_name: c.card_name ?? "", owner: c.owner ?? "" };
        }
      }
    }

    const subcategoryMap: Record<string, { name: string; category_id: string | null }> = {};
    const categoryIds: string[] = [];
    if (subcategoryIds.length > 0) {
      const { data: subData } = await supabase
        .from("subcategories")
        .select("id, name, category_id")
        .in("id", subcategoryIds);
      if (subData) {
        for (const s of subData) {
          if (s.id) {
            subcategoryMap[s.id] = { name: s.name ?? "", category_id: s.category_id ?? null };
            if (s.category_id) categoryIds.push(s.category_id);
          }
        }
      }
    }

    const categoryMap: Record<string, string> = {};
    if (categoryIds.length > 0) {
      try {
        const { data: catData } = await supabase
          .from("categories")
          .select("id, name")
          .in("id", [...new Set(categoryIds)]);
        if (catData) {
          for (const c of catData) {
            if (c.id) categoryMap[c.id] = c.name ?? "";
          }
        }
      } catch {
        // categories table may not exist
      }
    }

    const total = count ?? 0;
    let mapped = (rows ?? []).map((r) => {
      const card = r.card_id ? cardMap[r.card_id] : null;
      const sub = r.sub_category_id ? subcategoryMap[r.sub_category_id] : null;
      return {
        id: r.id,
        cardId: r.card_id,
        owner: card?.owner ?? "—",
        cardName: card?.card_name ?? "—",
        date: r.date
          ? (() => {
              const s = String(r.date).trim();
              const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
              const d = match
                ? new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10))
                : new Date(s);
              if (isNaN(d.getTime())) return s || "—";
              return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()} ${d.getFullYear()}`;
            })()
          : "—",
        description: r.description || "—",
        debit: r.debit != null && Number(r.debit) > 0 ? formatCurrency(Number(r.debit)) : "",
        credit: r.credit != null && Number(r.credit) > 0 ? formatCurrency(Number(r.credit)) : "",
        subCategoryId: r.sub_category_id ?? null,
        subCategory: sub?.name ?? "—",
        category: (sub?.category_id && categoryMap[sub.category_id]) ?? "—",
      };
    });

    if (!useEmbedSort && mapped.length > 0) {
      const dir = asc ? 1 : -1;
      mapped = mapped.sort((a, b) => {
        let cmp = 0;
        if (validSortBy === "owner") cmp = (a.owner ?? "").localeCompare(b.owner ?? "");
        else if (validSortBy === "cardName") cmp = (a.cardName ?? "").localeCompare(b.cardName ?? "");
        else if (validSortBy === "subCategory") cmp = (a.subCategory ?? "").localeCompare(b.subCategory ?? "");
        else if (validSortBy === "category") cmp = (a.category ?? "").localeCompare(b.category ?? "");
        return cmp * dir;
      });
    }

    const transactions = mapped;

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
