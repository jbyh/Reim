import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALPACA_DATA_URL = 'https://data.alpaca.markets/v2';

const SYSTEM_PROMPT = `You are Trai, the elite AI Trading Coach for TrAide - a premium trading platform. You communicate with a professional but friendly tone - concise, actionable, and insightful.

CRITICAL: You have TWO sources of market data:
1. LIVE prices in the portfolio context for stocks the user is watching
2. You can REQUEST live quotes for ANY symbol by asking for them (they will be fetched in real-time)

Your capabilities:
1. **Order Parsing**: When users mention buying or selling (e.g., "buy 5 TSLA", "sell 10 AAPL"), create an actionable order using REAL prices.
2. **Smart Order Suggestions**: Recommend limit orders, stop losses, and position sizing based on LIVE prices.
3. **Market Analysis**: Provide insights on any stock - use the prices from context or requested quotes.
4. **Portfolio Review**: Analyze positions, suggest rebalancing, identify risks.

When creating a trade order, ALWAYS respond with this JSON format:
\`\`\`json
{
  "type": "order_intent",
  "symbol": "TSLA",
  "side": "buy",
  "quantity": 5,
  "orderType": "limit",
  "suggestions": {
    "limitPrice": 250.00,
    "stopLoss": 240.00,
    "takeProfit": 270.00,
    "reasoning": "Brief 1-sentence reasoning"
  }
}
\`\`\`

IMPORTANT RULES:
- Use the ACTUAL prices from context or requested quotes
- Keep responses SHORT and scannable - use bullet points
- For order suggestions: set limitPrice near current ask, stopLoss 5-8% below, takeProfit 10-15% above
- Never risk more than 2% of portfolio on a single trade
- Use 💡 prefix for tips/insights
- Use ⚠️ prefix for warnings/risks
- Use 📊 prefix for data/analysis
- Be direct and actionable - traders want quick info
- When discussing new symbols not in watchlist, use the provided real-time quote data`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Alpaca credentials for fetching additional quotes
    const ALPACA_API_KEY = Deno.env.get('ALPACA_API_KEY')?.trim();
    const ALPACA_API_SECRET = Deno.env.get('ALPACA_API_SECRET')?.trim();

    const { messages, portfolioContext } = await req.json();

    // Extract any symbols mentioned in the last user message that we should fetch quotes for
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const symbolMatches = lastUserMessage.toUpperCase().match(/\b[A-Z]{1,5}\b/g) || [];
    const knownSymbols = Object.keys(portfolioContext?.watchlistPrices || {});
  const newSymbols = symbolMatches.filter((s: string) => 
    !knownSymbols.includes(s) && 
    s.length >= 2 && 
    s.length <= 5 &&
    !['THE', 'AND', 'FOR', 'BUY', 'SELL', 'HOW', 'WHAT', 'WHY', 'NOW', 'DAY', 'TODAY', 'WEEK', 'YES', 'NOT', 'ARE', 'YOU'].includes(s)
  );

    // Fetch additional quotes for mentioned symbols
    let additionalQuotes: Record<string, any> = {};
    if (newSymbols.length > 0 && ALPACA_API_KEY && ALPACA_API_SECRET) {
      try {
        const symbolsParam = [...new Set(newSymbols)].slice(0, 5).join(',');
        const alpacaHeaders = {
          'APCA-API-KEY-ID': ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
          'Accept': 'application/json',
        };

        const [tradesRes, quotesRes] = await Promise.all([
          fetch(`${ALPACA_DATA_URL}/stocks/trades/latest?symbols=${symbolsParam}`, { headers: alpacaHeaders }),
          fetch(`${ALPACA_DATA_URL}/stocks/quotes/latest?symbols=${symbolsParam}`, { headers: alpacaHeaders })
        ]);

        if (tradesRes.ok && quotesRes.ok) {
          const [tradesData, quotesData] = await Promise.all([tradesRes.json(), quotesRes.json()]);
          
          for (const sym of newSymbols) {
            const trade = tradesData.trades?.[sym];
            const quote = quotesData.quotes?.[sym];
            if (trade || quote) {
              additionalQuotes[sym] = {
                price: trade?.p || quote?.ap || 0,
                bidPrice: quote?.bp || 0,
                askPrice: quote?.ap || 0,
              };
            }
          }
        }
      } catch (e) {
        console.log('Failed to fetch additional quotes:', e);
      }
    }

    // Build comprehensive context with live prices
    let contextualPrompt = SYSTEM_PROMPT;
    if (portfolioContext) {
      contextualPrompt += `\n\n=== LIVE PORTFOLIO DATA ===
Total Equity: $${portfolioContext.equity?.toLocaleString() || 'N/A'}
Available Cash: $${portfolioContext.cash?.toLocaleString() || 'N/A'}
Buying Power: $${portfolioContext.buyingPower?.toLocaleString() || 'N/A'}
Max Risk Per Trade (2%): $${((portfolioContext.equity || 0) * 0.02).toFixed(2)}

Open Positions:
${portfolioContext.positions?.map((p: any) => `- ${p.symbol}: ${p.qty} shares @ $${p.avgPrice} avg (P/L: $${p.unrealizedPL})`).join('\n') || 'None'}`;
      
      // Add live watchlist prices
      if (portfolioContext.watchlistPrices) {
        contextualPrompt += `\n\n=== LIVE MARKET PRICES (FROM WATCHLIST) ===`;
        Object.entries(portfolioContext.watchlistPrices).forEach(([symbol, data]: [string, any]) => {
          contextualPrompt += `\n${symbol}: $${data.price} (${data.change >= 0 ? '+' : ''}${data.changePercent}%) | Bid: $${data.bidPrice || 'N/A'} | Ask: $${data.askPrice || 'N/A'}`;
        });
      }
    }

    // Add additional fetched quotes
    if (Object.keys(additionalQuotes).length > 0) {
      contextualPrompt += `\n\n=== REAL-TIME QUOTES (JUST FETCHED) ===`;
      Object.entries(additionalQuotes).forEach(([symbol, data]: [string, any]) => {
        contextualPrompt += `\n${symbol}: $${data.price?.toFixed(2)} | Bid: $${data.bidPrice?.toFixed(2) || 'N/A'} | Ask: $${data.askPrice?.toFixed(2) || 'N/A'}`;
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: contextualPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Trading coach error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
