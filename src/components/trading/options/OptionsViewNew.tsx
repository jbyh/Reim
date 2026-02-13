import { useState, useEffect, useCallback } from 'react';
import { IntuitiveOptionsChart, GeneratedContract } from './IntuitiveOptionsChart';
import { SelectedContractCard } from './SelectedContractCard';
import { OptionsSearch } from './OptionsSearch';
import { TrendingUp, TrendingDown, Sparkles, LineChart, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { subDays, format, addDays } from 'date-fns';

const STOCK_NAMES: Record<string, string> = {
  SPY: 'SPDR S&P 500 ETF Trust',
  QQQ: 'Invesco QQQ Trust',
  AAPL: 'Apple Inc.',
  TSLA: 'Tesla Inc.',
  NVDA: 'NVIDIA Corporation',
  MSFT: 'Microsoft Corporation',
  AMZN: 'Amazon.com Inc.',
  META: 'Meta Platforms Inc.',
  AMD: 'Advanced Micro Devices',
  GOOGL: 'Alphabet Inc.',
};

export const OptionsViewNew = () => {
  const [symbol, setSymbol] = useState('SPY');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceHistory, setPriceHistory] = useState<{ time: Date; price: number }[]>([]);
  const [selectedContract, setSelectedContract] = useState<GeneratedContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [optionsChainCache, setOptionsChainCache] = useState<Record<string, any>>({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Fetch real price bars for chart history
  const fetchBars = useCallback(async (sym: string): Promise<{ time: Date; price: number }[]> => {
    try {
      const startDate = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { action: 'bars', symbol: sym, timeframe: '1Day', start: startDate }
      });

      if (!error && data?.data?.bars) {
        const bars = data.data.bars;
        return bars.map((bar: any) => ({
          time: new Date(bar.t),
          price: bar.c, // closing price
        }));
      }
    } catch (err) {
      console.error('Failed to fetch bars:', err);
    }
    return [];
  }, []);

  // Fetch price data
  const fetchPrice = useCallback(async (sym: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { symbols: [sym] }
      });

      if (!error && data?.data?.[sym]) {
        const md = data.data[sym];
        const price = md.lastPrice || 0;
        if (price > 0) {
          setCurrentPrice(price);
          setPriceChange(md.changePercent || 0);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.error('Failed to fetch price:', err);
    }
    setIsLoading(false);
  }, []);

  // Fetch real bars for chart history
  const loadBars = useCallback(async (sym: string) => {
    const bars = await fetchBars(sym);
    if (bars.length > 0) {
      setPriceHistory(bars);
    }
  }, [fetchBars]);

  // Fetch options chain for a symbol
  const fetchOptionsChain = useCallback(async (sym: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { action: 'options_chain', underlying_symbol: sym }
      });

      if (!error && data?.data) {
        setOptionsChainCache(data.data);
        return data.data;
      }
    } catch (err) {
      console.error('Failed to fetch options chain:', err);
    }
    return null;
  }, []);

  // Initial load and symbol change
  useEffect(() => {
    fetchPrice(symbol);
    loadBars(symbol);
    fetchOptionsChain(symbol);
  }, [symbol, fetchPrice, loadBars, fetchOptionsChain]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrice(symbol);
    }, 30000);
    return () => clearInterval(interval);
  }, [symbol, fetchPrice]);

  const handleSymbolChange = (newSymbol: string, price: number) => {
    setSymbol(newSymbol);
    setSelectedContract(null);
    setOptionsChainCache({});
    if (price > 0) {
      setCurrentPrice(price);
    }
  };

  // Find nearest real contract from the options chain cache
  const findNearestContract = useCallback((approxContract: GeneratedContract): GeneratedContract => {
    const chainEntries = Object.entries(optionsChainCache);
    if (chainEntries.length === 0) return approxContract;

    let bestMatch: { symbol: string; data: any; distance: number } | null = null;

    for (const [occSymbol, contractData] of chainEntries) {
      // Parse OCC symbol: e.g. SPY260220C00700000
      // Format: SYMBOL + YYMMDD + C/P + strike*1000 (8 digits)
      const match = occSymbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
      if (!match) continue;

      const [, , dateStr, cpFlag] = match;
      const strikeFromOCC = parseInt(match[4]) / 1000;
      const typeFromOCC = cpFlag === 'C' ? 'call' : 'put';

      // Filter by type
      if (typeFromOCC !== approxContract.type) continue;

      // Calculate distance metric (strike distance + time distance)
      const strikeDist = Math.abs(strikeFromOCC - approxContract.strike) / currentPrice;
      
      // Parse expiry date from OCC
      const year = 2000 + parseInt(dateStr.substring(0, 2));
      const month = parseInt(dateStr.substring(2, 4)) - 1;
      const day = parseInt(dateStr.substring(4, 6));
      const expiryDate = new Date(year, month, day);
      const daysToExp = Math.max(1, Math.round((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const timeDist = Math.abs(daysToExp - approxContract.daysToExpiry) / 45;

      const distance = strikeDist * 2 + timeDist; // Weight strike more

      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { symbol: occSymbol, data: contractData, distance };
      }
    }

    if (!bestMatch) return approxContract;

    const d = bestMatch.data;
    const match = bestMatch.symbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
    if (!match) return approxContract;

    const strikeFromOCC = parseInt(match[4]) / 1000;
    const dateStr = match[2];
    const year = 2000 + parseInt(dateStr.substring(0, 2));
    const month = parseInt(dateStr.substring(2, 4)) - 1;
    const day = parseInt(dateStr.substring(4, 6));
    const expiryDate = new Date(year, month, day);
    const daysToExp = Math.max(1, Math.round((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    const midPrice = d.bid > 0 && d.ask > 0 ? (d.bid + d.ask) / 2 : d.lastPrice || approxContract.premium;

    return {
      ...approxContract,
      realSymbol: bestMatch.symbol,
      strike: strikeFromOCC,
      expiry: format(expiryDate, 'MMM dd, yyyy').toUpperCase(),
      expiryDate,
      daysToExpiry: daysToExp,
      premium: midPrice,
      bid: d.bid || 0,
      ask: d.ask || 0,
      openInterest: d.openInterest || 0,
      volume: d.volume || 0,
      greeks: d.greeks,
      impliedVolatility: d.impliedVolatility || 0,
      realPremium: midPrice,
      isLive: true,
    };
  }, [optionsChainCache, currentPrice]);

  const handleContractSelect = useCallback((contract: GeneratedContract) => {
    const enriched = findNearestContract(contract);
    setSelectedContract(enriched);
  }, [findNearestContract]);

  const handleTrade = useCallback(async () => {
    if (!selectedContract) return;

    const occSymbol = selectedContract.realSymbol;
    if (!occSymbol) {
      toast.error('No real contract data available. Connect your brokerage in Settings.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: {
          action: 'submit_options_order',
          orderSymbol: occSymbol,
          qty: 1,
          side: 'buy',
          type: 'limit',
          limitPrice: selectedContract.ask > 0 ? selectedContract.ask : selectedContract.premium,
        }
      });

      if (error) throw new Error(error.message || 'Order submission failed');
      if (data?.error) throw new Error(data.error);

      toast.success(`Order placed: BUY 1 ${occSymbol}`, {
        description: `Order ID: ${data?.data?.id || 'pending'} — Status: ${data?.data?.status || 'submitted'}`
      });
    } catch (err: any) {
      const msg = err?.message || 'Failed to submit order';
      if (msg.includes('credentials')) {
        toast.error('Connect your brokerage in Settings to trade options.');
      } else {
        toast.error('Order failed', { description: msg });
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [selectedContract]);

  const isPositive = priceChange >= 0;

  if (isLoading && currentPrice === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading {symbol}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-full sm:w-72 md:w-80">
            <OptionsSearch 
              onSymbolChange={handleSymbolChange} 
              currentSymbol={symbol}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>Live</span>
            <span className="text-muted-foreground/60">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button 
              onClick={() => { fetchPrice(symbol); fetchOptionsChain(symbol); }}
              disabled={isLoading}
              className="p-1 hover:bg-secondary rounded"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Ticker Header */}
        <div className="glass-card rounded-2xl p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={cn(
                "p-2.5 md:p-3 rounded-xl md:rounded-2xl",
                isPositive ? "bg-success/20" : "bg-destructive/20"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 md:gap-3">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-mono text-foreground">
                    {symbol}
                  </h2>
                  <Badge variant="outline" className="bg-secondary/60 text-muted-foreground border-border/40 text-xs">
                    OPTIONS
                  </Badge>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                  {STOCK_NAMES[symbol] || symbol}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right">
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold font-mono text-foreground">
                  ${currentPrice.toFixed(2)}
                </p>
                <div className={cn(
                  "flex items-center justify-end gap-1 text-sm font-medium",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instruction Banner */}
        <div className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-primary/10 border border-primary/20">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-xs md:text-sm text-foreground">
            <span className="font-semibold">Tap the chart</span> where you think the price will go.
            Higher = calls (bullish), lower = puts (bearish). Further right = later expiry.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <IntuitiveOptionsChart
              currentPrice={currentPrice}
              symbol={symbol}
              priceHistory={priceHistory}
              onContractSelect={handleContractSelect}
              selectedContract={selectedContract}
            />
          </div>

          <div className="lg:col-span-1">
            {selectedContract ? (
              <SelectedContractCard
                contract={selectedContract}
                currentPrice={currentPrice}
                onClear={() => setSelectedContract(null)}
                onTrade={handleTrade}
                isSubmitting={isSubmittingOrder}
              />
            ) : (
              <div className="glass-card rounded-2xl p-6 md:p-8 text-center h-full min-h-[300px] flex flex-col items-center justify-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <LineChart className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <p className="text-base md:text-lg font-semibold text-foreground mb-2">
                  Tap to Select Contract
                </p>
                <p className="text-xs md:text-sm text-muted-foreground max-w-[250px]">
                  Click anywhere on the chart to instantly configure an options contract based on your price target and timing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
