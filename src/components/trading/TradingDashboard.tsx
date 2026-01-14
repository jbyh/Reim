import { useState } from 'react';
import { useTradingState } from '@/hooks/useTradingState';
import { Watchlist } from './Watchlist';
import { ChatPanel } from './ChatPanel';
import { PortfolioPanel } from './PortfolioPanel';
import { AccountHistory } from './AccountHistory';
import { PositionDetail } from './PositionDetail';
import { OptionsViewNew } from './options/OptionsViewNew';
import { TheFloor } from './TheFloor';
import { MarketCountdown } from './dashboard/MarketCountdown';
import { TraiGreeting } from './dashboard/TraiGreeting';
import { PortfolioValueChart } from './dashboard/PortfolioValueChart';
import { TopMovers } from './dashboard/TopMovers';
import { PendingOrders } from './dashboard/PendingOrders';
import { Position } from '@/types/trading';
import { 
  LayoutDashboard, 
  TrendingUp, 
  PieChart, 
  MessageCircle, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Bell,
  Settings,
  Menu,
  X,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'watchlist' | 'portfolio' | 'chat' | 'history' | 'options' | 'floor';

export const TradingDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  
  const {
    watchlist,
    positions,
    portfolio,
    orders,
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

  const sidebarItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'watchlist' as TabType, label: 'Watchlist', icon: BarChart3 },
    { id: 'portfolio' as TabType, label: 'Portfolio', icon: PieChart },
    { id: 'options' as TabType, label: 'Options', icon: Layers },
    { id: 'history' as TabType, label: 'History', icon: Clock },
    { id: 'chat' as TabType, label: 'Trai', icon: Sparkles },
  ];

  const handleNavClick = (id: TabType) => {
    setActiveTab(id);
    setSidebarOpen(false);
    setSelectedPosition(null);
  };

  const handlePositionClick = (position: Position) => {
    setSelectedPosition(position);
  };

  // If on The Floor, show full screen
  if (activeTab === 'floor') {
    return <TheFloor onBack={() => setActiveTab('dashboard')} />;
  }

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
              <span className="font-bold text-xl text-foreground">TrAide</span>
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

        {/* Account Card */}
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
              <h1 className="text-lg font-semibold text-foreground capitalize">
                {activeTab === 'chat' ? 'Trai AI' : activeTab}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {activeTab === 'dashboard' && 'Welcome back to TrAide'}
                {activeTab === 'watchlist' && 'Real-time market quotes'}
                {activeTab === 'portfolio' && 'Your positions and holdings'}
                {activeTab === 'options' && 'Draw your price predictions'}
                {activeTab === 'chat' && 'Your AI trading companion'}
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
              <span className="text-sm font-semibold text-white">TR</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="h-full overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left Column - Chart & Positions */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                  <PortfolioValueChart portfolio={portfolio} />
                  
                  {/* Quick Positions */}
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-border/40 flex items-center justify-between">
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
                        onClick={() => setActiveTab('portfolio')}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        View All
                      </button>
                    </div>
                    
                    <div className="divide-y divide-border/30 max-h-[280px] overflow-y-auto scrollbar-thin">
                      {positions.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground text-sm">No open positions</p>
                        </div>
                      ) : (
                        positions.slice(0, 5).map((pos) => (
                          <button 
                            key={pos.symbol} 
                            onClick={() => { setActiveTab('portfolio'); handlePositionClick(pos); }}
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

                {/* Right Column - Trai & Market */}
                <div className="space-y-4 md:space-y-6">
                  <TraiGreeting 
                    portfolio={portfolio} 
                    positions={positions}
                    onAskTrai={sendMessage}
                    onNavigateToChat={() => setActiveTab('chat')}
                  />
                  <MarketCountdown onGoToFloor={() => setActiveTab('floor')} />
                  <TopMovers watchlist={watchlist} />
                  <PendingOrders orders={orders} />
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
