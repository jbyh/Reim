import { useState, useEffect } from 'react';
import { Position, BarData, Activity } from '@/types/trading';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, subMonths } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine
} from 'recharts';

interface PositionDetailProps {
  position: Position;
  activities: Activity[];
  onBack: () => void;
}

type TimeframeType = '1W' | '1M' | '3M' | '1Y';

export const PositionDetail = ({ position, activities, onBack }: PositionDetailProps) => {
  const [bars, setBars] = useState<BarData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeType>('1M');

  const trades = activities.filter(
    (a) => a.activity_type === 'FILL' && a.symbol === position.symbol
  );

  const fetchBars = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      let startDate: Date;
      let tf = '1Day';

      switch (timeframe) {
        case '1W':
          startDate = subDays(endDate, 7);
          tf = '1Hour';
          break;
        case '1M':
          startDate = subMonths(endDate, 1);
          break;
        case '3M':
          startDate = subMonths(endDate, 3);
          break;
        case '1Y':
          startDate = subMonths(endDate, 12);
          break;
        default:
          startDate = subMonths(endDate, 1);
      }

      const { data, error } = await supabase.functions.invoke('market-data', {
        body: {
          action: 'bars',
          symbol: position.symbol,
          timeframe: tf,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });

      if (!error && data?.data?.bars) {
        setBars(data.data.bars);
      }
    } catch (err) {
      console.error('Failed to fetch bars:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBars();
  }, [position.symbol, timeframe]);

  const chartData = bars.map((bar) => ({
    date: format(new Date(bar.t), timeframe === '1W' ? 'MMM dd HH:mm' : 'MMM dd'),
    price: bar.c,
    timestamp: new Date(bar.t).getTime(),
  }));

  // Find buy entries within the chart timeframe
  const entryPoints = trades
    .filter((t) => t.side === 'buy')
    .map((trade) => {
      const tradeTime = new Date(trade.transaction_time).getTime();
      const closestBar = chartData.reduce((closest, bar) => {
        const diff = Math.abs(bar.timestamp - tradeTime);
        const closestDiff = Math.abs(closest.timestamp - tradeTime);
        return diff < closestDiff ? bar : closest;
      }, chartData[0]);

      return closestBar
        ? {
            date: closestBar.date,
            price: parseFloat(trade.price || '0'),
            qty: trade.qty,
          }
        : null;
    })
    .filter(Boolean);

  const minPrice = Math.min(...chartData.map((d) => d.price), position.avgPrice) * 0.98;
  const maxPrice = Math.max(...chartData.map((d) => d.price), position.avgPrice) * 1.02;

  const timeframes: TimeframeType[] = ['1W', '1M', '3M', '1Y'];

  const isPositive = position.unrealizedPL >= 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 md:p-6 border-b border-border/40">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Portfolio</span>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold',
                isPositive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
              )}
            >
              {position.symbol.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{position.symbol}</h2>
              <p className="text-sm text-muted-foreground">
                {position.qty} shares @ ${position.avgPrice.toFixed(2)} avg
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-foreground">
              ${position.currentPrice.toFixed(2)}
            </p>
            <div
              className={cn(
                'flex items-center justify-end gap-1 text-sm font-medium',
                isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>
                {isPositive ? '+' : ''}${position.unrealizedPL.toFixed(2)} (
                {position.unrealizedPLPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="relative z-10">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Market Value
              </p>
              <p className="font-mono text-xl font-bold text-foreground">
                ${position.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="relative z-10">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Cost Basis
              </p>
              <p className="font-mono text-xl font-bold text-foreground">
                ${(position.qty * position.avgPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="relative z-10">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Avg Entry
              </p>
              <p className="font-mono text-xl font-bold text-foreground">
                ${position.avgPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <div className={cn('stat-card', isPositive ? 'gradient-gain' : 'gradient-loss')}>
            <div className="relative z-10">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Return
              </p>
              <p
                className={cn(
                  'font-mono text-xl font-bold',
                  isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {isPositive ? '+' : ''}
                {position.unrealizedPLPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Price Chart</h3>
                <p className="text-xs text-muted-foreground">Your entry points marked</p>
              </div>
            </div>

            <div className="flex gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    timeframe === tf
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 h-[300px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No chart data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[minPrice, maxPrice]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      padding: '12px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                  />
                  <ReferenceLine
                    y={position.avgPrice}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="5 5"
                    label={{
                      value: `Avg: $${position.avgPrice.toFixed(2)}`,
                      fill: 'hsl(var(--primary))',
                      fontSize: 10,
                      position: 'right',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                    strokeWidth={2}
                    fill="url(#colorPrice)"
                  />
                  {entryPoints.map((entry, i) =>
                    entry ? (
                      <ReferenceDot
                        key={i}
                        x={entry.date}
                        y={entry.price}
                        r={6}
                        fill="hsl(var(--primary))"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ) : null
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="px-4 pb-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Your entry points</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-primary" style={{ borderStyle: 'dashed' }} />
              <span>Average cost</span>
            </div>
          </div>
        </div>

        {/* Trade History */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Trade History</h3>
                <p className="text-xs text-muted-foreground">
                  {trades.length} trades for {position.symbol}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border/30">
            {trades.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No trade history found</p>
              </div>
            ) : (
              trades.slice(0, 10).map((trade) => (
                <div key={trade.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        trade.side === 'buy'
                          ? 'bg-success/20 text-success'
                          : 'bg-destructive/20 text-destructive'
                      )}
                    >
                      {trade.side === 'buy' ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {trade.side?.toUpperCase()} {trade.qty} shares
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trade.transaction_time
                          ? format(new Date(trade.transaction_time), 'MMM dd, yyyy · h:mm a')
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-foreground">
                      ${parseFloat(trade.price || '0').toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">per share</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};