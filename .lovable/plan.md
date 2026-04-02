# Intelligent Options Orchestration

## Overview

Transform the options view from a "fetch everything" approach to an intelligent, outlook-aware system that minimizes API calls, adds a classical chain table, and introduces shared caching for scale. Please update the README to document this change, the rationale, the benefits, and generally, refresh the readme to catch up to the current elite app we're going to be at when you've done this update.   
Make the options page impressive, intuitive, and a key value driver for Traider

---

## Architecture

```text
┌──────────────────────────────────────────────────┐
│  OptionsViewNew.tsx                              │
│  ┌──────────┐  ┌──────────┐                      │
│  │Short-Term│  │Long-Term │  ← ViewOutlook toggle│
│  └──────────┘  └──────────┘                      │
│                                                  │
│  ┌─────────┐  ┌─────────┐                        │
│  │ Visual  │  │ Chain   │  ← Tab view            │
│  └─────────┘  └─────────┘                        │
│                                                  │
│  Visual: IntuitiveOptionsChart (with outlook)    │
│  Chain:  OptionsChainTable (classical book)      │
└──────────────────────────────────────────────────┘
         │
         ▼  { action: 'options_chain', outlook: 'short'|'long' }
┌──────────────────────────────────────────────────┐
│  market-data edge function                       │
│                                                  │
│  short → next 3-5 Fridays, ±5% strikes          │
│  long  → quarterly (1st Fri), ±15% strikes      │
│                                                  │
│  Shared DB cache (options_chain_cache table)     │
│  - read-through: serve if < 5min old            │
│  - stale-while-revalidate: serve + bg refresh   │
│  Batch: max 2 concurrent, 1s delay              │
└──────────────────────────────────────────────────┘
```

---

## Plan

### 1. Backend: Outlook-Aware Fetching (market-data edge function)

Accept new `outlook` parameter (`'short'` default, `'long'`).

**Short-Term mode:**

- Compute next 3-5 Fridays from today (weekly expiries)
- Strike range: `±5%` of spot price
- Max ~5 API calls

**Long-Term mode:**

- Find first Friday of each quarter: ~3mo, 6mo, 9mo, 12mo, 18mo, 24mo out
- Skip all weeklies
- Strike range: `±15%` of spot price
- Max ~6 API calls

**Batching:** Reduce from 3-concurrent to 2-concurrent, increase inter-batch delay from 500ms to 1000ms. This cuts total calls by ~60% vs current 9-date approach.

### 2. Shared DB Cache (options_chain_cache table)

Create a new table `options_chain_cache`:

- `id`, `cache_key` (unique), `data` (jsonb), `created_at`, `updated_at`
- No RLS (edge function uses service role)
- TTL logic in edge function: fresh < 5min, stale < 15min

**Read-through pattern:**

1. Check DB cache by key (`{symbol}:{outlook}:{strike_range}`)
2. If fresh → return immediately
3. If stale → return immediately + trigger background Alpaca fetch + update cache
4. If miss → fetch from Alpaca, store, return

### 3. Pre-warming CRON Job

New edge function `options-prewarm`:

- Runs every 15 minutes via `pg_cron`
- Fetches short-term chains for top 10 tickers (SPY, QQQ, AAPL, TSLA, NVDA, MSFT, AMZN, META, AMD, GOOGL)
- Populates the shared cache so most common requests are instant

### 4. Frontend: Outlook Toggle (OptionsViewNew.tsx)

Add a `ViewOutlook` state: `'short'` | `'long'` with a toggle button group at the top.

**Short-Term (default):**

- Chart X-axis: 30 days ahead
- Chart Y-axis (price buffer): ±5%
- Pass `outlook: 'short'` to edge function

**Long-Term:**

- Chart X-axis: 730 days (2 years)
- Chart Y-axis (price buffer): ±15-20%
- Pass `outlook: 'long'` to edge function

Pass `outlook` to `IntuitiveOptionsChart` as a prop to adjust `daysAhead` and `priceBuffer`.

### 5. Frontend: Tabbed View — Visual + Chain

Add two tabs in `OptionsViewNew.tsx`: **Visual** (current chart) and **Chain** (new table).

**Chain tab** → new `OptionsChainTable.tsx`:

- Parse all OCC symbols from `optionsChainCache` into rows
- Group by expiry date, split calls/puts side-by-side
- Columns: Strike, Bid, Ask, Last, Vol, OI, IV, Delta
- Highlight ATM row, color ITM/OTM
- Click row → selects contract (same as chart click)

### 6. Chart: Clutter Guard & Real Data Tooltips

**X-Axis:** Use `outlook` to set tick count (short: 5 ticks, long: 6-8 ticks for quarterly markers).

**Y-Axis:** If strikes are < $5 apart, only render labels at $5 or $10 intervals. Show finer labels only when price range is narrow.

**Hover tooltips:** When hovering in future area, snap to nearest real contract from `optionsChainCache` instead of computing Black-Scholes locally. Show actual bid/ask from cache.

### 7. Editable Trade Controls (SelectedContractCard.tsx)

Add to the contract card:

- **Quantity** input (number, default 1, min 1, max 100)
- **Order Type** toggle: Market / Limit
- **Limit Price** input (pre-filled with ask, editable when Limit selected)
- Dynamic total: `premium × qty × 100`
- Pass `{ qty, orderType, limitPrice }` to `handleTrade`

---

## Files


| File                                                       | Action  | Summary                                                                                                          |
| ---------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/market-data/index.ts`                  | Modify  | Add `outlook` param, leaping logic, DB cache read-through, reduce batch concurrency                              |
| `supabase/functions/options-prewarm/index.ts`              | **New** | CRON function to pre-warm top 10 tickers every 15min                                                             |
| DB migration                                               | **New** | Create `options_chain_cache` table + pg_cron schedule                                                            |
| `src/components/trading/options/OptionsViewNew.tsx`        | Modify  | Add outlook toggle, tab view (Visual/Chain), pass outlook to fetch + chart                                       |
| `src/components/trading/options/IntuitiveOptionsChart.tsx` | Modify  | Accept outlook prop, dynamic daysAhead/priceBuffer, snap hover to real chain data, clutter guard for axis labels |
| `src/components/trading/options/OptionsChainTable.tsx`     | **New** | Classical options book table component                                                                           |
| `src/components/trading/options/SelectedContractCard.tsx`  | Modify  | Add qty, order type, limit price inputs                                                                          |
