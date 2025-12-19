import { Stock } from '@/types/trading';
import { TrendingUp, TrendingDown, Eye, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { MiniChart } from './widgets/MiniChart';

interface WatchlistProps {
  stocks: Stock[];
}

export const Watchlist = ({ stocks }: WatchlistProps) => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-highlight/20">
            <Eye className="h-5 w-5 text-highlight" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Watchlist</h2>
            <p className="text-xs text-muted-foreground">Real-time quotes</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {stocks.map((stock) => {
          const isPositive = stock.change >= 0;
          return (
            <div
              key={stock.symbol}
              onClick={() => navigate(`/asset/${stock.symbol}`)}
              className={cn(
                'watchlist-item group',
                isPositive ? 'gain' : 'loss'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-foreground">{stock.symbol}</span>
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      isPositive ? "bg-success animate-pulse-glow" : "bg-destructive"
                    )} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {stock.name}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <MiniChart positive={isPositive} width={50} height={24} />
                  
                  <div className="text-right min-w-[80px]">
                    <p className="font-mono font-bold text-base">${stock.price.toFixed(2)}</p>
                    <div
                      className={cn(
                        'flex items-center justify-end gap-1 text-xs font-semibold',
                        isPositive ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {isPositive ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/30 bg-secondary/20">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-highlight" />
          <span>Click any stock for detailed analysis</span>
        </div>
      </div>
    </div>
  );
};
