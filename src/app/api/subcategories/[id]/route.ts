import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/subcategories/[id]
 * Returns full subcategory for editing
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
      .from("subcategories")
      .select("id, name, category_id")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      categoryId: data.category_id ?? "",
    });
  } catch (error) {
    console.error("GET /api/subcategories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategory" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subcategories/[id]
 * Body: { categoryId?, name? }
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
    if (body.categoryId != null) updates.category_id = body.categoryId || null;
    if (body.name != null) updates.name = String(body.name).trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("subcategories")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/subcategories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update subcategory" },
      { status: 500 }
    );
  }
}
