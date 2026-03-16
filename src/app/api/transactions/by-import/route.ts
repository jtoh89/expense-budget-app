import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * DELETE /api/transactions/by-import
 * Body: { importIds: string[] } or { importId: string } (legacy)
 * Deletes all transactions with the given import_id(s) and the import record(s) itself
 */
export async function DELETE(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const importIds = Array.isArray(body.importIds)
      ? body.importIds.filter((id: unknown) => typeof id === "string").map((id: string) => id.trim())
      : typeof body.importId === "string"
        ? [body.importId.trim()]
        : [];

    if (importIds.length === 0) {
      return NextResponse.json(
        { error: "importIds (array) or importId (string) is required" },
        { status: 400 }
      );
    }

    let totalDeleted = 0;

    for (const trimmedId of importIds) {
      if (!trimmedId) continue;

      const { data, error } = await supabase
        .from("transactions")
        .delete()
        .eq("import_id", trimmedId)
        .select("id");

      if (error) throw error;

      const { error: importError } = await supabase
        .from("imports")
        .delete()
        .eq("id", trimmedId);

      if (importError) throw importError;

      totalDeleted += data?.length ?? 0;
    }

    return NextResponse.json({ success: true, deletedCount: totalDeleted });
  } catch (error) {
    console.error("DELETE /api/transactions/by-import error:", error);
    return NextResponse.json(
      { error: "Failed to delete transactions" },
      { status: 500 }
    );
  }
}
