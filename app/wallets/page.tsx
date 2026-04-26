"use client";
import { useState, useEffect } from "react";
import WalletCard from "@/components/WalletCard";
import { Wallet } from "@/lib/supabase";
import { Plus } from "lucide-react";

const COLORS = ["#6366f1", "#3b82f6", "#22c55e", "#f97316", "#ec4899", "#eab308", "#14b8a6"];
const ICONS = ["wallet", "bank", "cash", "savings", "credit"];

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    balance: "",
    color: COLORS[0],
    icon: "wallet",
    currency: "MYR",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    Promise.all([
      fetch("/api/wallets").then((r) => r.json()),
      fetch(`/api/stats?month=${month}`).then((r) => r.json()),
    ]).then(([ws, s]) => {
      setWallets(Array.isArray(ws) ? ws : []);
      const spentMap: Record<string, number> = {};
      for (const w of s?.byWallet ?? []) spentMap[w.name] = w.amount;
      setStats(spentMap);
      setLoading(false);
    });
  }, [month]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          balance: parseFloat(form.balance) || 0,
          color: form.color,
          icon: form.icon,
          currency: form.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWallets((w) => [...w, data]);
      setShowForm(false);
      setForm({ name: "", balance: "", color: COLORS[0], icon: "wallet", currency: "MYR" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this wallet? Existing transactions will remain.")) return;
    await fetch("/api/wallets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setWallets((ws) => ws.filter((w) => w.id !== id));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallets</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your bank accounts & cards</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add Wallet
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-3"
        >
          <h2 className="text-sm font-semibold text-white">New Wallet</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Wallet Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Maybank, CIMB, Cash"
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Initial Balance</label>
              <input
                type="number"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option>MYR</option>
                <option>USD</option>
                <option>SGD</option>
                <option>EUR</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Icon</label>
              <select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {ICONS.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: form.color === c ? "white" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end mt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white border border-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Add Wallet"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-2">💳</p>
          <p>No wallets yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {wallets.map((w) => (
            <WalletCard
              key={w.id}
              wallet={w}
              spent={stats[w.name]}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
