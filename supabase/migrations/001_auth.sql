-- profiles: one row per auth.users row
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on profiles(username);

alter table profiles enable row level security;
create policy "profiles_all" on profiles for all using (true) with check (true);

-- user_settings: theme, base currency, foreign currencies, month start day
create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  theme text not null default 'emerald',
  base_currency text not null default 'MYR',
  foreign_currencies_json jsonb not null default '["USD"]',
  month_start_day int not null default 1,
  ai_summary_cache text,
  ai_summary_cached_at timestamptz,
  created_at timestamptz not null default now()
);

alter table user_settings enable row level security;
create policy "user_settings_all" on user_settings for all using (true) with check (true);

-- auto-create user_settings row on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  insert into user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
