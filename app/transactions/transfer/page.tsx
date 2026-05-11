"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import type { Wallet } from "@/lib/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TransferPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: wallets } = useSWR<Wallet[]>("/api/wallets", fetcher);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fromWalletId === toWalletId) { setError("Source and destination must be different wallets."); return; }
    setSaving(true);
    setError("");

    const numAmount = parseFloat(amount);
    const fromWallet = wallets?.find((w) => w.id === fromWalletId);
    const currency = fromWallet?.currency ?? "MYR";

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date, type: "transfer",
        amount: numAmount, currency, myr_amount: numAmount, exchange_rate: 1,
        wallet_id: fromWalletId, to_wallet_id: toWalletId,
        notes: notes || null,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
      setSaving(false);
      return;
    }
    router.push("/wallets");
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/wallets" className="text-slate-500 hover:text-white transition-colors"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-bold text-white">Transfer</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">From</label>
            <select value={fromWalletId} onChange={(e) => setFromWalletId(e.target.value)} required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500">
              <option value="">Select wallet</option>
              {(wallets ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <ArrowRight size={18} className="text-slate-600 mt-5 flex-shrink-0" />
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">To</label>
            <select value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500">
              <option value="">Select wallet</option>
              {(wallets ?? []).filter((w) => w.id !== fromWalletId).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Amount</label>
          <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" required
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={saving || !fromWalletId || !toWalletId || !amount}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors">
          {saving ? "Transferring..." : "Confirm Transfer"}
        </button>
      </form>
    </div>
  );
}
