# Portfolio Briefing Bot

A personal, single-user stock-portfolio tracker. Add tickers (with optional shares + cost basis) in a Next.js web UI; every morning at 8:30 AM Montréal time a Telegram bot sends you a concise briefing per holding: latest news, current price, unrealized gain, and a qualitative outlook. Free to run indefinitely.

## Stack

- **Next.js 15** (App Router, TypeScript) — UI + API routes
- **Neon Postgres** (free tier) — database
- **`postgres`** npm package — raw SQL, no ORM
- **`yahoo-finance2`** — current price + day's change (free, no API key)
- **Gemini 2.0 Flash with Google Search Grounding** — news summary per ticker (free, Google AI Studio)
- **Telegram Bot API** — delivery
- **Netlify** — hosting + scheduled functions
- **Tailwind + shadcn/ui** — styling
- **Optional single-password cookie auth** — empty `APP_PASSWORD` = open

## Pre-build setup (~10 min)

### 1. Neon database
- Sign up at [neon.tech](https://neon.tech)
- Create a project; copy the **pooled** connection string (host contains `-pooler`)
- SQL Editor → paste contents of [`database_schema.sql`](./database_schema.sql) → Run

### 2. Telegram bot
- Reuse `@JHbirthdayBot` if you already have one for BirthdayBot. Otherwise, message `@BotFather` → `/newbot`, save the token, send your bot any message, visit `https://api.telegram.org/bot<TOKEN>/getUpdates` to find your `chat_id`.

### 3. Gemini API key
- Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Click **Create API key** → copy it. Free tier is 1500 requests/day, way more than this app needs.

### 4. Pick secrets
- `APP_PASSWORD` — leave empty for open mode, set any value to require login at `/login`

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill in DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GEMINI_API_KEY
npm run seed       # inserts NVDA, AAPL, VOO as demo holdings
npm run dev        # → http://localhost:3000
```

Visit http://localhost:3000 → see the holdings table → add/edit/delete via the UI.

Visit http://localhost:3000/api/cron/test → triggers the full briefing pipeline and sends the message to Telegram. The result also lands in `/logs`.

## Deploy to Netlify

1. Push to GitHub
2. Netlify → **Add new site** → **Import from Git** → pick this repo
3. Build settings auto-detected from `netlify.toml` — nothing to configure
4. **Site configuration → Environment variables**: add all 5 (`DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `GEMINI_API_KEY`, `APP_PASSWORD`)
5. Trigger a deploy. First successful deploy registers the scheduled function automatically.
6. **Functions** tab → confirm `briefing-cron` shows as **Scheduled** with `30 12 * * *`

## How it works

- The scheduled function fires at 13:30 UTC daily (8:30 AM Montréal during EDT, 7:30 AM during EST).
- For each holding: fetch live price from Yahoo Finance → ask Gemini for a grounded 2-3 sentence news summary → compose one section per stock.
- All sections are combined into a single Telegram message (chunked into ~4000-char pieces if needed).
- A row is written to `briefings` on every run including no-op days, so silent failures are visible at `/logs`.
- `sendTelegramMessage`, `getQuote`, and `summarizeTicker` all return `{ok, error}` instead of throwing — the handler always returns 200.

## Briefing prompt design

The Gemini prompt explicitly asks for:
1. Material news from the past 24-48h (factual, source-grounded via Google Search)
2. Analyst commentary — citing the analyst/firm, not the AI's own opinion
3. Qualitative outlook framed as "consensus is..." — no AI-generated price predictions

The AI doesn't predict prices. Briefings are informational, not financial advice.

## Project layout

```
app/
  page.tsx                     holdings list (main UI)
  login/page.tsx + actions.ts  password login (server action; redirects home if APP_PASSWORD unset)
  logs/page.tsx                30 days of briefings
  api/holdings/route.ts        GET, POST
  api/holdings/[id]/route.ts   PATCH, DELETE
  api/cron/test/route.ts       in-app test trigger
netlify/functions/
  briefing-cron.ts             daily Telegram job (cron declared inline)
lib/
  db.ts                        postgres client (lazy, Neon-tuned)
  telegram.ts                  sendMessage helper (never throws)
  yahoo.ts                     getQuote wrapper (never throws)
  gemini.ts                    summarizeTicker with Google Search Grounding
  briefing.ts                  date math, money/pct format, message chunking
  run-briefing.ts              shared composer used by cron + test endpoint
  auth.ts + auth-constants.ts  cookie helpers (Edge-safe split)
  validate.ts                  hand-rolled validation for holding input
  notification-tags.ts         shared status-tag constants
  types.ts                     Holding row shape
  utils.ts                     shadcn cn() helper
components/ui/                 shadcn primitives
middleware.ts                  APP_PASSWORD-toggle auth wall
netlify.toml                   build + functions config
database_schema.sql            paste into Neon SQL Editor
```

## Known limitations

- **DST drift**: cron fires at 13:30 UTC — that's 8:30 AM during EDT and 7:30 AM during EST. The 1h winter offset is accepted as-is.
- **Yahoo Finance ToS**: `yahoo-finance2` is an unofficial wrapper. For personal use this is fine; if Yahoo ever changes endpoints, swap in Alpha Vantage free tier as a fallback.
- **No live price in the UI**: prices appear in the morning Telegram only. Adding a price column would require either per-render Yahoo lookups (slow, rate-limited) or caching (more complexity). Out of scope for v1.
- **Single user**: no multi-user, no portfolio sharing.

## Environment variables

| Var | What |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `TELEGRAM_BOT_TOKEN` | From `@BotFather` |
| `TELEGRAM_CHAT_ID` | From `/getUpdates` after messaging your bot |
| `GEMINI_API_KEY` | From [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `APP_PASSWORD` | Empty = open. Any value = required at `/login`. |
| `CRON_SECRET` | Reserved for future use; not currently validated |
