export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-server";
import { serverDb } from "@/lib/supabase";
import { parseExpenses } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, walletNames, categoryNames } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 });

  // Fetch category names if not provided
  let cats = categoryNames as string[] | undefined;
  if (!cats?.length) {
    const { data } = await serverDb()
      .from("categories")
      .select("name")
      .eq("user_id", user.id)
      .eq("archived", false);
    cats = (data ?? []).map((c: { name: string }) => c.name);
  }

  try {
    const result = await parseExpenses(text, walletNames ?? [], cats ?? []);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
