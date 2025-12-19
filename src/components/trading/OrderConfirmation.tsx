import { OrderIntent, Stock } from '@/types/trading';
import { Button } from '@/components/ui/button';
import { Check, X, TrendingUp, TrendingDown, AlertCircle, Shield, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderConfirmationProps {
  order: OrderIntent;
  stock?: Stock;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OrderConfirmation = ({
  order,
  stock,
  onConfirm,
  onCancel,
}: OrderConfirmationProps) => {
  const estimatedTotal = stock ? stock.price * order.qty : 0;
  const isBuy = order.side === 'buy';

  return (
    <div className={cn(
      'glass-card rounded-xl p-4 border-2',
      isBuy ? 'border-success/30' : 'border-destructive/30'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-2 rounded-lg',
            isBuy ? 'bg-success/20' : 'bg-destructive/20'
          )}>
            {isBuy ? (
              <TrendingUp className={cn('h-5 w-5', isBuy ? 'text-success' : 'text-destructive')} />
            ) : (
              <TrendingDown className={cn('h-5 w-5', isBuy ? 'text-success' : 'text-destructive')} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">Order Confirmation</h3>
            <p className="text-xs text-muted-foreground">Review before submitting</p>
          </div>
        </div>
        <div className={cn(
          'px-3 py-1 rounded-full text-xs font-semibold uppercase',
          isBuy ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
        )}>
          {order.side}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Symbol</span>
          <span className="font-mono font-semibold text-lg">{order.symbol}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Quantity</span>
          <span className="font-mono font-semibold">{order.qty} shares</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Order Type</span>
          <span className="font-medium capitalize">{order.type}</span>
        </div>

        {order.limitPrice && (
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Limit Price</span>
            <span className="font-mono text-primary">${order.limitPrice.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Est. Price</span>
          <div className="text-right">
            <span className="font-mono">${stock?.price.toFixed(2) || '—'}</span>
            {stock?.bidPrice && stock?.askPrice && (
              <p className="text-[10px] text-muted-foreground">
                Bid: ${stock.bidPrice.toFixed(2)} / Ask: ${stock.askPrice.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Smart Order Suggestions */}
        {(order.stopLoss || order.takeProfit) && (
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Suggestions</p>
            {order.stopLoss && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-destructive" />
                  <span className="text-sm">Stop Loss</span>
                </div>
                <span className="font-mono text-destructive">${order.stopLoss.toFixed(2)}</span>
              </div>
            )}
            {order.takeProfit && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-success" />
                  <span className="text-sm">Take Profit</span>
                </div>
                <span className="font-mono text-success">${order.takeProfit.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center py-3 bg-secondary/50 rounded-lg px-3 -mx-1">
          <span className="text-sm font-medium">Est. Total</span>
          <span className="font-mono font-bold text-xl">${estimatedTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
        <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          {order.type === 'limit' 
            ? 'Limit order will execute only at your specified price or better.'
            : 'Market orders execute at the best available price. Final price may vary.'}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          className={cn(
            'flex-1',
            isBuy 
              ? 'bg-success hover:bg-success/90 text-success-foreground glow-success' 
              : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground glow-destructive'
          )}
          onClick={onConfirm}
        >
          <Check className="h-4 w-4 mr-2" />
          Confirm {order.side === 'buy' ? 'Buy' : 'Sell'}
        </Button>
      </div>
    </div>
  );
};
