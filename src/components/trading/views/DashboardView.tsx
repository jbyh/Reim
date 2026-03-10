import { Portfolio, Position, Stock, Order } from '@/types/trading';
import { MarketCountdown } from '@/components/trading/dashboard/MarketCountdown';
import { TraiGreeting } from '@/components/trading/dashboard/TraiGreeting';
import { PortfolioValueChart } from '@/components/trading/dashboard/PortfolioValueChart';
import { TopMovers } from '@/components/trading/dashboard/TopMovers';
import { PendingOrders } from '@/components/trading/dashboard/PendingOrders';
import { PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'watchlist' | 'portfolio' | 'options' | 'history' | 'chat' | 'floor';

interface DashboardViewProps {
  portfolio: Portfolio;
  positions: Position[];
  watchlist: Stock[];
  orders: Order[];
  onNavigate: (tab: TabType, symbol?: string) => void;
  onPositionClick: (position: Position) => void;
  onAskTrai: (message: string) => void;
}

export const DashboardView = ({
  portfolio,
  positions,
  watchlist,
  orders,
  onNavigate,
  onPositionClick,
  onAskTrai
}: DashboardViewProps) => {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="p-4 lg:p-6 w-full">
        {/* Two-column layout: main content + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 w-full">
          
          {/* Left Column – 2/3 width */}
          <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-5">
            {/* Portfolio Chart */}
            <PortfolioValueChart portfolio={portfolio} />

            {/* Positions Card */}
            <div className="glass-card rounded-2xl overflow-hidden flex-1">
              <div className="p-4 lg:p-5 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/20">
                    <PieChart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Positions</h3>
                    <p className="text-xs text-muted-foreground">{positions.length} active</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('portfolio')}
                  className="text-xs text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label="View all positions"
                >
                  View All
                </button>
              </div>
              
              <div className="divide-y divide-border/30">
                {positions.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground text-sm">No open positions</p>
                  </div>
                ) : (
                  positions.slice(0, 5).map((pos) => (
                    <button
                      key={pos.symbol}
                      onClick={() => { onNavigate('portfolio'); onPositionClick(pos); }}
                      className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`${pos.symbol} position: ${pos.qty} shares, ${pos.unrealizedPL >= 0 ? 'up' : 'down'} ${Math.abs(pos.unrealizedPLPercent).toFixed(2)}%`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                          pos.unrealizedPL >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                        )}>
                          {pos.symbol.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{pos.symbol}</p>
                          <p className="text-xs text-muted-foreground">{pos.qty} shares</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-mono font-semibold text-foreground">${pos.marketValue.toLocaleString()}</p>
                        <p className={cn(
                          "text-xs font-medium",
                          pos.unrealizedPL >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {pos.unrealizedPL >= 0 ? '+' : ''}{pos.unrealizedPLPercent.toFixed(2)}%
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column – 1/3 width */}
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Trai Greeting */}
            <TraiGreeting
              portfolio={portfolio}
              positions={positions}
              onAskTrai={onAskTrai}
              onNavigateToChat={() => onNavigate('chat')}
            />

            {/* Market Countdown */}
            <MarketCountdown onGoToFloor={() => onNavigate('floor')} />

            {/* Top Movers */}
            <TopMovers watchlist={watchlist} />

            {/* Pending Orders */}
            <PendingOrders orders={orders} />
          </div>
        </div>
      </div>
    </div>
  );
};
