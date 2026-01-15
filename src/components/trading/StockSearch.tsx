import { useState, useRef, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowRight, Sparkles, X, Bitcoin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  assetType?: 'stock' | 'crypto';
}

// Popular stocks for quick access
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', assetType: 'stock' as const },
  { symbol: 'MSFT', name: 'Microsoft Corporation', assetType: 'stock' as const },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', assetType: 'stock' as const },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', assetType: 'stock' as const },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', assetType: 'stock' as const },
  { symbol: 'TSLA', name: 'Tesla Inc.', assetType: 'stock' as const },
];

const POPULAR_CRYPTO = [
  { symbol: 'BTC/USD', name: 'Bitcoin', assetType: 'crypto' as const },
  { symbol: 'ETH/USD', name: 'Ethereum', assetType: 'crypto' as const },
  { symbol: 'SOL/USD', name: 'Solana', assetType: 'crypto' as const },
  { symbol: 'DOGE/USD', name: 'Dogecoin', assetType: 'crypto' as const },
];

const POPULAR_ASSETS = [...POPULAR_STOCKS, ...POPULAR_CRYPTO];

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

const CRYPTO_NAMES: Record<string, string> = {
  'BTC/USD': 'Bitcoin',
  'ETH/USD': 'Ethereum',
  'SOL/USD': 'Solana',
  'DOGE/USD': 'Dogecoin',
  'AVAX/USD': 'Avalanche',
  'LINK/USD': 'Chainlink',
};

const isCryptoSymbol = (symbol: string): boolean => {
  return symbol.includes('/') || Object.keys(CRYPTO_NAMES).some(
    crypto => crypto.replace('/USD', '') === symbol.toUpperCase()
  );
};

interface StockSearchProps {
  onClose?: () => void;
  variant?: 'modal' | 'inline';
  placeholder?: string;
}

export const StockSearch = ({ onClose, variant = 'inline', placeholder = "Search stocks or crypto..." }: StockSearchProps) => {
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

  const searchAssets = async (searchQuery: string) => {
    const upperQuery = searchQuery.toUpperCase().trim();
    const lowerQuery = searchQuery.toLowerCase().trim();
    
    if (!upperQuery) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Check for crypto keywords
    const cryptoMatch = CRYPTO_KEYWORDS[lowerQuery];
    
    // Filter popular assets first
    const filtered = POPULAR_ASSETS.filter(
      s => s.symbol.includes(upperQuery) || s.name.toUpperCase().includes(upperQuery)
    );

    // Add crypto match if found and not already in list
    if (cryptoMatch && !filtered.some(f => f.symbol === cryptoMatch)) {
      filtered.unshift({ 
        symbol: cryptoMatch, 
        name: CRYPTO_NAMES[cryptoMatch] || cryptoMatch, 
        assetType: 'crypto' 
      });
    }

    // If the query looks like a valid stock symbol not in our list, add it as a potential result
    const isValidStockSymbol = /^[A-Z]{1,5}$/.test(upperQuery);
    const existsInFiltered = filtered.some(s => s.symbol === upperQuery);
    
    if (isValidStockSymbol && !existsInFiltered && !isCryptoSymbol(upperQuery)) {
      filtered.unshift({ symbol: upperQuery, name: 'Search for ' + upperQuery, assetType: 'stock' });
    }

    // Try to fetch live prices for the filtered results
    try {
      const symbols = filtered.slice(0, 6).map(s => s.symbol);
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { symbols }
      });

      if (!error && data?.data) {
        const enrichedResults = filtered.slice(0, 6).map(asset => {
          const marketData = data.data[asset.symbol];
          return {
            ...asset,
            price: marketData?.lastPrice,
            change: marketData?.change,
            changePercent: marketData?.changePercent,
            assetType: marketData?.assetType || asset.assetType,
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
    searchAssets(value);
  };

  const handleSelect = (symbol: string) => {
    setShowDropdown(false);
    setQuery('');
    onClose?.();
    navigate(`/asset/${encodeURIComponent(symbol)}`);
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
                const isCrypto = result.assetType === 'crypto';
                return (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelect(result.symbol)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-b border-border/20 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                        isCrypto
                          ? "bg-orange-500/15 text-orange-500"
                          : result.price 
                            ? (isPositive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")
                            : "bg-secondary text-muted-foreground"
                      )}>
                        {isCrypto ? (
                          <Bitcoin className="h-5 w-5" />
                        ) : (
                          result.symbol.slice(0, 2)
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{result.symbol}</p>
                          {isCrypto && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-500 font-medium">
                              CRYPTO
                            </span>
                          )}
                        </div>
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
                <span>Popular assets</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_ASSETS.slice(0, 8).map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => handleSelect(asset.symbol)}
                    className="flex items-center gap-2 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                      asset.assetType === 'crypto'
                        ? "bg-orange-500/10 text-orange-500"
                        : "bg-primary/10 text-primary"
                    )}>
                      {asset.assetType === 'crypto' ? (
                        <Bitcoin className="h-4 w-4" />
                      ) : (
                        asset.symbol.slice(0, 2)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm">{asset.symbol}</p>
                        {asset.assetType === 'crypto' && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-500 font-medium">
                            ₿
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[100px]">{asset.name}</p>
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
