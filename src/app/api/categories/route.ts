import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "") || `cat_${Date.now()}`;
}

/**
 * GET /api/categories
 * Returns categories for dropdowns (id, name)
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
      .from("categories")
      .select("id, name")
      .order("name");

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Body: { name }
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
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const id = slugify(String(name).trim());

    const { error } = await supabase.from("categories").insert({
      id,
      name: String(name).trim(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
