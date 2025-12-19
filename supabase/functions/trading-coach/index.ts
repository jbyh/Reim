import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an elite AI Trading Coach with expertise in market analysis, risk management, and trading strategies. You communicate with a professional but friendly tone - concise and actionable.

CRITICAL: You have access to LIVE market prices provided in the portfolio context. ALWAYS use these real prices when discussing stocks or creating orders. Never say you don't have access to prices - you DO.

Your capabilities:
1. **Order Parsing**: When users mention buying or selling (e.g., "buy 5 TSLA", "sell 10 AAPL"), create an actionable order using REAL prices.
2. **Smart Order Suggestions**: Recommend limit orders, stop losses, and position sizing based on the LIVE prices provided.
3. **Market Analysis**: Provide insights on stocks using the real-time data you have.

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
- Use the ACTUAL prices from watchlistPrices in your context
- Keep responses SHORT and scannable - use bullet points
- For order suggestions: set limitPrice near current ask, stopLoss 5-8% below, takeProfit 10-15% above
- Never risk more than 2% of portfolio on a single trade
- Use 💡 prefix for tips/insights
- Use ⚠️ prefix for warnings/risks
- Be direct and actionable - traders want quick info`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { messages, portfolioContext } = await req.json();

    // Build comprehensive context with live prices
    let contextualPrompt = SYSTEM_PROMPT;
    if (portfolioContext) {
      contextualPrompt += `\n\n=== LIVE PORTFOLIO DATA ===
Total Equity: $${portfolioContext.equity?.toLocaleString() || 'N/A'}
Available Cash: $${portfolioContext.cash?.toLocaleString() || 'N/A'}
Max Risk Per Trade (2%): $${((portfolioContext.equity || 0) * 0.02).toFixed(2)}

Open Positions:
${portfolioContext.positions?.map((p: any) => `- ${p.symbol}: ${p.qty} shares @ $${p.avgPrice} avg (P/L: $${p.unrealizedPL})`).join('\n') || 'None'}`;
      
      // Add live watchlist prices
      if (portfolioContext.watchlistPrices) {
        contextualPrompt += `\n\n=== LIVE MARKET PRICES (USE THESE!) ===`;
        Object.entries(portfolioContext.watchlistPrices).forEach(([symbol, data]: [string, any]) => {
          contextualPrompt += `\n${symbol}: $${data.price} (${data.change >= 0 ? '+' : ''}${data.changePercent}%) | Bid: $${data.bidPrice || 'N/A'} | Ask: $${data.askPrice || 'N/A'}`;
        });
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
