import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/subcategories
 * Returns subcategories with category name for dropdowns
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
      .from("subcategories")
      .select("id, name, category_id, categories(name)")
      .order("category_id")
      .order("name");

    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        categoryId: r.category_id,
        categoryName: (r.categories as { name: string } | null)?.name ?? null,
      }))
    );
  } catch (error) {
    console.error("GET /api/subcategories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}
