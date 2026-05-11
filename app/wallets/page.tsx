"use client";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Wallet } from "@/lib/types";
import { Plus, Wallet as WalletIcon, ArrowRight, Trash2, History } from "lucide-react";
import Link from "next/link";

const COLORS = ["#6366f1","#3b82f6","#22c55e","#f97316","#ec4899","#eab308","#14b8a6","#a855f7","#64748b"];
const WALLET_TYPES = ["cash","debit","credit","ewallet","savings","other"] as const;

function WalletCard({ wallet, onDelete }: { wallet: Wallet; onDelete: (id: string) => void }) {
  const balance = wallet.balance ?? 0;
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3"
      style={{ borderLeftColor: wallet.color, borderLeftWidth: 3 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: wallet.color + "25" }}>
            <WalletIcon size={15} style={{ color: wallet.color }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{wallet.name}</p>
            <p className="text-xs text-slate-500">{wallet.type} · {wallet.currency}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/wallets/${wallet.id}`}
            className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors" title="History">
            <History size={14} />
          </Link>
          <button onClick={() => onDelete(wallet.id)}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">Balance</p>
        <p className={`text-xl font-bold ${balance < 0 ? "text-red-400" : "text-white"}`}>
          {wallet.currency} {balance.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

export default function WalletsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", initial_balance: "", color: COLORS[0], type: "debit" as typeof WALLET_TYPES[number], currency: "MYR" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: wallets, isLoading } = useSWR<Wallet[]>("/api/wallets", fetcher);
  const totalMyr = (wallets ?? []).filter((w) => w.currency === "MYR").reduce((s, w) => s + (w.balance ?? 0), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setError("");
    const res = await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, initial_balance: parseFloat(form.initial_balance) || 0 }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    mutate("/api/wallets");
    setShowForm(false);
    setForm({ name: "", initial_balance: "", color: COLORS[0], type: "debit", currency: "MYR" });
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this wallet? Existing transactions will be preserved.")) return;
    await fetch("/api/wallets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    mutate("/api/wallets");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallets</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your accounts &amp; cards</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/transactions/transfer"
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-sm rounded-xl transition-colors">
            <ArrowRight size={15} /> Transfer
          </Link>
          <button onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Total MYR balance */}
      {!isLoading && (wallets?.length ?? 0) > 0 && (
        <div className="bg-gradient-to-br from-emerald-600/15 to-emerald-800/10 border border-emerald-500/20 rounded-2xl p-4">
          <p className="text-xs text-emerald-400 mb-1">Total MYR balance</p>
          <p className={`text-3xl font-bold ${totalMyr < 0 ? "text-red-400" : "text-white"}`}>RM {totalMyr.toFixed(2)}</p>
        </div>
      )}

      {/* Add wallet form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white">New Wallet</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Maybank, Touch n Go" required
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof WALLET_TYPES[number] })}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                {WALLET_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                <option>MYR</option><option>USD</option><option>SGD</option><option>EUR</option><option>GBP</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Initial Balance</label>
              <input type="number" value={form.initial_balance} onChange={(e) => setForm({ ...form, initial_balance: e.target.value })}
                placeholder="0.00" step="0.01"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: form.color === c ? "white" : "transparent" }} />
                ))}
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-slate-400 border border-slate-600 rounded-xl hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition-colors">
              {saving ? "Saving..." : "Add Wallet"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (wallets?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <WalletIcon size={32} className="mx-auto mb-3 text-slate-700" />
          <p>No wallets yet.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-emerald-400 text-sm hover:text-emerald-300">Add your first wallet</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(wallets ?? []).map((w) => <WalletCard key={w.id} wallet={w} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}
