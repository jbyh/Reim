import { useState } from 'react';
import { useTradingState } from '@/hooks/useTradingState';
import { Watchlist } from './Watchlist';
import { ChatPanel } from './ChatPanel';
import { PortfolioPanel } from './PortfolioPanel';
import { AccountHistory } from './AccountHistory';
import { PositionDetail } from './PositionDetail';
import { PerformanceAttribution } from './PerformanceAttribution';
import { OptionsViewNew } from './options/OptionsViewNew';
import { Position } from '@/types/trading';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart, 
  MessageCircle, 
  BarChart3,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Bell,
  Settings,
  Menu,
  X,
  Clock,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type TabType = 'dashboard' | 'watchlist' | 'portfolio' | 'chat' | 'history' | 'options';

export const TradingDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  
  const {
    watchlist,
    positions,
    portfolio,
    messages,
    pendingOrder,
    isLoading,
    activities,
    isLoadingActivities,
    sendMessage,
    confirmOrder,
    cancelOrder,
    fetchActivities,
  } = useTradingState();

  const dailyPL = portfolio.dayPL;
  const dailyPLPercent = portfolio.dayPLPercent;
  const totalReturn = portfolio.totalPL;
  const totalReturnPercent = portfolio.totalPLPercent;

  const sidebarItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'watchlist' as TabType, label: 'Watchlist', icon: BarChart3 },
    { id: 'portfolio' as TabType, label: 'Portfolio', icon: PieChart },
    { id: 'options' as TabType, label: 'Options', icon: Layers },
    { id: 'history' as TabType, label: 'History', icon: Clock },
    { id: 'chat' as TabType, label: 'AI Coach', icon: MessageCircle },
  ];

  const handleNavClick = (id: TabType) => {
    setActiveTab(id);
    setSidebarOpen(false);
    setSelectedPosition(null);
  };

  const handlePositionClick = (position: Position) => {
    setSelectedPosition(position);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:relative z-50 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-foreground">TradePilot</span>
            </div>
            <button 
              className="md:hidden p-2 hover:bg-secondary rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-secondary/60 border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Main Menu</p>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn("sidebar-nav-item w-full", activeTab === item.id && "active")}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Upgrade Card */}
        <div className="p-4">
          <div className="balance-card">
            <div className="relative z-10">
              <p className="text-sm text-white/70 mb-1">Account Value</p>
              <p className="font-mono text-2xl font-bold text-white mb-3">
                ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold",
                dailyPL >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}>
                {dailyPL >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {dailyPL >= 0 ? '+' : ''}{dailyPLPercent.toFixed(2)}% today
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex-shrink-0 h-16 border-b border-border/50 bg-card/30 backdrop-blur-xl flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 hover:bg-secondary rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground capitalize">{activeTab === 'chat' ? 'AI Trading Coach' : activeTab}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {activeTab === 'dashboard' && 'Overview of your trading activity'}
                {activeTab === 'watchlist' && 'Real-time market quotes'}
                {activeTab === 'portfolio' && 'Your positions and holdings'}
                {activeTab === 'options' && 'Draw your price predictions'}
                {activeTab === 'chat' && 'Get AI-powered trading insights'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success">Live</span>
            </div>
            <button className="p-2 hover:bg-secondary rounded-xl transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-secondary rounded-xl transition-colors">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center">
              <span className="text-sm font-semibold text-white">TP</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
              {/* Balance Card */}
              <div className="balance-card">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-5 w-5 text-white/70" />
                      <span className="text-sm text-white/70">My Balance</span>
                    </div>
                    <p className="font-mono text-3xl md:text-4xl font-bold text-white mb-2">
                      ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold",
                      dailyPL >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}>
                      {dailyPL >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {dailyPL >= 0 ? '+' : ''}{dailyPLPercent.toFixed(2)}% today
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button className="btn-primary">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Transfer
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      Request
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cash */}
                <div className="stat-card">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-primary/20">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cash Available</p>
                    <p className="font-mono text-2xl font-bold text-foreground">
                      ${portfolio.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Buying Power */}
                <div className="stat-card">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-success/20">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Buying Power</p>
                    <p className="font-mono text-2xl font-bold text-foreground">
                      ${portfolio.buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Daily P/L */}
                <div className={cn("stat-card", dailyPL >= 0 ? "gradient-gain" : "gradient-loss")}>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn("p-2 rounded-xl", dailyPL >= 0 ? "bg-success/20" : "bg-destructive/20")}>
                        {dailyPL >= 0 ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Daily P/L</p>
                    <p className={cn("font-mono text-2xl font-bold", dailyPL >= 0 ? "text-success" : "text-destructive")}>
                      {dailyPL >= 0 ? '+' : ''}${Math.abs(dailyPL).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Total Return */}
                <div className="insight-card">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl gradient-purple">
                        <PieChart className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Return</p>
                    <p className={cn("font-mono text-2xl font-bold", totalReturn >= 0 ? "text-gradient-purple" : "text-destructive")}>
                      {totalReturn >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/20">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Open Positions</h3>
                        <p className="text-xs text-muted-foreground">{positions.length} active</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('portfolio')}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      View All
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-border/30">
                  {positions.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-3">
                        <PieChart className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No open positions</p>
                      <p className="text-xs text-muted-foreground mt-1">Start trading to see your positions here</p>
                    </div>
                  ) : (
                    positions.slice(0, 5).map((pos) => (
                      <button 
                        key={pos.symbol} 
                        onClick={() => { setActiveTab('portfolio'); handlePositionClick(pos); }}
                        className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors w-full text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                            pos.unrealizedPL >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                          )}>
                            {pos.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{pos.symbol}</p>
                            <p className="text-xs text-muted-foreground">{pos.qty} shares @ ${pos.avgPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold text-foreground">${pos.marketValue.toLocaleString()}</p>
                          <p className={cn(
                            "text-xs font-medium flex items-center justify-end gap-1",
                            pos.unrealizedPL >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {pos.unrealizedPL >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {pos.unrealizedPL >= 0 ? '+' : ''}${pos.unrealizedPL.toFixed(2)} ({pos.unrealizedPLPercent.toFixed(2)}%)
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Performance Attribution */}
              <PerformanceAttribution positions={positions} totalEquity={portfolio.equity} />

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {sidebarItems.slice(1).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="glass-card p-5 rounded-xl flex items-center gap-4 hover:bg-card transition-all group border border-transparent hover:border-primary/20"
                  >
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-foreground block">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.id === 'watchlist' && `${watchlist.length} stocks`}
                        {item.id === 'portfolio' && `${positions.length} positions`}
                        {item.id === 'history' && `${activities.length} activities`}
                        {item.id === 'chat' && 'AI insights'}
                      </span>
                    </div>
                  </button>
                ))}
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
              {selectedPosition ? (
                <PositionDetail 
                  position={selectedPosition} 
                  activities={activities}
                  onBack={() => setSelectedPosition(null)} 
                />
              ) : (
                <PortfolioPanel 
                  portfolio={portfolio} 
                  positions={positions} 
                  onPositionClick={handlePositionClick}
                />
              )}
            </div>
          )}

          {/* Options View */}
          {activeTab === 'options' && (
            <div className="h-full">
              <OptionsViewNew />
            </div>
          )}

          {/* History View */}
          {activeTab === 'history' && (
            <div className="h-full">
              <AccountHistory 
                activities={activities} 
                isLoading={isLoadingActivities} 
                onRefresh={fetchActivities} 
              />
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
        </main>
      </div>
    </div>
  );
};