import { useState, useEffect, useCallback } from 'react';
import { IntuitiveOptionsChart, GeneratedContract } from './IntuitiveOptionsChart';
import { SelectedContractCard } from './SelectedContractCard';
import { OptionsSearch } from './OptionsSearch';
import { TrendingUp, TrendingDown, Sparkles, LineChart, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { subDays, subHours } from 'date-fns';

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

// Generate realistic mock price history
const generatePriceHistory = (currentPrice: number, days: number = 30): { time: Date; price: number }[] => {
  const history: { time: Date; price: number }[] = [];
  let price = currentPrice * (0.95 + Math.random() * 0.1); // Start 5-15% from current
  const volatility = 0.015;
  
  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.48) * volatility * price;
    price += change;
    
    // Ensure we end close to current price
    if (i === 0) price = currentPrice;
    
    history.push({
      time: subDays(new Date(), i),
      price: price
    });
  }
  
  return history;
};

export const OptionsViewNew = () => {
  const [symbol, setSymbol] = useState('SPY');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceHistory, setPriceHistory] = useState<{ time: Date; price: number }[]>([]);
  const [selectedContract, setSelectedContract] = useState<GeneratedContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch price data
  const fetchPrice = useCallback(async (sym: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { symbols: [sym] }
      });

      if (!error && data?.data?.[sym]) {
        const md = data.data[sym];
        const price = md.lastPrice || 100;
        setCurrentPrice(price);
        setPriceChange(md.changePercent || 0);
        setPriceHistory(generatePriceHistory(price));
        setLastUpdated(new Date());
      } else {
        // Fallback mock data
        const mockPrice = 100 + Math.random() * 400;
        setCurrentPrice(mockPrice);
        setPriceChange((Math.random() - 0.5) * 4);
        setPriceHistory(generatePriceHistory(mockPrice));
      }
    } catch (err) {
      console.error('Failed to fetch price:', err);
      const mockPrice = 100 + Math.random() * 400;
      setCurrentPrice(mockPrice);
      setPriceHistory(generatePriceHistory(mockPrice));
    }
    setIsLoading(false);
  }, []);

  // Initial load and symbol change
  useEffect(() => {
    fetchPrice(symbol);
  }, [symbol, fetchPrice]);

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
    if (price > 0) {
      setCurrentPrice(price);
      setPriceHistory(generatePriceHistory(price));
    }
  };

  const handleContractSelect = (contract: GeneratedContract) => {
    setSelectedContract(contract);
  };

  const handleTrade = () => {
    if (selectedContract) {
      toast.success(`Order placed: BUY 1 ${selectedContract.symbol}`, {
        description: `${selectedContract.type.toUpperCase()} $${selectedContract.strike} expiring ${selectedContract.expiry}`
      });
    }
  };

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
        {/* Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Search */}
          <div className="w-full sm:w-72 md:w-80">
            <OptionsSearch 
              onSymbolChange={handleSymbolChange} 
              currentSymbol={symbol}
            />
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>Live</span>
            <span className="text-muted-foreground/60">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button 
              onClick={() => fetchPrice(symbol)}
              disabled={isLoading}
              className="p-1 hover:bg-secondary rounded"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Ticker Header - Compact on mobile */}
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

        {/* Main Content - Responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Chart - Full width on mobile, 2 cols on desktop */}
          <div className="lg:col-span-2">
            <IntuitiveOptionsChart
              currentPrice={currentPrice}
              symbol={symbol}
              priceHistory={priceHistory}
              onContractSelect={handleContractSelect}
              selectedContract={selectedContract}
            />
          </div>

          {/* Selected Contract or Placeholder */}
          <div className="lg:col-span-1">
            {selectedContract ? (
              <SelectedContractCard
                contract={selectedContract}
                currentPrice={currentPrice}
                onClear={() => setSelectedContract(null)}
                onTrade={handleTrade}
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
