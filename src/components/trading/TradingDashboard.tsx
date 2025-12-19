import { useState } from 'react';
import { useTradingState } from '@/hooks/useTradingState';
import { Watchlist } from './Watchlist';
import { ChatPanel } from './ChatPanel';
import { PortfolioPanel } from './PortfolioPanel';
import { Activity, Zap, TrendingUp, TrendingDown, Wallet, PieChart, MessageCircle, BarChart3, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'watchlist' | 'portfolio' | 'chat';

export const TradingDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  const {
    watchlist,
    positions,
    portfolio,
    messages,
    pendingOrder,
    isLoading,
    sendMessage,
    confirmOrder,
    cancelOrder,
  } = useTradingState();

  const dailyPL = portfolio.dayPL;
  const dailyPLPercent = portfolio.dayPLPercent;
  const totalReturn = portfolio.totalPL;
  const totalReturnPercent = portfolio.totalPLPercent;

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Overview', icon: Home },
    { id: 'watchlist' as TabType, label: 'Watchlist', icon: BarChart3 },
    { id: 'portfolio' as TabType, label: 'Portfolio', icon: PieChart },
    { id: 'chat' as TabType, label: 'AI Coach', icon: MessageCircle },
  ];

  return (
    <div className="h-screen flex flex-col bg-background bg-gradient-radial overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl flex-shrink-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-primary/20 glow-primary">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-xl sm:text-2xl text-gradient-primary tracking-tight">TradePilot</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">AI Trading Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs sm:text-sm font-medium text-success">Live</span>
              </div>
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden md:flex items-center gap-1 mt-4 -mb-[1px]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-card/80 text-foreground border-t border-x border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1800px] mx-auto">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Portfolio Value */}
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-primary/20">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Portfolio</span>
                  </div>
                  <p className="font-mono text-2xl sm:text-4xl font-bold text-foreground mb-2">
                    ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-semibold",
                      dailyPL >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}>
                      {dailyPL >= 0 ? '+' : ''}{dailyPLPercent.toFixed(2)}% today
                    </span>
                  </div>
                </div>

                {/* Daily P/L */}
                <div className={cn("stat-card", dailyPL >= 0 ? "gradient-gain" : "gradient-loss")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-xl", dailyPL >= 0 ? "bg-success/20" : "bg-destructive/20")}>
                      {dailyPL >= 0 ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Daily P/L</span>
                  </div>
                  <p className={cn("font-mono text-2xl sm:text-4xl font-bold mb-2", dailyPL >= 0 ? "text-success" : "text-destructive")}>
                    {dailyPL >= 0 ? '+' : ''}${Math.abs(dailyPL).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">{positions.length} position{positions.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Total Return */}
                <div className="insight-card">
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="p-2 rounded-xl gradient-purple-gold">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Return</span>
                  </div>
                  <p className={cn("font-mono text-2xl sm:text-4xl font-bold mb-2 relative z-10", totalReturn >= 0 ? "text-gradient-purple-gold" : "text-destructive")}>
                    {totalReturn >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground relative z-10">Since inception</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tabs.slice(1).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="glass-card p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-card/60 transition-all group"
                  >
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <tab.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Recent Activity Preview */}
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {positions.slice(0, 3).map((pos) => (
                    <div key={pos.symbol} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-1 h-10 rounded-full", pos.unrealizedPL >= 0 ? "bg-success" : "bg-destructive")} />
                        <div>
                          <p className="font-bold text-foreground">{pos.symbol}</p>
                          <p className="text-xs text-muted-foreground">{pos.qty} shares</p>
                        </div>
                      </div>
                      <p className={cn("font-mono font-semibold", pos.unrealizedPL >= 0 ? "text-success" : "text-destructive")}>
                        {pos.unrealizedPL >= 0 ? '+' : ''}${pos.unrealizedPL.toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {positions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No open positions</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Watchlist View */}
          {activeTab === 'watchlist' && (
            <div className="h-full">
              <Watchlist stocks={watchlist} />
            </div>
          )}

          {/* Portfolio View */}
          {activeTab === 'portfolio' && (
            <div className="h-full">
              <PortfolioPanel portfolio={portfolio} positions={positions} />
            </div>
          )}

          {/* Chat View */}
          {activeTab === 'chat' && (
            <div className="h-full">
              <ChatPanel
                messages={messages}
                pendingOrder={pendingOrder}
                watchlist={watchlist}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                onConfirmOrder={confirmOrder}
                onCancelOrder={cancelOrder}
              />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden flex-shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-xl safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", activeTab === tab.id && "text-primary")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};