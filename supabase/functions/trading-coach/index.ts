import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { decryptApiKey } from "../_shared/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALPACA_DATA_URL = 'https://data.alpaca.markets/v2';
const ALPACA_CRYPTO_URL = 'https://data.alpaca.markets/v1beta3/crypto/us';

// Crypto keyword to symbol mapping
const CRYPTO_KEYWORDS: Record<string, string> = {
  'bitcoin': 'BTC/USD',
  'btc': 'BTC/USD',
  'ethereum': 'ETH/USD',
  'eth': 'ETH/USD',
  'solana': 'SOL/USD',
  'sol': 'SOL/USD',
  'dogecoin': 'DOGE/USD',
  'doge': 'DOGE/USD',
  'avalanche': 'AVAX/USD',
  'avax': 'AVAX/USD',
  'chainlink': 'LINK/USD',
  'link': 'LINK/USD',
  'uniswap': 'UNI/USD',
  'uni': 'UNI/USD',
  'aave': 'AAVE/USD',
  'litecoin': 'LTC/USD',
  'ltc': 'LTC/USD',
  'ripple': 'XRP/USD',
  'xrp': 'XRP/USD',
  'cardano': 'ADA/USD',
  'ada': 'ADA/USD',
  'polkadot': 'DOT/USD',
  'dot': 'DOT/USD',
  'shiba': 'SHIB/USD',
  'shib': 'SHIB/USD',
  'polygon': 'MATIC/USD',
  'matic': 'MATIC/USD',
};

const isCryptoSymbol = (symbol: string): boolean => {
  const upper = symbol.toUpperCase();
  return upper.includes('/USD') || Object.values(CRYPTO_KEYWORDS).some(s => s.replace('/USD', '') === upper);
};

const SYSTEM_PROMPT = `You are Trai — an elite AI trading copilot for TrAide (premium).
Tone: concise, confident, and practical. No fluff.

You can trade BOTH stocks AND cryptocurrencies:
- Stocks: AAPL, TSLA, NVDA, SPY, QQQ, etc.
- Crypto: BTC/USD, ETH/USD, SOL/USD, DOGE/USD, etc.

Crypto trades 24/7 - no market hours restrictions. Use same order format for both.

You have TWO sources of market data:
1) LIVE watchlist prices included in the context
2) On-demand real-time quotes for symbols mentioned by the user

When you propose a trade, output EXACTLY ONE JSON order_intent block (below) and keep any additional text to 1–3 short bullets.
Do NOT restate the full ticket in prose — the UI will show the ticket separately.

Order format (works for both stocks and crypto):
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
    "reasoning": "One short sentence."
  }
}
\`\`\`

For crypto, use the full symbol format (e.g., "BTC/USD", "ETH/USD").

Rules:
- Use actual prices from context/quotes.
- limitPrice near current ask; stopLoss 5–8% below; takeProfit 10–15% above.
- Max risk per trade: 2% of equity.
- For crypto: no bracket orders (stop loss/take profit) - just use market or limit orders.
- Use 💡 for insights, ⚠️ for risks, 📊 for data, ₿ for crypto.`;

