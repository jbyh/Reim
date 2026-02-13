import { Menu, Bell, LogIn, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'TR';
  };

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
        
        {/* API Key Status */}
        {user && !profile?.alpaca_api_key_encrypted && (
          <button 
            onClick={() => navigate('/profile')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/30 hover:bg-warning/20 transition-colors"
          >
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-medium text-warning">Setup API Keys</span>
          </button>
        )}
        
        {/* Notifications */}
        <button className="p-2 hover:bg-secondary rounded-xl transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
        
        {/* User avatar / Auth */}
        {!loading && (
          <>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer">
                    <span className="text-sm font-semibold text-white">{getUserInitials()}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.display_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile & API Keys
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button 
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-purple text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
};