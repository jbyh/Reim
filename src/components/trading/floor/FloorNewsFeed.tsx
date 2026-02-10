import { useMemo } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloorNewsFeedProps {
  stocks: { symbol: string; name: string; changePercent: number; price: number }[];
}

interface Insight {
  icon: typeof TrendingUp;
  title: string;
  description: string;
  type: 'bullish' | 'bearish' | 'neutral';
  time: string;
}

export const FloorNewsFeed = ({ stocks }: FloorNewsFeedProps) => {
  const insights = useMemo<Insight[]>(() => {
    if (stocks.length === 0) return [];

    const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
    const topGainer = sorted[0];
    const topLoser = sorted[sorted.length - 1];
    const avgChange = stocks.reduce((s, st) => s + st.changePercent, 0) / stocks.length;
    const gainers = stocks.filter(s => s.changePercent > 0).length;
    const breadth = (gainers / stocks.length) * 100;

    const result: Insight[] = [];

    // Market breadth insight
    if (breadth > 65) {
      result.push({
        icon: TrendingUp,
        title: 'Broad Market Rally',
        description: `${breadth.toFixed(0)}% of tracked assets are advancing. Strong bullish breadth across sectors.`,
        type: 'bullish',
        time: 'Just now',
      });
    } else if (breadth < 35) {
      result.push({
        icon: TrendingDown,
        title: 'Broad Market Selloff',
        description: `Only ${breadth.toFixed(0)}% of tracked assets are positive. Risk-off sentiment prevails.`,
        type: 'bearish',
        time: 'Just now',
      });
    } else {
      result.push({
        icon: Minus,
        title: 'Mixed Market Session',
        description: `${breadth.toFixed(0)}% advancing — markets are split with no clear direction.`,
        type: 'neutral',
        time: 'Just now',
      });
    }

    // Top mover
    if (topGainer && topGainer.changePercent > 1) {
      result.push({
        icon: Zap,
        title: `${topGainer.symbol} Leading Gains`,
        description: `${topGainer.name} surges ${topGainer.changePercent.toFixed(2)}%, trading at $${topGainer.price.toFixed(2)}.`,
        type: 'bullish',
        time: 'Live',
      });
    }

    if (topLoser && topLoser.changePercent < -1) {
      result.push({
        icon: TrendingDown,
        title: `${topLoser.symbol} Under Pressure`,
        description: `${topLoser.name} drops ${topLoser.changePercent.toFixed(2)}%, now at $${topLoser.price.toFixed(2)}.`,
        type: 'bearish',
        time: 'Live',
      });
    }

    // Volatility insight
    const bigMovers = stocks.filter(s => Math.abs(s.changePercent) > 2);
    if (bigMovers.length >= 3) {
      result.push({
        icon: Zap,
        title: 'Elevated Volatility',
        description: `${bigMovers.length} assets moving more than 2%. High-conviction moves across the board.`,
        type: 'neutral',
        time: 'Live',
      });
    }

    // Avg performance
    result.push({
      icon: avgChange >= 0 ? TrendingUp : TrendingDown,
      title: 'Average Performance',
      description: `Tracked universe averaging ${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}% today.`,
      type: avgChange >= 0 ? 'bullish' : 'bearish',
      time: 'Session',
    });

    return result;
  }, [stocks]);

  return (
    <div className="glass-card rounded-2xl border border-border/40 overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
        <div className="p-2 rounded-xl bg-primary/20">
          <Newspaper className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Market Insights</h3>
          <p className="text-[10px] text-muted-foreground">AI-derived from live data</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border/20">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <div key={i} className="px-5 py-4 hover:bg-secondary/20 transition-colors animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg mt-0.5 flex-shrink-0",
                  insight.type === 'bullish' && "bg-success/15",
                  insight.type === 'bearish' && "bg-destructive/15",
                  insight.type === 'neutral' && "bg-warning/15",
                )}>
                  <Icon className={cn(
                    "h-3.5 w-3.5",
                    insight.type === 'bullish' && "text-success",
                    insight.type === 'bearish' && "text-destructive",
                    insight.type === 'neutral' && "text-warning",
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{insight.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