// Retry wrapper for fetch with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error('Unreachable');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // --- Resolve the user's own Alpaca credentials ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let ALPACA_API_KEY: string | null = null;
    let ALPACA_API_SECRET: string | null = null;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('alpaca_api_key_encrypted, alpaca_secret_key_encrypted')
            .eq('user_id', user.id)
            .single();

          if (profile?.alpaca_api_key_encrypted && profile?.alpaca_secret_key_encrypted) {
            ALPACA_API_KEY = await decryptApiKey(profile.alpaca_api_key_encrypted, user.id);
            ALPACA_API_SECRET = await decryptApiKey(profile.alpaca_secret_key_encrypted, user.id);
          }
        }
      } catch (authErr) {
        console.log('Auth lookup failed, falling back to env vars:', authErr);
      }
    }

    // Fallback to env vars
    if (!ALPACA_API_KEY) ALPACA_API_KEY = Deno.env.get('ALPACA_API_KEY')?.trim() || null;
    if (!ALPACA_API_SECRET) ALPACA_API_SECRET = Deno.env.get('ALPACA_API_SECRET')?.trim() || null;

    const { messages, portfolioContext } = await req.json();

    // Extract any symbols mentioned in the last user message that we should fetch quotes for
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
    const lowerMessage = lastUserMessage.toLowerCase();
    
    // Extract stock symbols (uppercase 2-5 letter words)
    const symbolMatches = lastUserMessage.toUpperCase().match(/\b[A-Z]{1,5}\b/g) || [];
    const knownSymbols = Object.keys(portfolioContext?.watchlistPrices || {});
    
    // Filter out common words
    const commonWords = ['THE', 'AND', 'FOR', 'BUY', 'SELL', 'HOW', 'WHAT', 'WHY', 'NOW', 'DAY', 'TODAY', 'WEEK', 'YES', 'NOT', 'ARE', 'YOU', 'CAN', 'GET', 'PUT', 'CALL', 'LIKE', 'WANT', 'NEED', 'HELP', 'THINK', 'ABOUT', 'WITH', 'FROM', 'HAVE', 'THIS', 'THAT', 'WILL', 'WOULD', 'SHOULD', 'COULD', 'JUST', 'MORE', 'SOME', 'THAN', 'THEN', 'WHEN', 'WHERE', 'WHICH', 'WHILE', 'INTO', 'ONLY', 'ALSO', 'BACK', 'GOOD', 'MAKE', 'TAKE', 'COME', 'KNOW', 'LOOK'];
    
    const newStockSymbols = symbolMatches.filter((s: string) => 
      !knownSymbols.includes(s) && 
      s.length >= 2 && 
      s.length <= 5 &&
      !commonWords.includes(s) &&
      !isCryptoSymbol(s)
    );

    // Detect crypto keywords in the message
    const cryptoSymbols: string[] = [];
    for (const [keyword, symbol] of Object.entries(CRYPTO_KEYWORDS)) {
      if (lowerMessage.includes(keyword) && !knownSymbols.includes(symbol)) {
        cryptoSymbols.push(symbol);
      }
    }

    // Fetch additional quotes for mentioned symbols
    let additionalQuotes: Record<string, any> = {};
    
    if (ALPACA_API_KEY && ALPACA_API_SECRET) {
      const alpacaHeaders = {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
        'Accept': 'application/json',
      };

      // Fetch stock quotes
      if (newStockSymbols.length > 0) {
        try {
          const symbolsParam = [...new Set(newStockSymbols)].slice(0, 5).join(',');

          const [tradesRes, quotesRes] = await Promise.all([
            fetchWithRetry(`${ALPACA_DATA_URL}/stocks/trades/latest?symbols=${symbolsParam}`, { headers: alpacaHeaders }),
            fetchWithRetry(`${ALPACA_DATA_URL}/stocks/quotes/latest?symbols=${symbolsParam}`, { headers: alpacaHeaders })
          ]);

          if (tradesRes.ok && quotesRes.ok) {
            const [tradesData, quotesData] = await Promise.all([tradesRes.json(), quotesRes.json()]);
            
            for (const sym of newStockSymbols) {
              const trade = tradesData.trades?.[sym];
              const quote = quotesData.quotes?.[sym];
              if (trade || quote) {
                additionalQuotes[sym] = {
                  price: trade?.p || quote?.ap || 0,
                  bidPrice: quote?.bp || 0,
                  askPrice: quote?.ap || 0,
                  assetType: 'stock',
                };
              }
            }
          }
        } catch (e) {
          console.log('Failed to fetch stock quotes:', e);
        }
      }

      // Fetch crypto quotes
      if (cryptoSymbols.length > 0) {
        try {
          const cryptoSymbolsParam = [...new Set(cryptoSymbols)].slice(0, 5).join(',');

          const [tradesRes, quotesRes] = await Promise.all([
            fetchWithRetry(`${ALPACA_CRYPTO_URL}/latest/trades?symbols=${cryptoSymbolsParam}`, { headers: alpacaHeaders }),
            fetchWithRetry(`${ALPACA_CRYPTO_URL}/latest/quotes?symbols=${cryptoSymbolsParam}`, { headers: alpacaHeaders })
          ]);

          if (tradesRes.ok && quotesRes.ok) {
            const [tradesData, quotesData] = await Promise.all([tradesRes.json(), quotesRes.json()]);
            
            for (const sym of cryptoSymbols) {
              const trade = tradesData.trades?.[sym];
              const quote = quotesData.quotes?.[sym];
              if (trade || quote) {
                additionalQuotes[sym] = {
                  price: trade?.p || quote?.ap || 0,
                  bidPrice: quote?.bp || 0,
                  askPrice: quote?.ap || 0,
                  assetType: 'crypto',
                };
              }
            }
          }
        } catch (e) {
          console.log('Failed to fetch crypto quotes:', e);
        }
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
          const assetIndicator = data.assetType === 'crypto' ? '₿' : '📈';
          contextualPrompt += `\n${assetIndicator} ${symbol}: $${data.price} (${data.change >= 0 ? '+' : ''}${data.changePercent}%) | Bid: $${data.bidPrice || 'N/A'} | Ask: $${data.askPrice || 'N/A'}`;
        });
      }
    }

    // Add additional fetched quotes
    if (Object.keys(additionalQuotes).length > 0) {
      contextualPrompt += `\n\n=== REAL-TIME QUOTES (JUST FETCHED) ===`;
      Object.entries(additionalQuotes).forEach(([symbol, data]: [string, any]) => {
        const assetIndicator = data.assetType === 'crypto' ? '₿' : '📈';
        contextualPrompt += `\n${assetIndicator} ${symbol}: $${data.price?.toFixed(2)} | Bid: $${data.bidPrice?.toFixed(2) || 'N/A'} | Ask: $${data.askPrice?.toFixed(2) || 'N/A'}`;
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