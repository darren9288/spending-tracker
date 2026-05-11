"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import type { Wallet, Category, ParseResult, ParsedEntry } from "@/lib/types";
import { Sparkles, PenLine, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

type EntryWithWallet = ParsedEntry & { selectedWalletId: string; selectedCategoryId: string };

const MOODS = [
  { value: "", label: "No tag" },
  { value: "essential", label: "Essential" },
  { value: "planned", label: "Planned" },
  { value: "impulse", label: "Impulse" },
];

export default function AddTransactionPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"manual" | "ai">("manual");

  // Manual form state
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MYR");
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState("");
  const [isTaxDeductible, setIsTaxDeductible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualError, setManualError] = useState("");

  // AI form state
  const [aiText, setAiText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<{ date: string; entries: EntryWithWallet[] } | null>(null);
  const [aiError, setAiError] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const { data: wallets } = useSWR<Wallet[]>("/api/wallets", fetcher);
  const { data: categories } = useSWR<Category[]>("/api/categories", fetcher);

  const filteredCats = (categories ?? []).filter((c) => c.type === type);
  const expenseCats = (categories ?? []).filter((c) => c.type === "expense");
  const incomeCats = (categories ?? []).filter((c) => c.type === "income");

  // Exchange rates
  const { data: rates } = useSWR<{ from_currency: string; to_currency: string; rate: number }[]>("/api/exchange-rates", fetcher);
  function toMyr(amt: number, curr: string): number {
    if (curr === "MYR") return amt;
    const rate = rates?.find((r) => r.from_currency === curr && r.to_currency === "MYR");
    return rate ? amt * rate.rate : amt;
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletId || !amount) return;
    setSaving(true);
    setManualError("");
    const numAmount = parseFloat(amount);
    const myrAmount = toMyr(numAmount, currency);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date, type, amount: numAmount, currency, myr_amount: myrAmount,
        exchange_rate: currency === "MYR" ? 1 : myrAmount / numAmount,
        wallet_id: walletId,
        category_id: categoryId || null,
        notes: notes || null,
        mood: mood || null,
        is_tax_deductible: isTaxDeductible,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setManualError(d.error ?? "Failed to save");
      setSaving(false);
      return;
    }
    router.push("/transactions");
  }

  async function handleAiParse() {
    if (!aiText.trim()) return;
    setParsing(true);
    setAiError("");
    setParsed(null);

    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: aiText,
        walletNames: (wallets ?? []).map((w) => w.name),
        categoryNames: (categories ?? []).map((c) => c.name),
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setAiError(d.error ?? "Parse failed");
      setParsing(false);
      return;
    }

    const data: ParseResult = await res.json();
    const defaultWallet = wallets?.[0]?.id ?? "";

    const entries: EntryWithWallet[] = data.entries.map((e) => {
      let wId = defaultWallet;
      if (e.wallet) {
        const m = (wallets ?? []).find((w) => w.name.toLowerCase().includes(e.wallet!.toLowerCase()) || e.wallet!.toLowerCase().includes(w.name.toLowerCase()));
        if (m) wId = m.id;
      }
      const cats = e.type === "income" ? incomeCats : expenseCats;
      const cat = cats.find((c) => c.name.toLowerCase() === e.category.toLowerCase()) ?? cats[0];
      return { ...e, selectedWalletId: wId, selectedCategoryId: cat?.id ?? "" };
    });

    setParsed({ date: data.date, entries });
    setParsing(false);
  }

  async function handleBulkSave() {
    if (!parsed) return;
    setBulkSaving(true);

    const rows = parsed.entries.map((e) => {
      const numAmount = e.amount;
      return {
        date: parsed.date, type: e.type, amount: numAmount, currency: "MYR", myr_amount: numAmount, exchange_rate: 1,
        wallet_id: e.selectedWalletId, category_id: e.selectedCategoryId || null, notes: null, mood: null, is_tax_deductible: false,
      };
    });

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const d = await res.json();
      setAiError(d.error ?? "Save failed");
      setBulkSaving(false);
      return;
    }
    router.push("/transactions");
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/transactions" className="text-slate-500 hover:text-white transition-colors"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-bold text-white">Add Transaction</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
        <button onClick={() => setTab("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "manual" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}>
          <PenLine size={15} /> Manual
        </button>
        <button onClick={() => setTab("ai")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "ai" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}>
          <Sparkles size={15} /> AI Parse
        </button>
      </div>

      {tab === "manual" && (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
            {(["expense", "income"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setType(t); setCategoryId(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${type === t ? (t === "expense" ? "bg-red-600 text-white" : "bg-emerald-600 text-white") : "text-slate-500 hover:text-slate-300"}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>

          {/* Amount + currency */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Amount</label>
            <div className="flex gap-2">
              <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" required
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none">
                <option>MYR</option>
                {(rates ?? []).map((r) => <option key={r.from_currency} value={r.from_currency}>{r.from_currency}</option>)}
              </select>
            </div>
            {currency !== "MYR" && amount && (
              <p className="text-xs text-slate-500 mt-1">≈ RM {toMyr(parseFloat(amount) || 0, currency).toFixed(2)}</p>
            )}
          </div>

          {/* Wallet */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Wallet</label>
            <select value={walletId} onChange={(e) => setWalletId(e.target.value)} required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors">
              <option value="">Select wallet</option>
              {(wallets ?? []).map((w) => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors">
              <option value="">No category</option>
              {filteredCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional description"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>

          {/* Mood + tax */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-slate-400 mb-1 block">Mood tag</label>
              <select value={mood} onChange={(e) => setMood(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none">
                {MOODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="taxdeduct" checked={isTaxDeductible} onChange={(e) => setIsTaxDeductible(e.target.checked)}
                className="w-4 h-4 accent-emerald-500" />
              <label htmlFor="taxdeduct" className="text-sm text-slate-300">Tax deductible</label>
            </div>
          </div>

          {manualError && <p className="text-sm text-red-400">{manualError}</p>}

          <button type="submit" disabled={saving || !walletId || !amount}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors">
            {saving ? "Saving..." : "Save Transaction"}
          </button>
        </form>
      )}

      {tab === "ai" && (
        <div className="flex flex-col gap-4">
          <textarea value={aiText} onChange={(e) => setAiText(e.target.value)}
            placeholder={"e.g.\n24/4\nLunch - 12.4\nDinner - 29 (Maybank)\nGrab to office - 8.50"}
            rows={6}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-emerald-500 font-mono" />

          <button onClick={handleAiParse} disabled={parsing || !aiText.trim()}
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
            {parsing
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Parsing...</>
              : <><Sparkles size={16} />Parse with AI</>}
          </button>

          {aiError && <p className="text-sm text-red-400">{aiError}</p>}

          {parsed && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {new Date(`${parsed.date}T00:00:00`).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <button onClick={() => setParsed(null)} className="text-xs text-slate-500 hover:text-slate-300">Reset</button>
              </div>

              {parsed.entries.map((entry, i) => (
                <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">{entry.description}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${entry.type === "income" ? "text-emerald-400" : "text-white"}`}>
                        RM {entry.amount.toFixed(2)}
                      </span>
                      <button onClick={() => setParsed((p) => p ? { ...p, entries: p.entries.filter((_, j) => j !== i) } : null)}
                        className="text-slate-600 hover:text-red-400 transition-colors text-xs">x</button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select value={entry.selectedWalletId}
                      onChange={(e) => setParsed((p) => p ? { ...p, entries: p.entries.map((en, j) => j === i ? { ...en, selectedWalletId: e.target.value } : en) } : null)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none">
                      {(wallets ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <select value={entry.selectedCategoryId}
                      onChange={(e) => setParsed((p) => p ? { ...p, entries: p.entries.map((en, j) => j === i ? { ...en, selectedCategoryId: e.target.value } : en) } : null)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none">
                      <option value="">No category</option>
                      {(entry.type === "income" ? incomeCats : expenseCats).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              ))}

              {parsed.entries.length > 0 && (
                <button onClick={handleBulkSave} disabled={bulkSaving}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors">
                  {bulkSaving ? "Saving..." : `Save ${parsed.entries.length} transaction${parsed.entries.length !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
