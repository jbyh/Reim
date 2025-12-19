import { Portfolio, Position } from '@/types/trading';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioPanelProps {
  portfolio: Portfolio;
  positions: Position[];
  onPositionClick?: (position: Position) => void;
}

export const PortfolioPanel = ({ portfolio, positions, onPositionClick }: PortfolioPanelProps) => {
  const totalPositionValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const allocationPercent = portfolio.equity > 0 ? (totalPositionValue / portfolio.equity) * 100 : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 space-y-6">
        {/* Equity Card */}
        <div className="balance-card">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-white/70" />
              <span className="text-sm text-white/70">Total Equity</span>
            </div>
            <p className="font-mono text-3xl md:text-4xl font-bold text-white mb-3">
              ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex flex-wrap gap-3">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                portfolio.dayPL >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
              )}>
                {portfolio.dayPL >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>
                  {portfolio.dayPL >= 0 ? '+' : ''}${portfolio.dayPL.toFixed(2)} today
                </span>
              </div>
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                portfolio.totalPL >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
              )}>
                <span>
                  {portfolio.totalPL >= 0 ? '+' : ''}{portfolio.totalPLPercent.toFixed(2)}% total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Cash</span>
              </div>
              <p className="font-mono text-xl font-bold text-foreground">
                ${portfolio.cash.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Buying Power</span>
              </div>
              <p className="font-mono text-xl font-bold text-foreground">
                ${portfolio.buyingPower.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Positions</span>
              </div>
              <p className="font-mono text-xl font-bold text-foreground">
                {positions.length}
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Allocated</span>
              </div>
              <p className="font-mono text-xl font-bold text-foreground">
                {allocationPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Positions */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <PieChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Open Positions</h3>
                <p className="text-xs text-muted-foreground">{positions.length} active holdings</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border/30">
            {positions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-3">
                  <PieChart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No open positions</p>
                <p className="text-xs text-muted-foreground mt-1">Use AI Coach to start trading</p>
              </div>
            ) : (
              positions.map((position) => (
                <button
                  key={position.symbol}
                  onClick={() => onPositionClick?.(position)}
                  className="p-4 hover:bg-secondary/30 transition-colors w-full text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                        position.unrealizedPL >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      )}>
                        {position.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{position.symbol}</span>
                        <p className="text-xs text-muted-foreground">
                          {position.qty} shares @ ${position.avgPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-foreground">
                        ${position.marketValue.toLocaleString()}
                      </p>
                      <div className={cn(
                        'flex items-center justify-end gap-1 text-sm font-medium',
                        position.unrealizedPL >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {position.unrealizedPL >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {position.unrealizedPL >= 0 ? '+' : ''}
                          ${position.unrealizedPL.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar showing allocation */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          position.unrealizedPL >= 0 ? 'bg-success' : 'bg-destructive'
                        )}
                        style={{
                          width: `${totalPositionValue > 0 ? (position.marketValue / totalPositionValue) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground min-w-[50px] text-right">
                      {totalPositionValue > 0 ? ((position.marketValue / totalPositionValue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};