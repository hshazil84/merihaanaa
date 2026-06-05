// src/app/api/articles/clear-slot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { placement, slot, excludeId } = await req.json();

    if (!placement || !slot) {
      return NextResponse.json({ error: "placement and slot required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Clear slot from any other article that has the same placement + slot
    let query = supabase
      .from("articles")
      .update({ homepage_slot: null })
      .eq("homepage_placement", placement)
      .eq("homepage_slot", slot);

    // Exclude current article if editing an existing one
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
