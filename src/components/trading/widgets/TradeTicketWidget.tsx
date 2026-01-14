import { OrderIntent, Stock } from '@/types/trading';
import { ArrowUpRight, ArrowDownRight, Target, Shield, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MiniChart } from './MiniChart';

interface TradeTicketWidgetProps {
  order: OrderIntent;
  stock?: Stock;
  reasoning?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
  isSubmitting?: boolean;
}

export const TradeTicketWidget = ({ 
  order, 
  stock, 
  reasoning,
  onConfirm, 
  onCancel,
  showActions = true,
  isSubmitting = false
}: TradeTicketWidgetProps) => {
  const isBuy = order.side === 'buy';
  const currentPrice = stock?.price || order.limitPrice || 0;
  const totalValue = order.qty * currentPrice;

  return (
    <div className={cn(
      'glass-card rounded-xl overflow-hidden',
      isBuy ? 'glow-success' : 'glow-destructive'
    )}>
      {/* Header */}
      <div className={cn(
        'px-4 py-3 flex items-center justify-between',
        isBuy ? 'bg-success/10' : 'bg-destructive/10'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isBuy ? 'bg-success/20' : 'bg-destructive/20'
          )}>
            {isBuy ? (
              <ArrowUpRight className={cn('h-5 w-5', isBuy ? 'text-success' : 'text-destructive')} />
            ) : (
              <ArrowDownRight className={cn('h-5 w-5', isBuy ? 'text-success' : 'text-destructive')} />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {order.type} Order
            </p>
            <p className={cn(
              'font-bold text-lg',
              isBuy ? 'text-success' : 'text-destructive'
            )}>
              {order.side.toUpperCase()} {order.symbol}
            </p>
          </div>
        </div>
        
        <MiniChart positive={isBuy} width={80} height={32} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-lg p-3 bg-secondary/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              Quantity
            </div>
            <p className="font-mono text-xl font-bold">{order.qty}</p>
            <p className="text-xs text-muted-foreground">shares</p>
          </div>
          
          <div className="glass-card rounded-lg p-3 bg-secondary/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              Est. Total
            </div>
            <p className="font-mono text-xl font-bold">${totalValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">@ ${currentPrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Smart suggestions */}
        {(order.limitPrice || order.stopLoss || order.takeProfit) && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">AI Suggestions</p>
            <div className="grid grid-cols-3 gap-2">
              {order.limitPrice && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-2 text-center">
                  <p className="text-[10px] text-primary/70 uppercase">Limit</p>
                  <p className="font-mono font-semibold text-primary">${order.limitPrice.toFixed(2)}</p>
                </div>
              )}
              {order.stopLoss && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-destructive/70 uppercase">
                    <Shield className="h-2.5 w-2.5" />
                    Stop
                  </div>
                  <p className="font-mono font-semibold text-destructive">${order.stopLoss.toFixed(2)}</p>
                </div>
              )}
              {order.takeProfit && (
                <div className="rounded-lg bg-success/10 border border-success/20 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-success/70 uppercase">
                    <Target className="h-2.5 w-2.5" />
                    Target
                  </div>
                  <p className="font-mono font-semibold text-success">${order.takeProfit.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {reasoning && (
          <div className="rounded-lg bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">💡 Reasoning</p>
            <p className="text-sm leading-relaxed">{reasoning}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && onConfirm && onCancel && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-border/50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isSubmitting}
              className={cn(
                'flex-1',
                isBuy 
                  ? 'bg-success hover:bg-success/90 text-success-foreground' 
                  : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                `Confirm ${order.side.toUpperCase()}`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
