"use client";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Transaction, Wallet } from "@/lib/types";
import { Calendar, Filter, Search, PlusCircle, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

function Skeleton() {
  return <div className="h-14 bg-slate-800 rounded-xl animate-pulse" />;
}

function fmt(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
}

function TypeBadge({ type }: { type: string }) {
  const cfg = {
    income: "bg-emerald-500/15 text-emerald-400",
    expense: "bg-red-500/15 text-red-400",
    transfer: "bg-blue-500/15 text-blue-400",
  }[type] ?? "bg-slate-700 text-slate-400";
  return <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${cfg}`}>{type}</span>;
}

export default function TransactionsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [walletFilter, setWalletFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const params = new URLSearchParams({ month });
  if (walletFilter) params.set("wallet_id", walletFilter);
  if (typeFilter) params.set("type", typeFilter);
  if (search) params.set("search", search);

  const { data: transactions, isLoading, error } = useSWR<Transaction[]>(`/api/transactions?${params}`, fetcher);
  const { data: wallets } = useSWR<Wallet[]>("/api/wallets", fetcher);

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await fetch("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    mutate(`/api/transactions?${params}`);
  }

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  for (const t of transactions ?? []) {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  }

  const totalExpense = (transactions ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.myr_amount), 0);
  const totalIncome = (transactions ?? []).filter((t) => t.type === "income").reduce((s, t) => s + Number(t.myr_amount), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">All recorded transactions</p>
        </div>
        <Link href="/transactions/add"
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <PlusCircle size={15} /> Add
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <Calendar size={13} className="text-slate-500" />
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent text-sm text-slate-300 focus:outline-none" />
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <Filter size={13} className="text-slate-500" />
          <select value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)}
            className="bg-transparent text-sm text-slate-300 focus:outline-none">
            <option value="">All wallets</option>
            {(wallets ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-transparent text-sm text-slate-300 focus:outline-none">
            <option value="">All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex-1 min-w-[140px]">
          <Search size={13} className="text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="bg-transparent text-sm text-slate-300 placeholder-slate-600 focus:outline-none w-full" />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error.message}</p>}

      {/* Summary */}
      {!isLoading && (transactions?.length ?? 0) > 0 && (
        <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm">
          <span className="text-slate-400">{transactions!.length} transactions</span>
          <div className="flex items-center gap-4">
            {totalIncome > 0 && <span className="text-emerald-400">+RM {totalIncome.toFixed(2)}</span>}
            {totalExpense > 0 && <span className="text-red-400">-RM {totalExpense.toFixed(2)}</span>}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">{[...Array(5)].map((_, i) => <Skeleton key={i} />)}</div>
      ) : (transactions?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-2">📭</p>
          <p>No transactions found</p>
          <Link href="/transactions/add" className="mt-4 inline-flex items-center gap-1 text-emerald-400 text-sm hover:text-emerald-300">
            Add one <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.myr_amount), 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{fmt(date)}</span>
                  {dayTotal > 0 && <span className="text-xs text-slate-500">-RM {dayTotal.toFixed(2)}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  {items.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-3 py-2.5 group">
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.category?.color ?? "#94a3b8" }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white truncate">{t.notes ?? t.category?.name ?? t.type}</p>
                          <TypeBadge type={t.type} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.category && <span className="text-xs text-slate-500">{t.category.name}</span>}
                          {t.wallet && (
                            <>
                              <span className="text-slate-700">·</span>
                              <span className="text-xs font-medium" style={{ color: t.wallet.color }}>{t.wallet.name}</span>
                            </>
                          )}
                          {t.type === "transfer" && t.to_wallet && (
                            <>
                              <ArrowRight size={10} className="text-slate-600" />
                              <span className="text-xs font-medium" style={{ color: t.to_wallet.color }}>{t.to_wallet.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-white"}`}>
                          {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}RM {Number(t.myr_amount).toFixed(2)}
                        </span>
                        <button onClick={() => handleDelete(t.id)}
                          className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                          <ArrowLeft size={13} className="rotate-180" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
