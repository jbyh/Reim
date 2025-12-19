import { Stock } from '@/types/trading';
import { TrendingUp, TrendingDown, Eye, ChevronRight, Sparkles, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { MiniChart } from './widgets/MiniChart';
import { useState } from 'react';

interface WatchlistProps {
  stocks: Stock[];
}

export const Watchlist = ({ stocks }: WatchlistProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Watchlist</h2>
              <p className="text-xs text-muted-foreground">{stocks.length} symbols tracked</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/60 border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          />
        </div>
      </div>
      
      {/* Stocks List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {filteredStocks.map((stock) => {
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
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold",
                    isPositive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  )}>
                    {stock.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-lg text-foreground">{stock.symbol}</span>
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        isPositive ? "bg-success" : "bg-destructive"
                      )} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {stock.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <MiniChart positive={isPositive} width={60} height={28} />
                  
                  <div className="text-right min-w-[90px]">
                    <p className="font-mono font-bold text-lg">${stock.price.toFixed(2)}</p>
                    <div
                      className={cn(
                        'flex items-center justify-end gap-1 text-sm font-semibold',
                        isPositive ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isPositive ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredStocks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No stocks found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/30 bg-secondary/20">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Click any stock for detailed analysis</span>
        </div>
      </div>
    </div>
  );
};