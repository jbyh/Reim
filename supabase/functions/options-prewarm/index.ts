import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOP_TICKERS = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'AMD', 'GOOGL'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const ALPACA_API_KEY = Deno.env.get('ALPACA_API_KEY')?.trim();
  const ALPACA_API_SECRET = Deno.env.get('ALPACA_API_SECRET')?.trim();

  if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
    return new Response(JSON.stringify({ error: 'No Alpaca credentials configured for prewarm' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const alpacaHeaders = {
    'APCA-API-KEY-ID': ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
    'Accept': 'application/json',
  };

  // Compute next 5 Fridays
  const today = new Date();
  const fridays: string[] = [];
  let d = new Date(today);
  while (fridays.length < 5) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 5) {
      fridays.push(d.toISOString().split('T')[0]);
    }
  }

  const results: string[] = [];

  for (const ticker of TOP_TICKERS) {
    try {
      // Get spot price first
      const snapRes = await fetch(
        `https://data.alpaca.markets/v2/stocks/snapshots?symbols=${ticker}&feed=iex`,
        { headers: alpacaHeaders }
      );
      if (!snapRes.ok) continue;
      const snapData = await snapRes.json();
      const snap = snapData?.[ticker];
      const spotPrice = snap?.latestTrade?.p || snap?.latestQuote?.ap || 0;
      if (spotPrice <= 0) continue;

      const strikeLower = Math.floor(spotPrice * 0.95);
      const strikeUpper = Math.ceil(spotPrice * 1.05);
      const allContracts: Record<string, any> = {};

      // Fetch each expiry (sequential to avoid rate limits)
      for (const expiry of fridays) {
        const url = new URL(`https://data.alpaca.markets/v1beta1/options/snapshots/${ticker}`);
        url.searchParams.set('feed', 'indicative');
        url.searchParams.set('limit', '50');
        url.searchParams.set('expiration_date', expiry);
        url.searchParams.set('strike_price_gte', String(strikeLower));
        url.searchParams.set('strike_price_lte', String(strikeUpper));

        try {
          const res = await fetch(url.toString(), { headers: alpacaHeaders });
          if (res.ok) {
            const data = await res.json();
            const snapshots = data.snapshots || {};
            for (const [occ, s] of Object.entries(snapshots)) {
              const sn = s as any;
              const quote = sn.latestQuote || {};
              const trade = sn.latestTrade || {};
              const greeks = sn.greeks || {};
              allContracts[occ] = {
                symbol: occ,
                bid: quote.bp || 0,
                ask: quote.ap || 0,
                lastPrice: trade.p || 0,
                volume: trade.s || 0,
                openInterest: sn.openInterest || 0,
                impliedVolatility: sn.impliedVolatility || greeks.iv || 0,
                greeks: {
                  delta: greeks.delta || 0,
                  gamma: greeks.gamma || 0,
                  theta: greeks.theta || 0,
                  vega: greeks.vega || 0,
                },
              };
            }
          }
        } catch (_) {
          // skip this expiry
        }

        // Rate limit delay
        await new Promise(r => setTimeout(r, 1000));
      }

      // Store in DB cache
      const cacheKey = `${ticker}:short:${strikeLower}:${strikeUpper}`;
      if (Object.keys(allContracts).length > 0) {
        await supabase
          .from('options_chain_cache')
          .upsert({
            cache_key: cacheKey,
            data: allContracts,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'cache_key' });
        results.push(`${ticker}: ${Object.keys(allContracts).length} contracts`);
      }

      // Delay between tickers
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.warn(`Prewarm failed for ${ticker}:`, err);
    }
  }

  console.log('Prewarm complete:', results);
  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
