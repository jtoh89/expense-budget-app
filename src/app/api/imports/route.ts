import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * POST /api/imports
 * Body: { cardId, filename, transactions: [{ date, description, debit, credit }] }
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
    const { cardId, filename, transactions } = body;

    if (!cardId || !filename || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "cardId, filename, and transactions array are required" },
        { status: 400 }
      );
    }

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const dateStr = String(t?.date ?? "").trim();
      const descStr = String(t?.description ?? "").trim();
      const debitVal = t?.debit != null ? Number(t.debit) : NaN;
      const creditVal = t?.credit != null ? Number(t.credit) : NaN;

      if (!dateStr) {
        return NextResponse.json(
          { error: `Row ${i + 1}: date is required` },
          { status: 400 }
        );
      }
      if (isNaN(new Date(dateStr).getTime())) {
        return NextResponse.json(
          { error: `Row ${i + 1}: invalid date "${dateStr}"` },
          { status: 400 }
        );
      }
      if (!descStr) {
        return NextResponse.json(
          { error: `Row ${i + 1}: description is required` },
          { status: 400 }
        );
      }
      if (isNaN(debitVal) || debitVal < 0) {
        return NextResponse.json(
          { error: `Row ${i + 1}: debit must be a valid non-negative number` },
          { status: 400 }
        );
      }
      if (isNaN(creditVal) || creditVal < 0) {
        return NextResponse.json(
          { error: `Row ${i + 1}: credit must be a valid non-negative number` },
          { status: 400 }
        );
      }
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const importId = `${String(cardId).trim()}_${dateStr}`;

    const { error: importError } = await supabase.from("imports").insert({
      id: importId,
      card_id: cardId,
      filename: String(filename),
      upload_date: new Date().toISOString(),
      row_count: transactions.length,
    });

    if (importError) throw importError;

    const idCounts = new Map<string, number>();
    const txRows = transactions.map((t: { date: string; description: string; debit: number; credit: number }) => {
      const debitVal = t.debit != null ? Number(t.debit) : 0;
      const creditVal = t.credit != null ? Number(t.credit) : 0;
      const dateStr = String(t.date);
      const year = new Date(dateStr).getFullYear();
      const baseId = `${dateStr}_${String(t.description).replace(/\s/g, "_")}_${debitVal || creditVal}_${cardId}`.slice(0, 248);
      const n = (idCounts.get(baseId) ?? 0) + 1;
      idCounts.set(baseId, n);
      const id = n === 1 ? baseId : `${baseId}_${n}`;
      return {
        id,
        card_id: cardId,
        import_id: importId,
        date: dateStr,
        year,
        description: String(t.description),
        debit: debitVal,
        credit: creditVal,
        sub_category_id: null,
      };
    });

    if (txRows.length > 0) {
      const { error: txError } = await supabase
        .from("transactions")
        .upsert(txRows, { onConflict: "id", ignoreDuplicates: true });
      if (txError) throw txError;
    }

    return NextResponse.json({ success: true, id: importId, count: transactions.length });
  } catch (error) {
    console.error("POST /api/imports error:", error);
    return NextResponse.json(
      { error: "Failed to import transactions" },
      { status: 500 }
    );
  }
}
