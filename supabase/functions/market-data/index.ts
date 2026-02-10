import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { decryptApiKey } from "../_shared/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALPACA_DATA_URL = 'https://data.alpaca.markets/v2';
const ALPACA_CRYPTO_URL = 'https://data.alpaca.markets/v1beta3/crypto/us';

// Simple in-memory cache to reduce API calls and prevent rate limiting
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL_MS = 30000; // 30 second cache to prevent rate limiting
const STALE_TTL_MS = 300000; // 5 min stale cache for fallback on errors

// Track last request time to enforce minimum delay between API calls
let lastApiCallTime = 0;
const MIN_API_DELAY_MS = 3000; // Minimum 3 seconds between API calls

const getCached = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
};

// Return stale data (up to 5 min old) as fallback during errors
const getStaleCached = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < STALE_TTL_MS) {
    return cached.data;
  }
  return null;
};

const setCache = (key: string, data: any): void => {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.timestamp > STALE_TTL_MS) {
        cache.delete(k);
      }
    }
  }
};

// Safe fetch wrapper that catches connection errors
const safeFetch = async (url: string, options: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (err) {
    throw new Error(`CONNECTION_ERROR: ${err instanceof Error ? err.message : 'Network error'}`);
  }
};

// Helper to detect crypto symbols (e.g., BTC/USD, ETH/USD)
const isCryptoSymbol = (symbol: string): boolean => {
  return symbol.includes('/') || ['BTC', 'ETH', 'SOL', 'DOGE', 'AVAX', 'LINK', 'UNI', 'AAVE', 'LTC', 'BCH', 'XRP', 'ADA', 'DOT', 'SHIB', 'MATIC'].some(
    crypto => symbol.toUpperCase() === crypto || symbol.toUpperCase() === `${crypto}/USD`
  );
};

