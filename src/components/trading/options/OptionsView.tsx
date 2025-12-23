import { useState } from 'react';
import { OptionsChart } from './OptionsChart';
import { OptionsMatrix } from './OptionsMatrix';
import { OptionsInsights } from './OptionsInsights';
import { Search, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

export const OptionsView = () => {
  const [ticker, setTicker] = useState('SPY');
  const [currentPrice] = useState(445.20);
  const [priceChange] = useState(1.25);
  const [volume] = useState('45.2M');
  const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null);
  const [drawnPath, setDrawnPath] = useState<PricePoint[]>([]);
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | '1W' | '1M'>('1D');

  // Mock option contracts
  const contracts: OptionContract[] = [
    { symbol: 'SPY230922C460', strike: 460, expiry: 'SEP 22, 2023', type: 'call', bid: 0.20, ask: 0.30, premium: 0.25, openInterest: 3200, daysToExpiry: 2 },
    { symbol: 'SPY230922C455', strike: 455, expiry: 'SEP 22, 2023', type: 'call', bid: 0.75, ask: 0.85, premium: 0.80, openInterest: 7800, daysToExpiry: 2 },
    { symbol: 'SPY230922C450', strike: 450, expiry: 'SEP 22, 2023', type: 'call', bid: 2.45, ask: 2.55, premium: 2.50, openInterest: 12100, daysToExpiry: 2 },
    { symbol: 'SPY230922C445', strike: 445, expiry: 'SEP 22, 2023', type: 'call', bid: 5.00, ask: 5.20, premium: 5.10, openInterest: 9500, daysToExpiry: 2 },
    { symbol: 'SPY230929C465', strike: 465, expiry: 'SEP 29, 2023', type: 'call', bid: 0.08, ask: 0.12, premium: 0.10, openInterest: 1500, daysToExpiry: 9 },
    { symbol: 'SPY230929C460', strike: 460, expiry: 'SEP 29, 2023', type: 'call', bid: 0.40, ask: 0.50, premium: 0.45, openInterest: 4100, daysToExpiry: 9 },
    { symbol: 'SPY230929C455', strike: 455, expiry: 'SEP 29, 2023', type: 'call', bid: 1.15, ask: 1.25, premium: 1.20, openInterest: 9200, daysToExpiry: 9 },
    { symbol: 'SPY231006C460', strike: 460, expiry: 'OCT 06, 2023', type: 'call', bid: 0.65, ask: 0.75, premium: 0.70, openInterest: 2800, daysToExpiry: 14 },
    { symbol: 'SPY231006C455', strike: 455, expiry: 'OCT 06, 2023', type: 'call', bid: 1.55, ask: 1.65, premium: 1.60, openInterest: 6500, daysToExpiry: 14 },
  ];

  const handlePathUpdate = (path: PricePoint[]) => {
    setDrawnPath(path);
  };

  const handleContractSelect = (contract: OptionContract) => {
    setSelectedContract(contract);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Explore tickers, strikes..."
              className="w-64 bg-secondary/60 border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Timeframe Selector */}
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
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
            <span>fullscreen</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ticker Header */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold font-mono text-foreground">{ticker}</h2>
                    <Badge variant="outline" className="bg-secondary/60 text-muted-foreground border-border/40">
                      QUANTUM ETF
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">SPDR S&P 500 ETF Trust</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold font-mono text-foreground">${currentPrice.toFixed(2)}</p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    priceChange >= 0 ? "text-success" : "text-destructive"
                  )}>
                    <TrendingUp className="h-4 w-4" />
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </div>
                  <span className="text-muted-foreground text-sm">Volume {volume}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chart */}
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
  );
};
