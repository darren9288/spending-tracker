export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = serverDb();
  let { data } = await db
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Auto-create if missing (race with trigger)
  if (!data) {
    const { data: created } = await db
      .from("user_settings")
      .insert({ user_id: user.id })
      .select()
      .single();
    data = created;
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await req.json();
  // Whitelist allowed fields
  const allowed = ["theme", "base_currency", "foreign_currencies_json", "month_start_day", "ai_summary_cache", "ai_summary_cached_at"];
  const safe = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  const { data, error } = await serverDb()
    .from("user_settings")
    .upsert({ user_id: user.id, ...safe }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
