"use client";
import { useState, useEffect, useCallback } from "react";
import TransactionList from "@/components/TransactionList";
import { Transaction, Wallet } from "@/lib/supabase";
import { Calendar, Filter } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [walletFilter, setWalletFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (walletFilter) params.set("wallet_id", walletFilter);
    const [txRes, wRes] = await Promise.all([
      fetch(`/api/transactions?${params}`).then((r) => r.json()),
      fetch("/api/wallets").then((r) => r.json()),
    ]);
    setTransactions(Array.isArray(txRes) ? txRes : []);
    setWallets(Array.isArray(wRes) ? wRes : []);
    setLoading(false);
  }, [month, walletFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await fetch("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTransactions((ts) => ts.filter((t) => t.id !== id));
  }

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-sm text-slate-500 mt-0.5">All your recorded transactions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-slate-500" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent text-sm text-slate-300 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="bg-transparent text-sm text-slate-300 focus:outline-none pr-1"
          >
            <option value="">All wallets</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && transactions.length > 0 && (
        <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5">
          <span className="text-sm text-slate-400">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </span>
          <span className="text-sm font-bold text-white">RM {total.toFixed(2)}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <TransactionList transactions={transactions} onDelete={handleDelete} />
      )}
    </div>
  );
}
