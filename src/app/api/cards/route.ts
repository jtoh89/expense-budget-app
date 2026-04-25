import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/cards
 * Returns cards for dropdowns (id, name, owner)
 */
export async function GET() {
	if (!supabase) {
		return NextResponse.json({ error: "Database not configured" }, { status: 503 });
	}

	try {
		const { data, error } = await supabase.from("cards").select("id, card_name, owner").order("owner").order("card_name");

		if (error) throw error;

		return NextResponse.json(
			(data ?? []).map((r) => ({
				id: r.id,
				name: r.card_name,
				owner: r.owner,
				label: `${r.owner} - ${r.card_name}`,
			})),
		);
	} catch (error) {
		console.error("GET /api/cards error:", error);
		return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
	}
}

/**
 * POST /api/cards
 * Body: { owner, cardName, dateHeader?, descriptionHeader?, debitHeader?, creditHeader?, singleColumn?, isInverted? }
 */
export async function POST(request: Request) {
	if (!supabase) {
		return NextResponse.json({ error: "Database not configured" }, { status: 503 });
	}

	try {
		const body = await request.json();
		const { owner, cardName, dateHeader, descriptionHeader, debitHeader, creditHeader, singleColumn, isInverted } = body;

		if (!owner || !cardName) {
			return NextResponse.json({ error: "owner and cardName are required" }, { status: 400 });
		}

		const slug = `${String(owner).trim()}-${String(cardName).trim()}`
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
		const id = slug || `card_${Date.now()}`;

		const isSingle = singleColumn === true;
		const { error } = await supabase.from("cards").insert({
			id,
			owner: String(owner).trim(),
			card_name: String(cardName).trim(),
			date_header: dateHeader ? String(dateHeader).trim() : "Date",
			description_header: descriptionHeader ? String(descriptionHeader).trim() : "Description",
			/** Single-column CSV: one amount column name only; we persist as debit_header, credit_header stays null. */
			debit_header: debitHeader ? String(debitHeader).trim() : null,
			credit_header: isSingle ? null : creditHeader ? String(creditHeader).trim() : null,
			is_inverted: isInverted === true,
		});

		if (error) throw error;

		return NextResponse.json({ success: true, id });
	} catch (error) {
		console.error("POST /api/cards error:", error);
		return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
	}
}
