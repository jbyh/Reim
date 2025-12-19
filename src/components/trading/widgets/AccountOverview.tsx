import { Portfolio, Position } from '@/types/trading';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, 
  PieChart, Activity, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MiniChart } from './MiniChart';

interface AccountOverviewProps {
  portfolio: Portfolio;
  positions: Position[];
}

export const AccountOverview = ({ portfolio, positions }: AccountOverviewProps) => {
  const positionCount = positions.length;
  const totalPositionValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const allocationPercent = portfolio.equity > 0 ? ((totalPositionValue / portfolio.equity) * 100).toFixed(1) : '0';

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header with gradient */}
      <div className="relative px-5 py-6 balance-card">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/70 mb-1">Account Overview</p>
              <p className="font-mono text-3xl font-bold text-white">
                ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MiniChart positive={portfolio.dayPL >= 0} width={80} height={36} />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 divide-x divide-border/30">
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Today</p>
          <div className={cn(
            'flex items-center justify-center gap-1 font-mono font-semibold',
            portfolio.dayPL >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {portfolio.dayPL >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{portfolio.dayPL >= 0 ? '+' : ''}{portfolio.dayPLPercent.toFixed(2)}%</span>
          </div>
        </div>
        
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total</p>
          <div className={cn(
            'flex items-center justify-center gap-1 font-mono font-semibold',
            portfolio.totalPL >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {portfolio.totalPL >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{portfolio.totalPL >= 0 ? '+' : ''}{portfolio.totalPLPercent.toFixed(2)}%</span>
          </div>
        </div>
        
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Positions</p>
          <div className="flex items-center justify-center gap-2 font-mono font-semibold">
            <PieChart className="h-4 w-4 text-primary" />
            <span>{positionCount}</span>
          </div>
        </div>
        
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Allocated</p>
          <div className="flex items-center justify-center gap-2 font-mono font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>{allocationPercent}%</span>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Cash</span>
          </div>
          <span className="font-mono font-semibold">${portfolio.cash.toLocaleString()}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Buying Power</span>
          </div>
          <span className="font-mono font-semibold">${portfolio.buyingPower.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};