// Normalize crypto symbol to Alpaca format (BTC -> BTC/USD)
const normalizeCryptoSymbol = (symbol: string): string => {
  if (symbol.includes('/')) return symbol.toUpperCase();
  return `${symbol.toUpperCase()}/USD`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Cache key for the current request (used for graceful 429 handling)
  let cacheKey: string | null = null;

  try {

    // Initialize Supabase client to get user's credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let userAlpacaKey: string | null = null;
    let userAlpacaSecret: string | null = null;
    let paperTrading = true;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Retry auth lookup up to 2 times (connection resets are transient)
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data: { user } } = await supabase.auth.getUser(token);
          
          if (user) {
            userId = user.id;
            
            // Fetch user's encrypted Alpaca credentials from their profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('alpaca_api_key_encrypted, alpaca_secret_key_encrypted, alpaca_paper_trading')
              .eq('user_id', user.id)
              .single();
            
            if (profile?.alpaca_api_key_encrypted && profile?.alpaca_secret_key_encrypted) {
              // Decrypt the keys
              userAlpacaKey = await decryptApiKey(profile.alpaca_api_key_encrypted, user.id);
              userAlpacaSecret = await decryptApiKey(profile.alpaca_secret_key_encrypted, user.id);
              paperTrading = profile.alpaca_paper_trading ?? true;
            }
          }
          break; // Success, exit retry loop
        } catch (authErr) {
          console.error(`Auth attempt ${attempt + 1} failed:`, authErr);
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
          }
        }
      }
    }

    // Fallback to environment variables if no user credentials
    const ALPACA_API_KEY = userAlpacaKey || Deno.env.get('ALPACA_API_KEY')?.trim();
    const ALPACA_API_SECRET = userAlpacaSecret || Deno.env.get('ALPACA_API_SECRET')?.trim();

    // Set trading URL based on paper/live mode
    const ALPACA_TRADING_URL = paperTrading 
      ? 'https://paper-api.alpaca.markets/v2'
      : 'https://api.alpaca.markets/v2';

    const hasAlpacaCredentials = !!(ALPACA_API_KEY && ALPACA_API_SECRET);

    if (!hasAlpacaCredentials && action && ['account', 'positions', 'activities', 'submit_order', 'orders'].includes(action)) {
      throw new Error('Alpaca API credentials not configured. Please add your API keys in Settings to trade.');
    }

    // Guard against accidentally pasting labels like "ALPACA_API_KEY=..."
    if (hasAlpacaCredentials && (ALPACA_API_KEY!.includes('=') || ALPACA_API_SECRET!.includes('='))) {
      throw new Error('Alpaca API credentials look malformed (remove any KEY= / SECRET= prefix).');
    }

    const alpacaHeaders = hasAlpacaCredentials ? {
      'APCA-API-KEY-ID': ALPACA_API_KEY!,
      'APCA-API-SECRET-KEY': ALPACA_API_SECRET!,
      'Accept': 'application/json',
    } : null;

    const body = await req.json();
    const { action, symbols, symbol, timeframe, start, end } = body;

    // --- Free fallback: Yahoo Finance for quotes when no Alpaca creds ---
    async function fetchYahooQuotes(syms: string[]): Promise<Record<string, any>> {
      const results: Record<string, any> = {};
      try {
        const symbolsParam = syms.join(',');
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,bid,ask,bidSize,askSize`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (res.ok) {
          const json = await res.json();
          const quotes = json?.quoteResponse?.result || [];
          for (const q of quotes) {
            results[q.symbol] = {
              symbol: q.symbol,
              lastPrice: q.regularMarketPrice || 0,
              bidPrice: q.bid || 0,
              askPrice: q.ask || 0,
              bidSize: q.bidSize || 0,
              askSize: q.askSize || 0,
              lastSize: 0,
              change: q.regularMarketChange || 0,
              changePercent: q.regularMarketChangePercent || 0,
              timestamp: new Date().toISOString(),
              assetType: q.quoteType === 'CRYPTOCURRENCY' ? 'crypto' : 'stock',
              delayed: true,
            };
          }
        }
      } catch (e) {
        console.error('Yahoo Finance fallback error:', e);
      }
      return results;
    }

    // Actions that require Alpaca credentials
    if (action === 'account') {
      if (!alpacaHeaders) throw new Error('Alpaca credentials required');
      cacheKey = 'account';
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(JSON.stringify({ data: cached, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const response = await safeFetch(`${ALPACA_TRADING_URL}/account`, { headers: alpacaHeaders });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca account error:', response.status, errorText);
        throw new Error(`Alpaca API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setCache(cacheKey, data);
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'positions') {
      if (!alpacaHeaders) throw new Error('Alpaca credentials required');
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(JSON.stringify({ data: cached, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const response = await safeFetch(`${ALPACA_TRADING_URL}/positions`, { headers: alpacaHeaders });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca positions error:', response.status, errorText);
        throw new Error(`Alpaca API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setCache(cacheKey, data);
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'activities') {
      cacheKey = 'activities';
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(JSON.stringify({ data: cached, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const url = new URL(`${ALPACA_TRADING_URL}/account/activities`);
      url.searchParams.set('direction', 'desc');
      url.searchParams.set('page_size', '100');
      const response = await safeFetch(url.toString(), { headers: alpacaHeaders });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca activities error:', response.status, errorText);
        throw new Error(`Alpaca API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setCache(cacheKey, data);
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Submit order to Alpaca
    if (action === 'submit_order') {
      const { orderSymbol, qty, side, type, limitPrice, stopLoss, takeProfit } = body;
      
      if (!orderSymbol || !qty || !side) {
        throw new Error('Missing required order parameters: symbol, qty, side');
      }

      const isCrypto = isCryptoSymbol(orderSymbol);

      const orderPayload: Record<string, any> = {
        symbol: orderSymbol,
        qty: String(qty),
        side: side,
        type: type || 'market',
        // Crypto trades 24/7 so use 'gtc', stocks use 'day'
        time_in_force: isCrypto ? 'gtc' : 'day',
      };

      // Add limit price for limit orders
      if (type === 'limit' && limitPrice) {
        orderPayload.limit_price = String(limitPrice);
      }

      // Create order with optional bracket (stop loss / take profit) - only for stocks
      if (!isCrypto && (stopLoss || takeProfit)) {
        orderPayload.order_class = 'bracket';
        if (stopLoss) {
          orderPayload.stop_loss = { stop_price: String(stopLoss) };
        }
        if (takeProfit) {
          orderPayload.take_profit = { limit_price: String(takeProfit) };
        }
      }

      console.log('Submitting order to Alpaca:', orderPayload);
      console.log('Using trading URL:', ALPACA_TRADING_URL);

      const response = await safeFetch(`${ALPACA_TRADING_URL}/orders`, {
        method: 'POST',
        headers: {
          ...alpacaHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca order error:', response.status, errorText);
        throw new Error(`Order failed: ${errorText}`);
      }

      const data = await response.json();
      console.log('Order submitted successfully:', data.id, 'Status:', data.status);
      
      return new Response(JSON.stringify({ data, success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get orders
    if (action === 'orders') {
      cacheKey = 'orders';
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(JSON.stringify({ data: cached, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const url = new URL(`${ALPACA_TRADING_URL}/orders`);
      url.searchParams.set('status', 'all');
      url.searchParams.set('limit', '50');
      url.searchParams.set('direction', 'desc');
      const response = await safeFetch(url.toString(), { headers: alpacaHeaders });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca orders error:', response.status, errorText);
        throw new Error(`Alpaca API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setCache(cacheKey, data);
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch crypto bars
    if (action === 'crypto_bars' && symbol) {
      const cryptoSymbol = normalizeCryptoSymbol(symbol);
      const url = new URL(`${ALPACA_CRYPTO_URL}/bars`);
      url.searchParams.set('symbols', cryptoSymbol);
      url.searchParams.set('timeframe', timeframe || '1Day');
      url.searchParams.set('limit', '365');
      if (start) url.searchParams.set('start', start);
      if (end) url.searchParams.set('end', end);

      const response = await safeFetch(url.toString(), {
        headers: alpacaHeaders,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca crypto bars error:', response.status, errorText);
        throw new Error(`Alpaca API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch stock bars
    if (action === 'bars' && symbol) {
      const url = new URL(`${ALPACA_DATA_URL}/stocks/${symbol}/bars`);
      url.searchParams.set('timeframe', timeframe || '1Day');
      url.searchParams.set('limit', '365');
      if (start) url.searchParams.set('start', start);
      if (end) url.searchParams.set('end', end);

      const response = await safeFetch(url.toString(), {
        headers: alpacaHeaders,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca bars error:', response.status, errorText);
        throw new Error(`Alpaca API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: fetch quotes for symbols
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      throw new Error('Symbols array is required for quotes');
    }

    // Check cache first
    cacheKey = `quotes:${symbols.sort().join(',')}`;
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      console.log('Returning cached market data for:', symbols);
      return new Response(JSON.stringify({ data: cachedData, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no Alpaca credentials, use Yahoo Finance fallback for quotes
    if (!alpacaHeaders) {
      console.log('No Alpaca credentials, using Yahoo Finance fallback for:', symbols);
      const yahooData = await fetchYahooQuotes(symbols);
      if (Object.keys(yahooData).length > 0) {
        setCache(cacheKey, yahooData);
      }
      return new Response(JSON.stringify({ data: yahooData, delayed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit protection - wait if needed to prevent 429 errors
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    if (timeSinceLastCall < MIN_API_DELAY_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_API_DELAY_MS - timeSinceLastCall));
    }
    lastApiCallTime = Date.now();

    // Separate stocks and crypto
    const stockSymbols = symbols.filter(s => !isCryptoSymbol(s));
    const cryptoSymbols = symbols.filter(s => isCryptoSymbol(s)).map(normalizeCryptoSymbol);

    const marketData: Record<string, any> = {};

    // Fetch stock data (use snapshots to reduce API calls: 1 request vs 3)
    if (stockSymbols.length > 0) {
      const symbolsParam = stockSymbols.join(',');

      const snapshotsResponse = await safeFetch(
        `${ALPACA_DATA_URL}/stocks/snapshots?symbols=${symbolsParam}`,
        { headers: alpacaHeaders }
      );

      if (!snapshotsResponse.ok) {
        const errorText = await snapshotsResponse.text();
        console.error('Alpaca snapshots error:', snapshotsResponse.status, errorText);
        throw new Error(`Alpaca API error: ${snapshotsResponse.status}`);
      }

      const snapshotsData = await snapshotsResponse.json();

      // Combine data for each stock symbol
      for (const sym of stockSymbols) {
        const snap = snapshotsData?.snapshots?.[sym];
        const latestTrade = snap?.latestTrade;
        const latestQuote = snap?.latestQuote;
        const prevDailyBar = snap?.prevDailyBar;

        const lastPrice = latestTrade?.p || latestQuote?.ap || 0;
        const prevClose = prevDailyBar?.c || lastPrice;
        const change = lastPrice - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        marketData[sym] = {
          symbol: sym,
          lastPrice,
          bidPrice: latestQuote?.bp || 0,
          askPrice: latestQuote?.ap || 0,
          bidSize: latestQuote?.bs || 0,
          askSize: latestQuote?.as || 0,
          lastSize: latestTrade?.s || 0,
          change,
          changePercent,
          timestamp: latestTrade?.t || latestQuote?.t || new Date().toISOString(),
          assetType: 'stock',
        };
      }
    }

    // Fetch crypto data
    if (cryptoSymbols.length > 0) {
      const cryptoSymbolsParam = cryptoSymbols.join(',');
      
      // Fetch latest crypto trades
      const cryptoTradesResponse = await safeFetch(
        `${ALPACA_CRYPTO_URL}/latest/trades?symbols=${cryptoSymbolsParam}`,
        { headers: alpacaHeaders }
      );

      // Fetch latest crypto quotes
      const cryptoQuotesResponse = await safeFetch(
        `${ALPACA_CRYPTO_URL}/latest/quotes?symbols=${cryptoSymbolsParam}`,
        { headers: alpacaHeaders }
      );

      // Fetch crypto bars for change calculation
      const cryptoBarsResponse = await safeFetch(
        `${ALPACA_CRYPTO_URL}/bars?symbols=${cryptoSymbolsParam}&timeframe=1Day&limit=2`,
        { headers: alpacaHeaders }
      );

      let cryptoTradesData: { trades: Record<string, { p: number; s: number; t: string }> } = { trades: {} };
      let cryptoQuotesData: { quotes: Record<string, { bp: number; ap: number; bs: number; as: number; t: string }> } = { quotes: {} };
      let cryptoBarsData: { bars: Record<string, Array<{ c: number }>> } = { bars: {} };

      if (cryptoTradesResponse.ok) {
        cryptoTradesData = await cryptoTradesResponse.json();
      }
      if (cryptoQuotesResponse.ok) {
        cryptoQuotesData = await cryptoQuotesResponse.json();
      }
      if (cryptoBarsResponse.ok) {
        cryptoBarsData = await cryptoBarsResponse.json();
      }

      // Combine data for each crypto symbol
      for (const cryptoSym of cryptoSymbols) {
        const trade = cryptoTradesData.trades?.[cryptoSym];
        const quote = cryptoQuotesData.quotes?.[cryptoSym];
        const bars = cryptoBarsData.bars?.[cryptoSym] || [];
        
        const lastPrice = trade?.p || quote?.ap || 0;
        const prevClose = bars.length >= 2 ? bars[bars.length - 2]?.c : bars[0]?.c || lastPrice;
        const change = lastPrice - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        // Store with the original format the user requested (could be BTC or BTC/USD)
        const originalSymbol = symbols.find(s => 
          normalizeCryptoSymbol(s) === cryptoSym
        ) || cryptoSym;

        marketData[originalSymbol] = {
          symbol: originalSymbol,
          lastPrice: lastPrice,
          bidPrice: quote?.bp || 0,
          askPrice: quote?.ap || 0,
          bidSize: quote?.bs || 0,
          askSize: quote?.as || 0,
          lastSize: trade?.s || 0,
          change: change,
          changePercent: changePercent,
          timestamp: trade?.t || quote?.t || new Date().toISOString(),
          assetType: 'crypto',
        };
      }
    }

    console.log('Market data fetched for:', symbols);
    
    // Cache the result
    setCache(cacheKey, marketData);

    return new Response(JSON.stringify({ data: marketData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const isUnauthorized = msg.includes('401') || msg.includes('Authorization');
    const isRateLimited = msg.includes('429') || msg.toLowerCase().includes('too many requests');
    const isConnectionError = msg.includes('CONNECTION_ERROR') || msg.includes('connection closed');

    console.error('Market data error:', msg);

    // For rate limits or connection errors, return stale cached data to prevent blank screen
    if ((isRateLimited || isConnectionError) && cacheKey) {
      const stale = getStaleCached(cacheKey);
      if (stale) {
        return new Response(
          JSON.stringify({
            data: stale,
            rateLimited: isRateLimited,
            stale: true,
            error: isRateLimited
              ? 'Rate limited by data provider. Showing last known data.'
              : 'Connection issue. Showing last known data.',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // For rate limits without cache, still return 200 with empty data to prevent blank screen
    if (isRateLimited || isConnectionError) {
      return new Response(
        JSON.stringify({
          data: {},
          rateLimited: isRateLimited,
          error: 'Temporarily unable to fetch data. Will retry shortly.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: msg,
        hint: isUnauthorized
          ? 'Unauthorized from Alpaca. Please check your API keys in Settings and make sure they match your paper/live account.'
          : undefined,
      }),
      {
        status: isUnauthorized ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
