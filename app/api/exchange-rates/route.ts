export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await serverDb()
    .from("exchange_rates")
    .select("*")
    .eq("user_id", user.id)
    .order("from_currency");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { from_currency, to_currency, rate } = await req.json();
  if (!from_currency || !to_currency || !rate) {
    return NextResponse.json({ error: "from_currency, to_currency, rate required" }, { status: 400 });
  }

  const { data, error } = await serverDb()
    .from("exchange_rates")
    .upsert(
      { user_id: user.id, from_currency, to_currency, rate, updated_at: new Date().toISOString() },
      { onConflict: "user_id,from_currency,to_currency" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
