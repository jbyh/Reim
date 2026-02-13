import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, 
  Zap, Search, LineChart, Bitcoin, Clock, Newspaper, 
  CandlestickChart, ChevronRight, ExternalLink, Plus, Minus,
  ArrowUpRight, ArrowDownRight, Eye, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTradingState } from '@/hooks/useTradingState';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockSearch } from '@/components/trading/StockSearch';
import { TradeTicketDrawer } from '@/components/trading/TradeTicketDrawer';
import { Stock, BarData } from '@/types/trading';
import { subDays, format } from 'date-fns';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ReferenceLine,
} from 'recharts';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  bidPrice?: number;
  askPrice?: number;
}

interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  author: string;
  source: string;
  url: string;
  created_at: string;
  sentiment: any;
}

const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.', MSFT: 'Microsoft Corporation', GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.', NVDA: 'NVIDIA Corporation', TSLA: 'Tesla Inc.',
  META: 'Meta Platforms Inc.', SPY: 'SPDR S&P 500 ETF', QQQ: 'Invesco QQQ Trust',
  AMD: 'Advanced Micro Devices', NFLX: 'Netflix Inc.', DIS: 'Walt Disney Co.',
  BA: 'Boeing Co.', JPM: 'JPMorgan Chase', V: 'Visa Inc.',
};

const CRYPTO_NAMES: Record<string, string> = {
  'BTC/USD': 'Bitcoin', 'ETH/USD': 'Ethereum', 'SOL/USD': 'Solana',
  'DOGE/USD': 'Dogecoin', 'AVAX/USD': 'Avalanche', 'LINK/USD': 'Chainlink',
  'LTC/USD': 'Litecoin', 'XRP/USD': 'Ripple', 'ADA/USD': 'Cardano',
};

const isCryptoSymbol = (symbol: string): boolean => {
  const upper = symbol.toUpperCase();
  return upper.includes('/USD') || Object.keys(CRYPTO_NAMES).some(
    crypto => crypto.replace('/USD', '') === upper
  );
};

// Compute SMA from closes
const computeSMA = (data: BarData[], period: number): (number | null)[] => {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((sum, b) => sum + b.c, 0) / period;
  });
};

// Compute RSI from closes
const computeRSI = (data: BarData[], period = 14): (number | null)[] => {
  const result: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period + 1) return result;
  
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i].c - data[i - 1].c;
    if (diff >= 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].c - data[i - 1].c;
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
};

// Compute VWAP from bars
const computeVWAP = (data: BarData[]): (number | null)[] => {
  let cumPV = 0, cumVol = 0;
  return data.map(bar => {
    const tp = (bar.h + bar.l + bar.c) / 3;
    cumPV += tp * bar.v;
    cumVol += bar.v;
    return cumVol > 0 ? cumPV / cumVol : null;
  });
};

type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
type ChartMode = 'line' | 'candle';

