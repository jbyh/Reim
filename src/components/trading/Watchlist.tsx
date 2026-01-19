import { Stock } from '@/types/trading';
import { TrendingUp, TrendingDown, Eye, ChevronRight, Sparkles, Search, Bitcoin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { MiniChart } from './widgets/MiniChart';
import { useState } from 'react';
import { WatchlistSearch } from './WatchlistSearch';

interface WatchlistProps {
  stocks: Stock[];
  onAddSymbol?: (symbol: string) => void;
  onRemoveSymbol?: (symbol: string) => void;
}

export const Watchlist = ({ stocks, onAddSymbol, onRemoveSymbol }: WatchlistProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to display compact symbol
  const getDisplaySymbol = (stock: Stock) => {
    if (stock.assetType === 'crypto') {
      return stock.symbol.replace('/USD', '');
    }
    return stock.symbol;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 rounded-lg bg-primary/20">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-foreground">Watchlist</h2>
              <p className="text-[10px] md:text-xs text-muted-foreground">{stocks.length} symbols</p>
            </div>
          </div>
        </div>

        {/* Combined Search - Add or Filter */}
        {onAddSymbol ? (
          <WatchlistSearch 
            onAddSymbol={onAddSymbol} 
            existingSymbols={stocks.map(s => s.symbol)} 
          />
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/40 border border-border/30 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
          </div>
        )}

        {/* Filter when add search is present */}
        {onAddSymbol && stocks.length > 5 && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/30 border border-border/20 rounded-lg pl-9 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        )}
      </div>
      
      {/* Stocks List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 md:p-3 space-y-1.5 md:space-y-2">
        {filteredStocks.map((stock) => {
          const isPositive = stock.change >= 0;
          const isCrypto = stock.assetType === 'crypto';
          const displaySymbol = getDisplaySymbol(stock);
          
          return (
            <div
              key={stock.symbol}
              onClick={() => navigate(`/asset/${encodeURIComponent(stock.symbol)}`)}
              className={cn(
                'watchlist-item group !p-2.5 md:!p-3',
                isPositive ? 'gain' : 'loss'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className={cn(
                    "w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                    isCrypto 
                      ? "bg-orange-500/15 text-orange-500"
                      : isPositive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  )}>
                    {isCrypto ? <Bitcoin className="h-4 w-4" /> : displaySymbol.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-sm md:text-base text-foreground">{displaySymbol}</span>
                      {isCrypto && (
                        <span className="text-[8px] md:text-[10px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-500 font-medium">
                          CRYPTO
                        </span>
                      )}
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        isPositive ? "bg-success" : "bg-destructive"
                      )} />
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[100px] md:max-w-[140px]">
                      {stock.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="hidden sm:block">
                    <MiniChart positive={isPositive} width={48} height={22} />
                  </div>
                  
                  <div className="text-right min-w-[70px] md:min-w-[85px]">
                    <p className="font-mono font-bold text-sm md:text-base">
                      ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div
                      className={cn(
                        'flex items-center justify-end gap-0.5 text-xs font-semibold',
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
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredStocks.length === 0 && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center mx-auto mb-2">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No stocks found</p>
            <p className="text-xs text-muted-foreground mt-0.5">Try a different search</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 md:p-3 border-t border-border/30 bg-secondary/20">
        <div className="flex items-center justify-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Tap any asset for details</span>
        </div>
      </div>
    </div>
  );
};
