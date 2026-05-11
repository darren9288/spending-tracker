export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = new URL(req.url).searchParams;
  const walletId = p.get("wallet_id");
  const month = p.get("month"); // YYYY-MM
  const type = p.get("type"); // income|expense|transfer
  const categoryId = p.get("category_id");
  const search = p.get("search");
  const limit = Math.min(parseInt(p.get("limit") ?? "100"), 500);

  const db = serverDb();
  let q = db
    .from("transactions")
    .select("*, category:categories(*), wallet:wallets(*), to_wallet:wallets!to_wallet_id(*)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (walletId) q = q.eq("wallet_id", walletId);
  if (type) q = q.eq("type", type);
  if (categoryId) q = q.eq("category_id", categoryId);
  if (search) q = q.ilike("notes", `%${search}%`);
  if (month) {
    const lastDay = new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate();
    q = q.gte("date", `${month}-01`).lte("date", `${month}-${lastDay}`);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const items = Array.isArray(body) ? body : [body];

  const rows = items.map((item) => ({
    user_id: user.id,
    date: item.date,
    type: item.type ?? "expense",
    category_id: item.category_id ?? null,
    wallet_id: item.wallet_id,
    to_wallet_id: item.to_wallet_id ?? null,
    amount: item.amount,
    currency: item.currency ?? "MYR",
    myr_amount: item.myr_amount ?? item.amount,
    exchange_rate: item.exchange_rate ?? 1,
    notes: item.notes ?? null,
    photo_url: item.photo_url ?? null,
    mood: item.mood ?? null,
    is_tax_deductible: item.is_tax_deductible ?? false,
    recurring_template_id: item.recurring_template_id ?? null,
  }));

  const db = serverDb();
  const { data, error } = await db
    .from("transactions")
    .insert(rows)
    .select("*, category:categories(*), wallet:wallets(*), to_wallet:wallets!to_wallet_id(*)");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await req.json();
  const db = serverDb();

  const { data: existing } = await db.from("transactions").select("user_id").eq("id", id).single();
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await db
    .from("transactions").update(updates).eq("id", id)
    .select("*, category:categories(*), wallet:wallets(*), to_wallet:wallets!to_wallet_id(*)").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const db = serverDb();

  const { data: existing } = await db.from("transactions").select("user_id").eq("id", id).single();
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await db.from("transactions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
