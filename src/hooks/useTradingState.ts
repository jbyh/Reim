import { useState, useCallback, useEffect, useRef } from 'react';
import { Stock, Position, Order, ChatMessage, Portfolio, OrderIntent, Activity, AssetType } from '@/types/trading';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const WATCHLIST_SYMBOLS = ['SPY', 'QQQ', 'TSLA', 'NVDA', 'AAPL'];

const STOCK_NAMES: Record<string, string> = {
  'SPY': 'SPDR S&P 500 ETF',
  'QQQ': 'Invesco QQQ Trust',
  'TSLA': 'Tesla Inc',
  'NVDA': 'NVIDIA Corp',
  'AAPL': 'Apple Inc',
  'MSFT': 'Microsoft Corp',
  'AMZN': 'Amazon.com Inc',
  'GOOGL': 'Alphabet Inc',
  'META': 'Meta Platforms Inc',
  'AMD': 'AMD Inc',
};

const CRYPTO_NAMES: Record<string, string> = {
  'BTC/USD': 'Bitcoin',
  'ETH/USD': 'Ethereum',
  'SOL/USD': 'Solana',
  'DOGE/USD': 'Dogecoin',
  'AVAX/USD': 'Avalanche',
  'LINK/USD': 'Chainlink',
  'UNI/USD': 'Uniswap',
  'AAVE/USD': 'Aave',
  'LTC/USD': 'Litecoin',
  'BCH/USD': 'Bitcoin Cash',
  'XRP/USD': 'Ripple',
  'ADA/USD': 'Cardano',
  'DOT/USD': 'Polkadot',
  'SHIB/USD': 'Shiba Inu',
  'MATIC/USD': 'Polygon',
};

// Helper to detect crypto symbols
const isCryptoSymbol = (symbol: string): boolean => {
  const upper = symbol.toUpperCase();
  return upper.includes('/USD') || Object.keys(CRYPTO_NAMES).some(
    crypto => crypto.replace('/USD', '') === upper
  );
};

// Normalize crypto symbol to Alpaca format
const normalizeCryptoSymbol = (symbol: string): string => {
  if (symbol.includes('/')) return symbol.toUpperCase();
  return `${symbol.toUpperCase()}/USD`;
};

const INITIAL_WATCHLIST: Stock[] = WATCHLIST_SYMBOLS.map(symbol => ({
  symbol,
  name: STOCK_NAMES[symbol] || symbol,
  price: 0,
  change: 0,
  changePercent: 0,
  assetType: 'stock' as AssetType,
}));

