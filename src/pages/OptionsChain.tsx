import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Search, LineChart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OptionsChart } from '@/components/trading/options/OptionsChart';
import { OptionsMatrix } from '@/components/trading/options/OptionsMatrix';
import { OptionsInsights } from '@/components/trading/options/OptionsInsights';
import { StockSearch } from '@/components/trading/StockSearch';

export interface OptionContract {
  symbol: string;
  strike: number;
  expiry: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  premium: number;
  openInterest: number;
  daysToExpiry: number;
}

export interface PricePoint {
  x: number;
  y: number;
  price: number;
  time: Date;
}

// Stock name mappings
const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.',
  NVDA: 'NVIDIA Corporation',
  TSLA: 'Tesla Inc.',
  META: 'Meta Platforms Inc.',
  SPY: 'SPDR S&P 500 ETF',
  QQQ: 'Invesco QQQ Trust',
  AMD: 'Advanced Micro Devices',
};

// Generate mock options chain based on current price
const generateOptionsChain = (symbol: string, currentPrice: number): OptionContract[] => {
  const contracts: OptionContract[] = [];
  const baseStrike = Math.round(currentPrice / 5) * 5;
  const strikes = [-15, -10, -5, 0, 5, 10, 15, 20];
  const expiries = [
    { label: 'This Week', days: 3 },
    { label: 'Next Week', days: 10 },
    { label: '2 Weeks', days: 17 },
    { label: 'Monthly', days: 30 },
  ];

  expiries.forEach((expiry, expiryIndex) => {
    strikes.forEach((offset) => {
      const strike = baseStrike + offset;
      const isITM = strike < currentPrice;
      const distanceFromATM = Math.abs(strike - currentPrice);
      
      // Calculate premiums based on moneyness and time
      const intrinsicCall = Math.max(0, currentPrice - strike);
      const intrinsicPut = Math.max(0, strike - currentPrice);
      const timeValue = (expiry.days / 365) * currentPrice * 0.3 * Math.exp(-distanceFromATM / currentPrice);
      
      const callPremium = intrinsicCall + timeValue + Math.random() * 0.5;
      const putPremium = intrinsicPut + timeValue + Math.random() * 0.5;
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiry.days);
      const expiryStr = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

      contracts.push({
        symbol: `${symbol}${expiryDate.toISOString().slice(2, 10).replace(/-/g, '')}C${strike * 1000}`,
        strike,
        expiry: expiryStr,
        type: 'call',
        bid: Math.max(0.01, callPremium - 0.05),
        ask: callPremium + 0.05,
        premium: callPremium,
        openInterest: Math.floor(Math.random() * 15000) + 500,
        daysToExpiry: expiry.days,
      });

      contracts.push({
        symbol: `${symbol}${expiryDate.toISOString().slice(2, 10).replace(/-/g, '')}P${strike * 1000}`,
        strike,
        expiry: expiryStr,
        type: 'put',
        bid: Math.max(0.01, putPremium - 0.05),
        ask: putPremium + 0.05,
        premium: putPremium,
        openInterest: Math.floor(Math.random() * 12000) + 300,
        daysToExpiry: expiry.days,
      });
    });
  });

  return contracts;
};

export const OptionsChain = () => {
  const { symbol: paramSymbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  
  const [ticker, setTicker] = useState(paramSymbol?.toUpperCase() || 'SPY');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [volume] = useState('45.2M');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null);
  const [drawnPath, setDrawnPath] = useState<PricePoint[]>([]);
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | '1W' | '1M'>('1D');
  const [contracts, setContracts] = useState<OptionContract[]>([]);

  // Fetch stock price when ticker changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!ticker) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('market-data', {
          body: { symbols: [ticker] }
        });

        if (!error && data?.data?.[ticker]) {
          const md = data.data[ticker];
          const price = md.lastPrice || 100;
          setCurrentPrice(price);
          setPriceChange(md.changePercent || 0);
          setContracts(generateOptionsChain(ticker, price));
        } else {
          console.warn('No price data returned for', ticker);
        }
      } catch (err) {
        console.error('Failed to fetch price:', err);
      }
      setIsLoading(false);
    };

    fetchPrice();
  }, [ticker]);

  // Update ticker when URL changes
  useEffect(() => {
    if (paramSymbol && paramSymbol.toUpperCase() !== ticker) {
      setTicker(paramSymbol.toUpperCase());
    }
  }, [paramSymbol]);

  const handlePathUpdate = (path: PricePoint[]) => {
    setDrawnPath(path);
  };

  const handleContractSelect = (contract: OptionContract) => {
    setSelectedContract(contract);
  };

  const handleSearchSelect = (newSymbol: string) => {
    navigate(`/options/${newSymbol}`);
  };

  const isPositive = priceChange >= 0;

  if (isLoading && currentPrice === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading options for {ticker}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/20">
                  <LineChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-xl">Options Chain</h1>
                  <p className="text-xs text-muted-foreground">Visual contract explorer</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <StockSearch placeholder="Search for a different stock..." />
            </div>

            <Button 
              variant="outline" 
              onClick={() => navigate(`/asset/${ticker}`)}
              className="rounded-xl gap-2"
            >
              View Stock Chart
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {/* Ticker Header Card */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl",
                isPositive ? "bg-success/20" : "bg-destructive/20"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-6 w-6 text-success" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold font-mono text-foreground">{ticker}</h2>
                  <Badge variant="outline" className="bg-secondary/60 text-muted-foreground border-border/40">
                    OPTIONS
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{STOCK_NAMES[ticker] || ticker}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold font-mono text-foreground">${currentPrice.toFixed(2)}</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                </div>
                <span className="text-muted-foreground text-sm">Volume {volume}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Draw your price prediction on the chart to see projected P&L</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/60 rounded-xl p-1">
            {(['1H', '1D', '1W', '1M'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  timeframe === tf 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <OptionsChart 
              currentPrice={currentPrice}
              selectedContract={selectedContract}
              onPathUpdate={handlePathUpdate}
            />
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Insights */}
            <OptionsInsights 
              ticker={ticker} 
              currentPrice={currentPrice}
              drawnPath={drawnPath}
              selectedContract={selectedContract}
            />

            {/* Options Matrix */}
            <OptionsMatrix 
              contracts={contracts}
              selectedContract={selectedContract}
              onContractSelect={handleContractSelect}
              currentPrice={currentPrice}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsChain;
