import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradingState } from '@/hooks/useTradingState';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { TraiAssistant } from './TraiAssistant';
import { TopBar } from './TopBar';
import { Position } from '@/types/trading';

// Views
import { DashboardView } from '@/components/trading/views/DashboardView';
import { WatchlistView } from '@/components/trading/views/WatchlistView';
import { PortfolioView } from '@/components/trading/views/PortfolioView';
import { OptionsView } from '@/components/trading/views/OptionsView';
import { HistoryView } from '@/components/trading/views/HistoryView';
import { TheFloor } from '@/components/trading/TheFloor';

type TabType = 'dashboard' | 'watchlist' | 'portfolio' | 'options' | 'history' | 'chat' | 'floor';

export const AppShell = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [optionsSymbol, setOptionsSymbol] = useState<string>('SPY');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  
  const {
    watchlist,
    positions,
    portfolio,
    orders,
    messages,
    pendingOrder,
    orderStatus,
    isLoading,
    activities,
    isLoadingActivities,
    sendMessage,
    confirmOrder,
    cancelOrder,
    fetchActivities,
    addToWatchlist,
    removeFromWatchlist,
  } = useTradingState();

  // Responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedPosition(null);
    setMobileMenuOpen(false);
    
    // If switching to chat, this is handled by TraiAssistant
    if (tab === 'chat') {
      // Just focus Trai panel - it's omnipresent
    }
  };

  const handleNavigate = (tab: TabType, symbol?: string) => {
    setActiveTab(tab);
    if (symbol && tab === 'options') {
      setOptionsSymbol(symbol);
    }
  };

  const handlePositionClick = (position: Position) => {
    setSelectedPosition(position);
  };

  // Full-screen floor view
  if (activeTab === 'floor') {
    return <TheFloor onBack={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile unless menu open */}
      <div className={`
        fixed lg:relative z-50 h-full
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform duration-300
      `}>
        <CollapsibleSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          portfolio={portfolio}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Bar */}
        <TopBar
          activeTab={activeTab}
          onMenuClick={() => setMobileMenuOpen(true)}
          onTabChange={handleTabChange}
        />

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
            <WatchlistView
              stocks={watchlist}
              onAddStock={addToWatchlist}
              onRemoveStock={removeFromWatchlist}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioView
              portfolio={portfolio}
              positions={positions}
              selectedPosition={selectedPosition}
              activities={activities}
              onPositionClick={handlePositionClick}
              onBack={() => setSelectedPosition(null)}
            />
          )}

          {activeTab === 'options' && (
            <OptionsView
              initialSymbol={optionsSymbol}
              onSymbolChange={setOptionsSymbol}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              activities={activities}
              isLoading={isLoadingActivities}
              onRefresh={fetchActivities}
            />
          )}

          {/* Chat tab - Full page Trai experience */}
          {activeTab === 'chat' && (
            <TraiAssistant
              messages={messages}
              pendingOrder={pendingOrder}
              watchlist={watchlist}
              positions={positions}
              isLoading={isLoading}
              currentTab={activeTab}
              currentSymbol={optionsSymbol}
              orderStatus={orderStatus}
              onSendMessage={sendMessage}
              onConfirmOrder={confirmOrder}
              onCancelOrder={cancelOrder}
              onNavigate={handleNavigate}
              isFullPage={true}
            />
          )}
        </main>
      </div>

      {/* Omnipresent Trai Assistant - hidden when on chat tab */}
      {activeTab !== 'chat' && (
        <TraiAssistant
          messages={messages}
          pendingOrder={pendingOrder}
          watchlist={watchlist}
          positions={positions}
          isLoading={isLoading}
          currentTab={activeTab}
          currentSymbol={optionsSymbol}
          orderStatus={orderStatus}
          onSendMessage={sendMessage}
          onConfirmOrder={confirmOrder}
          onCancelOrder={cancelOrder}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};
