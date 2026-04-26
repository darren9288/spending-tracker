import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Wallet = {
  id: string;
  name: string;
  color: string;
  icon: string;
  balance: number;
  currency: string;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category_id: string | null;
  wallet_id: string;
  raw_input: string | null;
  created_at: string;
  category?: Category;
  wallet?: Wallet;
};
