import { Portfolio, Position } from '@/types/trading';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, 
  PieChart, Activity, Zap 
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
  const allocationPercent = ((totalPositionValue / portfolio.equity) * 100).toFixed(1);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header with gradient */}
      <div className="relative px-4 py-5 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 glow-primary">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Overview</p>
              <p className="font-mono text-2xl font-bold text-gradient-primary">
                ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-success animate-pulse" />
            <MiniChart positive={portfolio.dayPL >= 0} width={60} height={28} />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 divide-x divide-border/30">
        <div className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Today</p>
          <div className={cn(
            'flex items-center justify-center gap-1 font-mono font-semibold',
            portfolio.dayPL >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {portfolio.dayPL >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>{portfolio.dayPL >= 0 ? '+' : ''}{portfolio.dayPLPercent.toFixed(2)}%</span>
          </div>
        </div>
        
        <div className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total</p>
          <div className={cn(
            'flex items-center justify-center gap-1 font-mono font-semibold',
            portfolio.totalPL >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {portfolio.totalPL >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>{portfolio.totalPL >= 0 ? '+' : ''}{portfolio.totalPLPercent.toFixed(2)}%</span>
          </div>
        </div>
        
        <div className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Positions</p>
          <div className="flex items-center justify-center gap-1 font-mono font-semibold">
            <PieChart className="h-3.5 w-3.5 text-primary" />
            <span>{positionCount}</span>
          </div>
        </div>
        
        <div className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Allocated</p>
          <div className="flex items-center justify-center gap-1 font-mono font-semibold">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>{allocationPercent}%</span>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Cash</span>
          </div>
          <span className="font-mono font-semibold">${portfolio.cash.toLocaleString()}</span>
        </div>
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Buying Power</span>
          </div>
          <span className="font-mono font-semibold">${portfolio.buyingPower.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
