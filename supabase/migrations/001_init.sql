-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Wallets
create table wallets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6366f1',
  icon text not null default 'wallet',
  balance numeric not null default 0,
  currency text not null default 'MYR',
  created_at timestamptz not null default now()
);

-- Categories (seeded with defaults)
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#94a3b8',
  icon text not null default 'tag'
);

insert into categories (name, color, icon) values
  ('Food', '#f97316', 'utensils'),
  ('Transport', '#3b82f6', 'car'),
  ('Shopping', '#a855f7', 'shopping-bag'),
  ('Entertainment', '#ec4899', 'tv'),
  ('Health', '#22c55e', 'heart'),
  ('Bills', '#eab308', 'file-text'),
  ('Other', '#94a3b8', 'tag');

-- Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null,
  amount numeric not null check (amount > 0),
  category_id uuid references categories(id) on delete set null,
  wallet_id uuid not null references wallets(id) on delete cascade,
  raw_input text,
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index transactions_date_idx on transactions (date desc);
create index transactions_wallet_idx on transactions (wallet_id);
create index transactions_category_idx on transactions (category_id);

-- RLS: disable for simplicity (enable if you add auth later)
alter table wallets enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

-- Allow all for anon key (single-user app, no auth)
create policy "allow_all_wallets" on wallets for all using (true) with check (true);
create policy "allow_all_categories" on categories for all using (true) with check (true);
create policy "allow_all_transactions" on transactions for all using (true) with check (true);
