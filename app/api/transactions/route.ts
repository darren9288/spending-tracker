export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = getClient();
  const { searchParams } = new URL(req.url);
  const walletId = searchParams.get("wallet_id");
  const month = searchParams.get("month"); // YYYY-MM
  const limit = parseInt(searchParams.get("limit") ?? "100");

  let query = supabase
    .from("transactions")
    .select("*, wallet:wallets(*), category:categories(*)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (walletId) query = query.eq("wallet_id", walletId);
  if (month) {
    const lastDay = new Date(parseInt(month.slice(0, 4)), parseInt(month.slice(5, 7)), 0).getDate();
    query = query
      .gte("date", `${month}-01`)
      .lte("date", `${month}-${lastDay}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = getClient();
  const body = await req.json();

  // Support bulk insert (array) or single
  const items = Array.isArray(body) ? body : [body];

  const rows = items.map((item) => ({
    date: item.date,
    description: item.description,
    amount: item.amount,
    category_id: item.category_id ?? null,
    wallet_id: item.wallet_id,
    raw_input: item.raw_input ?? null,
  }));

  const { data, error } = await supabase
    .from("transactions")
    .insert(rows)
    .select("*, wallet:wallets(*), category:categories(*)");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = getClient();
  const { id } = await req.json();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
