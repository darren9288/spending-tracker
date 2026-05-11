"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import SpendingChart from "@/components/SpendingChart";
import Link from "next/link";
import { TrendingDown, TrendingUp, Wallet, ArrowRight, Sparkles, PlusCircle } from "lucide-react";

type Stats = {
  month: string;
  totalExpense: number;
  totalIncome: number;
  savings: number;
  savingsRate: number;
  byCategory: { name: string; amount: number; color: string }[];
  byWallet: { name: string; amount: number; color: string }[];
};

type Transaction = {
  id: string;
  date: string;
  type: string;
  notes: string | null;
  myr_amount: number;
  category?: { name: string; color: string } | null;
  wallet?: { name: string; color: string } | null;
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-700/60 rounded animate-pulse ${className ?? ""}`} />;
}

export default function Dashboard() {
  const month = new Date().toISOString().slice(0, 7);
  const { data: stats, isLoading: statsLoading } = useSWR<Stats>(`/api/stats?month=${month}`, fetcher);
  const { data: recent } = useSWR<Transaction[]>(`/api/transactions?limit=5`, fetcher);
  const { data: aiData } = useSWR<{ summary: string | null }>("/api/ai-summary", fetcher);

  const monthLabel = new Date(`${month}-01`).toLocaleDateString("en-MY", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">{monthLabel}</p>
        </div>
        <Link href="/transactions/add"
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <PlusCircle size={15} /> Add
        </Link>
      </div>

      {/* Income / Expense / Savings row */}
      <div className="grid grid-cols-3 gap-3">
        {statsLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={13} className="text-emerald-400" />
                <span className="text-xs text-slate-400">Income</span>
              </div>
              <p className="text-lg font-bold text-emerald-400">RM {(stats?.totalIncome ?? 0).toFixed(0)}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown size={13} className="text-red-400" />
                <span className="text-xs text-slate-400">Spent</span>
              </div>
              <p className="text-lg font-bold text-red-400">RM {(stats?.totalExpense ?? 0).toFixed(0)}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <Wallet size={13} className="text-blue-400" />
                <span className="text-xs text-slate-400">Saved</span>
              </div>
              <p className={`text-lg font-bold ${(stats?.savings ?? 0) >= 0 ? "text-blue-400" : "text-amber-400"}`}>
                RM {(stats?.savings ?? 0).toFixed(0)}
              </p>
              {(stats?.savingsRate ?? 0) > 0 && (
                <p className="text-xs text-slate-500">{stats?.savingsRate}%</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Category chart */}
      {!statsLoading && (stats?.byCategory?.length ?? 0) > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Top Categories</h2>
            <Link href="/transactions" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              See all <ArrowRight size={11} />
            </Link>
          </div>
          <SpendingChart data={stats!.byCategory.slice(0, 5)} type="pie" />
        </div>
      )}

      {/* Category breakdown bars */}
      {!statsLoading && (stats?.byCategory?.length ?? 0) > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-3">Breakdown</h2>
          <div className="flex flex-col gap-2.5">
            {stats!.byCategory.slice(0, 6).map((cat) => {
              const pct = stats!.totalExpense > 0 ? (cat.amount / stats!.totalExpense) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="text-slate-400">RM {cat.amount.toFixed(2)} <span className="text-slate-600 text-xs">{pct.toFixed(0)}%</span></span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI insight */}
      {aiData?.summary && (
        <div className="bg-emerald-950/40 border border-emerald-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">AI Insight</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{aiData.summary}</p>
        </div>
      )}

      {/* Recent transactions */}
      {(recent?.length ?? 0) > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Recent</h2>
            <Link href="/transactions" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              All <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            {recent!.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.category?.color ?? "#94a3b8" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{t.notes ?? t.category?.name ?? t.type}</p>
                  <p className="text-xs text-slate-500">{new Date(`${t.date}T00:00:00`).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}</p>
                </div>
                <span className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-white"}`}>
                  {t.type === "income" ? "+" : t.type === "transfer" ? "" : "-"}RM {Number(t.myr_amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!statsLoading && !stats?.totalExpense && !recent?.length && (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
            <Wallet size={28} className="text-slate-600" />
          </div>
          <div>
            <p className="text-slate-300 font-medium">No data yet</p>
            <p className="text-slate-500 text-sm mt-1">Add your first wallet and transaction to get started.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/wallets" className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white transition-colors">
              Add Wallet
            </Link>
            <Link href="/transactions/add" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm text-white font-medium transition-colors">
              Add Transaction
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
