import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/cards/[id]
 * Returns full card details for editing
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("cards")
      .select("id, owner, card_name, date_header, description_header, debit_header, credit_header, single_column")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      owner: data.owner,
      cardName: data.card_name,
      dateHeader: data.date_header,
      descriptionHeader: data.description_header,
      debitHeader: data.debit_header,
      creditHeader: data.credit_header,
      singleColumn: data.single_column ?? false,
    });
  } catch (error) {
    console.error("GET /api/cards/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cards/[id]
 * Body: { owner?, cardName?, dateHeader?, descriptionHeader?, debitHeader?, creditHeader?, singleColumn? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.owner != null) updates.owner = String(body.owner).trim();
    if (body.cardName != null) updates.card_name = String(body.cardName).trim();
    if (body.dateHeader != null) updates.date_header = String(body.dateHeader).trim();
    if (body.descriptionHeader != null) updates.description_header = String(body.descriptionHeader).trim();
    if (body.debitHeader !== undefined) updates.debit_header = body.debitHeader ? String(body.debitHeader).trim() : null;
    if (body.creditHeader !== undefined) updates.credit_header = body.creditHeader ? String(body.creditHeader).trim() : null;
    if (body.singleColumn != null) updates.single_column = body.singleColumn === true;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cards")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/cards/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}
