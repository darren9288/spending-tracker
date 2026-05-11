"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { User, KeyRound, Shield, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      const name = user.email?.replace("@placeholder.com", "") ?? "";
      setUsername(name);
    });
    fetch("/api/me").then((r) => r.json()).then((d) => {
      setIsSuperAdmin(d.is_super_admin ?? false);
    }).catch(() => {});
  }, [router]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { setMsg({ type: "err", text: "New passwords do not match." }); return; }
    if (newPw.length < 6) { setMsg({ type: "err", text: "Password must be at least 6 characters." }); return; }
    setSaving(true);
    setMsg(null);

    // Re-authenticate with current password first
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: `${username}@placeholder.com`,
      password: currentPw,
    });
    if (signInErr) {
      setMsg({ type: "err", text: "Current password is incorrect." });
      setSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      setMsg({ type: "err", text: error.message });
    } else {
      setMsg({ type: "ok", text: "Password changed successfully." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white">Account</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile and security</p>
      </div>

      {/* Profile info */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-600/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
          <User size={22} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-white font-semibold">{username}</p>
          <p className="text-xs text-slate-500">{username}@placeholder.com</p>
          {isSuperAdmin && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-0.5">
              <Shield size={11} /> Super Admin
            </span>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={16} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New password (min 6 chars)"
            autoComplete="new-password"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {msg && (
            <p className={`text-sm ${msg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
          )}
          <button type="submit" disabled={saving || !currentPw || !newPw || !confirmPw}
            className="py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? "Saving..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Admin link */}
      {isSuperAdmin && (
        <Link href="/admin"
          className="bg-slate-800/60 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-300">Admin Panel</span>
          </div>
          <ChevronRight size={16} className="text-slate-500" />
        </Link>
      )}

      {/* Sign out */}
      <button onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors px-1">
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}
