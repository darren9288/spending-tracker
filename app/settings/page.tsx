"use client";
import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { useTheme, THEMES } from "@/components/ThemeProvider";
import type { UserSettings, ExchangeRate } from "@/lib/types";
import { Check, RefreshCw, Loader2 } from "lucide-react";

const CURRENCIES = ["MYR", "USD", "SGD", "EUR", "GBP", "JPY", "CNY", "AUD", "HKD", "THB", "IDR", "PHP"];
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: settings } = useSWR<UserSettings>("/api/user-settings", fetcher);
  const { data: rates } = useSWR<ExchangeRate[]>("/api/exchange-rates", fetcher);

  const [baseCurrency, setBaseCurrency] = useState("MYR");
  const [foreignCurrencies, setForeignCurrencies] = useState<string[]>([]);
  const [monthStartDay, setMonthStartDay] = useState(1);
  const [rateMap, setRateMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savingRate, setSavingRate] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sync state when settings loads
  useEffect(() => {
    if (!settings) return;
    setBaseCurrency(settings.base_currency ?? "MYR");
    setForeignCurrencies(settings.foreign_currencies_json ?? []);
    setMonthStartDay(settings.month_start_day ?? 1);
  }, [settings]);

  // Sync rate map when rates or foreignCurrencies change
  useEffect(() => {
    if (!rates) return;
    const map: Record<string, string> = {};
    for (const fc of foreignCurrencies) {
      const found = rates.find((r) => r.from_currency === fc && r.to_currency === baseCurrency);
      map[fc] = found ? String(found.rate) : "";
    }
    setRateMap(map);
  }, [rates, foreignCurrencies, baseCurrency]);

  function toggleForeignCurrency(cur: string) {
    setForeignCurrencies((prev) =>
      prev.includes(cur) ? prev.filter((c) => c !== cur) : [...prev, cur]
    );
  }

  async function saveGeneral() {
    setSaving(true);
    await fetch("/api/user-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme,
        base_currency: baseCurrency,
        foreign_currencies_json: foreignCurrencies,
        month_start_day: monthStartDay,
      }),
    });
    mutate("/api/user-settings");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function saveRate(fc: string) {
    const rateVal = parseFloat(rateMap[fc]);
    if (!rateVal || rateVal <= 0) return;
    setSavingRate(fc);
    await fetch("/api/exchange-rates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_currency: fc, to_currency: baseCurrency, rate: rateVal }),
    });
    mutate("/api/exchange-rates");
    setSavingRate(null);
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Personalise your experience</p>
      </div>

      {/* Theme */}
      <Section title="Appearance">
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                theme === t.key
                  ? "border-white text-white bg-slate-700"
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
              {theme === t.key && <Check size={12} className="text-emerald-400" />}
            </button>
          ))}
        </div>
      </Section>

      {/* Currency */}
      <Section title="Currency">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Base Currency</label>
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Foreign Currencies</label>
          <div className="flex flex-wrap gap-1.5">
            {CURRENCIES.filter((c) => c !== baseCurrency).map((c) => (
              <button
                key={c}
                onClick={() => toggleForeignCurrency(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  foreignCurrencies.includes(c)
                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                    : "bg-transparent border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Exchange Rates */}
      {foreignCurrencies.length > 0 && (
        <Section title="Exchange Rates">
          <p className="text-xs text-slate-500 -mt-2">
            How much 1 unit of each currency equals in {baseCurrency}
          </p>
          <div className="flex flex-col gap-2">
            {foreignCurrencies.map((fc) => (
              <div key={fc} className="flex items-center gap-2">
                <span className="text-sm text-slate-300 w-10 flex-shrink-0">1 {fc}</span>
                <span className="text-sm text-slate-500">=</span>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={rateMap[fc] ?? ""}
                  onChange={(e) => setRateMap({ ...rateMap, [fc]: e.target.value })}
                  placeholder="0.00"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-sm text-slate-300 w-10 flex-shrink-0">{baseCurrency}</span>
                <button
                  onClick={() => saveRate(fc)}
                  disabled={savingRate === fc || !rateMap[fc]}
                  className="p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors"
                  title="Save rate"
                >
                  {savingRate === fc ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Month Start */}
      <Section title="Reporting">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Month Starts On Day</label>
          <select
            value={monthStartDay}
            onChange={(e) => setMonthStartDay(Number(e.target.value))}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {MONTH_DAYS.map((d) => (
              <option key={d} value={d}>{d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">Used for monthly budget and report calculations</p>
        </div>
      </Section>

      {/* Save */}
      <button
        onClick={saveGeneral}
        disabled={saving}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {saving ? (
          <><Loader2 size={15} className="animate-spin" /> Saving...</>
        ) : saved ? (
          <><Check size={15} /> Saved</>
        ) : (
          <><RefreshCw size={15} /> Save Settings</>
        )}
      </button>
    </div>
  );
}
