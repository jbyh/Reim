import { useState, useRef, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowRight, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

// Popular stocks for quick access
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
];

interface StockSearchProps {
  onClose?: () => void;
  variant?: 'modal' | 'inline';
  placeholder?: string;
}

export const StockSearch = ({ onClose, variant = 'inline', placeholder = "Search any stock or ETF..." }: StockSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant === 'modal') {
      inputRef.current?.focus();
    }
  }, [variant]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStocks = async (searchQuery: string) => {
    const upperQuery = searchQuery.toUpperCase().trim();
    if (!upperQuery) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Filter popular stocks first
    const filtered = POPULAR_STOCKS.filter(
      s => s.symbol.includes(upperQuery) || s.name.toUpperCase().includes(upperQuery)
    );

    // If the query looks like a valid symbol not in our list, add it as a potential result
    const isValidSymbol = /^[A-Z]{1,5}$/.test(upperQuery);
    const existsInFiltered = filtered.some(s => s.symbol === upperQuery);
    
    if (isValidSymbol && !existsInFiltered) {
      filtered.unshift({ symbol: upperQuery, name: 'Search for ' + upperQuery });
    }

    // Try to fetch live prices for the filtered results
    try {
      const symbols = filtered.slice(0, 6).map(s => s.symbol);
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { symbols }
      });

      if (!error && data?.data) {
        const enrichedResults = filtered.slice(0, 6).map(stock => {
          const marketData = data.data[stock.symbol];
          return {
            ...stock,
            price: marketData?.lastPrice,
            change: marketData?.change,
            changePercent: marketData?.changePercent,
          };
        });
        setResults(enrichedResults);
      } else {
        setResults(filtered.slice(0, 6));
      }
    } catch {
      setResults(filtered.slice(0, 6));
    }
    
    setIsLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);
    searchStocks(value);
  };

  const handleSelect = (symbol: string) => {
    setShowDropdown(false);
    setQuery('');
    onClose?.();
    navigate(`/asset/${symbol}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSelect(query.toUpperCase().trim());
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
      onClose?.();
    }
  };

  return (
    <div ref={containerRef} className={cn(
      "relative w-full",
      variant === 'modal' && "max-w-lg mx-auto"
    )}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full bg-secondary/60 border border-border/40 rounded-2xl pl-12 pr-4 py-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all",
            variant === 'modal' && "text-lg py-5"
          )}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden z-50">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result) => {
                const isPositive = (result.change ?? 0) >= 0;
                return (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelect(result.symbol)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-b border-border/20 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                        result.price 
                          ? (isPositive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")
                          : "bg-secondary text-muted-foreground"
                      )}>
                        {result.symbol.slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-foreground">{result.symbol}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">{result.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {result.price !== undefined && (
                        <div className="text-right">
                          <p className="font-mono font-bold">${result.price.toFixed(2)}</p>
                          <div className={cn(
                            "flex items-center justify-end gap-1 text-sm",
                            isPositive ? "text-success" : "text-destructive"
                          )}>
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            <span>{isPositive ? '+' : ''}{result.changePercent?.toFixed(2)}%</span>
                          </div>
                        </div>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground mb-2">No results found</p>
              <button
                onClick={() => handleSelect(query.toUpperCase().trim())}
                className="text-primary hover:underline text-sm"
              >
                Search for "{query.toUpperCase()}" anyway →
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Popular stocks</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_STOCKS.slice(0, 6).map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelect(stock.symbol)}
                    className="flex items-center gap-2 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{stock.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[100px]">{stock.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
