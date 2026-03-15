import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * GET /api/skip-keywords
 * Returns all skip keywords
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
      .from("transactions_to_skip")
      .select("keyword")
      .order("keyword");

    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((r) => ({ keyword: r.keyword }))
    );
  } catch (error) {
    console.error("GET /api/skip-keywords error:", error);
    return NextResponse.json(
      { error: "Failed to fetch skip keywords" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/skip-keywords
 * Body: { keyword }
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
    const keyword = body.keyword;

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json(
        { error: "keyword is required" },
        { status: 400 }
      );
    }

    const trimmed = String(keyword).trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "keyword cannot be empty" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("transactions_to_skip")
      .insert({ keyword: trimmed });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Keyword already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/skip-keywords error:", error);
    return NextResponse.json(
      { error: "Failed to add skip keyword" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/skip-keywords
 * Body: { keyword }
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
    const keyword = body?.keyword;

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json(
        { error: "keyword is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("transactions_to_skip")
      .delete()
      .eq("keyword", String(keyword).trim());

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/skip-keywords error:", error);
    return NextResponse.json(
      { error: "Failed to delete skip keyword" },
      { status: 500 }
    );
  }
}
