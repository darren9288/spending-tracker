"use client";
import { useState, useEffect } from "react";
import ParsedPreview from "@/components/ParsedPreview";
import { Wallet } from "@/lib/supabase";
import { ParsedEntry } from "@/lib/claude";
import { Sparkles, Info } from "lucide-react";

type EntryWithWallet = ParsedEntry & { selectedWalletId: string };

const EXAMPLE = `24/4
Lunch - 12.4
Dinner - 29 (Maybank)
Grab to office - 8.50`;

export default function InputPage() {
  const [text, setText] = useState("");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [parsed, setParsed] = useState<{
    date: string;
    entries: EntryWithWallet[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/wallets")
      .then((r) => r.json())
      .then(setWallets)
      .catch(() => {});
  }, []);

  const defaultWalletId = wallets[0]?.id ?? "";

  async function handleParse() {
    if (!text.trim()) return;
    setParsing(true);
    setError("");
    setParsed(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          walletNames: wallets.map((w) => w.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Match wallet names from AI to actual wallet IDs
      const entries: EntryWithWallet[] = data.entries.map((e: ParsedEntry) => {
        let walletId = defaultWalletId;
        if (e.wallet) {
          const match = wallets.find(
            (w) => w.name.toLowerCase().includes(e.wallet!.toLowerCase()) ||
              e.wallet!.toLowerCase().includes(w.name.toLowerCase())
          );
          if (match) walletId = match.id;
        }
        return { ...e, selectedWalletId: walletId };
      });

      setParsed({ date: data.date, entries });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm() {
    if (!parsed) return;
    setSaving(true);
    setError("");
    try {
      const rows = parsed.entries.map((e) => ({
        date: parsed.date,
        description: e.description,
        amount: e.amount,
        wallet_id: e.selectedWalletId,
        raw_input: text,
      }));
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setSuccess(`Saved ${rows.length} transaction${rows.length !== 1 ? "s" : ""}!`);
      setParsed(null);
      setText("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Add Expenses</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Type naturally — AI will parse your expenses
        </p>
      </div>

      {wallets.length === 0 && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-300">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            You need to add a wallet first. Go to{" "}
            <a href="/wallets" className="underline font-medium">Wallets</a> to set one up.
          </span>
        </div>
      )}

      {/* Input area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-400">
            Enter your expenses
          </label>
          <button
            onClick={() => setText(EXAMPLE)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Load example
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`e.g.\n${EXAMPLE}`}
          rows={7}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors font-mono"
        />
        <p className="text-xs text-slate-600">
          Tip: Add wallet in brackets like{" "}
          <span className="text-slate-500">Lunch - 15 (Maybank)</span>
        </p>
      </div>

      <button
        onClick={handleParse}
        disabled={parsing || !text.trim() || wallets.length === 0}
        className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
      >
        {parsing ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Parsing with AI...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Parse with AI
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-sm text-green-400">
          ✓ {success}
        </div>
      )}

      {parsed && (
        <ParsedPreview
          date={parsed.date}
          entries={parsed.entries}
          wallets={wallets}
          onWalletChange={(i, wid) =>
            setParsed((p) =>
              p
                ? {
                    ...p,
                    entries: p.entries.map((e, idx) =>
                      idx === i ? { ...e, selectedWalletId: wid } : e
                    ),
                  }
                : null
            )
          }
          onRemove={(i) =>
            setParsed((p) =>
              p
                ? { ...p, entries: p.entries.filter((_, idx) => idx !== i) }
                : null
            )
          }
          onConfirm={handleConfirm}
          onCancel={() => setParsed(null)}
          loading={saving}
        />
      )}
    </div>
  );
}
