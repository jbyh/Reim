import { Stock } from '@/types/trading';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TopMoversProps {
  watchlist: Stock[];
}

export const TopMovers = ({ watchlist }: TopMoversProps) => {
  const navigate = useNavigate();

  const sorted = [...watchlist]
    .filter(s => s.price > 0)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 4);

  return (
    <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="px-3 py-2.5 border-b border-border/30">
        <h3 className="font-semibold text-xs text-foreground">Top Movers</h3>
        <p className="text-[10px] text-muted-foreground">From your watchlist</p>
      </div>

      <div className="divide-y divide-border/30 flex-1">
        {sorted.length === 0 ? (
          <div className="p-4 text-center flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">No watchlist data</p>
          </div>
        ) : sorted.map((stock) => {
          const isPositive = stock.changePercent >= 0;
          return (
            <button
              key={stock.symbol}
              onClick={() => navigate(`/asset/${stock.symbol}`)}
              className="flex items-center justify-between p-2.5 hover:bg-secondary/30 transition-colors w-full text-left group min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0",
                  isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                )}>
                  {stock.symbol.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-foreground truncate">{stock.symbol}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{stock.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <div className="text-right">
                  <p className="font-mono text-[11px] font-semibold text-foreground">${stock.price.toFixed(2)}</p>
                  <div className={cn(
                    "flex items-center justify-end gap-0.5 text-[10px] font-medium",
                    isPositive ? "text-success" : "text-destructive"
                  )}>
                    {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
