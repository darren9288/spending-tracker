export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-server";
import { generateMonthlySummary } from "@/lib/claude";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = serverDb();

  // Check cache in user_settings
  const { data: settings } = await db
    .from("user_settings")
    .select("ai_summary_cache, ai_summary_cached_at")
    .eq("user_id", user.id)
    .single();

  if (settings?.ai_summary_cache && settings.ai_summary_cached_at) {
    const age = Date.now() - new Date(settings.ai_summary_cached_at).getTime();
    if (age < CACHE_TTL_MS) {
      return NextResponse.json({ summary: settings.ai_summary_cache, cached: true });
    }
  }

  // Build context for this month
  const month = new Date().toISOString().slice(0, 7);
  const lastDay = new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate();

  const { data: txns } = await db
    .from("transactions")
    .select("type, myr_amount, category:categories(name)")
    .eq("user_id", user.id)
    .gte("date", `${month}-01`)
    .lte("date", `${month}-${lastDay}`);

  if (!txns?.length) {
    return NextResponse.json({ summary: null, cached: false });
  }

  let income = 0, expense = 0;
  const byCategory: Record<string, number> = {};
  for (const t of txns) {
    const amt = Number(t.myr_amount);
    const cat = (t.category as unknown as { name: string } | null)?.name ?? "Other";
    if (t.type === "income") { income += amt; }
    else if (t.type === "expense") { expense += amt; byCategory[cat] = (byCategory[cat] ?? 0) + amt; }
  }

  const top3 = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const ctx = JSON.stringify({ month, income, expense, savings: income - expense, top_categories: top3 });

  try {
    const summary = await generateMonthlySummary(ctx);
    await db.from("user_settings").upsert(
      { user_id: user.id, ai_summary_cache: summary, ai_summary_cached_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    return NextResponse.json({ summary, cached: false });
  } catch {
    return NextResponse.json({ summary: null, cached: false });
  }
}
