import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { decryptApiKey } from "../_shared/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALPACA_DATA_URL = 'https://data.alpaca.markets/v2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    }

    // Fallback to environment variables if no user credentials
    const ALPACA_API_KEY = userAlpacaKey || Deno.env.get('ALPACA_API_KEY')?.trim();
    const ALPACA_API_SECRET = userAlpacaSecret || Deno.env.get('ALPACA_API_SECRET')?.trim();

    // Set trading URL based on paper/live mode
    const ALPACA_TRADING_URL = paperTrading 
      ? 'https://paper-api.alpaca.markets/v2'
      : 'https://api.alpaca.markets/v2';

    if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
      throw new Error('Alpaca API credentials not configured. Please add your API keys in Settings.');
    }

    // Guard against accidentally pasting labels like "ALPACA_API_KEY=..."
    if (ALPACA_API_KEY.includes('=') || ALPACA_API_SECRET.includes('=')) {
      throw new Error('Alpaca API credentials look malformed (remove any KEY= / SECRET= prefix).');
    }

    const alpacaHeaders = {
      'APCA-API-KEY-ID': ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
      'Accept': 'application/json',
    };

    const body = await req.json();
    const { action, symbols, symbol, timeframe, start, end } = body;

    // Route to different handlers based on action
    if (action === 'account') {
      const response = await fetch(`${ALPACA_TRADING_URL}/account`, {
        headers: alpacaHeaders,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca account error:', response.status, errorText);
        throw new Error(`Alpaca API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'positions') {
      const response = await fetch(`${ALPACA_TRADING_URL}/positions`, {
        headers: alpacaHeaders,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca positions error:', response.status, errorText);
        throw new Error(`Alpaca API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'activities') {
      const url = new URL(`${ALPACA_TRADING_URL}/account/activities`);
      url.searchParams.set('direction', 'desc');
      url.searchParams.set('page_size', '100');
      
      const response = await fetch(url.toString(), {
        headers: alpacaHeaders,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca activities error:', response.status, errorText);
        throw new Error(`Alpaca API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
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

      const orderPayload: Record<string, any> = {
        symbol: orderSymbol,
        qty: String(qty),
        side: side,
        type: type || 'market',
        time_in_force: 'day',
      };

      // Add limit price for limit orders
      if (type === 'limit' && limitPrice) {
        orderPayload.limit_price = String(limitPrice);
      }

      // Create order with optional bracket (stop loss / take profit)
      if (stopLoss || takeProfit) {
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

      const response = await fetch(`${ALPACA_TRADING_URL}/orders`, {
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
      const url = new URL(`${ALPACA_TRADING_URL}/orders`);
      url.searchParams.set('status', 'all');
      url.searchParams.set('limit', '50');
      url.searchParams.set('direction', 'desc');
      
      const response = await fetch(url.toString(), {
        headers: alpacaHeaders,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpaca orders error:', response.status, errorText);
        throw new Error(`Alpaca API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'bars' && symbol) {
      const url = new URL(`${ALPACA_DATA_URL}/stocks/${symbol}/bars`);
      url.searchParams.set('timeframe', timeframe || '1Day');
      url.searchParams.set('limit', '365');
      if (start) url.searchParams.set('start', start);
      if (end) url.searchParams.set('end', end);

      const response = await fetch(url.toString(), {
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

    const symbolsParam = symbols.join(',');
    
    // Fetch latest quotes (includes bid/ask)
    const quotesResponse = await fetch(
      `${ALPACA_DATA_URL}/stocks/quotes/latest?symbols=${symbolsParam}`,
      { headers: alpacaHeaders }
    );

    if (!quotesResponse.ok) {
      const errorText = await quotesResponse.text();
      console.error('Alpaca quotes error:', quotesResponse.status, errorText);
      throw new Error(`Alpaca API error: ${quotesResponse.status}`);
    }

    const quotesData = await quotesResponse.json();

    // Fetch latest trades (includes last trade price)
    const tradesResponse = await fetch(
      `${ALPACA_DATA_URL}/stocks/trades/latest?symbols=${symbolsParam}`,
      { headers: alpacaHeaders }
    );

    if (!tradesResponse.ok) {
      const errorText = await tradesResponse.text();
      console.error('Alpaca trades error:', tradesResponse.status, errorText);
      throw new Error(`Alpaca API error: ${tradesResponse.status}`);
    }

    const tradesData = await tradesResponse.json();

    // Fetch previous day bars for change calculation
    const barsResponse = await fetch(
      `${ALPACA_DATA_URL}/stocks/bars?symbols=${symbolsParam}&timeframe=1Day&limit=2`,
      { headers: alpacaHeaders }
    );

    let barsData: { bars: Record<string, Array<{ c: number }>> } = { bars: {} };
    if (barsResponse.ok) {
      barsData = await barsResponse.json() as { bars: Record<string, Array<{ c: number }>> };
    }

    // Combine data for each symbol
    const marketData: Record<string, any> = {};
    
    for (const sym of symbols) {
      const quote = quotesData.quotes?.[sym];
      const trade = tradesData.trades?.[sym];
      const bars = barsData.bars?.[sym] || [];
      
      const lastPrice = trade?.p || quote?.ap || 0;
      const prevClose = bars.length >= 2 ? bars[bars.length - 2]?.c : bars[0]?.c || lastPrice;
      const change = lastPrice - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      marketData[sym] = {
        symbol: sym,
        lastPrice: lastPrice,
        bidPrice: quote?.bp || 0,
        askPrice: quote?.ap || 0,
        bidSize: quote?.bs || 0,
        askSize: quote?.as || 0,
        lastSize: trade?.s || 0,
        change: change,
        changePercent: changePercent,
        timestamp: trade?.t || quote?.t || new Date().toISOString(),
      };
    }

    console.log('Market data fetched for:', symbols);

    return new Response(JSON.stringify({ data: marketData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';

    // Alpaca uses 401 for invalid/expired keys or wrong environment (paper vs live)
    const isUnauthorized = msg.includes('401') || msg.includes('Authorization');

    console.error('Market data error:', error);

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
