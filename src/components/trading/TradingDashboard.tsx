import { useState } from 'react';
import { useTradingState } from '@/hooks/useTradingState';
import { Watchlist } from './Watchlist';
import { ChatPanel } from './ChatPanel';
import { PortfolioPanel } from './PortfolioPanel';
import { AccountHistory } from './AccountHistory';
import { PositionDetail } from './PositionDetail';
import { OptionsViewNew } from './options/OptionsViewNew';
import { TheFloor } from './TheFloor';
import { DashboardView } from './views/DashboardView';
import { Position } from '@/types/trading';
import { 
  LayoutDashboard, 
  TrendingUp, 
  PieChart, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
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

  const handleNavigate = (tab: TabType, symbol?: string) => {
    setActiveTab(tab);
    setSelectedPosition(null);
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
        "fixed md:relative z-50 h-full w-16 md:w-[72px] bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-3 md:py-5 border-b border-sidebar-border flex items-center justify-center">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg text-foreground">TrAide</span>
              </div>
              <button 
                className="p-2 hover:bg-secondary rounded-lg"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 flex flex-col items-center gap-1" role="navigation" aria-label="Main navigation">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              aria-label={item.label}
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={cn(
                "relative group flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                sidebarOpen 
                  ? "w-full px-4 py-3 gap-3 justify-start mx-2" 
                  : "w-11 h-11",
                activeTab === item.id 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                activeTab !== item.id && "group-hover:scale-110"
              )} />
              {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              
              {/* Active indicator bar */}
              {activeTab === item.id && !sidebarOpen && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
              )}
              
              {/* Tooltip on collapsed */}
              {!sidebarOpen && (
                <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-popover border border-border text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Account Card – collapsed: just the P&L badge */}
        <div className="p-2 md:p-3 border-t border-sidebar-border">
          {sidebarOpen ? (
            <div className="balance-card">
              <div className="relative z-10">
                <p className="text-xs text-white/70 mb-1">Account Value</p>
                <p className="font-mono text-xl font-bold text-white mb-2">
                  ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <div className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold",
                  dailyPL >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                )}>
                  {dailyPL >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {dailyPL >= 0 ? '+' : ''}{dailyPLPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex items-center justify-center w-11 h-11 rounded-xl text-[10px] font-bold font-mono",
                dailyPL >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              )}>
                {dailyPL >= 0 ? '+' : ''}{dailyPLPercent.toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex-shrink-0 h-14 border-b border-border/50 bg-card/30 backdrop-blur-xl flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 hover:bg-secondary rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-foreground capitalize">
                {activeTab === 'chat' ? 'Trai AI' : activeTab}
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                {activeTab === 'dashboard' && 'Welcome back to TrAide'}
                {activeTab === 'watchlist' && 'Real-time market quotes'}
                {activeTab === 'portfolio' && 'Your positions and holdings'}
                {activeTab === 'options' && 'Draw your price predictions'}
                {activeTab === 'history' && 'Trade history and activity'}
                {activeTab === 'chat' && 'Your AI trading companion'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/30">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[11px] font-medium text-success">Live</span>
            </div>
            {/* Profile avatar – round, different from Trai's square purple icon */}
            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
              <span className="text-xs font-semibold text-foreground">TR</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              portfolio={portfolio}
              positions={positions}
              watchlist={watchlist}
              orders={orders}
              onNavigate={handleNavigate}
              onPositionClick={handlePositionClick}
              onAskTrai={sendMessage}
            />
          )}

          {activeTab === 'watchlist' && (
            <div className="h-full">
              <Watchlist stocks={watchlist} />
            </div>
          )}

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

          {activeTab === 'options' && (
            <div className="h-full">
              <OptionsViewNew />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="h-full">
              <AccountHistory 
                activities={activities} 
                isLoading={isLoadingActivities} 
                onRefresh={fetchActivities} 
              />
            </div>
          )}

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
