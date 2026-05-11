export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-server";
import { isSuperAdmin, listUsers, deleteUser, resetUserPassword } from "@/lib/admin";

async function requireSuperAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  const ok = await isSuperAdmin(user.id);
  return ok ? user : null;
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });
  if (user_id === admin.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  try {
    await deleteUser(user_id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { user_id, new_password } = await req.json();
  if (!user_id || !new_password) return NextResponse.json({ error: "user_id and new_password required" }, { status: 400 });
  if (new_password.length < 6) return NextResponse.json({ error: "Password too short" }, { status: 400 });

  try {
    await resetUserPassword(user_id, new_password);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
