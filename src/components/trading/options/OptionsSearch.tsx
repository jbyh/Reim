import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface OptionsSearchProps {
  onSymbolChange: (symbol: string, price: number) => void;
  currentSymbol: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const POPULAR_SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'AMD', 'GOOGL'];

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
  AMC: 'AMC Entertainment',
  COIN: 'Coinbase Global',
  PLTR: 'Palantir Technologies',
  SOFI: 'SoFi Technologies',
  NIO: 'NIO Inc.',
  RIVN: 'Rivian Automotive',
  LCID: 'Lucid Group',
  F: 'Ford Motor Company',
  GM: 'General Motors',
};

export const OptionsSearch = ({ onSymbolChange, currentSymbol }: OptionsSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [popularPrices, setPopularPrices] = useState<SearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const hasFetchedPopular = useRef(false);

  // Fetch prices for popular symbols once
  const fetchPopularPrices = useCallback(async () => {
    if (hasFetchedPopular.current) return;
    hasFetchedPopular.current = true;
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { symbols: POPULAR_SYMBOLS.slice(0, 6) }
      });
      if (!error && data?.data) {
        const enriched = POPULAR_SYMBOLS.slice(0, 6)
          .map(s => {
            const md = data.data[s];
            return {
              symbol: s,
              name: STOCK_NAMES[s] || s,
              price: md?.lastPrice || 0,
              change: md?.change || 0,
              changePercent: md?.changePercent || 0,
            };
          })
          .filter(r => r.price > 0);
        setPopularPrices(enriched);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Fetch price for a symbol
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
          change: md.change || 0,
          changePercent: md.changePercent || 0
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Search handler
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // Show popular symbols with real prices
      setResults(popularPrices.length > 0 ? popularPrices : POPULAR_SYMBOLS.slice(0, 6).map(s => ({
        symbol: s,
        name: STOCK_NAMES[s] || s,
        price: 0,
        change: 0,
        changePercent: 0
      })));
      return;
    }

    setIsLoading(true);
    const upper = searchQuery.toUpperCase();
    
    // Filter matching symbols
    const matching = POPULAR_SYMBOLS.filter(s => 
      s.includes(upper) || (STOCK_NAMES[s]?.toUpperCase().includes(upper))
    );

    // Also add the exact query if it's not in the list
    if (!matching.includes(upper) && upper.length <= 5) {
      matching.unshift(upper);
    }

    // Fetch prices for top 4 matches
    const pricePromises = matching.slice(0, 4).map(fetchPrice);
    const pricesData = await Promise.all(pricePromises);

    setResults(pricesData.filter((r): r is SearchResult => r !== null && r.price > 0));
    setIsLoading(false);
  }, [fetchPrice, popularPrices]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (isOpen) {
        handleSearch(query);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, isOpen, handleSearch]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    onSymbolChange(result.symbol, result.price);
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
            fetchPopularPrices();
            if (!query) handleSearch('');
          }}
          placeholder={`Search stocks (${currentSymbol})`}
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

      {/* Dropdown */}
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
                  onClick={() => handleSelect(result)}
                  className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold",
                      result.changePercent >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    )}>
                      {result.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{result.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px] md:max-w-[180px]">
                        {result.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold">${result.price.toFixed(2)}</p>
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
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
