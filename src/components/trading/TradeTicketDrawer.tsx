import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Zap, Clock, Bitcoin, Loader2 } from 'lucide-react';
import { Stock, OrderIntent } from '@/types/trading';

interface TradeTicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  side: 'buy' | 'sell';
  stock?: Stock | null;
  isCrypto?: boolean;
  quickTradeEnabled: boolean;
  onQuickTradeToggle: (enabled: boolean) => void;
  onSubmit: (order: OrderIntent, skipConfirmation?: boolean) => Promise<void>;
}

export const TradeTicketDrawer = ({
  isOpen,
  onClose,
  symbol,
  side,
  stock,
  isCrypto = false,
  quickTradeEnabled,
  onQuickTradeToggle,
  onSubmit,
}: TradeTicketDrawerProps) => {
  const [quantity, setQuantity] = useState('1');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPrice = stock?.price || 0;
  const bidPrice = stock?.bidPrice || currentPrice * 0.999;
  const askPrice = stock?.askPrice || currentPrice * 1.001;
  const qty = parseFloat(quantity) || 0;
  const estimatedTotal = qty * (orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : currentPrice);

  const handleSubmit = async () => {
    if (qty <= 0) return;
    
    setIsSubmitting(true);
    try {
      const order: OrderIntent = {
        symbol,
        qty,
        side,
        type: orderType,
        limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
      };
      
      await onSubmit(order, quickTradeEnabled);
      onClose();
      setQuantity('1');
      setLimitPrice('');
      setOrderType('market');
    } catch (err) {
      console.error('Order submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBuy = side === 'buy';

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="px-4 pb-8 max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl",
                isCrypto ? "bg-orange-500/20" : isBuy ? "bg-success/20" : "bg-destructive/20"
              )}>
                {isCrypto ? (
                  <Bitcoin className={cn("h-5 w-5", isBuy ? "text-success" : "text-destructive")} />
                ) : isBuy ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <DrawerTitle className="text-lg">
                  {isBuy ? 'Buy' : 'Sell'} {symbol}
                </DrawerTitle>
                <p className="text-xs text-muted-foreground">{stock?.name || symbol}</p>
              </div>
            </div>
            {isCrypto && (
              <div className="flex items-center gap-1.5 text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded-lg">
                <Clock className="h-3 w-3" />
                24/7
              </div>
            )}
          </div>
        </DrawerHeader>

        <div className="space-y-4 py-4">
          {/* Current Price & Spread */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-secondary/40">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Bid</p>
              <p className="font-mono font-semibold text-sm text-destructive">${bidPrice.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/60">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Price</p>
              <p className="font-mono font-bold text-base">${currentPrice.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/40">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Ask</p>
              <p className="font-mono font-semibold text-sm text-success">${askPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Order Type Toggle */}
          <div className="flex gap-2 p-1 bg-secondary/40 rounded-xl">
            <button
              onClick={() => setOrderType('market')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                orderType === 'market' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                orderType === 'limit' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Limit
            </button>
          </div>

          {/* Quantity Input */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {isCrypto ? 'Amount' : 'Shares'}
            </Label>
            <Input
              type="number"
              min="0.0001"
              step={isCrypto ? "0.0001" : "1"}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="text-lg font-mono text-center h-12"
              placeholder={isCrypto ? "0.001" : "1"}
            />
            {/* Quick quantity buttons */}
            <div className="flex gap-2 mt-2">
              {(isCrypto ? ['0.01', '0.1', '0.5', '1'] : ['1', '5', '10', '25']).map((val) => (
                <button
                  key={val}
                  onClick={() => setQuantity(val)}
                  className="flex-1 py-1.5 text-xs font-medium bg-secondary/40 hover:bg-secondary/60 rounded-lg transition-colors"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Limit Price (conditional) */}
          {orderType === 'limit' && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Limit Price</Label>
              <Input
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="text-lg font-mono text-center h-12"
                placeholder={currentPrice.toFixed(2)}
              />
            </div>
          )}

          {/* Estimated Total */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Total</span>
              <span className="font-mono font-bold text-xl">
                ${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Quick Trade Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <Label htmlFor="quick-trade" className="text-sm font-medium cursor-pointer">
                Quick Trade
              </Label>
            </div>
            <Switch
              id="quick-trade"
              checked={quickTradeEnabled}
              onCheckedChange={onQuickTradeToggle}
            />
          </div>
          <p className="text-xs text-muted-foreground -mt-2 px-1">
            {quickTradeEnabled 
              ? "Orders will execute immediately without confirmation" 
              : "You'll confirm orders before they execute"}
          </p>
        </div>

        <DrawerFooter className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || qty <= 0}
            className={cn(
              "w-full h-12 text-base font-semibold rounded-xl",
              isBuy 
                ? "bg-success hover:bg-success/90 text-success-foreground" 
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {quickTradeEnabled && <Zap className="h-4 w-4 mr-2" />}
                {isBuy ? 'Buy' : 'Sell'} {symbol}
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
