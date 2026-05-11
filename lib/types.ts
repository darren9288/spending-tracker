// ── Core domain types ─────────────────────────────────────────────────────────

export type Profile = {
  id: string;
  username: string;
  is_super_admin: boolean;
  created_at: string;
};

export type UserSettings = {
  id: string;
  user_id: string;
  theme: string;
  base_currency: string;
  foreign_currencies_json: string[];
  month_start_day: number;
  ai_summary_cache: string | null;
  ai_summary_cached_at: string | null;
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  color: string;
  icon: string;
  type: "cash" | "debit" | "credit" | "ewallet" | "savings" | "other";
  initial_balance: number;
  archived: boolean;
  created_at: string;
  // computed by API
  balance?: number;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  type: "income" | "expense";
  is_tax_deductible: boolean;
  archived: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  type: "income" | "expense" | "transfer";
  category_id: string | null;
  wallet_id: string;
  to_wallet_id: string | null;
  amount: number;
  currency: string;
  myr_amount: number;
  exchange_rate: number;
  notes: string | null;
  photo_url: string | null;
  mood: "essential" | "planned" | "impulse" | null;
  is_tax_deductible: boolean;
  recurring_template_id: string | null;
  created_at: string;
  // joined
  category?: Category | null;
  wallet?: Wallet | null;
  to_wallet?: Wallet | null;
};

export type ExchangeRate = {
  id: string;
  user_id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
};

// ── Wallet balance event (for per-wallet history timeline) ────────────────────

export type WalletEvent = {
  id: string;
  type: "initial" | "income" | "expense" | "transfer_in" | "transfer_out";
  date: string;
  created_at: string;
  amount: number;
  sign: 1 | -1;
  description: string;
  category?: string | null;
  notes?: string | null;
  counterpart?: string | null;
};

// ── AI parse types ────────────────────────────────────────────────────────────

export type ParsedEntry = {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  wallet: string | null;
};

export type ParseResult = {
  date: string;
  entries: ParsedEntry[];
};

// ── Default seed categories ───────────────────────────────────────────────────

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, "id" | "user_id" | "created_at" | "archived">[] = [
  { name: "Food & Drinks",      color: "#f97316", icon: "utensils",      type: "expense", is_tax_deductible: false },
  { name: "Transport",          color: "#3b82f6", icon: "car",           type: "expense", is_tax_deductible: false },
  { name: "Groceries",          color: "#84cc16", icon: "shopping-cart", type: "expense", is_tax_deductible: false },
  { name: "Shopping",           color: "#a855f7", icon: "shopping-bag",  type: "expense", is_tax_deductible: false },
  { name: "Entertainment",      color: "#ec4899", icon: "tv",            type: "expense", is_tax_deductible: false },
  { name: "Health & Medical",   color: "#22c55e", icon: "heart",         type: "expense", is_tax_deductible: true  },
  { name: "Bills & Utilities",  color: "#eab308", icon: "file-text",     type: "expense", is_tax_deductible: false },
  { name: "Rent",               color: "#64748b", icon: "home",          type: "expense", is_tax_deductible: false },
  { name: "Education",          color: "#06b6d4", icon: "book-open",     type: "expense", is_tax_deductible: true  },
  { name: "Subscriptions",      color: "#8b5cf6", icon: "repeat",        type: "expense", is_tax_deductible: false },
  { name: "Insurance",          color: "#14b8a6", icon: "shield",        type: "expense", is_tax_deductible: true  },
  { name: "Travel",             color: "#f43f5e", icon: "plane",         type: "expense", is_tax_deductible: false },
  { name: "Personal Care",      color: "#fb923c", icon: "sparkles",      type: "expense", is_tax_deductible: false },
  { name: "Gifts & Donations",  color: "#e879f9", icon: "gift",          type: "expense", is_tax_deductible: false },
  { name: "Investment",         color: "#34d399", icon: "trending-up",   type: "expense", is_tax_deductible: false },
  { name: "Tax & Fees",         color: "#94a3b8", icon: "landmark",      type: "expense", is_tax_deductible: false },
  { name: "Petrol",             color: "#f59e0b", icon: "fuel",          type: "expense", is_tax_deductible: false },
  { name: "Parking",            color: "#60a5fa", icon: "parking-circle",type: "expense", is_tax_deductible: false },
  { name: "Other Expense",      color: "#94a3b8", icon: "tag",           type: "expense", is_tax_deductible: false },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, "id" | "user_id" | "created_at" | "archived">[] = [
  { name: "Salary",      color: "#10b981", icon: "briefcase",    type: "income", is_tax_deductible: false },
  { name: "Freelance",   color: "#6366f1", icon: "monitor",      type: "income", is_tax_deductible: false },
  { name: "Investment",  color: "#34d399", icon: "trending-up",  type: "income", is_tax_deductible: false },
  { name: "Refund",      color: "#38bdf8", icon: "refresh-cw",   type: "income", is_tax_deductible: false },
  { name: "Gift",        color: "#e879f9", icon: "gift",         type: "income", is_tax_deductible: false },
  { name: "Other Income",color: "#94a3b8", icon: "plus-circle",  type: "income", is_tax_deductible: false },
];
