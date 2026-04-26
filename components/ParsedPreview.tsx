"use client";
import { ParsedEntry } from "@/lib/claude";
import { Wallet } from "@/lib/supabase";
import { Check, X } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Shopping: "#a855f7",
  Entertainment: "#ec4899",
  Health: "#22c55e",
  Bills: "#eab308",
  Other: "#94a3b8",
};

type EntryWithWallet = ParsedEntry & { selectedWalletId: string };

type Props = {
  date: string;
  entries: EntryWithWallet[];
  wallets: Wallet[];
  onWalletChange: (index: number, walletId: string) => void;
  onRemove: (index: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
};

export default function ParsedPreview({
  date,
  entries,
  wallets,
  onWalletChange,
  onRemove,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  const total = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">AI Parsed Result</p>
          <p className="text-xs text-slate-500">
            {new Date(date + "T00:00:00").toLocaleDateString("en-MY", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="text-sm font-bold text-white">RM {total.toFixed(2)}</span>
      </div>

      <div className="divide-y divide-slate-700/50">
        {entries.map((entry, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3">
            <div
              className="w-2 h-8 rounded-full flex-shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[entry.category] ?? "#94a3b8" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{entry.description}</p>
              <span className="text-xs text-slate-500">{entry.category}</span>
            </div>
            <select
              value={entry.selectedWalletId}
              onChange={(e) => onWalletChange(i, e.target.value)}
              className="text-xs bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-slate-300 max-w-[110px] focus:outline-none focus:border-indigo-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <span className="text-sm font-bold text-white w-16 text-right">
              RM {entry.amount.toFixed(2)}
            </span>
            <button
              onClick={() => onRemove(i)}
              className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-slate-700 flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading || entries.length === 0}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check size={14} />
          )}
          Save {entries.length} transaction{entries.length !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
