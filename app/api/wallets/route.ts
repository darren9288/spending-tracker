export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = getClient();
  const body = await req.json();
  const { data, error } = await supabase
    .from("wallets")
    .insert({
      name: body.name,
      color: body.color ?? "#6366f1",
      icon: body.icon ?? "wallet",
      balance: body.balance ?? 0,
      currency: body.currency ?? "MYR",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const supabase = getClient();
  const body = await req.json();
  const { id, ...updates } = body;
  const { data, error } = await supabase
    .from("wallets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = getClient();
  const { id } = await req.json();
  const { error } = await supabase.from("wallets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
