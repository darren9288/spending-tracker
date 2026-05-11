"use client";
import { use } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { WalletEvent, Wallet } from "@/lib/types";

function EventRow({ event }: { event: WalletEvent }) {
  const isIn = event.sign === 1;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isIn ? "bg-emerald-500" : "bg-red-500"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{event.description}{event.notes ? ` — ${event.notes}` : ""}</p>
        <p className="text-xs text-slate-500">{new Date(`${event.date}T00:00:00`).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</p>
      </div>
      <span className={`text-sm font-semibold ${isIn ? "text-emerald-400" : "text-red-400"}`}>
        {isIn ? "+" : "-"}{event.amount.toFixed(2)}
      </span>
    </div>
  );
}

export default function WalletHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: wallets } = useSWR<Wallet[]>("/api/wallets", fetcher);
  const { data, isLoading } = useSWR<{ events: WalletEvent[]; currency: string }>(`/api/wallet-history?wallet_id=${id}`, fetcher);

  const wallet = wallets?.find((w) => w.id === id);
  const events = data?.events ?? [];
  const currency = data?.currency ?? "MYR";

  // Running balance
  let running = 0;
  const withBalance = events.map((e) => {
    running += e.sign * e.amount;
    return { ...e, running };
  });
  const currentBalance = running;

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/wallets" className="text-slate-500 hover:text-white transition-colors"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-white">{wallet?.name ?? "Wallet"}</h1>
          <p className="text-xs text-slate-500">{currency} · {wallet?.type}</p>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
        <p className="text-xs text-slate-400 mb-1">Current Balance</p>
        <p className={`text-3xl font-bold ${currentBalance < 0 ? "text-red-400" : "text-white"}`}>
          {currency} {currentBalance.toFixed(2)}
        </p>
      </div>

      {/* Events timeline */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Transaction History</h2>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-700 rounded animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No transactions yet</p>
        ) : (
          <div>
            {[...withBalance].reverse().map((e) => <EventRow key={e.id} event={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}
