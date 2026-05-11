import { serverDb } from "./supabase";

// All functions here call the Supabase Admin API via the service role key.
// Never expose these to the browser.

export async function listUsers() {
  const db = serverDb();
  const { data, error } = await db.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;

  // Join with profiles for username + is_super_admin
  const { data: profiles } = await db
    .from("profiles")
    .select("id, username, is_super_admin");

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return (data.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "",
    username: profileMap[u.id]?.username ?? u.email?.split("@")[0] ?? u.id,
    is_super_admin: profileMap[u.id]?.is_super_admin ?? false,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));
}

export async function deleteUser(userId: string) {
  const db = serverDb();
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const db = serverDb();
  const { error } = await db.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (error) throw error;
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const db = serverDb();
  const { data } = await db
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .single();
  return data?.is_super_admin === true;
}
