
# Options Tab: Real Data Integration with Alpaca

## Current Problems

1. **Mock price history** -- `generatePriceHistory()` creates random walk data instead of fetching real historical bars
2. **Black-Scholes calculated premiums** -- When a user clicks the chart, the contract premium/bid/ask are computed locally using a textbook formula instead of fetching real option chain data from Alpaca
3. **Random open interest** -- `Math.floor(Math.random() * 10000) + 500`
4. **Trade button is a toast** -- Clicking "Buy CALL/PUT Option" just shows a toast notification; it never submits an order to Alpaca
5. **Mock fallback** -- When the quote API fails, the code falls back to `100 + Math.random() * 400` instead of using the Yahoo Finance fallback already available in the edge function

## Solution

### 1. New Edge Function Actions (market-data/index.ts)

Add three new action handlers to the existing edge function:

**`options_chain`** -- Fetches real option chain data from Alpaca
- Endpoint: `GET https://data.alpaca.markets/v1beta1/options/snapshots/{underlying_symbol}`
- Query params: `feed=indicative`, optional `expiration_date`, `type` (call/put)
- Returns: Real bid/ask, premium (mid-price), greeks (delta, gamma, theta, vega), IV, open interest for each contract
- Caches for 30 seconds like other data

**`options_contracts`** -- Looks up available contracts for a symbol
- Endpoint: `GET {TRADING_URL}/v2/options/contracts?underlying_symbols={symbol}&status=active&expiration_date_gte={today}&limit=100`
- Returns: List of available contract symbols, strikes, expiry dates

**`submit_options_order`** -- Submits a real options order via Alpaca's Orders API
- Same `POST /v2/orders` endpoint used for stocks, but with the OCC option symbol (e.g., `AAPL240119C00190000`)
- Payload: `{ symbol, qty, side: "buy", type: "limit", limit_price, time_in_force: "day" }`

### 2. Real Price History (OptionsViewNew.tsx)

Replace `generatePriceHistory()` with a call to the existing `bars` action:
```text
body: { action: 'bars', symbol, timeframe: '1Day', start: '30 days ago ISO' }
```
This already works in the edge function -- just needs to be called from the options view.

### 3. Real Options Chain on Click (IntuitiveOptionsChart.tsx + OptionsViewNew.tsx)

When a user clicks the chart:
1. The chart still calculates the approximate strike/expiry from the click position (this UX stays the same)
2. OptionsViewNew calls the new `options_chain` action to fetch the nearest matching real contract
3. The `GeneratedContract` interface gets new fields: `greeks`, `impliedVolatility`, `volume`, `realSymbol` (the actual OCC symbol)
4. The selected contract card shows real premium, real bid/ask, real greeks

Flow:
```text
User clicks chart position
  -> Chart computes approximate strike + expiry
  -> OptionsViewNew fetches options_chain for that symbol
  -> Finds nearest contract to clicked strike/expiry
  -> Populates SelectedContractCard with real data
```

### 4. Real Order Submission (SelectedContractCard.tsx + OptionsViewNew.tsx)

Replace the toast-only `handleTrade` with:
1. Call `market-data` edge function with `action: 'submit_options_order'`
2. Pass the real OCC symbol, qty=1, side="buy", type="limit", limit_price=ask
3. Show success/error toast with the actual Alpaca order ID and status
4. If user has no Alpaca keys, show a prompt to connect in Settings

### 5. Remove All Mock/Random Fallbacks

- Remove `generatePriceHistory` function entirely
- Remove random price fallbacks (`100 + Math.random() * 400`)
- Use the Yahoo Finance fallback (already in edge function) for underlying price when no Alpaca keys
- For options chain data specifically: if no Alpaca keys, show a message "Connect your brokerage in Settings to view live options data"

### 6. Enhanced SelectedContractCard

Add real data fields to the contract card:
- Greeks row: Delta, Gamma, Theta, Vega
- Implied Volatility
- Volume and Open Interest (real numbers)
- Bid/Ask spread indicator

---

## Technical Details

### Modified: `supabase/functions/market-data/index.ts`

Add after the `orders` action block:

```typescript
// Fetch options chain
if (action === 'options_chain') {
  if (!alpacaHeaders) throw new Error('Alpaca credentials required for options data');
  const underlying = body.underlying_symbol;
  // GET /v1beta1/options/snapshots/{underlying}
  // Query params: feed, expiration_date, type, strike_price, limit
  // Returns snapshots with greeks, quotes, trades per contract
}

// Submit options order  
if (action === 'submit_options_order') {
  if (!alpacaHeaders) throw new Error('Alpaca credentials required');
  // POST /v2/orders with OCC symbol
  // { symbol: "SPY260220C00700000", qty: "1", side: "buy", type: "limit", ... }
}
```

### Modified: `src/components/trading/options/IntuitiveOptionsChart.tsx`

- `GeneratedContract` interface expanded with optional real data fields:
  - `realSymbol?: string` (OCC symbol like SPY260220C00700000)
  - `greeks?: { delta, gamma, theta, vega }`
  - `impliedVolatility?: number`
  - `volume?: number`
  - `realPremium?: number` (from Alpaca vs calculated)

### Modified: `src/components/trading/options/OptionsViewNew.tsx`

- Replace `generatePriceHistory` with real `bars` API call
- Add `fetchOptionsChain` function that calls `options_chain` action
- On contract select: enrich with real chain data from nearest matching contract
- `handleTrade` submits real order via `submit_options_order`
- Remove all random/mock fallbacks
- Add state for options chain cache

### Modified: `src/components/trading/options/SelectedContractCard.tsx`

- Display greeks (delta/gamma/theta/vega) when available
- Show real volume and open interest
- Show implied volatility
- Indicate "Live" vs "Estimated" premium
- Trade button calls real order submission

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `supabase/functions/market-data/index.ts` | Modify | Add `options_chain`, `submit_options_order` actions |
| `src/components/trading/options/IntuitiveOptionsChart.tsx` | Modify | Expand `GeneratedContract` interface with real data fields |
| `src/components/trading/options/OptionsViewNew.tsx` | Modify | Real bars, real chain fetch, real order submission, remove all mocks |
| `src/components/trading/options/SelectedContractCard.tsx` | Modify | Display greeks, real volume/OI, IV, live order button |
