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
