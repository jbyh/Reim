import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const INDEX_MAP: Record<string, string> = {
  SPY: 'S&P 500',
  QQQ: 'NASDAQ',
  DIA: 'DOW 30',
  IWM: 'Russell 2K',
  VIX: 'VIX',
};

const CRYPTO_MAP: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
};

export const FloorIndicesStrip = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);

  const fetchIndices = useCallback(async () => {
    try {
      // Fetch stock indices
      const { data: stockData } = await supabase.functions.invoke('market-data', {
        body: { symbols: Object.keys(INDEX_MAP) }
      });

      // Fetch crypto
      const { data: cryptoData } = await supabase.functions.invoke('market-data', {
        body: { symbols: Object.keys(CRYPTO_MAP) }
      });

      const combined: IndexData[] = [];

      if (stockData?.data) {
        for (const [sym, name] of Object.entries(INDEX_MAP)) {
          const d = stockData.data[sym];
          if (d) combined.push({ symbol: sym, name, price: d.lastPrice, change: d.change, changePercent: d.changePercent });
        }
      }
      if (cryptoData?.data) {
        for (const [sym, name] of Object.entries(CRYPTO_MAP)) {
          const d = cryptoData.data[sym];
          if (d) combined.push({ symbol: sym, name, price: d.lastPrice, change: d.change, changePercent: d.changePercent });
        }
      }

      if (combined.length > 0) setIndices(combined);
    } catch (err) {
      console.error('Failed to fetch indices:', err);
    }
  }, []);

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 45000);
    return () => clearInterval(interval);
  }, [fetchIndices]);

  if (indices.length === 0) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 glass-card rounded-xl px-4 py-3 min-w-[140px] animate-pulse">
            <div className="h-3 bg-secondary rounded w-12 mb-2" />
            <div className="h-5 bg-secondary rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Double the items for infinite scroll effect
  const scrollItems = [...indices, ...indices];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex gap-3 animate-ticker-scroll">
        {scrollItems.map((idx, i) => {
          const isPositive = idx.changePercent >= 0;
          return (
            <div key={`${idx.symbol}-${i}`} className={cn(
              "flex-shrink-0 glass-card rounded-xl px-4 py-2.5 min-w-[150px] border-l-2 transition-all hover:scale-[1.02]",
              isPositive ? "border-l-success" : "border-l-destructive"
            )}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground">{idx.symbol}</span>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{idx.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-sm font-bold text-foreground">
                  {idx.price >= 1000 ? `$${(idx.price / 1000).toFixed(1)}k` : `$${idx.price.toFixed(2)}`}
                </span>
                <span className={cn(
                  "font-mono text-[11px] font-semibold",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
