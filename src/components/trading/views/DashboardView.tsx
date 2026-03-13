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
      <div className="p-3 sm:p-4 lg:p-5">
        {/*
          Mobile: single column
          md: 2-column grid
          lg: 3-column grid — main content spans 2
          All tiles use flex-1/auto height so they snap together like a bento box.
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

          {/* ── Portfolio Chart ── spans full width on md, 2 cols on lg */}
          <div className="md:col-span-2">
            <PortfolioValueChart portfolio={portfolio} />
          </div>

          {/* ── Trai Insights ── */}
          <div className="md:col-span-1">
            <TraiGreeting
              portfolio={portfolio}
              positions={positions}
              onAskTrai={onAskTrai}
              onNavigateToChat={() => onNavigate('chat')}
            />
          </div>

          {/* ── Positions ── spans full width on md, 2 cols on lg */}
          <div className="md:col-span-2 lg:col-span-2">
            <div className="glass-card rounded-2xl overflow-hidden h-full">
              <div className="p-3 sm:p-3.5 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-primary/20 shrink-0">
                    <PieChart className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-foreground">Positions</h3>
                    <p className="text-[10px] text-muted-foreground">{positions.length} active</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('portfolio')}
                  className="text-xs text-primary hover:underline font-medium shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
                  aria-label="View all positions"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-border/30">
                {positions.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground text-sm">No open positions</p>
                  </div>
                ) : (
                  positions.slice(0, 5).map((pos) => (
                    <button
                      key={pos.symbol}
                      onClick={() => { onNavigate('portfolio'); onPositionClick(pos); }}
                      className="flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-0"
                      aria-label={`${pos.symbol}: ${pos.qty} shares`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                          pos.unrealizedPL >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                        )}>
                          {pos.symbol.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{pos.symbol}</p>
                          <p className="text-[10px] text-muted-foreground">{pos.qty} shares</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-mono text-xs font-semibold text-foreground">${pos.marketValue.toLocaleString()}</p>
                        <p className={cn(
                          "text-[10px] font-medium",
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

          {/* ── Market Countdown ── */}
          <div className="md:col-span-1">
            <MarketCountdown onGoToFloor={() => onNavigate('floor')} />
          </div>

          {/* ── Top Movers ── */}
          <div className="md:col-span-1">
            <TopMovers watchlist={watchlist} />
          </div>

          {/* ── Pending Orders ── */}
          <div className="md:col-span-1 lg:col-span-2">
            <PendingOrders orders={orders} />
          </div>
        </div>
      </div>
    </div>
  );
};
