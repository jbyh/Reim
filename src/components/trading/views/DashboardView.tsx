import { Portfolio, Position, Stock, Order } from '@/types/trading';
import { MarketCountdown } from '@/components/trading/dashboard/MarketCountdown';
import { TraiGreeting } from '@/components/trading/dashboard/TraiGreeting';
import { PortfolioValueChart } from '@/components/trading/dashboard/PortfolioValueChart';
import { TopMovers } from '@/components/trading/dashboard/TopMovers';
import { PendingOrders } from '@/components/trading/dashboard/PendingOrders';
import { PieChart, TrendingUp, Eye } from 'lucide-react';
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
  onAskTrai,
}: DashboardViewProps) => {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="p-4 lg:p-6">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5 auto-rows-min">
          
          {/* Portfolio Chart - Large card spanning 8 cols */}
          <div className="md:col-span-2 lg:col-span-8 row-span-1">
            <PortfolioValueChart portfolio={portfolio} />
          </div>

          {/* Trai Greeting - 4 cols on right */}
          <div className="md:col-span-2 lg:col-span-4 row-span-1">
            <TraiGreeting 
              portfolio={portfolio} 
              positions={positions}
              onAskTrai={onAskTrai}
              onNavigateToChat={() => onNavigate('chat')}
            />
          </div>

          {/* Positions Card - 5 cols */}
          <div className="md:col-span-2 lg:col-span-5">
            <div className="glass-card rounded-2xl overflow-hidden h-full">
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
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View All
                </button>
              </div>
              
              <div className="divide-y divide-border/30 max-h-[300px] overflow-y-auto scrollbar-thin">
                {positions.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground text-sm">No open positions</p>
                  </div>
                ) : (
                  positions.slice(0, 5).map((pos) => (
                    <button 
                      key={pos.symbol} 
                      onClick={() => { onNavigate('portfolio'); onPositionClick(pos); }}
                      className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                          pos.unrealizedPL >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                        )}>
                          {pos.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{pos.symbol}</p>
                          <p className="text-xs text-muted-foreground">{pos.qty} shares</p>
                        </div>
                      </div>
                      <div className="text-right">
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

          {/* Market Countdown - 3 cols */}
          <div className="md:col-span-1 lg:col-span-3">
            <MarketCountdown onGoToFloor={() => onNavigate('floor')} />
          </div>

          {/* Top Movers - 4 cols */}
          <div className="md:col-span-1 lg:col-span-4">
            <TopMovers watchlist={watchlist} />
          </div>

          {/* Pending Orders - Full width on small, 5 cols on xl */}
          <div className="md:col-span-2 xl:col-span-5">
            <PendingOrders orders={orders} />
          </div>

          {/* Quick Actions - 7 cols */}
          <div className="md:col-span-2 xl:col-span-7">
            <div className="glass-card rounded-2xl p-4 lg:p-5">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button 
                  onClick={() => onNavigate('watchlist')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <Eye className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Watchlist</span>
                </button>
                <button 
                  onClick={() => onNavigate('options')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <TrendingUp className="h-5 w-5 text-success" />
                  <span className="text-xs font-medium text-foreground">Options</span>
                </button>
                <button 
                  onClick={() => onNavigate('portfolio')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <PieChart className="h-5 w-5 text-warning" />
                  <span className="text-xs font-medium text-foreground">Portfolio</span>
                </button>
                <button 
                  onClick={() => onNavigate('floor')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <TrendingUp className="h-5 w-5 text-purple" />
                  <span className="text-xs font-medium text-foreground">The Floor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
