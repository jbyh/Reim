import { Position, PerformanceAttribution as Attribution } from '@/types/trading';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceAttributionProps {
  positions: Position[];
  totalEquity: number;
}

export const PerformanceAttribution = ({ positions, totalEquity }: PerformanceAttributionProps) => {
  const totalPositionValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const cashPosition = totalEquity - totalPositionValue;
  
  // Calculate attribution for each position
  const attributions: Attribution[] = positions.map(position => {
    const allocation = (position.marketValue / totalEquity) * 100;
    const returnPct = position.unrealizedPLPercent;
    // Contribution = allocation weight × position return
    const contribution = (allocation / 100) * returnPct;
    
    return {
      symbol: position.symbol,
      allocation,
      return: returnPct,
      contribution,
      marketValue: position.marketValue,
    };
  });

  // Sort by absolute contribution (biggest movers first)
  const sortedAttributions = [...attributions].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );

  // Calculate totals
  const totalContribution = attributions.reduce((sum, a) => sum + a.contribution, 0);
  const topGainer = sortedAttributions.find(a => a.contribution > 0);
  const topLoser = sortedAttributions.find(a => a.contribution < 0);

  // Cash allocation
  const cashAllocation = (cashPosition / totalEquity) * 100;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <PieChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Performance Attribution</h3>
            <p className="text-xs text-muted-foreground">What's driving your portfolio</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Portfolio Return */}
        <div className={cn(
          "stat-card",
          totalContribution >= 0 ? "gradient-gain" : "gradient-loss"
        )}>
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Portfolio Return
            </p>
            <p className={cn(
              "font-mono text-2xl font-bold",
              totalContribution >= 0 ? "text-success" : "text-destructive"
            )}>
              {totalContribution >= 0 ? '+' : ''}{totalContribution.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Top Contributor */}
        {topGainer && (
          <div className="stat-card">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Top Gainer
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-foreground">{topGainer.symbol}</span>
                <span className="text-sm text-success font-medium">
                  +{topGainer.contribution.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top Detractor */}
        {topLoser && (
          <div className="stat-card">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Top Loser
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-foreground">{topLoser.symbol}</span>
                <span className="text-sm text-destructive font-medium">
                  {topLoser.contribution.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attribution Table */}
      <div className="divide-y divide-border/30">
        {/* Header */}
        <div className="px-4 py-3 grid grid-cols-12 gap-2 text-xs text-muted-foreground uppercase tracking-wider bg-secondary/30">
          <div className="col-span-3">Asset</div>
          <div className="col-span-2 text-right">Weight</div>
          <div className="col-span-3 text-right">Return</div>
          <div className="col-span-4 text-right">Contribution</div>
        </div>

        {/* Rows */}
        {sortedAttributions.map((attr) => (
          <div
            key={attr.symbol}
            className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-secondary/30 transition-colors"
          >
            <div className="col-span-3 flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                attr.contribution >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}>
                {attr.symbol.slice(0, 2)}
              </div>
              <span className="font-semibold text-foreground">{attr.symbol}</span>
            </div>
            <div className="col-span-2 text-right">
              <span className="font-mono text-sm text-foreground">{attr.allocation.toFixed(1)}%</span>
            </div>
            <div className="col-span-3 text-right">
              <span className={cn(
                "font-mono text-sm font-medium flex items-center justify-end gap-1",
                attr.return >= 0 ? "text-success" : "text-destructive"
              )}>
                {attr.return >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {attr.return >= 0 ? '+' : ''}{attr.return.toFixed(2)}%
              </span>
            </div>
            <div className="col-span-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      attr.contribution >= 0 ? "bg-success" : "bg-destructive"
                    )}
                    style={{
                      width: `${Math.min(Math.abs(attr.contribution) * 10, 100)}%`,
                      marginLeft: attr.contribution < 0 ? 'auto' : undefined,
                    }}
                  />
                </div>
                <span className={cn(
                  "font-mono text-sm font-semibold min-w-[60px]",
                  attr.contribution >= 0 ? "text-success" : "text-destructive"
                )}>
                  {attr.contribution >= 0 ? '+' : ''}{attr.contribution.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Cash Row */}
        {cashAllocation > 1 && (
          <div className="px-4 py-3 grid grid-cols-12 gap-2 items-center bg-secondary/20">
            <div className="col-span-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">
                $
              </div>
              <span className="font-semibold text-muted-foreground">Cash</span>
            </div>
            <div className="col-span-2 text-right">
              <span className="font-mono text-sm text-muted-foreground">{cashAllocation.toFixed(1)}%</span>
            </div>
            <div className="col-span-3 text-right">
              <span className="font-mono text-sm text-muted-foreground">0.00%</span>
            </div>
            <div className="col-span-4 text-right">
              <span className="font-mono text-sm text-muted-foreground">0.00%</span>
            </div>
          </div>
        )}
      </div>

      {/* Insight */}
      <div className="p-4 bg-secondary/20 border-t border-border/40">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium mb-1">Portfolio Insight</p>
            <p className="text-xs text-muted-foreground">
              {(() => {
                if (sortedAttributions.length === 0) {
                  return "Add positions to see performance attribution analysis.";
                }
                
                const largestPosition = sortedAttributions.reduce(
                  (max, a) => (a.allocation > max.allocation ? a : max),
                  sortedAttributions[0]
                );
                
                if (largestPosition.allocation > 50) {
                  return `Your portfolio is heavily concentrated in ${largestPosition.symbol} (${largestPosition.allocation.toFixed(0)}%). Consider diversifying to reduce single-stock risk.`;
                }
                
                if (topGainer && topLoser) {
                  const spread = topGainer.return - topLoser.return;
                  if (spread > 50) {
                    return `Large performance spread: ${topGainer.symbol} is up ${topGainer.return.toFixed(0)}% while ${topLoser.symbol} is ${topLoser.return >= 0 ? 'up' : 'down'} ${Math.abs(topLoser.return).toFixed(0)}%. Consider rebalancing.`;
                  }
                }
                
                if (cashAllocation > 30) {
                  return `You have ${cashAllocation.toFixed(0)}% in cash. Consider deploying capital if you have high-conviction ideas.`;
                }
                
                return "Your portfolio is reasonably balanced. Monitor individual position performance for rebalancing opportunities.";
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};