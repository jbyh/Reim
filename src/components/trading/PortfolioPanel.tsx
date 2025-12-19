import { Portfolio, Position } from '@/types/trading';
import { Wallet, TrendingUp, TrendingDown, PieChart, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioPanelProps {
  portfolio: Portfolio;
  positions: Position[];
}

export const PortfolioPanel = ({ portfolio, positions }: PortfolioPanelProps) => {
  const totalPositionValue = positions.reduce((sum, p) => sum + p.marketValue, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Portfolio</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Equity Card */}
        <div className="glass-card rounded-xl p-4 glow-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Equity</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <p className="font-mono text-3xl font-bold text-gradient-primary">
            ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className={cn(
            'flex items-center gap-1 mt-2 text-sm font-medium',
            portfolio.dayPL >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {portfolio.dayPL >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>
              {portfolio.dayPL >= 0 ? '+' : ''}${portfolio.dayPL.toFixed(2)} ({portfolio.dayPLPercent.toFixed(2)}%) today
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Cash</p>
            <p className="font-mono font-semibold">${portfolio.cash.toLocaleString()}</p>
          </div>
          <div className="glass-card rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Buying Power</p>
            <p className="font-mono font-semibold">${portfolio.buyingPower.toLocaleString()}</p>
          </div>
          <div className="glass-card rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Total P&L</p>
            <p className={cn(
              'font-mono font-semibold',
              portfolio.totalPL >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {portfolio.totalPL >= 0 ? '+' : ''}${portfolio.totalPL.toLocaleString()}
            </p>
          </div>
          <div className="glass-card rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Return</p>
            <p className={cn(
              'font-mono font-semibold',
              portfolio.totalPLPercent >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {portfolio.totalPLPercent >= 0 ? '+' : ''}{portfolio.totalPLPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Positions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Open Positions</h3>
            <span className="text-xs text-muted-foreground">({positions.length})</span>
          </div>

          <div className="space-y-2">
            {positions.length === 0 ? (
              <div className="glass-card rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">No open positions</p>
              </div>
            ) : (
              positions.map((position) => (
                <div
                  key={position.symbol}
                  className="glass-card rounded-lg p-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold">{position.symbol}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {position.qty} shares
                      </span>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 text-sm font-medium',
                      position.unrealizedPL >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {position.unrealizedPL >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {position.unrealizedPL >= 0 ? '+' : ''}
                        ${position.unrealizedPL.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Avg: ${position.avgPrice.toFixed(2)}</span>
                    <span>Current: ${position.currentPrice.toFixed(2)}</span>
                    <span className={cn(
                      position.unrealizedPLPercent >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {position.unrealizedPLPercent >= 0 ? '+' : ''}
                      {position.unrealizedPLPercent.toFixed(2)}%
                    </span>
                  </div>

                  {/* Position bar */}
                  <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        position.unrealizedPL >= 0 ? 'bg-success' : 'bg-destructive'
                      )}
                      style={{
                        width: `${(position.marketValue / totalPositionValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-secondary/30">
        <p className="text-xs text-muted-foreground text-center">
          Alpaca API Integration Ready
        </p>
      </div>
    </div>
  );
};
