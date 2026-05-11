export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-server";
import type { WalletEvent } from "@/lib/types";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallet_id = new URL(req.url).searchParams.get("wallet_id");
  if (!wallet_id) return NextResponse.json({ error: "wallet_id required" }, { status: 400 });

  const db = serverDb();

  const { data: wallet } = await db
    .from("wallets")
    .select("currency, name, initial_balance, user_id")
    .eq("id", wallet_id)
    .single();

  if (!wallet || wallet.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: transactions } = await db
    .from("transactions")
    .select("id, date, created_at, type, myr_amount, amount, notes, to_wallet_id, category:categories(name)")
    .eq("user_id", user.id)
    .or(`wallet_id.eq.${wallet_id},to_wallet_id.eq.${wallet_id}`)
    .order("date")
    .order("created_at");

  const events: WalletEvent[] = [];

  // Opening balance event
  if (Number(wallet.initial_balance) !== 0) {
    events.push({
      id: "initial",
      type: "initial",
      date: "2000-01-01",
      created_at: "2000-01-01T00:00:00Z",
      amount: Math.abs(Number(wallet.initial_balance)),
      sign: Number(wallet.initial_balance) >= 0 ? 1 : -1,
      description: "Opening balance",
    });
  }

  for (const t of transactions ?? []) {
    const amt = Number(t.amount);
    const cat = (t.category as unknown as { name: string } | null)?.name;

    if (t.type === "income") {
      events.push({ id: t.id, type: "income", date: t.date, created_at: t.created_at, amount: amt, sign: 1, description: cat ?? "Income", notes: t.notes, category: cat });
    } else if (t.type === "expense") {
      events.push({ id: t.id, type: "expense", date: t.date, created_at: t.created_at, amount: amt, sign: -1, description: cat ?? "Expense", notes: t.notes, category: cat });
    } else if (t.type === "transfer") {
      if (t.to_wallet_id === wallet_id) {
        events.push({ id: t.id, type: "transfer_in", date: t.date, created_at: t.created_at, amount: amt, sign: 1, description: "Transfer in", notes: t.notes });
      } else {
        events.push({ id: t.id, type: "transfer_out", date: t.date, created_at: t.created_at, amount: amt, sign: -1, description: "Transfer out", notes: t.notes });
      }
    }
  }

  return NextResponse.json({ events, currency: wallet.currency });
}
