import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/cards/[id]
 * Returns full card details for editing
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	if (!supabase) {
		return NextResponse.json({ error: "Database not configured" }, { status: 503 });
	}

	try {
		const { id } = await params;
		const { data, error } = await supabase
			.from("cards")
			.select("id, owner, card_name, date_header, description_header, debit_header, credit_header, use_single_column, single_column_debit_format")
			.eq("id", id)
			.single();

		// PGRST116 = zero rows (PostgREST)
		if (error && error.code !== "PGRST116") {
			console.error("GET /api/cards/[id] supabase error:", error.message, error.code, error.details);
			return NextResponse.json({ error: "Failed to fetch card", details: error.message }, { status: 500 });
		}
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
			/**
			 * From `use_single_column`; if missing (legacy), infer from `credit_header == null`.
			 */
			singleColumn: (data as { use_single_column?: boolean | null }).use_single_column ?? data.credit_header == null,
			singleColumnDebitFormat: (() => {
				const f = (data as { single_column_debit_format?: string | null }).single_column_debit_format;
				if (f === "parentheses" || f === "negative" || f === "positive") return f;
				return null;
			})(),
		});
	} catch (error) {
		console.error("GET /api/cards/[id] error:", error);
		return NextResponse.json({ error: "Failed to fetch card" }, { status: 500 });
	}
}

/**
 * PATCH /api/cards/[id]
 * Body: { owner?, cardName?, dateHeader?, descriptionHeader?, debitHeader?, creditHeader?, singleColumn?, singleColumnDebitFormat? }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	if (!supabase) {
		return NextResponse.json({ error: "Database not configured" }, { status: 503 });
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
		if (body.singleColumn != null) {
			updates.use_single_column = body.singleColumn === true;
			if (body.singleColumn === true) {
				updates.credit_header = null;
				if (
					body.singleColumnDebitFormat === "parentheses" ||
					body.singleColumnDebitFormat === "negative" ||
					body.singleColumnDebitFormat === "positive"
				) {
					updates.single_column_debit_format = body.singleColumnDebitFormat;
				} else if (body.singleColumnDebitFormat === null) {
					updates.single_column_debit_format = null;
				}
			} else {
				updates.single_column_debit_format = null;
				if (body.creditHeader !== undefined) {
					updates.credit_header = body.creditHeader ? String(body.creditHeader).trim() : null;
				}
			}
		} else if (body.creditHeader !== undefined) {
			updates.credit_header = body.creditHeader ? String(body.creditHeader).trim() : null;
		}
		if (body.singleColumn == null && body.singleColumnDebitFormat !== undefined) {
			const f = body.singleColumnDebitFormat;
			if (f === "parentheses" || f === "negative" || f === "positive") {
				updates.single_column_debit_format = f;
			} else if (f === null) {
				updates.single_column_debit_format = null;
			}
		}

		if (Object.keys(updates).length === 0) {
			return NextResponse.json({ error: "No fields to update" }, { status: 400 });
		}

		// Single-column cards never use a credit header; ensure DB cannot keep a stale value.
		if (updates.use_single_column === true) {
			updates.credit_header = null;
		}

		const { error } = await supabase.from("cards").update(updates).eq("id", id);

		if (error) throw error;

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("PATCH /api/cards/[id] error:", error);
		return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
	}
}
