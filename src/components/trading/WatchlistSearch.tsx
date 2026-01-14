import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, TrendingUp, TrendingDown, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface WatchlistSearchProps {
  onAddSymbol: (symbol: string) => void;
  existingSymbols: string[];
}

interface SearchResult {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

const POPULAR_SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'AMD', 'GOOGL', 'GME', 'COIN', 'PLTR'];

const STOCK_NAMES: Record<string, string> = {
  SPY: 'SPDR S&P 500 ETF',
  QQQ: 'Invesco QQQ Trust',
  AAPL: 'Apple Inc.',
  TSLA: 'Tesla Inc.',
  NVDA: 'NVIDIA Corporation',
  MSFT: 'Microsoft Corporation',
  AMZN: 'Amazon.com Inc.',
  META: 'Meta Platforms Inc.',
  AMD: 'Advanced Micro Devices',
  GOOGL: 'Alphabet Inc.',
  GME: 'GameStop Corp.',
  COIN: 'Coinbase Global',
  PLTR: 'Palantir Technologies',
  SOFI: 'SoFi Technologies',
  NIO: 'NIO Inc.',
  RIVN: 'Rivian Automotive',
  F: 'Ford Motor Company',
};

export const WatchlistSearch = ({ onAddSymbol, existingSymbols }: WatchlistSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchPrice = useCallback(async (symbol: string): Promise<SearchResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { symbols: [symbol] }
      });

      if (!error && data?.data?.[symbol]) {
        const md = data.data[symbol];
        return {
          symbol,
          name: STOCK_NAMES[symbol] || symbol,
          price: md.lastPrice || 0,
          changePercent: md.changePercent || 0
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // Show suggestions excluding already-added symbols
      const suggestions = POPULAR_SYMBOLS
        .filter(s => !existingSymbols.includes(s))
        .slice(0, 5)
        .map(s => ({
          symbol: s,
          name: STOCK_NAMES[s] || s,
          price: 0,
          changePercent: 0
        }));
      setResults(suggestions);
      return;
    }

    setIsLoading(true);
    const upper = searchQuery.toUpperCase();
    
    const matching = POPULAR_SYMBOLS.filter(s => 
      s.includes(upper) || (STOCK_NAMES[s]?.toUpperCase().includes(upper))
    ).filter(s => !existingSymbols.includes(s));

    if (!matching.includes(upper) && upper.length <= 5 && !existingSymbols.includes(upper)) {
      matching.unshift(upper);
    }

    const pricePromises = matching.slice(0, 4).map(fetchPrice);
    const pricesData = await Promise.all(pricePromises);

    setResults(pricesData.filter((r): r is SearchResult => r !== null && r.price > 0));
    setIsLoading(false);
  }, [fetchPrice, existingSymbols]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (isOpen) handleSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen, handleSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (result: SearchResult) => {
    onAddSymbol(result.symbol);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onFocus={() => {
            setIsOpen(true);
            if (!query) handleSearch('');
          }}
          placeholder="Add symbol..."
          className="w-full bg-secondary/60 border border-border/40 rounded-xl pl-10 pr-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-border/30">
              {results.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => handleAdd(result)}
                  className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                      result.changePercent >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    )}>
                      {result.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{result.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {result.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono text-sm">${result.price.toFixed(2)}</p>
                      <div className={cn(
                        "flex items-center justify-end gap-1 text-xs",
                        result.changePercent >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {result.changePercent >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%</span>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results for "{query}"
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Enter a symbol to search
            </div>
          )}
        </div>
      )}
    </div>
  );
};
