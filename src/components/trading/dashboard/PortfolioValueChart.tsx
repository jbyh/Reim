import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portfolio } from '@/types/trading';
import { subDays, format } from 'date-fns';

interface PortfolioValueChartProps {
  portfolio: Portfolio;
}

export const PortfolioValueChart = ({ portfolio }: PortfolioValueChartProps) => {
  // Generate mock historical data based on current portfolio
  const chartData = useMemo(() => {
    const data = [];
    let value = portfolio.equity - portfolio.totalPL; // Approximate starting value
    const dailyChange = portfolio.totalPL / 30;
    
    for (let i = 30; i >= 0; i--) {
      const variation = (Math.random() - 0.4) * (portfolio.equity * 0.01);
      value += dailyChange + variation;
      if (i === 0) value = portfolio.equity;
      
      data.push({
        date: format(subDays(new Date(), i), 'MMM d'),
        value: Math.max(0, value),
      });
    }
    return data;
  }, [portfolio.equity, portfolio.totalPL]);

  const isPositive = portfolio.totalPL >= 0;
  const minValue = Math.min(...chartData.map(d => d.value)) * 0.995;
  const maxValue = Math.max(...chartData.map(d => d.value)) * 1.005;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Portfolio Value</p>
          <p className="text-2xl font-bold font-mono text-foreground">
            ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold",
          isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
        )}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isPositive ? '+' : ''}{portfolio.totalPLPercent.toFixed(2)}%
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="0%" 
                  stopColor={isPositive ? "hsl(142, 70%, 50%)" : "hsl(0, 85%, 60%)"} 
                  stopOpacity={0.3} 
                />
                <stop 
                  offset="100%" 
                  stopColor={isPositive ? "hsl(142, 70%, 50%)" : "hsl(0, 85%, 60%)"} 
                  stopOpacity={0} 
                />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis 
              domain={[minValue, maxValue]}
              hide
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                      <p className="font-mono font-semibold text-foreground">
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
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/30">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Today</p>
          <p className={cn(
            "text-sm font-semibold font-mono",
            portfolio.dayPL >= 0 ? "text-success" : "text-destructive"
          )}>
            {portfolio.dayPL >= 0 ? '+' : ''}${portfolio.dayPL.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Cash</p>
          <p className="text-sm font-semibold font-mono text-foreground">
            ${(portfolio.cash / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Buying Power</p>
          <p className="text-sm font-semibold font-mono text-foreground">
            ${(portfolio.buyingPower / 1000).toFixed(1)}k
          </p>
        </div>
      </div>
    </div>
  );
};
