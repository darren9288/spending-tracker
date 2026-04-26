# SpendTrack — Setup Guide

## 1. Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor** and run the contents of `supabase/migrations/001_init.sql`
3. Go to **Settings → API** → copy your **Project URL** and **anon public** key

## 2. Set environment variables

Copy `.env.local.example` to `.env.local` and fill in your keys:

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## 4. Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add the 3 environment variables in Vercel's dashboard
4. Deploy — you'll get a URL like `https://spendtrack-xxx.vercel.app`

## 5. Use on your phone

1. Open the Vercel URL on your phone browser
2. Tap **Share → Add to Home Screen** (Safari) or the install prompt (Chrome)
3. SpendTrack appears as an app on your home screen!

## How to log expenses

In the **Add** tab, type naturally:

```
24/4
Lunch - 12.4
Dinner - 29 (Maybank)
Grab to office - 8.50 (Touch n Go)
```

- AI will auto-detect date, description, amount, and category
- Add wallet name in brackets `(Maybank)` to pre-select it
- Review and edit before confirming
