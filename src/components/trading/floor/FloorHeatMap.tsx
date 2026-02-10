import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { MiniChart } from '@/components/trading/widgets/MiniChart';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

interface FloorHeatMapProps {
  stocks: StockData[];
  isLoading: boolean;
}

export const FloorHeatMap = ({ stocks, isLoading }: FloorHeatMapProps) => {
  const navigate = useNavigate();

  if (isLoading && stocks.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-3.5 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="h-3 bg-secondary rounded w-10 mb-2" />
            <div className="h-5 bg-secondary rounded w-14 mb-1.5" />
            <div className="h-3 bg-secondary rounded w-8" />
          </div>
        ))}
      </div>
    );
  }

  // Sort by absolute change for visual impact
  const sorted = [...stocks].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
      {sorted.map((stock, i) => {
        const isPositive = stock.changePercent >= 0;
        const intensity = Math.min(Math.abs(stock.changePercent) / 5, 1);

        return (
          <button
            key={stock.symbol}
            onClick={() => navigate(`/asset/${stock.symbol}`)}
            className={cn(
              "relative rounded-xl p-3.5 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-xl border overflow-hidden group animate-fade-in",
              isPositive
                ? "border-success/20 hover:border-success/40"
                : "border-destructive/20 hover:border-destructive/40",
            )}
            style={{
              animationDelay: `${i * 40}ms`,
              background: isPositive
                ? `linear-gradient(135deg, hsl(var(--success) / ${0.05 + intensity * 0.12}), hsl(var(--card)))`
                : `linear-gradient(135deg, hsl(var(--destructive) / ${0.05 + intensity * 0.12}), hsl(var(--card)))`,
            }}
          >
            {/* Sparkline background */}
            <div className="absolute bottom-0 right-0 opacity-20 group-hover:opacity-40 transition-opacity">
              <MiniChart positive={isPositive} width={80} height={30} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-foreground">{stock.symbol}</span>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate mb-1.5">{stock.name}</p>
              <p className="font-mono font-bold text-base text-foreground">${stock.price.toFixed(2)}</p>
              <p className={cn(
                "font-mono text-xs font-semibold mt-0.5",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
