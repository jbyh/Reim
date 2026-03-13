import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portfolio } from '@/types/trading';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PortfolioValueChartProps {
  portfolio: Portfolio;
}

type PeriodKey = '1D' | '1W' | '1M' | '3M' | '1A';

const PERIODS: { key: PeriodKey; label: string; period: string; timeframe: string }[] = [
  { key: '1D', label: '1D', period: '1D', timeframe: '5Min' },
  { key: '1W', label: '1W', period: '1W', timeframe: '1H' },
  { key: '1M', label: '1M', period: '1M', timeframe: '1D' },
  { key: '3M', label: '3M', period: '3M', timeframe: '1D' },
  { key: '1A', label: '1Y', period: '1A', timeframe: '1D' },
];

interface HistoryPoint {
  date: string;
  value: number;
}

export const PortfolioValueChart = ({ portfolio }: PortfolioValueChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('1M');
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      const config = PERIODS.find(p => p.key === selectedPeriod)!;
      try {
        const { data, error: fnError } = await supabase.functions.invoke('market-data', {
          body: { action: 'portfolio_history', period: config.period, timeframe: config.timeframe },
        });

        if (cancelled) return;

        if (fnError || !data?.data) {
          setError('Could not load history');
          setHistoryData([]);
          return;
        }

        const raw = data.data;
        const timestamps: number[] = raw.timestamp || [];
        const equities: number[] = raw.equity || [];

        const points: HistoryPoint[] = timestamps.map((ts: number, i: number) => ({
          date: format(new Date(ts * 1000), selectedPeriod === '1D' ? 'h:mm a' : 'MMM d'),
          value: equities[i] ?? 0,
        })).filter((p: HistoryPoint) => p.value > 0);

        setHistoryData(points);
      } catch {
        if (!cancelled) {
          setError('Could not load history');
          setHistoryData([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchHistory();
    return () => { cancelled = true; };
  }, [selectedPeriod]);

  const chartData = historyData.length > 0 ? historyData : null;

  const periodChange = useMemo(() => {
    if (!chartData || chartData.length < 2) return { value: portfolio.dayPL, percent: portfolio.dayPLPercent };
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    const change = last - first;
    const pct = first > 0 ? (change / first) * 100 : 0;
    return { value: change, percent: pct };
  }, [chartData, portfolio.dayPL, portfolio.dayPLPercent]);

  const isPositive = periodChange.value >= 0;

  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 100];
    const values = chartData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const padding = range > 0 ? range * 0.15 : max * 0.02;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground mb-0.5">Portfolio Value</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-foreground truncate">
            ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0",
          isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? '+' : ''}{periodChange.percent.toFixed(2)}%
        </div>
      </div>

      {/* Period selector */}
      <div className="px-3 sm:px-4 pb-2 flex gap-1" role="tablist" aria-label="Chart period">
        {PERIODS.map(p => (
          <button
            key={p.key}
            role="tab"
            aria-selected={selectedPeriod === p.key}
            onClick={() => setSelectedPeriod(p.key)}
            className={cn(
              "px-2 py-1 rounded-md text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedPeriod === p.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart — flex-1 fills remaining space */}
      <div className="flex-1 min-h-[140px] max-h-[220px] px-1">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error || !chartData ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-muted-foreground">{error || 'No data available'}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? "hsl(142, 70%, 50%)" : "hsl(0, 85%, 60%)"} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isPositive ? "hsl(142, 70%, 50%)" : "hsl(0, 85%, 60%)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 9 }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={yDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 20%, 45%)', fontSize: 9 }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-[10px] text-muted-foreground">{payload[0].payload.date}</p>
                        <p className="font-mono text-sm font-semibold text-foreground">
                          ${Number(payload[0].value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "hsl(142, 70%, 50%)" : "hsl(0, 85%, 60%)"}
                strokeWidth={2}
                fill="url(#portfolioGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 p-3 border-t border-border/30">
        <div className="text-center min-w-0">
          <p className="text-[10px] text-muted-foreground mb-0.5">Period P&L</p>
          <p className={cn(
            "text-xs font-semibold font-mono truncate",
            periodChange.value >= 0 ? "text-success" : "text-destructive"
          )}>
            {periodChange.value >= 0 ? '+' : ''}${periodChange.value.toFixed(2)}
          </p>
        </div>
        <div className="text-center min-w-0">
          <p className="text-[10px] text-muted-foreground mb-0.5">Cash</p>
          <p className="text-xs font-semibold font-mono text-foreground truncate">
            ${(portfolio.cash / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="text-center min-w-0">
          <p className="text-[10px] text-muted-foreground mb-0.5">Buying Power</p>
          <p className="text-xs font-semibold font-mono text-foreground truncate">
            ${(portfolio.buyingPower / 1000).toFixed(1)}k
          </p>
        </div>
      </div>
    </div>
  );
};
