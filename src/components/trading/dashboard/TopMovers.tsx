import { Stock } from '@/types/trading';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TopMoversProps {
  watchlist: Stock[];
}

export const TopMovers = ({ watchlist }: TopMoversProps) => {
  const navigate = useNavigate();
  
  // Sort by absolute change percent
  const sorted = [...watchlist]
    .filter(s => s.price > 0)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 4);

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/30">
        <h3 className="font-semibold text-foreground">Top Movers</h3>
        <p className="text-xs text-muted-foreground">From your watchlist</p>
      </div>

      <div className="divide-y divide-border/30">
        {sorted.map((stock) => {
          const isPositive = stock.changePercent >= 0;
          return (
            <button
              key={stock.symbol}
              onClick={() => navigate(`/asset/${stock.symbol}`)}
              className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors w-full text-left group"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                  isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                )}>
                  {stock.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{stock.symbol}</p>
                  <p className="text-xs text-muted-foreground">{stock.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono font-semibold text-foreground">${stock.price.toFixed(2)}</p>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    isPositive ? "text-success" : "text-destructive"
                  )}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
