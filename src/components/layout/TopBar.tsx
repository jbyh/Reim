import { Menu, Bell, Settings, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'watchlist' | 'portfolio' | 'options' | 'history' | 'chat' | 'floor';

interface TopBarProps {
  activeTab: TabType;
  onMenuClick: () => void;
  onTabChange: (tab: TabType) => void;
}

const tabLabels: Record<TabType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Welcome back to TrAide' },
  watchlist: { title: 'Watchlist', subtitle: 'Real-time market quotes' },
  portfolio: { title: 'Portfolio', subtitle: 'Your positions and holdings' },
  options: { title: 'Options', subtitle: 'Draw your price predictions' },
  history: { title: 'History', subtitle: 'Your trading activity' },
  chat: { title: 'Trai AI', subtitle: 'Your AI trading companion' },
  floor: { title: 'The Floor', subtitle: 'Market screener' },
};

export const TopBar = ({ activeTab, onMenuClick, onTabChange }: TopBarProps) => {
  const { title, subtitle } = tabLabels[activeTab];

  return (
    <header className="flex-shrink-0 h-16 border-b border-border/40 bg-card/30 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button 
          className="lg:hidden p-2 hover:bg-secondary rounded-xl transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
        
        {/* Page title */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-success">Live</span>
        </div>
        
        {/* Notifications */}
        <button className="p-2 hover:bg-secondary rounded-xl transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
        
        {/* Settings */}
        <button className="p-2 hover:bg-secondary rounded-xl transition-colors">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
        
        {/* User avatar */}
        <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center">
          <span className="text-sm font-semibold text-white">TR</span>
        </div>
      </div>
    </header>
  );
};
