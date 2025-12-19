import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALPACA_BASE_URL = 'https://data.alpaca.markets/v2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ALPACA_API_KEY = Deno.env.get('ALPACA_API_KEY');
    const ALPACA_API_SECRET = Deno.env.get('ALPACA_API_SECRET');

    if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
      throw new Error('Alpaca API credentials not configured');
    }

    const { symbols } = await req.json();
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      throw new Error('Symbols array is required');
    }

    const symbolsParam = symbols.join(',');
    
    // Fetch latest quotes (includes bid/ask)
    const quotesResponse = await fetch(
      `${ALPACA_BASE_URL}/stocks/quotes/latest?symbols=${symbolsParam}`,
      {
        headers: {
          'APCA-API-KEY-ID': ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
        },
      }
    );

    if (!quotesResponse.ok) {
      const errorText = await quotesResponse.text();
      console.error('Alpaca quotes error:', quotesResponse.status, errorText);
      throw new Error(`Alpaca API error: ${quotesResponse.status}`);
    }

    const quotesData = await quotesResponse.json();

    // Fetch latest trades (includes last trade price)
    const tradesResponse = await fetch(
      `${ALPACA_BASE_URL}/stocks/trades/latest?symbols=${symbolsParam}`,
      {
        headers: {
          'APCA-API-KEY-ID': ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
        },
      }
    );

    if (!tradesResponse.ok) {
      const errorText = await tradesResponse.text();
      console.error('Alpaca trades error:', tradesResponse.status, errorText);
      throw new Error(`Alpaca API error: ${tradesResponse.status}`);
    }

    const tradesData = await tradesResponse.json();

    // Fetch previous day bars for change calculation
    const barsResponse = await fetch(
      `${ALPACA_BASE_URL}/stocks/bars?symbols=${symbolsParam}&timeframe=1Day&limit=2`,
      {
        headers: {
          'APCA-API-KEY-ID': ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
        },
      }
    );

    let barsData: { bars: Record<string, Array<{ c: number }>> } = { bars: {} };
    if (barsResponse.ok) {
      barsData = await barsResponse.json() as { bars: Record<string, Array<{ c: number }>> };
    }

    // Combine data for each symbol
    const marketData: Record<string, any> = {};
    
    for (const symbol of symbols) {
      const quote = quotesData.quotes?.[symbol];
      const trade = tradesData.trades?.[symbol];
      const bars = barsData.bars?.[symbol] || [];
      
      const lastPrice = trade?.p || quote?.ap || 0;
      const prevClose = bars.length >= 2 ? bars[bars.length - 2]?.c : bars[0]?.c || lastPrice;
      const change = lastPrice - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      marketData[symbol] = {
        symbol,
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
    console.error('Market data error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
