"use client";
import { Transaction } from "@/lib/supabase";
import { Trash2 } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Shopping: "#a855f7",
  Entertainment: "#ec4899",
  Health: "#22c55e",
  Bills: "#eab308",
  Other: "#94a3b8",
};

type Props = {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
};

export default function TransactionList({ transactions, onDelete }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-4xl mb-2">📭</p>
        <p>No transactions yet</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([date, items]) => {
        const dayTotal = items.reduce((s, t) => s + Number(t.amount), 0);
        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {new Date(date + "T00:00:00").toLocaleDateString("en-MY", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <span className="text-xs text-slate-500">
                RM {dayTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {items.map((t) => {
                const catName = t.category?.name ?? "Other";
                const color = CATEGORY_COLORS[catName] ?? "#94a3b8";
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 bg-slate-800/60 rounded-lg px-3 py-2.5 group"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{catName}</span>
                        {t.wallet && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: t.wallet.color }}
                            >
                              {t.wallet.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        RM {Number(t.amount).toFixed(2)}
                      </span>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(t.id)}
                          className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
