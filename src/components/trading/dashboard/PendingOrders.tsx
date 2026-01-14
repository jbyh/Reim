import { Order } from '@/types/trading';
import { Clock, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PendingOrdersProps {
  orders: Order[];
  onCancelOrder?: (orderId: string) => void;
}

export const PendingOrders = ({ orders, onCancelOrder }: PendingOrdersProps) => {
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');

  if (pendingOrders.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-muted/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Pending Orders</h3>
        </div>
        <div className="text-center py-6">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No pending orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-warning/20">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Pending Orders</h3>
            <p className="text-xs text-muted-foreground">{pendingOrders.length} active</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/30 max-h-[200px] overflow-y-auto scrollbar-thin">
        {pendingOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "px-2 py-1 rounded text-xs font-bold uppercase",
                order.side === 'buy' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}>
                {order.side}
              </div>
              <div>
                <p className="font-semibold text-foreground">{order.symbol}</p>
                <p className="text-xs text-muted-foreground">
                  {order.qty} shares @ {order.type === 'limit' ? `$${order.limitPrice}` : 'Market'}
                </p>
              </div>
            </div>
            {onCancelOrder && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCancelOrder(order.id)}
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