const INITIAL_PORTFOLIO: Portfolio = {
  equity: 0,
  cash: 0,
  buyingPower: 0,
  dayPL: 0,
  dayPLPercent: 0,
  totalPL: 0,
  totalPLPercent: 0,
};

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useTradingState = () => {
  const [watchlist, setWatchlist] = useState<Stock[]>(INITIAL_WATCHLIST);
  const [positions, setPositions] = useState<Position[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>(INITIAL_PORTFOLIO);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: 'assistant',
      content: "Hey! I'm Trai, your AI trading companion. I can help you trade both stocks AND crypto — just ask about AAPL, TSLA, Bitcoin, Ethereum, or any other asset. I'll fetch real-time prices and help you build smart orders. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [pendingOrder, setPendingOrder] = useState<OrderIntent | null>(null);
  const [orderStatus, setOrderStatus] = useState<'pending' | 'submitting' | 'confirmed' | 'failed' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const conversationHistory = useRef<Array<{ role: string; content: string }>>([]);

  // Fetch account data from Alpaca
  const fetchAccountData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { action: 'account' },
      });

      if (error || !data?.data) {
        console.error('Account data error:', error);
        return;
      }

      const account = data.data;
      const equity = parseFloat(account.equity) || 0;
      const lastEquity = parseFloat(account.last_equity) || equity;
      const dayPL = equity - lastEquity;
      const dayPLPercent = lastEquity > 0 ? (dayPL / lastEquity) * 100 : 0;

      setPortfolio({
        equity,
        cash: parseFloat(account.cash) || 0,
        buyingPower: parseFloat(account.buying_power) || 0,
        dayPL,
        dayPLPercent,
        totalPL: equity - 100000, // Assuming $100k initial
        totalPLPercent: ((equity - 100000) / 100000) * 100,
      });
    } catch (err) {
      console.error('Failed to fetch account:', err);
    }
  }, []);

  // Fetch positions from Alpaca
  const fetchPositions = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { action: 'positions' },
      });

      if (error || !data?.data) {
        console.error('Positions error:', error);
        return;
      }

      const alpacaPositions = data.data.map((p: any) => ({
        symbol: p.symbol,
        qty: parseFloat(p.qty) || 0,
        avgPrice: parseFloat(p.avg_entry_price) || 0,
        currentPrice: parseFloat(p.current_price) || 0,
        marketValue: parseFloat(p.market_value) || 0,
        unrealizedPL: parseFloat(p.unrealized_pl) || 0,
        unrealizedPLPercent: parseFloat(p.unrealized_plpc) * 100 || 0,
        costBasis: parseFloat(p.cost_basis) || 0,
        side: p.side,
      }));

      setPositions(alpacaPositions);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    }
  }, []);

  // Fetch activities from Alpaca
  const fetchActivities = useCallback(async () => {
    setIsLoadingActivities(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { action: 'activities' },
      });

      if (error || !data?.data) {
        console.error('Activities error:', error);
        return;
      }

      setActivities(data.data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setIsLoadingActivities(false);
    }
  }, []);

  // Fetch live market data from Alpaca
  const fetchMarketData = useCallback(async () => {
    try {
      // Get all symbols from watchlist
      const allSymbols = watchlist.map(s => s.symbol);
      
      if (allSymbols.length === 0) return;

      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { symbols: allSymbols },
      });

      if (error) {
        console.error('Market data error:', error);
        return;
      }

      if (data?.data) {
        setWatchlist((prev) =>
          prev.map((stock) => {
            const marketData = data.data[stock.symbol];
            if (!marketData) return stock;

            return {
              ...stock,
              price: Number(marketData.lastPrice?.toFixed(2) || 0),
              change: Number(marketData.change?.toFixed(2) || 0),
              changePercent: Number(marketData.changePercent?.toFixed(2) || 0),
              bidPrice: marketData.bidPrice,
              askPrice: marketData.askPrice,
              bidSize: marketData.bidSize,
              askSize: marketData.askSize,
              assetType: marketData.assetType || stock.assetType,
            };
          })
        );
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    }
  }, [watchlist]);

  // Refetch all portfolio data (for use after order submission)
  const refetchAllData = useCallback(async () => {
    await Promise.all([
      fetchAccountData(),
      fetchPositions(),
      fetchActivities(),
    ]);
  }, [fetchAccountData, fetchPositions, fetchActivities]);

  // Fetch all data on mount
  useEffect(() => {
    fetchAccountData();
    fetchPositions();
    fetchActivities();
    fetchMarketData();
    
    const interval = setInterval(() => {
      fetchMarketData();
      fetchAccountData();
      fetchPositions();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [fetchAccountData, fetchPositions, fetchActivities, fetchMarketData]);

  // Update positions based on watchlist prices
  useEffect(() => {
    setPositions((prev) =>
      prev.map((position) => {
        const stock = watchlist.find((s) => s.symbol === position.symbol);
        if (!stock || stock.price === 0) return position;

        const currentPrice = stock.price;
        const marketValue = position.qty * currentPrice;
        const unrealizedPL = marketValue - position.qty * position.avgPrice;
        const unrealizedPLPercent = (unrealizedPL / (position.qty * position.avgPrice)) * 100;

        return {
          ...position,
          currentPrice,
          marketValue: Number(marketValue.toFixed(2)),
          unrealizedPL: Number(unrealizedPL.toFixed(2)),
          unrealizedPLPercent: Number(unrealizedPLPercent.toFixed(2)),
        };
      })
    );
  }, [watchlist]);

  // Parse order intent from AI response
  const parseAIOrderIntent = useCallback((content: string): OrderIntent | null => {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.type !== 'order_intent') return null;

      // For crypto, we might not have it in watchlist yet, so just validate the symbol format
      const symbol = parsed.symbol;
      const isInWatchlist = watchlist.find((s) => s.symbol === symbol);
      const isCrypto = isCryptoSymbol(symbol);
      
      // Allow the order if it's in watchlist OR it's a valid crypto symbol
      if (!isInWatchlist && !isCrypto) return null;

      return {
        symbol: parsed.symbol,
        qty: parsed.quantity,
        side: parsed.side,
        type: parsed.orderType || 'market',
        limitPrice: parsed.suggestions?.limitPrice,
        stopLoss: isCrypto ? undefined : parsed.suggestions?.stopLoss, // No bracket orders for crypto
        takeProfit: isCrypto ? undefined : parsed.suggestions?.takeProfit,
      };
    } catch {
      return null;
    }
  }, [watchlist]);

  // Stream AI response
  const streamAIResponse = useCallback(async (userMessage: string) => {
    setIsLoading(true);

    // Add user message to conversation history
    conversationHistory.current.push({ role: 'user', content: userMessage });

    // Create placeholder for assistant response
    const assistantMessageId = generateId();
    let assistantContent = '';

    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: '', timestamp: new Date() },
    ]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trading-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: conversationHistory.current,
            portfolioContext: {
              equity: portfolio.equity,
              cash: portfolio.cash,
              positions: positions.map((p) => ({
                symbol: p.symbol,
                qty: p.qty,
                avgPrice: p.avgPrice,
                unrealizedPL: p.unrealizedPL,
              })),
              watchlistPrices: watchlist.reduce((acc, stock) => {
                if (stock.price > 0) {
                  acc[stock.symbol] = {
                    price: stock.price,
                    change: stock.change,
                    changePercent: stock.changePercent,
                    bidPrice: stock.bidPrice,
                    askPrice: stock.askPrice,
                    assetType: stock.assetType,
                  };
                }
                return acc;
              }, {} as Record<string, any>),
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId ? { ...m, content: assistantContent } : m
                )
              );
            }
          } catch {
            // Incomplete JSON, wait for more data
          }
        }
      }

      // Add to conversation history
      conversationHistory.current.push({ role: 'assistant', content: assistantContent });

      // Check for order intent in AI response
      const orderIntent = parseAIOrderIntent(assistantContent);
      if (orderIntent) {
        setPendingOrder(orderIntent);
      }
    } catch (err) {
      console.error('AI streaming error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      toast.error(errorMessage);
      
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [portfolio, positions, watchlist, parseAIOrderIntent]);

  // Send message
  const sendMessage = useCallback(
    (content: string) => {
      if (isLoading) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      streamAIResponse(content);
    },
    [isLoading, streamAIResponse]
  );


  // Confirm order - submit to Alpaca and refetch data
  const confirmOrder = useCallback(async () => {
    if (!pendingOrder) return;

    const submittingOrder = pendingOrder;
    const stock = watchlist.find((s) => s.symbol === submittingOrder.symbol);
    const currentPrice = stock?.price || submittingOrder.limitPrice || 0;
    const isCrypto = isCryptoSymbol(submittingOrder.symbol);

    setOrderStatus('submitting');

    try {
      // Submit order to Alpaca
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: {
          action: 'submit_order',
          orderSymbol: submittingOrder.symbol,
          qty: submittingOrder.qty,
          side: submittingOrder.side,
          type: submittingOrder.type,
          limitPrice: submittingOrder.limitPrice,
          // Only include bracket order params for stocks
          stopLoss: isCrypto ? undefined : submittingOrder.stopLoss,
          takeProfit: isCrypto ? undefined : submittingOrder.takeProfit,
        },
      });

      if (error) {
        throw new Error(error.message || 'Order submission failed');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Order was not accepted');
      }

      // Create local order record
      const order: Order = {
        id: data.data?.id || generateId(),
        ...submittingOrder,
        status: 'filled',
        timestamp: new Date(),
      };

      setOrders((prev) => [...prev, order]);
      setPendingOrder(null);
      setOrderStatus('confirmed');

      // Add confirmation message
      const assetLabel = isCrypto ? 'crypto' : 'shares';
      const confirmationMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `✅ Submitted: ${submittingOrder.side.toUpperCase()} ${submittingOrder.qty} ${submittingOrder.symbol} @ ~$${currentPrice.toFixed(2)}. Syncing…`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmationMessage]);
      toast.success(`Order submitted: ${submittingOrder.side.toUpperCase()} ${submittingOrder.qty} ${submittingOrder.symbol}`);

      // Refetch all data to sync with Alpaca
      setTimeout(async () => {
        await refetchAllData();
        const syncMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `📊 Synced. Positions & balances updated.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, syncMessage]);
      }, 1500);

      // Clear status after a moment
      setTimeout(() => setOrderStatus(null), 4000);
    } catch (err) {
      console.error('Order submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit order';
      toast.error(errorMessage);

      setOrderStatus('failed');

      const errorChatMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `⚠️ Order failed: ${errorMessage}.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorChatMessage]);

      setTimeout(() => setOrderStatus(null), 5000);
    }
  }, [pendingOrder, watchlist, refetchAllData]);

  // Cancel order
  const cancelOrder = useCallback(() => {
    if (!pendingOrder) return;

    const cancelMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: `Order cancelled. No worries—it's always wise to take a moment to reconsider. Let me know if you'd like to explore other opportunities or adjust the trade parameters.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);

    setPendingOrder(null);
  }, [pendingOrder]);

  // Add a symbol to watchlist
  const addToWatchlist = useCallback(async (symbol: string) => {
    // Normalize and detect asset type
    const isCrypto = isCryptoSymbol(symbol);
    const normalizedSymbol = isCrypto ? normalizeCryptoSymbol(symbol) : symbol.toUpperCase();
    
    // Check if already in watchlist
    if (watchlist.some(s => s.symbol === normalizedSymbol)) {
      toast.info(`${normalizedSymbol} is already in your watchlist`);
      return;
    }

    // Fetch the price for the new symbol
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { symbols: [normalizedSymbol] }
      });

      if (!error && data?.data?.[normalizedSymbol]) {
        const md = data.data[normalizedSymbol];
        const name = isCrypto 
          ? CRYPTO_NAMES[normalizedSymbol] || normalizedSymbol.replace('/USD', '')
          : STOCK_NAMES[normalizedSymbol] || normalizedSymbol;
          
        setWatchlist(prev => [...prev, {
          symbol: normalizedSymbol,
          name,
          price: Number(md.lastPrice?.toFixed(2) || 0),
          change: Number(md.change?.toFixed(2) || 0),
          changePercent: Number(md.changePercent?.toFixed(2) || 0),
          bidPrice: md.bidPrice,
          askPrice: md.askPrice,
          assetType: isCrypto ? 'crypto' : 'stock',
        }]);
        toast.success(`Added ${normalizedSymbol} to watchlist`);
      } else {
        // Add with zero price, will be updated on next refresh
        const name = isCrypto 
          ? CRYPTO_NAMES[normalizedSymbol] || normalizedSymbol.replace('/USD', '')
          : STOCK_NAMES[normalizedSymbol] || normalizedSymbol;
          
        setWatchlist(prev => [...prev, {
          symbol: normalizedSymbol,
          name,
          price: 0,
          change: 0,
          changePercent: 0,
          assetType: isCrypto ? 'crypto' : 'stock',
        }]);
        toast.success(`Added ${normalizedSymbol} to watchlist`);
      }
    } catch {
      toast.error(`Failed to add ${normalizedSymbol}`);
    }
  }, [watchlist]);

  // Remove a symbol from watchlist
  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => prev.filter(s => s.symbol !== symbol));
    toast.success(`Removed ${symbol} from watchlist`);
  }, []);

  return {
    watchlist,
    positions,
    portfolio,
    orders,
    messages,
    pendingOrder,
    orderStatus,
    isLoading,
    activities,
    isLoadingActivities,
    sendMessage,
    confirmOrder,
    cancelOrder,
    fetchActivities,
    addToWatchlist,
    removeFromWatchlist,
  };
};
