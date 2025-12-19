import { Stock } from '@/types/trading';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceWidgetProps {
  stock: Stock;
  compact?: boolean;
}

export const PriceWidget = ({ stock, compact = false }: PriceWidgetProps) => {
  const isPositive = stock.change >= 0;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 glass-card rounded-lg px-3 py-1.5">
        <span className="font-semibold text-sm">{stock.symbol}</span>
        <span className="font-mono text-sm">${stock.price.toFixed(2)}</span>
        <span className={cn(
          'flex items-center gap-0.5 text-xs font-medium',
          isPositive ? 'text-success' : 'text-destructive'
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </span>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4 min-w-[180px]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-lg">{stock.symbol}</span>
        <div className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          isPositive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </div>
      </div>
      
      <p className="font-mono text-2xl font-bold text-gradient-primary">
        ${stock.price.toFixed(2)}
      </p>
      
      <p className="text-xs text-muted-foreground mt-1">{stock.name}</p>

      {stock.bidPrice && stock.askPrice && (
        <div className="flex justify-between mt-3 pt-3 border-t border-border/50 text-xs">
          <div>
            <span className="text-muted-foreground">Bid</span>
            <p className="font-mono font-medium">${stock.bidPrice.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">Ask</span>
            <p className="font-mono font-medium">${stock.askPrice.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
};
