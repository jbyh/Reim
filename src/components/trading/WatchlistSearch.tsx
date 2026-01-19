import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, TrendingUp, TrendingDown, Loader2, X, Bitcoin } from 'lucide-react';
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
  assetType: 'stock' | 'crypto';
}

const POPULAR_STOCKS = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'AMD', 'GOOGL'];
const POPULAR_CRYPTO = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'DOGE/USD', 'AVAX/USD', 'LINK/USD'];
const POPULAR_SYMBOLS = [...POPULAR_STOCKS, ...POPULAR_CRYPTO];

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
};

const CRYPTO_NAMES: Record<string, string> = {
  'BTC/USD': 'Bitcoin',
  'ETH/USD': 'Ethereum',
  'SOL/USD': 'Solana',
  'DOGE/USD': 'Dogecoin',
  'AVAX/USD': 'Avalanche',
  'LINK/USD': 'Chainlink',
  'UNI/USD': 'Uniswap',
  'AAVE/USD': 'Aave',
  'LTC/USD': 'Litecoin',
  'XRP/USD': 'Ripple',
  'ADA/USD': 'Cardano',
  'DOT/USD': 'Polkadot',
  'SHIB/USD': 'Shiba Inu',
  'MATIC/USD': 'Polygon',
};

// Crypto keywords to symbol mapping
const CRYPTO_KEYWORDS: Record<string, string> = {
  'bitcoin': 'BTC/USD',
  'btc': 'BTC/USD',
  'ethereum': 'ETH/USD',
  'eth': 'ETH/USD',
  'solana': 'SOL/USD',
  'sol': 'SOL/USD',
  'dogecoin': 'DOGE/USD',
  'doge': 'DOGE/USD',
  'avalanche': 'AVAX/USD',
  'avax': 'AVAX/USD',
  'chainlink': 'LINK/USD',
  'link': 'LINK/USD',
};

const isCryptoSymbol = (symbol: string): boolean => {
  return symbol.includes('/') || Object.keys(CRYPTO_NAMES).some(
    crypto => crypto.replace('/USD', '') === symbol.toUpperCase()
  );
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
        const isCrypto = isCryptoSymbol(symbol);
        return {
          symbol,
          name: isCrypto ? (CRYPTO_NAMES[symbol] || symbol.replace('/USD', '')) : (STOCK_NAMES[symbol] || symbol),
          price: md.lastPrice || 0,
          changePercent: md.changePercent || 0,
          assetType: isCrypto ? 'crypto' : 'stock',
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
        .slice(0, 6)
        .map(s => ({
          symbol: s,
          name: CRYPTO_NAMES[s] || STOCK_NAMES[s] || s,
          price: 0,
          changePercent: 0,
          assetType: (isCryptoSymbol(s) ? 'crypto' : 'stock') as 'stock' | 'crypto',
        }));
      setResults(suggestions);
      return;
    }

    setIsLoading(true);
    const lower = searchQuery.toLowerCase();
    const upper = searchQuery.toUpperCase();
    
    // Check for crypto keywords first
    const cryptoMatch = CRYPTO_KEYWORDS[lower];
    
    // Find matching symbols
    const matching: string[] = [];
    
    // Add crypto keyword match
    if (cryptoMatch && !existingSymbols.includes(cryptoMatch)) {
      matching.push(cryptoMatch);
    }
    
    // Add matching from popular symbols
    POPULAR_SYMBOLS.forEach(s => {
      const name = CRYPTO_NAMES[s] || STOCK_NAMES[s] || '';
      if ((s.includes(upper) || name.toLowerCase().includes(lower)) && !existingSymbols.includes(s) && !matching.includes(s)) {
        matching.push(s);
      }
    });

    // If query looks like a stock symbol and not in list, add it
    if (!matching.includes(upper) && upper.length <= 5 && /^[A-Z]{1,5}$/.test(upper) && !existingSymbols.includes(upper) && !isCryptoSymbol(upper)) {
      matching.push(upper);
    }

    const pricePromises = matching.slice(0, 5).map(fetchPrice);
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsOpen(true);
            if (!query) handleSearch('');
          }}
          placeholder="Add stock or crypto..."
          className="w-full bg-secondary/60 border border-border/40 rounded-lg pl-9 pr-9 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded"
          >
            <X className="h-3 w-3 text-muted-foreground" />
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
                      result.assetType === 'crypto' 
                        ? "bg-orange-500/15 text-orange-500"
                        : result.changePercent >= 0 
                          ? "bg-success/15 text-success" 
                          : "bg-destructive/15 text-destructive"
                    )}>
                      {result.assetType === 'crypto' ? (
                        <Bitcoin className="h-4 w-4" />
                      ) : (
                        result.symbol.slice(0, 2)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{result.symbol}</p>
                        {result.assetType === 'crypto' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-500 font-medium">
                            CRYPTO
                          </span>
                        )}
                      </div>
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
              Enter a symbol or name to search
            </div>
          )}
        </div>
      )}
    </div>
  );
};
