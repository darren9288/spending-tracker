export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = serverDb();

  // Get all non-archived wallets with computed balance
  const { data: wallets, error } = await db
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!wallets?.length) return NextResponse.json([]);

  const ids = wallets.map((w) => w.id);

  // Compute balance: initial_balance + income - expenses + transfers_in - transfers_out
  const [{ data: income }, { data: expense }, { data: xferIn }, { data: xferOut }] = await Promise.all([
    db.from("transactions").select("wallet_id, myr_amount").eq("user_id", user.id).eq("type", "income").in("wallet_id", ids),
    db.from("transactions").select("wallet_id, myr_amount").eq("user_id", user.id).eq("type", "expense").in("wallet_id", ids),
    db.from("transactions").select("to_wallet_id, myr_amount").eq("user_id", user.id).eq("type", "transfer").in("to_wallet_id", ids),
    db.from("transactions").select("wallet_id, myr_amount").eq("user_id", user.id).eq("type", "transfer").in("wallet_id", ids),
  ]);

  const balances: Record<string, number> = {};
  for (const w of wallets) balances[w.id] = Number(w.initial_balance ?? 0);
  for (const r of income ?? []) balances[r.wallet_id] = (balances[r.wallet_id] ?? 0) + Number(r.myr_amount);
  for (const r of expense ?? []) balances[r.wallet_id] = (balances[r.wallet_id] ?? 0) - Number(r.myr_amount);
  for (const r of xferIn ?? []) if (r.to_wallet_id) balances[r.to_wallet_id] = (balances[r.to_wallet_id] ?? 0) + Number(r.myr_amount);
  for (const r of xferOut ?? []) balances[r.wallet_id] = (balances[r.wallet_id] ?? 0) - Number(r.myr_amount);

  return NextResponse.json(wallets.map((w) => ({ ...w, balance: balances[w.id] ?? 0 })));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await serverDb()
    .from("wallets")
    .insert({
      user_id: user.id,
      name: body.name,
      currency: body.currency ?? "MYR",
      color: body.color ?? "#6366f1",
      icon: body.icon ?? "wallet",
      type: body.type ?? "other",
      initial_balance: body.initial_balance ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, balance: Number(data.initial_balance ?? 0) }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await req.json();
  // Verify ownership
  const { data: existing } = await serverDb().from("wallets").select("user_id").eq("id", id).single();
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await serverDb()
    .from("wallets").update(updates).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const { data: existing } = await serverDb().from("wallets").select("user_id").eq("id", id).single();
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await serverDb().from("wallets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