export const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { watchlist, positions, quickTradeEnabled, setQuickTradeEnabled, submitOrder, addToWatchlist } = useTradingState();
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [chartMode, setChartMode] = useState<ChartMode>('candle');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [bars, setBars] = useState<BarData[]>([]);
  const [barsLoading, setBarsLoading] = useState(true);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const upperSymbol = symbol?.toUpperCase() || '';
  const isCrypto = isCryptoSymbol(upperSymbol);
  const watchlistStock = watchlist.find(s => s.symbol === upperSymbol);
  const position = positions.find(p => p.symbol === upperSymbol);
  const isOnWatchlist = !!watchlistStock;

  // Fetch price data
  useEffect(() => {
    const fetchStockData = async () => {
      if (!upperSymbol) return;
      if (watchlistStock) {
        setStockData({
          symbol: watchlistStock.symbol, name: watchlistStock.name,
          price: watchlistStock.price, change: watchlistStock.change,
          changePercent: watchlistStock.changePercent,
          bidPrice: watchlistStock.bidPrice, askPrice: watchlistStock.askPrice,
        });
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('market-data', {
          body: { symbols: [upperSymbol] }
        });
        if (!error && data?.data?.[upperSymbol]) {
          const md = data.data[upperSymbol];
          const name = isCrypto ? CRYPTO_NAMES[upperSymbol] || upperSymbol.replace('/USD', '') : STOCK_NAMES[upperSymbol] || upperSymbol;
          setStockData({ symbol: upperSymbol, name, price: md.lastPrice || 0, change: md.change || 0, changePercent: md.changePercent || 0, bidPrice: md.bidPrice, askPrice: md.askPrice });
        } else {
          const name = isCrypto ? CRYPTO_NAMES[upperSymbol] || upperSymbol.replace('/USD', '') : STOCK_NAMES[upperSymbol] || upperSymbol;
          setStockData({ symbol: upperSymbol, name, price: 0, change: 0, changePercent: 0 });
        }
      } catch { 
        const name = isCrypto ? CRYPTO_NAMES[upperSymbol] || upperSymbol.replace('/USD', '') : STOCK_NAMES[upperSymbol] || upperSymbol;
        setStockData({ symbol: upperSymbol, name, price: 0, change: 0, changePercent: 0 });
      }
      setIsLoading(false);
    };
    fetchStockData();
  }, [upperSymbol, watchlistStock, isCrypto]);

  // Fetch bars
  const fetchBars = useCallback(async () => {
    if (!upperSymbol) return;
    setBarsLoading(true);
    const tfMap: Record<Timeframe, { timeframe: string; days: number }> = {
      '1D': { timeframe: '5Min', days: 1 },
      '1W': { timeframe: '30Min', days: 7 },
      '1M': { timeframe: '1Day', days: 30 },
      '3M': { timeframe: '1Day', days: 90 },
      '1Y': { timeframe: '1Day', days: 365 },
      'ALL': { timeframe: '1Week', days: 1825 },
    };
    const config = tfMap[timeframe];
    const startDate = subDays(new Date(), config.days).toISOString();
    try {
      const action = isCrypto ? 'crypto_bars' : 'bars';
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { action, symbol: upperSymbol, timeframe: config.timeframe, start: startDate }
      });
      if (!error && data?.data) {
        let rawBars = data.data.bars;
        if (isCrypto && rawBars && typeof rawBars === 'object' && !Array.isArray(rawBars)) {
          const cryptoKey = Object.keys(rawBars)[0];
          rawBars = rawBars[cryptoKey];
        }
        if (Array.isArray(rawBars) && rawBars.length > 0) {
          setBars(rawBars);
        }
      }
    } catch (err) { console.error('Bars error:', err); }
    setBarsLoading(false);
  }, [upperSymbol, timeframe, isCrypto]);

  useEffect(() => { fetchBars(); }, [fetchBars]);

  // Fetch news
  useEffect(() => {
    const fetchNews = async () => {
      if (!upperSymbol) return;
      setNewsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('market-data', {
          body: { action: 'news', symbol: upperSymbol }
        });
        if (!error && data?.data) {
          setNews(data.data);
        }
      } catch (err) { console.error('News error:', err); }
      setNewsLoading(false);
    };
    fetchNews();
  }, [upperSymbol]);

  const stock = stockData;
  const isPositive = stock ? stock.change >= 0 : true;

  // Chart data with indicators
  const chartData = useMemo(() => {
    if (bars.length === 0) return [];
    const sma20 = computeSMA(bars, 20);
    const sma50 = computeSMA(bars, Math.min(50, bars.length));
    const vwap = computeVWAP(bars);
    
    return bars.map((bar, i) => ({
      time: bar.t,
      label: timeframe === '1D' 
        ? format(new Date(bar.t), 'HH:mm')
        : timeframe === '1W'
          ? format(new Date(bar.t), 'EEE HH:mm')
          : format(new Date(bar.t), 'MMM d'),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
      sma20: sma20[i],
      sma50: sma50[i],
      vwap: vwap[i],
      // For candlestick rendering
      isGreen: bar.c >= bar.o,
      body: [Math.min(bar.o, bar.c), Math.max(bar.o, bar.c)],
      wick: [bar.l, bar.h],
    }));
  }, [bars, timeframe]);

  // RSI
  const rsiData = useMemo(() => {
    if (bars.length === 0) return [];
    const rsi = computeRSI(bars);
    return bars.map((bar, i) => ({
      label: timeframe === '1D' ? format(new Date(bar.t), 'HH:mm') : format(new Date(bar.t), 'MMM d'),
      rsi: rsi[i],
    }));
  }, [bars, timeframe]);

  // Derived stats
  const stats = useMemo(() => {
    if (bars.length === 0) return null;
    const latest = bars[bars.length - 1];
    const first = bars[0];
    const highs = bars.map(b => b.h);
    const lows = bars.map(b => b.l);
    const vols = bars.map(b => b.v);
    const periodHigh = Math.max(...highs);
    const periodLow = Math.min(...lows);
    const avgVol = vols.reduce((s, v) => s + v, 0) / vols.length;
    const periodChange = latest.c - first.o;
    const periodChangePct = first.o > 0 ? (periodChange / first.o) * 100 : 0;
    
    // Current RSI
    const rsi = computeRSI(bars);
    const currentRSI = rsi[rsi.length - 1];
    
    // SMA values
    const sma20 = computeSMA(bars, 20);
    const currentSMA20 = sma20[sma20.length - 1];
    const sma50 = computeSMA(bars, Math.min(50, bars.length));
    const currentSMA50 = sma50[sma50.length - 1];

    return {
      dayHigh: latest.h, dayLow: latest.l, dayOpen: latest.o, dayClose: latest.c,
      periodHigh, periodLow, avgVol, periodChange, periodChangePct,
      currentRSI, currentSMA20, currentSMA50,
      totalVolume: vols.reduce((s, v) => s + v, 0),
    };
  }, [bars]);

  // Signal summary
  const signalSummary = useMemo(() => {
    if (!stats || !stock) return null;
    const signals: string[] = [];
    if (stats.currentRSI !== null) {
      if (stats.currentRSI > 70) signals.push('RSI overbought');
      else if (stats.currentRSI < 30) signals.push('RSI oversold');
      else signals.push('RSI neutral');
    }
    if (stats.currentSMA20 && stock.price > stats.currentSMA20) signals.push('Above SMA20');
    else if (stats.currentSMA20) signals.push('Below SMA20');
    if (stats.currentSMA50 && stock.price > stats.currentSMA50) signals.push('Above SMA50');
    else if (stats.currentSMA50) signals.push('Below SMA50');
    
    const bullish = signals.filter(s => s.includes('Above') || s.includes('oversold')).length;
    const bearish = signals.filter(s => s.includes('Below') || s.includes('overbought')).length;
    const bias = bullish > bearish ? 'Bullish' : bearish > bullish ? 'Bearish' : 'Neutral';
    return { signals, bias };
  }, [stats, stock]);

  const handleOpenTrade = (side: 'buy' | 'sell') => {
    setTradeSide(side);
    setTradeDrawerOpen(true);
  };

  const stockForDrawer: Stock | null = stock ? {
    symbol: stock.symbol, name: stock.name, price: stock.price,
    change: stock.change, changePercent: stock.changePercent,
    bidPrice: stock.bidPrice, askPrice: stock.askPrice,
    assetType: isCrypto ? 'crypto' : 'stock',
  } : null;

  const displaySymbol = isCrypto ? (stock?.symbol || upperSymbol).replace('/USD', '') : (stock?.symbol || upperSymbol);
  const timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading {upperSymbol}...</p>
        </div>
      </div>
    );
  }

  if (!stock || stock.price === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center mx-auto mb-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold mb-2">Symbol not found</h2>
          <p className="text-sm text-muted-foreground mb-4">We couldn't find data for "{upperSymbol}".</p>
          <div className="mb-4"><StockSearch placeholder="Search..." /></div>
          <Button onClick={() => navigate('/')} variant="outline" size="sm" className="rounded-xl">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Custom tooltip for chart
  const ChartTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="bg-card border border-border/50 rounded-lg p-3 shadow-xl text-xs space-y-1">
        <p className="font-medium text-foreground">{d.label}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span className="text-muted-foreground">O</span><span className="font-mono text-foreground">${d.open?.toFixed(2)}</span>
          <span className="text-muted-foreground">H</span><span className="font-mono text-success">${d.high?.toFixed(2)}</span>
          <span className="text-muted-foreground">L</span><span className="font-mono text-destructive">${d.low?.toFixed(2)}</span>
          <span className="text-muted-foreground">C</span><span className="font-mono text-foreground">${d.close?.toFixed(2)}</span>
        </div>
        {d.volume > 0 && (
          <p className="text-muted-foreground pt-1 border-t border-border/30">Vol: {(d.volume / 1000).toFixed(0)}K</p>
        )}
      </div>
    );
  };

  // Min/max for chart domain
  const priceMin = chartData.length > 0 ? Math.min(...chartData.map(d => d.low)) * 0.998 : 0;
  const priceMax = chartData.length > 0 ? Math.max(...chartData.map(d => d.high)) * 1.002 : 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl h-8 w-8 md:h-9 md:w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className={cn("p-1.5 md:p-2 rounded-xl", isCrypto ? "bg-orange-500/20" : isPositive ? "bg-success/20" : "bg-destructive/20")}>
                {isCrypto ? <Bitcoin className="h-4 w-4 md:h-5 md:w-5 text-orange-500" /> : <BarChart3 className={cn("h-4 w-4 md:h-5 md:w-5", isPositive ? "text-success" : "text-destructive")} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base md:text-lg">{displaySymbol}</h1>
                  {isCrypto && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-500 font-medium">CRYPTO</span>}
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">{stock.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isOnWatchlist && (
                <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs gap-1" onClick={() => addToWatchlist(upperSymbol)}>
                  <Eye className="h-3 w-3" /> Watch
                </Button>
              )}
              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setShowSearch(!showSearch)}>
                <Search className="h-4 w-4" />
              </Button>
              {isCrypto ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
                  <Clock className="h-3 w-3 text-orange-500" /><span className="text-xs font-medium text-orange-500">24/7</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /><span className="text-xs font-medium text-success">Live</span>
                </div>
              )}
            </div>
          </div>
          {showSearch && (
            <div className="mt-2 pb-1">
              <StockSearch onClose={() => setShowSearch(false)} />
            </div>
          )}
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-3 md:p-6">
        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left column - Chart + TA */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Price Hero */}
            <div className={cn("stat-card !p-4 md:!p-6", isPositive ? "gradient-gain" : "gradient-loss")}>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                  <p className="font-mono text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-1.5">
                    ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className={cn('flex items-center gap-2', isPositive ? 'text-success' : 'text-destructive')}>
                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-mono text-sm md:text-base font-bold">
                      {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </span>
                    <span className="text-muted-foreground text-xs">Today</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleOpenTrade('buy')} className="rounded-xl h-10 px-5 text-sm font-semibold bg-success hover:bg-success/90 text-success-foreground">
                    <Plus className="h-4 w-4 mr-1" /> Buy
                  </Button>
                  <Button onClick={() => handleOpenTrade('sell')} className="rounded-xl h-10 px-5 text-sm font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    <Minus className="h-4 w-4 mr-1" /> Sell
                  </Button>
                  {!isCrypto && (
                    <Button onClick={() => navigate(`/options/${encodeURIComponent(stock.symbol)}`)} variant="outline" className="rounded-xl h-10 px-4 text-sm border-primary/40 hover:bg-primary/10">
                      <LineChart className="h-4 w-4 mr-1.5" /> Options
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="glass-card-elevated rounded-xl md:rounded-2xl overflow-hidden">
              <div className="p-3 md:p-4 border-b border-border/30 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm md:text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Chart
                  </h2>
                  <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5">
                    <button onClick={() => setChartMode('line')} className={cn("px-2 py-1 rounded-md text-[10px] font-medium transition-all", chartMode === 'line' && "bg-primary text-primary-foreground")}>
                      Line
                    </button>
                    <button onClick={() => setChartMode('candle')} className={cn("px-2 py-1 rounded-md text-[10px] font-medium transition-all", chartMode === 'candle' && "bg-primary text-primary-foreground")}>
                      <CandlestickChart className="h-3 w-3 inline mr-0.5" />Candle
                    </button>
                  </div>
                </div>
                <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5">
                  {timeframes.map(tf => (
                    <Button key={tf} variant="ghost" size="sm"
                      className={cn('text-[10px] md:text-xs px-2 md:px-3 h-7 rounded-md transition-all', timeframe === tf && 'bg-primary text-primary-foreground')}
                      onClick={() => setTimeframe(tf)}>
                      {tf}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="p-2 md:p-4 h-64 md:h-80 lg:h-96">
                {barsLoading && bars.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No chart data available. Connect your brokerage in Settings.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={40} />
                      <YAxis domain={[priceMin, priceMax]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} width={55} />
                      <Tooltip content={<ChartTooltipContent />} />
                      
                      {/* SMA lines */}
                      <Line type="monotone" dataKey="sma20" stroke="hsl(var(--primary))" strokeWidth={1} dot={false} strokeDasharray="4 2" opacity={0.6} />
                      <Line type="monotone" dataKey="sma50" stroke="hsl(var(--warning))" strokeWidth={1} dot={false} strokeDasharray="4 2" opacity={0.6} />
                      
                      {chartMode === 'line' ? (
                        <>
                          <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="close" stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} strokeWidth={2} fill="url(#priceGradient)" dot={false} />
                        </>
                      ) : (
                        <>
                          {/* Candle wicks as thin bars */}
                          <Bar dataKey="wick" barSize={1} shape={(props: any) => {
                            const { x, y, width, height, payload } = props;
                            if (!payload?.wick) return null;
                            const yMin = props.y;
                            const yMax = yMin + (props.height || 0);
                            return <line x1={x + width / 2} y1={yMin} x2={x + width / 2} y2={yMax} stroke={payload.isGreen ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} strokeWidth={1} />;
                          }} />
                          {/* Candle bodies */}
                          <Bar dataKey="body" barSize={Math.min(8, Math.max(2, 600 / chartData.length))} shape={(props: any) => {
                            const { x, y, width, height, payload } = props;
                            if (!payload?.body) return null;
                            return <rect x={x} y={y} width={width} height={Math.max(height, 1)} fill={payload.isGreen ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} rx={1} />;
                          }} />
                        </>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Volume bar below chart */}
              {chartData.length > 0 && (
                <div className="px-2 md:px-4 pb-2 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                      <XAxis dataKey="label" hide />
                      <YAxis hide />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" opacity={0.3} radius={[1, 1, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Technical Analysis */}
            {stats && (
              <div className="glass-card-elevated rounded-xl md:rounded-2xl p-4 md:p-5">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Technical Analysis
                  {signalSummary && (
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      signalSummary.bias === 'Bullish' && "bg-success/20 text-success",
                      signalSummary.bias === 'Bearish' && "bg-destructive/20 text-destructive",
                      signalSummary.bias === 'Neutral' && "bg-muted text-muted-foreground",
                    )}>
                      {signalSummary.bias}
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <span className="text-[10px] text-muted-foreground block mb-1">RSI (14)</span>
                    <span className={cn("font-mono font-bold text-lg", 
                      stats.currentRSI !== null && stats.currentRSI > 70 ? "text-destructive" :
                      stats.currentRSI !== null && stats.currentRSI < 30 ? "text-success" : "text-foreground"
                    )}>
                      {stats.currentRSI?.toFixed(1) || '—'}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {stats.currentRSI !== null && stats.currentRSI > 70 ? 'Overbought' : stats.currentRSI !== null && stats.currentRSI < 30 ? 'Oversold' : 'Neutral'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <span className="text-[10px] text-muted-foreground block mb-1">SMA 20</span>
                    <span className="font-mono font-bold text-lg">${stats.currentSMA20?.toFixed(2) || '—'}</span>
                    {stats.currentSMA20 && (
                      <span className={cn("text-[10px] block", stock.price > stats.currentSMA20 ? "text-success" : "text-destructive")}>
                        {stock.price > stats.currentSMA20 ? 'Price above' : 'Price below'}
                      </span>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <span className="text-[10px] text-muted-foreground block mb-1">SMA 50</span>
                    <span className="font-mono font-bold text-lg">${stats.currentSMA50?.toFixed(2) || '—'}</span>
                    {stats.currentSMA50 && (
                      <span className={cn("text-[10px] block", stock.price > stats.currentSMA50 ? "text-success" : "text-destructive")}>
                        {stock.price > stats.currentSMA50 ? 'Price above' : 'Price below'}
                      </span>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <span className="text-[10px] text-muted-foreground block mb-1">{timeframe} Change</span>
                    <span className={cn("font-mono font-bold text-lg", stats.periodChange >= 0 ? "text-success" : "text-destructive")}>
                      {stats.periodChange >= 0 ? '+' : ''}{stats.periodChangePct.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {stats.periodChange >= 0 ? '+' : ''}${stats.periodChange.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Signal chips */}
                {signalSummary && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {signalSummary.signals.map((sig, i) => (
                      <span key={i} className={cn(
                        "text-[10px] px-2 py-1 rounded-full border",
                        sig.includes('Above') || sig.includes('oversold') ? "border-success/30 text-success bg-success/10" :
                        sig.includes('Below') || sig.includes('overbought') ? "border-destructive/30 text-destructive bg-destructive/10" :
                        "border-border/30 text-muted-foreground bg-secondary/30"
                      )}>
                        {sig}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RSI Chart */}
            {rsiData.length > 0 && rsiData.some(d => d.rsi !== null) && (
              <div className="glass-card-elevated rounded-xl md:rounded-2xl overflow-hidden">
                <div className="p-3 md:p-4 border-b border-border/30">
                  <h3 className="font-bold text-sm flex items-center gap-2">RSI (14)</h3>
                </div>
                <div className="p-2 md:p-4 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={rsiData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                      <YAxis domain={[0, 100]} ticks={[30, 50, 70]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={25} />
                      <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <ReferenceLine y={30} stroke="hsl(var(--success))" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Line type="monotone" dataKey="rsi" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* News Feed */}
            <div className="glass-card-elevated rounded-xl md:rounded-2xl p-4 md:p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-primary" /> News & Events
                <span className="text-[10px] text-muted-foreground ml-auto">{news.length} articles</span>
              </h3>
              {newsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : news.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No recent news for {displaySymbol}.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                  {news.map(article => (
                    <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer"
                      className="block p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{article.headline}</p>
                          {article.summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                            <span>{article.source}</span>
                            <span>•</span>
                            <span>{format(new Date(article.created_at), 'MMM d, h:mm a')}</span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Market Data, Position, Quick Trade */}
          <div className="space-y-4 md:space-y-6">
            {/* Market Data */}
            <div className="glass-card-elevated rounded-xl md:rounded-2xl p-4 md:p-5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Market Data
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Bid', value: stock.bidPrice?.toFixed(2), color: 'text-destructive' },
                  { label: 'Ask', value: stock.askPrice?.toFixed(2), color: 'text-success' },
                  { label: 'Spread', value: stock.bidPrice && stock.askPrice ? `$${(stock.askPrice - stock.bidPrice).toFixed(2)}` : undefined },
                  ...(stats ? [
                    { label: 'Day Open', value: `$${stats.dayOpen.toFixed(2)}` },
                    { label: 'Day High', value: `$${stats.dayHigh.toFixed(2)}`, color: 'text-success' },
                    { label: 'Day Low', value: `$${stats.dayLow.toFixed(2)}`, color: 'text-destructive' },
                    { label: `${timeframe} High`, value: `$${stats.periodHigh.toFixed(2)}`, color: 'text-success' },
                    { label: `${timeframe} Low`, value: `$${stats.periodLow.toFixed(2)}`, color: 'text-destructive' },
                    { label: 'Avg Volume', value: stats.avgVol > 1e6 ? `${(stats.avgVol / 1e6).toFixed(1)}M` : `${(stats.avgVol / 1e3).toFixed(0)}K` },
                  ] : []),
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={cn("font-mono text-sm font-medium", color || 'text-foreground')}>
                      {value || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Position */}
            {position && (
              <div className="glass-card-elevated rounded-xl md:rounded-2xl p-4 md:p-5 border-primary/20">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Your Position
                </h3>
                <div className="space-y-2">
                  {[
                    { label: isCrypto ? 'Amount' : 'Shares', value: String(position.qty) },
                    { label: 'Avg Cost', value: `$${position.avgPrice.toFixed(2)}` },
                    { label: 'Market Value', value: `$${position.marketValue.toLocaleString()}` },
                    { label: 'P/L', value: `${position.unrealizedPL >= 0 ? '+' : ''}$${position.unrealizedPL.toFixed(2)}`, color: position.unrealizedPL >= 0 ? 'text-success' : 'text-destructive' },
                    { label: 'P/L %', value: `${position.unrealizedPLPercent >= 0 ? '+' : ''}${position.unrealizedPLPercent.toFixed(2)}%`, color: position.unrealizedPLPercent >= 0 ? 'text-success' : 'text-destructive' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className={cn("font-mono text-sm font-bold", color || 'text-foreground')}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* News sentiment summary */}
            {news.length > 0 && (
              <div className="glass-card-elevated rounded-xl md:rounded-2xl p-4 md:p-5">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" /> News Pulse
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground">Articles (24h)</span>
                    <span className="font-mono text-sm font-bold">{news.filter(n => new Date(n.created_at) > subDays(new Date(), 1)).length}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground">Articles (7d)</span>
                    <span className="font-mono text-sm font-bold">{news.filter(n => new Date(n.created_at) > subDays(new Date(), 7)).length}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground">Sources</span>
                    <span className="font-mono text-sm font-bold">{new Set(news.map(n => n.source)).size}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trade Ticket Drawer */}
      <TradeTicketDrawer
        isOpen={tradeDrawerOpen}
        onClose={() => setTradeDrawerOpen(false)}
        symbol={stock.symbol}
        side={tradeSide}
        stock={stockForDrawer}
        isCrypto={isCrypto}
        quickTradeEnabled={quickTradeEnabled}
        onQuickTradeToggle={setQuickTradeEnabled}
        onSubmit={submitOrder}
      />
    </div>
  );
};
