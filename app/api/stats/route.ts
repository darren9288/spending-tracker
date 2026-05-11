export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = new URL(req.url).searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const lastDay = new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate();

  const db = serverDb();

  const { data, error } = await db
    .from("transactions")
    .select("type, myr_amount, category:categories(name, color), wallet:wallets(name, color)")
    .eq("user_id", user.id)
    .gte("date", `${month}-01`)
    .lte("date", `${month}-${lastDay}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byCategory: Record<string, { amount: number; color: string }> = {};
  const byWallet: Record<string, { amount: number; color: string }> = {};
  let totalExpense = 0;
  let totalIncome = 0;

  for (const row of data ?? []) {
    const amt = Number(row.myr_amount);
    const cat = row.category as unknown as { name: string; color: string } | null;
    const wal = row.wallet as unknown as { name: string; color: string } | null;

    if (row.type === "income") { totalIncome += amt; continue; }
    if (row.type === "transfer") continue;

    totalExpense += amt;
    const catName = cat?.name ?? "Other";
    const walName = wal?.name ?? "Unknown";
    byCategory[catName] = { amount: (byCategory[catName]?.amount ?? 0) + amt, color: cat?.color ?? "#94a3b8" };
    byWallet[walName] = { amount: (byWallet[walName]?.amount ?? 0) + amt, color: wal?.color ?? "#6366f1" };
  }

  return NextResponse.json({
    month,
    totalExpense,
    totalIncome,
    savings: totalIncome - totalExpense,
    savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
    byCategory: Object.entries(byCategory)
      .map(([name, v]) => ({ name, amount: v.amount, color: v.color }))
      .sort((a, b) => b.amount - a.amount),
    byWallet: Object.entries(byWallet)
      .map(([name, v]) => ({ name, amount: v.amount, color: v.color }))
      .sort((a, b) => b.amount - a.amount),
  });
}
