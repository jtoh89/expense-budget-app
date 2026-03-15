import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/cards
 * Returns cards for dropdowns (id, name, owner)
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("cards")
      .select("id, card_name, owner")
      .order("owner")
      .order("card_name");

    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((r) => ({
        id: r.id,
        name: r.card_name,
        owner: r.owner,
        label: `${r.owner} - ${r.card_name}`,
      }))
    );
  } catch (error) {
    console.error("GET /api/cards error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cards
 * Body: { owner, cardName, dateHeader?, descriptionHeader?, debitHeader?, creditHeader?, singleColumn? }
 */
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const {
      owner,
      cardName,
      dateHeader,
      descriptionHeader,
      debitHeader,
      creditHeader,
      singleColumn,
    } = body;

    if (!owner || !cardName) {
      return NextResponse.json(
        { error: "owner and cardName are required" },
        { status: 400 }
      );
    }

    const id = `card_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const { error } = await supabase.from("cards").insert({
      id,
      owner: String(owner).trim(),
      card_name: String(cardName).trim(),
      date_header: dateHeader ? String(dateHeader).trim() : "Date",
      description_header: descriptionHeader ? String(descriptionHeader).trim() : "Description",
      debit_header: debitHeader ? String(debitHeader).trim() : null,
      credit_header: creditHeader ? String(creditHeader).trim() : null,
      single_column: singleColumn === true,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("POST /api/cards error:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}
