"use client";
import { useEffect, useState } from "react";
import SpendingChart from "@/components/SpendingChart";
import { TrendingDown, Wallet, Calendar } from "lucide-react";

type Stats = {
  total: number;
  month: string;
  byCategory: { name: string; amount: number; color: string }[];
  byWallet: { name: string; amount: number; color: string }[];
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats?month=${month}`)
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month]);

  const monthLabel = new Date(month + "-01").toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your spending overview</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-slate-500" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent text-sm text-slate-300 focus:outline-none"
          />
        </div>
      </div>

      {/* Total card */}
      <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-800/10 border border-indigo-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown size={16} className="text-indigo-400" />
          <span className="text-sm text-indigo-300">Total Spent — {monthLabel}</span>
        </div>
        {loading ? (
          <div className="h-9 w-36 bg-slate-700 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-white">
            RM {(stats?.total ?? 0).toFixed(2)}
          </p>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            By Category
          </h2>
          {loading ? (
            <div className="h-48 bg-slate-700/50 rounded animate-pulse" />
          ) : (
            <SpendingChart data={stats?.byCategory ?? []} type="pie" />
          )}
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
            <Wallet size={13} className="text-indigo-400" />
            By Wallet
          </h2>
          {loading ? (
            <div className="h-48 bg-slate-700/50 rounded animate-pulse" />
          ) : (
            <SpendingChart data={stats?.byWallet ?? []} type="bar" />
          )}
        </div>
      </div>

      {/* Category breakdown */}
      {!loading && (stats?.byCategory?.length ?? 0) > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-3">Category Breakdown</h2>
          <div className="flex flex-col gap-2">
            {[...(stats?.byCategory ?? [])]
              .sort((a, b) => b.amount - a.amount)
              .map((cat) => {
                const pct = stats?.total ? (cat.amount / stats.total) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{cat.name}</span>
                      <span className="text-slate-400">
                        RM {cat.amount.toFixed(2)}
                        <span className="text-slate-600 ml-2 text-xs">{pct.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
