export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-server";
import { serverDb } from "@/lib/supabase";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = serverDb();
  const { data: profile } = await db
    .from("profiles")
    .select("username, is_super_admin")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    id: user.id,
    username: profile?.username ?? user.email?.split("@")[0] ?? "",
    is_super_admin: profile?.is_super_admin ?? false,
  });
}
