create extension if not exists "pgcrypto";

-- wallets
create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  currency text not null default 'MYR',
  color text not null default '#6366f1',
  icon text not null default 'wallet',
  type text not null default 'other' check (type in ('cash','debit','credit','ewallet','savings','other')),
  initial_balance numeric not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists wallets_user_idx on wallets(user_id);
alter table wallets enable row level security;
create policy "wallets_all" on wallets for all using (true) with check (true);

-- categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#94a3b8',
  icon text not null default 'tag',
  type text not null default 'expense' check (type in ('income','expense')),
  is_tax_deductible boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_idx on categories(user_id);
alter table categories enable row level security;
create policy "categories_all" on categories for all using (true) with check (true);

-- exchange_rates: user-defined currency pairs
create table if not exists exchange_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_currency text not null,
  to_currency text not null,
  rate numeric not null,
  updated_at timestamptz not null default now(),
  unique(user_id, from_currency, to_currency)
);

alter table exchange_rates enable row level security;
create policy "exchange_rates_all" on exchange_rates for all using (true) with check (true);

-- transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null default 'expense' check (type in ('income','expense','transfer')),
  category_id uuid references categories(id) on delete set null,
  wallet_id uuid not null references wallets(id) on delete cascade,
  to_wallet_id uuid references wallets(id) on delete set null,
  amount numeric not null check (amount > 0),
  currency text not null default 'MYR',
  myr_amount numeric not null,
  exchange_rate numeric not null default 1,
  notes text,
  photo_url text,
  mood text check (mood in ('essential','planned','impulse') or mood is null),
  is_tax_deductible boolean not null default false,
  recurring_template_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_idx on transactions(user_id);
create index if not exists transactions_date_idx on transactions(date desc);
create index if not exists transactions_wallet_idx on transactions(wallet_id);
create index if not exists transactions_category_idx on transactions(category_id);

alter table transactions enable row level security;
create policy "transactions_all" on transactions for all using (true) with check (true);

-- seed default categories for a given user (called after signup from app code)
-- Note: seeding happens via /api/categories/seed route on first login, not via trigger,
-- to allow per-user customisation from day one.
