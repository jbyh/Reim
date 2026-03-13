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

  return (
    <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="p-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "p-1.5 rounded-lg shrink-0",
            pendingOrders.length > 0 ? "bg-warning/20" : "bg-muted/50"
          )}>
            <Clock className={cn("h-3.5 w-3.5", pendingOrders.length > 0 ? "text-warning" : "text-muted-foreground")} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-xs text-foreground">Pending Orders</h3>
            <p className="text-[10px] text-muted-foreground">{pendingOrders.length} active</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {pendingOrders.length === 0 ? (
          <div className="p-4 text-center flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-6 w-6 text-muted-foreground mb-1.5" />
            <p className="text-xs text-muted-foreground">No pending orders</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30 max-h-[180px] overflow-y-auto scrollbar-thin">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0",
                    order.side === 'buy' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                  )}>
                    {order.side}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-foreground truncate">{order.symbol}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {order.qty} shares @ {order.type === 'limit' ? `$${order.limitPrice}` : 'Mkt'}
                    </p>
                  </div>
                </div>
                {onCancelOrder && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCancelOrder(order.id)}
                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
