export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = new URL(req.url).searchParams;
  const type = p.get("type"); // "income" | "expense" | null (all)
  const includeArchived = p.get("archived") === "true";

  let query = serverDb()
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (type) query = query.eq("type", type);
  if (!includeArchived) query = query.eq("archived", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await serverDb()
    .from("categories")
    .insert({
      user_id: user.id,
      name: body.name,
      color: body.color ?? "#94a3b8",
      icon: body.icon ?? "tag",
      type: body.type ?? "expense",
      is_tax_deductible: body.is_tax_deductible ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await req.json();
  const { data: existing } = await serverDb().from("categories").select("user_id").eq("id", id).single();
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await serverDb()
    .from("categories").update(updates).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const { data: existing } = await serverDb().from("categories").select("user_id").eq("id", id).single();
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete — archive instead of hard delete to preserve transaction category refs
  const { error } = await serverDb().from("categories").update({ archived: true }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
