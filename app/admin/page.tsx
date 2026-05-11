"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Shield, Trash2, KeyRound, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

type AdminUser = {
  id: string;
  username: string;
  email: string;
  is_super_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin");
    if (res.status === 403) { router.push("/"); return; }
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
    loadUsers();
  }, [loadUsers]);

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });
    if (res.ok) { setActionMsg(`Deleted ${user.username}`); loadUsers(); }
    else { const d = await res.json(); setActionMsg(`Error: ${d.error}`); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget || !newPassword) return;
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: resetTarget.id, new_password: newPassword }),
    });
    if (res.ok) {
      setActionMsg(`Password reset for ${resetTarget.username}`);
      setResetTarget(null); setNewPassword("");
    } else {
      const d = await res.json(); setActionMsg(`Error: ${d.error}`);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/account" className="text-slate-500 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-amber-400" />
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Manage all users</p>
        </div>
        <button onClick={loadUsers} className="ml-auto text-slate-500 hover:text-white transition-colors p-1">
          <RefreshCw size={15} />
        </button>
      </div>

      {actionMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2 text-sm text-emerald-400">
          {actionMsg}
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm">
            <h2 className="text-sm font-semibold text-white mb-1">Reset password</h2>
            <p className="text-xs text-slate-400 mb-4">for <span className="text-white font-mono">{resetTarget.username}</span></p>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                minLength={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setResetTarget(null); setNewPassword(""); }}
                  className="flex-1 py-2 border border-slate-700 rounded-xl text-sm text-slate-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={newPassword.length < 6}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-sm text-white font-medium transition-colors">
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white font-mono">{u.username}</span>
                  {u.is_super_admin && <Shield size={11} className="text-amber-400" />}
                  {u.id === currentUserId && <span className="text-xs text-slate-500">(you)</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Joined {new Date(u.created_at).toLocaleDateString("en-MY")}
                  {u.last_sign_in_at && ` · Last seen ${new Date(u.last_sign_in_at).toLocaleDateString("en-MY")}`}
                </p>
              </div>
              <button onClick={() => { setResetTarget(u); setNewPassword(""); }}
                className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors" title="Reset password">
                <KeyRound size={15} />
              </button>
              {u.id !== currentUserId && (
                <button onClick={() => handleDelete(u)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Delete user">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-600">
        To make a user super admin: <span className="font-mono text-slate-500">update profiles set is_super_admin = true where username = &apos;name&apos;</span>
      </p>
    </div>
  );
}
