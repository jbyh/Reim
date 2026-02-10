import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Zap, RefreshCw, Search, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

import { FloorCountdown } from './floor/FloorCountdown';
import { FloorIndicesStrip } from './floor/FloorIndicesStrip';
import { FloorSentimentGauge } from './floor/FloorSentimentGauge';
import { FloorNewsFeed } from './floor/FloorNewsFeed';
import { FloorHeatMap } from './floor/FloorHeatMap';
import { FloorStatsBar } from './floor/FloorStatsBar';

interface ScreenerStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TheFloorProps {
  onBack: () => void;
}

const SCREENER_SYMBOLS = [
  'SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD',
  'JPM', 'V', 'UNH', 'JNJ', 'XOM', 'WMT', 'MA', 'PG', 'HD', 'COST'
];

const STOCK_NAMES: Record<string, string> = {
  SPY: 'SPDR S&P 500', QQQ: 'Invesco QQQ', AAPL: 'Apple', MSFT: 'Microsoft',
  NVDA: 'NVIDIA', TSLA: 'Tesla', AMZN: 'Amazon', GOOGL: 'Alphabet',
  META: 'Meta', AMD: 'AMD', JPM: 'JPMorgan', V: 'Visa', UNH: 'UnitedHealth',
  JNJ: 'J&J', XOM: 'Exxon', WMT: 'Walmart', MA: 'Mastercard', PG: 'P&G',
  HD: 'Home Depot', COST: 'Costco'
};

export const TheFloor = ({ onBack }: TheFloorProps) => {
  const [stocks, setStocks] = useState<ScreenerStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGainers, setFilterGainers] = useState<'all' | 'gainers' | 'losers'>('all');

  const fetchScreenerData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { symbols: SCREENER_SYMBOLS }
      });

      if (!error && data?.data) {
        const stockData: ScreenerStock[] = SCREENER_SYMBOLS.map(sym => {
          const md = data.data[sym] || {};
          return {
            symbol: sym,
            name: STOCK_NAMES[sym] || sym,
            price: md.lastPrice || 0,
            change: md.change || 0,
            changePercent: md.changePercent || 0,
          };
        }).filter(s => s.price > 0);
        setStocks(stockData);
      }
    } catch (err) {
      console.error('Failed to fetch screener data:', err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchScreenerData();
    const interval = setInterval(fetchScreenerData, 45000);
    return () => clearInterval(interval);
  }, [fetchScreenerData]);

  const filteredStocks = stocks.filter(s => {
    if (searchTerm && !s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !s.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterGainers === 'gainers' && s.changePercent < 0) return false;
    if (filterGainers === 'losers' && s.changePercent >= 0) return false;
    return true;
  });

  const gainersCount = stocks.filter(s => s.changePercent > 0).length;
  const losersCount = stocks.filter(s => s.changePercent < 0).length;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Hero Header */}
      <div className="flex-shrink-0 relative overflow-hidden">
        {/* Gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-success/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-4 md:p-6 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse-glow" />
                The Floor
              </h1>
              <p className="text-xs text-muted-foreground">Live market intelligence</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchScreenerData}
              disabled={isLoading}
              className="rounded-xl gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          {/* Indices ticker strip */}
          <FloorIndicesStrip />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4 md:p-6 pt-3 space-y-4 md:space-y-5">

          {/* Stats bar */}
          <FloorStatsBar stocks={stocks} />

          {/* Bento grid: Countdown + Sentiment + News */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 md:gap-5">
            {/* Countdown */}
            <div className="md:col-span-1 xl:col-span-3">
              <FloorCountdown />
            </div>

            {/* Sentiment Gauge */}
            <div className="md:col-span-1 xl:col-span-3">
              <FloorSentimentGauge stocks={stocks} />
            </div>

            {/* News / Insights */}
            <div className="md:col-span-2 xl:col-span-6">
              <FloorNewsFeed stocks={stocks} />
            </div>
          </div>

          {/* Screener section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search symbols..."
                  className="pl-10 bg-secondary/60 border-border/40 h-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterGainers === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterGainers('all')}
                  className="rounded-xl h-9 text-xs"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  All
                </Button>
                <Button
                  variant={filterGainers === 'gainers' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterGainers('gainers')}
                  className={cn("rounded-xl h-9 text-xs", filterGainers === 'gainers' && "bg-success hover:bg-success/90")}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {gainersCount}
                </Button>
                <Button
                  variant={filterGainers === 'losers' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterGainers('losers')}
                  className={cn("rounded-xl h-9 text-xs", filterGainers === 'losers' && "bg-destructive hover:bg-destructive/90")}
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {losersCount}
                </Button>
              </div>
            </div>

            <FloorHeatMap stocks={filteredStocks} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};
