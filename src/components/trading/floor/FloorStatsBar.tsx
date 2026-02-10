import { BarChart3, Activity, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloorStatsBarProps {
  stocks: { changePercent: number; price: number }[];
}

export const FloorStatsBar = ({ stocks }: FloorStatsBarProps) => {
  if (stocks.length === 0) return null;

  const gainers = stocks.filter(s => s.changePercent > 0).length;
  const losers = stocks.filter(s => s.changePercent < 0).length;
  const avgChange = stocks.reduce((s, st) => s + st.changePercent, 0) / stocks.length;
  const bigMovers = stocks.filter(s => Math.abs(s.changePercent) > 2).length;

  const stats = [
    { icon: TrendingUp, label: 'Advancers', value: gainers, color: 'text-success' },
    { icon: Activity, label: 'Decliners', value: losers, color: 'text-destructive' },
    { icon: BarChart3, label: 'Avg Chg', value: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`, color: avgChange >= 0 ? 'text-success' : 'text-destructive' },
    { icon: DollarSign, label: 'Big Movers', value: bigMovers, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/80">
              <Icon className={cn("h-4 w-4", stat.color)} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className={cn("font-mono text-lg font-bold", stat.color)}>{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
