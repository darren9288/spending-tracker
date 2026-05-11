"use client";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Category } from "@/lib/types";
import { Plus, Tag, Archive, Pencil, Check, X } from "lucide-react";

const COLORS = ["#f97316","#3b82f6","#a855f7","#ec4899","#22c55e","#eab308","#06b6d4","#64748b","#14b8a6","#f43f5e","#8b5cf6","#84cc16","#34d399","#fb923c","#60a5fa","#e879f9","#94a3b8"];

type EditState = { name: string; color: string; is_tax_deductible: boolean };

function CategoryRow({ cat, onArchive }: { cat: Category; onArchive: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditState>({ name: cat.name, color: cat.color, is_tax_deductible: cat.is_tax_deductible });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cat.id, ...form }),
    });
    mutate("/api/categories");
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-3 flex flex-col gap-2">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
              className="w-5 h-5 rounded-full border-2 transition-all"
              style={{ backgroundColor: c, borderColor: form.color === c ? "white" : "transparent" }} />
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={form.is_tax_deductible} onChange={(e) => setForm({ ...form, is_tax_deductible: e.target.checked })}
            className="accent-emerald-500" />
          Tax deductible
        </label>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"><Check size={15} /></button>
          <button onClick={() => setEditing(false)} className="p-1 text-slate-500 hover:text-white transition-colors"><X size={15} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 group">
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{cat.name}</p>
        {cat.is_tax_deductible && <span className="text-xs text-emerald-500">Tax deductible</span>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-slate-500 hover:text-white transition-colors"><Pencil size={13} /></button>
        <button onClick={() => onArchive(cat.id)} className="p-1 text-slate-500 hover:text-amber-400 transition-colors" title="Archive"><Archive size={13} /></button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"expense" | "income">("expense");
  const [form, setForm] = useState({ name: "", color: COLORS[0], is_tax_deductible: false });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const { data: categories, isLoading } = useSWR<Category[]>("/api/categories", fetcher);

  const expense = (categories ?? []).filter((c) => c.type === "expense");
  const income = (categories ?? []).filter((c) => c.type === "income");
  const displayed = activeTab === "expense" ? expense : income;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type: formType }),
    });
    mutate("/api/categories");
    setShowForm(false);
    setForm({ name: "", color: COLORS[0], is_tax_deductible: false });
    setSaving(false);
  }

  async function handleArchive(id: string) {
    if (!confirm("Archive this category?")) return;
    await fetch("/api/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    mutate("/api/categories");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">Organise your transactions</p>
        </div>
        <button onClick={() => { setShowForm((v) => !v); setFormType(activeTab); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Tab */}
      <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
        {(["expense", "income"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === t ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}>
            {t} ({t === "expense" ? expense.length : income.length})
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white">New {formType} category</h2>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Category name" required
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Color</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: form.color === c ? "white" : "transparent" }} />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.is_tax_deductible} onChange={(e) => setForm({ ...form, is_tax_deductible: e.target.checked })}
              className="accent-emerald-500" />
            Tax deductible (LHDN relief)
          </label>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-slate-400 border border-slate-600 rounded-xl hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition-colors">
              {saving ? "Saving..." : "Add Category"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />)}</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Tag size={28} className="mx-auto mb-2 text-slate-700" />
          <p>No {activeTab} categories</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {displayed.map((c) => <CategoryRow key={c.id} cat={c} onArchive={handleArchive} />)}
        </div>
      )}
    </div>
  );
}
