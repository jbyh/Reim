import { Stock } from '@/types/trading';
import { Watchlist } from '@/components/trading/Watchlist';

interface WatchlistViewProps {
  stocks: Stock[];
  onAddStock?: (symbol: string) => void;
  onRemoveStock?: (symbol: string) => void;
}

export const WatchlistView = ({ stocks, onAddStock, onRemoveStock }: WatchlistViewProps) => {
  return (
    <div className="h-full">
      <Watchlist 
        stocks={stocks} 
        onAddSymbol={onAddStock}
        onRemoveSymbol={onRemoveStock}
      />
    </div>
  );
};
