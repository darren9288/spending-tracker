"use client";
import { Wallet } from "@/lib/supabase";
import { Trash2 } from "lucide-react";

const WALLET_ICONS: Record<string, string> = {
  wallet: "💳",
  bank: "🏦",
  cash: "💵",
  savings: "🏧",
  credit: "💰",
};

type Props = {
  wallet: Wallet;
  spent?: number;
  onDelete?: (id: string) => void;
};

export default function WalletCard({ wallet, spent, onDelete }: Props) {
  return (
    <div
      className="relative rounded-xl p-4 border border-slate-700 bg-slate-800/50 flex flex-col gap-2"
      style={{ borderLeftColor: wallet.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{WALLET_ICONS[wallet.icon] ?? "💳"}</span>
          <span className="font-semibold text-white">{wallet.name}</span>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(wallet.id)}
            className="text-slate-500 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500">Balance</p>
          <p className="text-lg font-bold text-white">
            {wallet.currency} {wallet.balance.toFixed(2)}
          </p>
        </div>
        {spent !== undefined && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Spent this month</p>
            <p className="text-sm font-semibold text-red-400">
              - {wallet.currency} {spent.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
