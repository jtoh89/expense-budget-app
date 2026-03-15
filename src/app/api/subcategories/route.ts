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
    const { data: subData, error: subError } = await supabase
      .from("subcategories")
      .select("id, name, category_id")
      .order("category_id")
      .order("name");

    if (subError) throw subError;

    const categoryIds = [...new Set((subData ?? []).map((r) => r.category_id).filter(Boolean))];
    const categoryMap: Record<string, string> = {};

    if (categoryIds.length > 0) {
      try {
        const { data: catData, error: catError } = await supabase
          .from("categories")
          .select("id, name")
          .in("id", categoryIds);

        if (!catError && catData) {
          for (const c of catData) {
            if (c.id) categoryMap[c.id] = c.name ?? "";
          }
        }
      } catch {
        // categories table may not exist; continue with empty category names
      }
    }

    return NextResponse.json(
      (subData ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        categoryId: r.category_id,
        categoryName: (r.category_id && categoryMap[r.category_id]) ?? null,
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

/**
 * POST /api/subcategories
 * Body: { categoryId, name }
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
    const { categoryId, name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }
    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const { error } = await supabase.from("subcategories").insert({
      id,
      category_id: categoryId,
      name: String(name).trim(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("POST /api/subcategories error:", error);
    return NextResponse.json(
      { error: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}
