import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Zap, Target, Sparkles, Search, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTradingState } from '@/hooks/useTradingState';
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockSearch } from '@/components/trading/StockSearch';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  bidPrice?: number;
  askPrice?: number;
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

const generateChartData = (positive: boolean, points: number = 50) => {
  const data: number[] = [];
  let value = 100;
  for (let i = 0; i < points; i++) {
    value += (Math.random() - (positive ? 0.4 : 0.6)) * 2;
    data.push(value);
  }
  return data;
};

const generateCandleData = (points: number = 30) => {
  const data: Array<{ open: number; high: number; low: number; close: number }> = [];
  let price = 100;
  for (let i = 0; i < points; i++) {
    const open = price;
    const change = (Math.random() - 0.5) * 4;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    data.push({ open, high, low, close });
    price = close;
  }
  return data;
};

export const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { watchlist, positions, sendMessage } = useTradingState();
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1D');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const upperSymbol = symbol?.toUpperCase() || '';

  // Try to find in watchlist first, otherwise fetch from API
  const watchlistStock = watchlist.find(s => s.symbol === upperSymbol);
  const position = positions.find(p => p.symbol === upperSymbol);

  useEffect(() => {
    const fetchStockData = async () => {
      if (!upperSymbol) return;
      
      // If we have it in watchlist, use that data
      if (watchlistStock) {
        setStockData({
          symbol: watchlistStock.symbol,
          name: watchlistStock.name,
          price: watchlistStock.price,
          change: watchlistStock.change,
          changePercent: watchlistStock.changePercent,
          bidPrice: watchlistStock.bidPrice,
          askPrice: watchlistStock.askPrice,
        });
        setIsLoading(false);
        return;
      }

      // Otherwise fetch from API
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('market-data', {
          body: { symbols: [upperSymbol] }
        });

        if (!error && data?.data?.[upperSymbol]) {
          const md = data.data[upperSymbol];
          setStockData({
            symbol: upperSymbol,
            name: STOCK_NAMES[upperSymbol] || upperSymbol,
            price: md.lastPrice || 0,
            change: md.change || 0,
            changePercent: md.changePercent || 0,
            bidPrice: md.bidPrice,
            askPrice: md.askPrice,
          });
        } else {
          // Fallback with mock data if API fails
          setStockData({
            symbol: upperSymbol,
            name: STOCK_NAMES[upperSymbol] || upperSymbol,
            price: 0,
            change: 0,
            changePercent: 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stock data:', err);
        setStockData({
          symbol: upperSymbol,
          name: STOCK_NAMES[upperSymbol] || upperSymbol,
          price: 0,
          change: 0,
          changePercent: 0,
        });
      }
      setIsLoading(false);
    };

    fetchStockData();
  }, [upperSymbol, watchlistStock]);

  const stock = stockData;
  const isPositive = stock ? stock.change >= 0 : true;
  const candleData = useMemo(() => generateCandleData(timeframe === '1D' ? 30 : 50), [timeframe]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading {upperSymbol}...</p>
        </div>
      </div>
    );
  }

  if (!stock || stock.price === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Symbol not found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find market data for "{upperSymbol}". Try searching for another stock.
          </p>
          <div className="mb-6">
            <StockSearch placeholder="Search for a stock..." />
          </div>
          <Button onClick={() => navigate('/')} variant="outline" className="rounded-xl">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const timeframes: Array<'1D' | '1W' | '1M' | '3M' | '1Y'> = ['1D', '1W', '1M', '3M', '1Y'];

  // Mock data for support/resistance and signals
  const supportLevel = stock.price * 0.95;
  const resistanceLevel = stock.price * 1.08;
  const priceTarget = stock.price * 1.15;
  const stopLoss = stock.price * 0.92;

  const dayHigh = stock.price * 1.02;
  const dayLow = stock.price * 0.98;
  const week52High = stock.price * 1.15;
  const week52Low = stock.price * 0.75;
  const avgVolume = Math.floor(Math.random() * 50000000) + 10000000;
  const marketCap = stock.price * (Math.floor(Math.random() * 1000000000) + 100000000);
  const peRatio = (Math.random() * 30 + 10).toFixed(2);

  const handleQuickTrade = (side: 'buy' | 'sell') => {
    sendMessage(`${side} 10 ${stock.symbol}`);
    navigate('/');
  };

  // Calculate candle positions
  const minPrice = Math.min(...candleData.map(c => c.low));
  const maxPrice = Math.max(...candleData.map(c => c.high));
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="min-h-screen bg-background bg-gradient-radial">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  isPositive ? "bg-success/20" : "bg-destructive/20"
                )}>
                  <BarChart3 className={cn("h-6 w-6", isPositive ? "text-success" : "text-destructive")} />
                </div>
                <div>
                  <h1 className="font-bold text-2xl">{stock.symbol}</h1>
                  <p className="text-sm text-muted-foreground">{stock.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-success">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Price Hero + Trade Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={cn(
            "lg:col-span-2 stat-card",
            isPositive ? "gradient-gain" : "gradient-loss"
          )}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Price</p>
                <p className="font-mono text-6xl font-bold text-foreground mb-3">
                  ${stock.price.toFixed(2)}
                </p>
                <div className={cn(
                  'flex items-center gap-3',
                  isPositive ? 'text-success' : 'text-destructive'
                )}>
                  {isPositive ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                  <span className="font-mono text-2xl font-bold">
                    {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  </span>
                  <span className="text-muted-foreground text-sm">Today</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleQuickTrade('buy')} className="btn-buy">
                  Buy {stock.symbol}
                </button>
                <button onClick={() => handleQuickTrade('sell')} className="btn-sell">
                  Sell {stock.symbol}
                </button>
                <Button 
                  onClick={() => navigate(`/options/${stock.symbol}`)} 
                  variant="outline" 
                  className="rounded-xl border-primary/40 hover:bg-primary/10"
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  Options
                </Button>
                <Button 
                  onClick={() => {
                    sendMessage(`Tell me about ${stock.symbol} - analyze the current price action and suggest trade ideas`);
                    navigate('/');
                  }} 
                  variant="outline" 
                  className="rounded-xl border-highlight/40 hover:bg-highlight/10"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Coach
                </Button>
              </div>
            </div>
          </div>

          {/* AI Signal Card */}
          <div className="insight-card">
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 rounded-xl gradient-purple-gold">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-gradient-purple-gold">AI Signal</h3>
            </div>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recommendation</span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold",
                  isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                )}>
                  {isPositive ? 'BULLISH' : 'BEARISH'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <span className="font-mono font-bold text-highlight">78%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price Target</span>
                <span className="font-mono font-bold text-success">${priceTarget.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Candlestick Chart */}
        <div className="glass-card-elevated rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border/30 flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-highlight" />
              Price Chart
            </h2>
            <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
              {timeframes.map(tf => (
                <Button
                  key={tf}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-xs px-4 rounded-lg transition-all',
                    timeframe === tf && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="p-6 h-80">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 800 280"
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradientGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="chartGradientRed" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              {[0, 1, 2, 3, 4, 5].map(i => (
                <line 
                  key={i}
                  x1="0" 
                  y1={i * 46} 
                  x2="800" 
                  y2={i * 46} 
                  stroke="hsl(var(--border))" 
                  strokeOpacity="0.2"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Support Line */}
              <line 
                x1="0" 
                y1={240 - ((supportLevel - minPrice) / priceRange) * 220} 
                x2="800" 
                y2={240 - ((supportLevel - minPrice) / priceRange) * 220}
                stroke="hsl(var(--success))"
                strokeWidth="1"
                strokeDasharray="8 4"
                strokeOpacity="0.5"
              />
              <text 
                x="10" 
                y={235 - ((supportLevel - minPrice) / priceRange) * 220}
                fill="hsl(var(--success))"
                fontSize="10"
                fontFamily="JetBrains Mono"
              >
                Support ${supportLevel.toFixed(2)}
              </text>

              {/* Resistance Line */}
              <line 
                x1="0" 
                y1={240 - ((resistanceLevel - minPrice) / priceRange) * 220} 
                x2="800" 
                y2={240 - ((resistanceLevel - minPrice) / priceRange) * 220}
                stroke="hsl(var(--destructive))"
                strokeWidth="1"
                strokeDasharray="8 4"
                strokeOpacity="0.5"
              />
              <text 
                x="10" 
                y={235 - ((resistanceLevel - minPrice) / priceRange) * 220}
                fill="hsl(var(--destructive))"
                fontSize="10"
                fontFamily="JetBrains Mono"
              >
                Resistance ${resistanceLevel.toFixed(2)}
              </text>
              
              {/* Candlesticks */}
              {candleData.map((candle, i) => {
                const x = (i / (candleData.length - 1)) * 780 + 10;
                const candleWidth = 780 / candleData.length * 0.6;
                const isGreen = candle.close >= candle.open;
                
                const highY = 240 - ((candle.high - minPrice) / priceRange) * 220;
                const lowY = 240 - ((candle.low - minPrice) / priceRange) * 220;
                const openY = 240 - ((candle.open - minPrice) / priceRange) * 220;
                const closeY = 240 - ((candle.close - minPrice) / priceRange) * 220;
                
                return (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={isGreen ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      strokeWidth="1.5"
                    />
                    {/* Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={Math.min(openY, closeY)}
                      width={candleWidth}
                      height={Math.abs(closeY - openY) || 2}
                      fill={isGreen ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      rx="2"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Price Targets & Risk Management */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card-elevated rounded-2xl p-6">
            <h3 className="font-bold mb-5 flex items-center gap-3">
              <Target className="h-5 w-5 text-success" />
              Price Targets
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/30">
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Target Price</span>
                  <span className="font-mono text-2xl font-bold text-success">${priceTarget.toFixed(2)}</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-success/20 text-success text-sm font-bold">
                  +{((priceTarget / stock.price - 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Stop Loss</span>
                  <span className="font-mono text-2xl font-bold text-destructive">${stopLoss.toFixed(2)}</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-bold">
                  {((stopLoss / stock.price - 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-highlight/10 border border-highlight/30">
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Risk/Reward</span>
                  <span className="font-mono text-2xl font-bold text-highlight">1:2.5</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-highlight/20 text-highlight text-sm font-bold">
                  Favorable
                </span>
              </div>
            </div>
          </div>

          {/* Market Data */}
          <div className="glass-card-elevated rounded-2xl p-6">
            <h3 className="font-bold mb-5 flex items-center gap-3">
              <Activity className="h-5 w-5 text-highlight" />
              Market Data
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-xs text-muted-foreground block mb-1">Bid</span>
                <span className="font-mono font-bold">${stock.bidPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-xs text-muted-foreground block mb-1">Ask</span>
                <span className="font-mono font-bold">${stock.askPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-xs text-muted-foreground block mb-1">Day High</span>
                <span className="font-mono font-bold text-success">${dayHigh.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-xs text-muted-foreground block mb-1">Day Low</span>
                <span className="font-mono font-bold text-destructive">${dayLow.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-xs text-muted-foreground block mb-1">52W High</span>
                <span className="font-mono font-bold">${week52High.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-xs text-muted-foreground block mb-1">52W Low</span>
                <span className="font-mono font-bold">${week52Low.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-xs text-muted-foreground block mb-1">Market Cap</span>
                <span className="font-mono font-bold">${(marketCap / 1e9).toFixed(2)}B</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-xs text-muted-foreground block mb-1">Avg Volume</span>
                <span className="font-mono font-bold">{(avgVolume / 1e6).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Position */}
        {position && (
          <div className="glass-card-elevated rounded-2xl p-6 glow-primary">
            <h3 className="font-bold mb-5 flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              Your Position
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <p className="text-xs text-muted-foreground mb-2">Shares</p>
                <p className="font-mono text-3xl font-bold">{position.qty}</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-muted-foreground mb-2">Avg Cost</p>
                <p className="font-mono text-3xl font-bold">${position.avgPrice.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-muted-foreground mb-2">Market Value</p>
                <p className="font-mono text-3xl font-bold">${position.marketValue.toLocaleString()}</p>
              </div>
              <div className={cn(
                "stat-card",
                position.unrealizedPL >= 0 ? "gradient-gain" : "gradient-loss"
              )}>
                <p className="text-xs text-muted-foreground mb-2">P/L</p>
                <p className={cn(
                  'font-mono text-3xl font-bold',
                  position.unrealizedPL >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {position.unrealizedPL >= 0 ? '+' : ''}${position.unrealizedPL.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
