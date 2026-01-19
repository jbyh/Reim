import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Zap, Target, Sparkles, Search, LineChart, Bitcoin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTradingState } from '@/hooks/useTradingState';
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockSearch } from '@/components/trading/StockSearch';
import { TradeTicketDrawer } from '@/components/trading/TradeTicketDrawer';
import { Stock } from '@/types/trading';

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

// Crypto name mappings
const CRYPTO_NAMES: Record<string, string> = {
  'BTC/USD': 'Bitcoin',
  'ETH/USD': 'Ethereum',
  'SOL/USD': 'Solana',
  'DOGE/USD': 'Dogecoin',
  'AVAX/USD': 'Avalanche',
  'LINK/USD': 'Chainlink',
  'LTC/USD': 'Litecoin',
  'XRP/USD': 'Ripple',
  'ADA/USD': 'Cardano',
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
  const { watchlist, positions, quickTradeEnabled, setQuickTradeEnabled, submitOrder } = useTradingState();
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1D');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');

  const upperSymbol = symbol?.toUpperCase() || '';
  const isCrypto = isCryptoSymbol(upperSymbol);

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
          const name = isCrypto 
            ? CRYPTO_NAMES[upperSymbol] || upperSymbol.replace('/USD', '')
            : STOCK_NAMES[upperSymbol] || upperSymbol;
          setStockData({
            symbol: upperSymbol,
            name,
            price: md.lastPrice || 0,
            change: md.change || 0,
            changePercent: md.changePercent || 0,
            bidPrice: md.bidPrice,
            askPrice: md.askPrice,
          });
        } else {
          // Fallback with mock data if API fails
          const name = isCrypto 
            ? CRYPTO_NAMES[upperSymbol] || upperSymbol.replace('/USD', '')
            : STOCK_NAMES[upperSymbol] || upperSymbol;
          setStockData({
            symbol: upperSymbol,
            name,
            price: 0,
            change: 0,
            changePercent: 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stock data:', err);
        const name = isCrypto 
          ? CRYPTO_NAMES[upperSymbol] || upperSymbol.replace('/USD', '')
          : STOCK_NAMES[upperSymbol] || upperSymbol;
        setStockData({
          symbol: upperSymbol,
          name,
          price: 0,
          change: 0,
          changePercent: 0,
        });
      }
      setIsLoading(false);
    };

    fetchStockData();
  }, [upperSymbol, watchlistStock, isCrypto]);

  const stock = stockData;
  const isPositive = stock ? stock.change >= 0 : true;
  const candleData = useMemo(() => generateCandleData(timeframe === '1D' ? 30 : 50), [timeframe]);

  const handleOpenTrade = (side: 'buy' | 'sell') => {
    setTradeSide(side);
    setTradeDrawerOpen(true);
  };

  // Convert stockData to Stock type for drawer
  const stockForDrawer: Stock | null = stock ? {
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    change: stock.change,
    changePercent: stock.changePercent,
    bidPrice: stock.bidPrice,
    askPrice: stock.askPrice,
    assetType: isCrypto ? 'crypto' : 'stock',
  } : null;

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
          <p className="text-sm text-muted-foreground mb-4">
            We couldn't find data for "{upperSymbol}".
          </p>
          <div className="mb-4">
            <StockSearch placeholder="Search..." />
          </div>
          <Button onClick={() => navigate('/')} variant="outline" size="sm" className="rounded-xl">
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

  // Calculate candle positions
  const minPrice = Math.min(...candleData.map(c => c.low));
  const maxPrice = Math.max(...candleData.map(c => c.high));
  const priceRange = maxPrice - minPrice || 1;

  // Display symbol (show BTC instead of BTC/USD for compact display)
  const displaySymbol = isCrypto ? stock.symbol.replace('/USD', '') : stock.symbol;

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl h-8 w-8 md:h-9 md:w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 md:gap-3">
                <div className={cn(
                  "p-1.5 md:p-2 rounded-xl",
                  isCrypto ? "bg-orange-500/20" : isPositive ? "bg-success/20" : "bg-destructive/20"
                )}>
                  {isCrypto ? (
                    <Bitcoin className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                  ) : (
                    <BarChart3 className={cn("h-4 w-4 md:h-5 md:w-5", isPositive ? "text-success" : "text-destructive")} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-base md:text-lg">{displaySymbol}</h1>
                    {isCrypto && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-500 font-medium">
                        CRYPTO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block">{stock.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isCrypto ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
                  <Clock className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-medium text-orange-500">24/7</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-success">Live</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-3 md:p-6 space-y-3 md:space-y-6">
        {/* Price Hero + Trade Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
          <div className={cn(
            "lg:col-span-2 stat-card !p-4 md:!p-5",
            isPositive ? "gradient-gain" : "gradient-loss"
          )}>
            <div className="flex flex-col gap-4">
              {/* Price Display */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                <p className="font-mono text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-1.5">
                  ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className={cn(
                  'flex items-center gap-2',
                  isPositive ? 'text-success' : 'text-destructive'
                )}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="font-mono text-sm md:text-base font-bold">
                    {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  </span>
                  <span className="text-muted-foreground text-xs">Today</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleOpenTrade('buy')}
                  className="rounded-xl h-9 px-4 text-sm bg-success hover:bg-success/90 text-success-foreground"
                >
                  Buy
                </Button>
                <Button
                  onClick={() => handleOpenTrade('sell')}
                  className="rounded-xl h-9 px-4 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Sell
                </Button>
                {!isCrypto && (
                  <Button 
                    onClick={() => navigate(`/options/${encodeURIComponent(stock.symbol)}`)} 
                    variant="outline" 
                    className="rounded-xl h-9 px-3 text-sm border-primary/40 hover:bg-primary/10"
                  >
                    <LineChart className="h-3.5 w-3.5 mr-1.5" />
                    Options
                  </Button>
                )}
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline" 
                  className="rounded-xl h-9 px-3 text-sm border-highlight/40 hover:bg-highlight/10"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  AI Coach
                </Button>
              </div>
            </div>
          </div>

          {/* AI Signal Card */}
          <div className="insight-card !p-4">
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="p-1.5 rounded-lg gradient-purple">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-sm text-gradient-purple">AI Signal</h3>
            </div>
            <div className="space-y-2.5 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Signal</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                )}>
                  {isPositive ? 'BULLISH' : 'BEARISH'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Confidence</span>
                <span className="font-mono font-bold text-sm text-primary">78%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Target</span>
                <span className="font-mono font-bold text-sm text-success">${priceTarget.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Candlestick Chart */}
        <div className="glass-card-elevated rounded-xl md:rounded-2xl overflow-hidden">
          <div className="p-3 md:p-4 border-b border-border/30 flex items-center justify-between">
            <h2 className="font-bold text-sm md:text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Chart
            </h2>
            <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5">
              {timeframes.map(tf => (
                <Button
                  key={tf}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-[10px] md:text-xs px-2 md:px-3 h-7 rounded-md transition-all',
                    timeframe === tf && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="p-3 md:p-4 h-48 md:h-64 lg:h-72">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 800 200"
              preserveAspectRatio="xMidYMid meet"
              className="overflow-visible"
            >
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <line 
                  key={i}
                  x1="0" 
                  y1={i * 40 + 20} 
                  x2="800" 
                  y2={i * 40 + 20} 
                  stroke="hsl(var(--border))" 
                  strokeOpacity="0.2"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Support Line */}
              <line 
                x1="0" 
                y1={180 - ((supportLevel - minPrice) / priceRange) * 160} 
                x2="800" 
                y2={180 - ((supportLevel - minPrice) / priceRange) * 160}
                stroke="hsl(var(--success))"
                strokeWidth="1"
                strokeDasharray="6 3"
                strokeOpacity="0.5"
              />

              {/* Resistance Line */}
              <line 
                x1="0" 
                y1={180 - ((resistanceLevel - minPrice) / priceRange) * 160} 
                x2="800" 
                y2={180 - ((resistanceLevel - minPrice) / priceRange) * 160}
                stroke="hsl(var(--destructive))"
                strokeWidth="1"
                strokeDasharray="6 3"
                strokeOpacity="0.5"
              />
              
              {/* Candlesticks */}
              {candleData.map((candle, i) => {
                const x = (i / (candleData.length - 1)) * 780 + 10;
                const candleWidth = 780 / candleData.length * 0.6;
                const isGreen = candle.close >= candle.open;
                
                const highY = 180 - ((candle.high - minPrice) / priceRange) * 160;
                const lowY = 180 - ((candle.low - minPrice) / priceRange) * 160;
                const openY = 180 - ((candle.open - minPrice) / priceRange) * 160;
                const closeY = 180 - ((candle.close - minPrice) / priceRange) * 160;
                
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={isGreen ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      strokeWidth="1"
                    />
                    <rect
                      x={x - candleWidth / 2}
                      y={Math.min(openY, closeY)}
                      width={candleWidth}
                      height={Math.abs(closeY - openY) || 2}
                      fill={isGreen ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      rx="1"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Price Targets & Market Data - 2 col grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {/* Price Targets */}
          <div className="glass-card-elevated rounded-xl md:rounded-2xl p-4 md:p-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-success" />
              Price Levels
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-success/10 border border-success/30">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Target</span>
                  <span className="font-mono text-base md:text-lg font-bold text-success">${priceTarget.toFixed(2)}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-bold">
                  +{((priceTarget / stock.price - 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Stop Loss</span>
                  <span className="font-mono text-base md:text-lg font-bold text-destructive">${stopLoss.toFixed(2)}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[10px] font-bold">
                  {((stopLoss / stock.price - 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Risk/Reward</span>
                  <span className="font-mono text-base md:text-lg font-bold text-primary">1:2.5</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                  Favorable
                </span>
              </div>
            </div>
          </div>

          {/* Market Data */}
          <div className="glass-card-elevated rounded-xl md:rounded-2xl p-4 md:p-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Market Data
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-secondary/30">
                <span className="text-[10px] text-muted-foreground block">Bid</span>
                <span className="font-mono font-semibold text-sm">${stock.bidPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30">
                <span className="text-[10px] text-muted-foreground block">Ask</span>
                <span className="font-mono font-semibold text-sm">${stock.askPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30">
                <span className="text-[10px] text-muted-foreground block">Day High</span>
                <span className="font-mono font-semibold text-sm text-success">${dayHigh.toFixed(2)}</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30">
                <span className="text-[10px] text-muted-foreground block">Day Low</span>
                <span className="font-mono font-semibold text-sm text-destructive">${dayLow.toFixed(2)}</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30">
                <span className="text-[10px] text-muted-foreground block">52W High</span>
                <span className="font-mono font-semibold text-sm">${week52High.toFixed(2)}</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30">
                <span className="text-[10px] text-muted-foreground block">52W Low</span>
                <span className="font-mono font-semibold text-sm">${week52Low.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Position */}
        {position && (
          <div className="glass-card-elevated rounded-xl md:rounded-2xl p-4 md:p-5 glow-primary">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Your Position
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <div className="p-2.5 md:p-3 rounded-lg bg-secondary/30">
                <p className="text-[10px] text-muted-foreground mb-0.5">{isCrypto ? 'Amount' : 'Shares'}</p>
                <p className="font-mono text-lg md:text-xl font-bold">{position.qty}</p>
              </div>
              <div className="p-2.5 md:p-3 rounded-lg bg-secondary/30">
                <p className="text-[10px] text-muted-foreground mb-0.5">Avg Cost</p>
                <p className="font-mono text-lg md:text-xl font-bold">${position.avgPrice.toFixed(2)}</p>
              </div>
              <div className="p-2.5 md:p-3 rounded-lg bg-secondary/30">
                <p className="text-[10px] text-muted-foreground mb-0.5">Value</p>
                <p className="font-mono text-lg md:text-xl font-bold">${position.marketValue.toLocaleString()}</p>
              </div>
              <div className={cn(
                "p-2.5 md:p-3 rounded-lg",
                position.unrealizedPL >= 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                <p className="text-[10px] text-muted-foreground mb-0.5">P/L</p>
                <p className={cn(
                  'font-mono text-lg md:text-xl font-bold',
                  position.unrealizedPL >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {position.unrealizedPL >= 0 ? '+' : ''}${position.unrealizedPL.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
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
