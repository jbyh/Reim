import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Search, RefreshCw, Zap, Filter, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ScreenerStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: string;
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
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<ScreenerStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'changePercent' | 'symbol' | 'price'>('changePercent');
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
    const interval = setInterval(fetchScreenerData, 30000);
    return () => clearInterval(interval);
  }, [fetchScreenerData]);

  const filteredStocks = stocks
    .filter(s => {
      if (searchTerm && !s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !s.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterGainers === 'gainers' && s.changePercent < 0) return false;
      if (filterGainers === 'losers' && s.changePercent >= 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'changePercent') return Math.abs(b.changePercent) - Math.abs(a.changePercent);
      if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol);
      return b.price - a.price;
    });

  const gainersCount = stocks.filter(s => s.changePercent > 0).length;
  const losersCount = stocks.filter(s => s.changePercent < 0).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 md:p-6 border-b border-border/50 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              The Floor
            </h1>
            <p className="text-sm text-muted-foreground">Real-time market screener</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symbols..."
              className="pl-10 bg-secondary/60 border-border/40"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterGainers === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterGainers('all')}
              className="rounded-xl"
            >
              All
            </Button>
            <Button
              variant={filterGainers === 'gainers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterGainers('gainers')}
              className={cn("rounded-xl", filterGainers === 'gainers' && "bg-success hover:bg-success/90")}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              {gainersCount}
            </Button>
            <Button
              variant={filterGainers === 'losers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterGainers('losers')}
              className={cn("rounded-xl", filterGainers === 'losers' && "bg-destructive hover:bg-destructive/90")}
            >
              <TrendingDown className="h-4 w-4 mr-1" />
              {losersCount}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchScreenerData}
              disabled={isLoading}
              className="rounded-xl"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading && stocks.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-secondary rounded w-12 mb-2" />
                <div className="h-6 bg-secondary rounded w-16 mb-2" />
                <div className="h-4 bg-secondary rounded w-10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredStocks.map((stock) => {
              const isPositive = stock.changePercent >= 0;
              return (
                <button
                  key={stock.symbol}
                  onClick={() => navigate(`/asset/${stock.symbol}`)}
                  className={cn(
                    "glass-card rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg border-l-4",
                    isPositive ? "border-l-success" : "border-l-destructive"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-foreground">{stock.symbol}</span>
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-1.5 py-0",
                      isPositive ? "text-success border-success/30" : "text-destructive border-destructive/30"
                    )}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-2">{stock.name}</p>
                  <p className="font-mono font-bold text-lg text-foreground">${stock.price.toFixed(2)}</p>
                  <p className={cn(
                    "text-sm font-semibold",
                    isPositive ? "text-success" : "text-destructive"
                  )}>
                    {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
