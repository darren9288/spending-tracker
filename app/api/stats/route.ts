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
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, category:categories(name, color), wallet:wallets(name, color)")
    .gte("date", `${month}-01`)
    .lte("date", `${month}-31`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by category
  const byCategory: Record<string, { amount: number; color: string }> = {};
  const byWallet: Record<string, { amount: number; color: string }> = {};
  let total = 0;

  for (const row of data ?? []) {
    const amt = Number(row.amount);
    total += amt;
    const cat = (row.category as unknown as { name: string; color: string } | null);
    const wal = (row.wallet as unknown as { name: string; color: string } | null);
    const catName = cat?.name ?? "Other";
    const walName = wal?.name ?? "Unknown";
    byCategory[catName] = {
      amount: (byCategory[catName]?.amount ?? 0) + amt,
      color: cat?.color ?? "#94a3b8",
    };
    byWallet[walName] = {
      amount: (byWallet[walName]?.amount ?? 0) + amt,
      color: wal?.color ?? "#6366f1",
    };
  }

  return NextResponse.json({
    total,
    month,
    byCategory: Object.entries(byCategory).map(([name, v]) => ({
      name,
      amount: v.amount,
      color: v.color,
    })),
    byWallet: Object.entries(byWallet).map(([name, v]) => ({
      name,
      amount: v.amount,
      color: v.color,
    })),
  });
}
