import { useState } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  PieChart, 
  BarChart3,
  Clock,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portfolio } from '@/types/trading';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type TabType = 'dashboard' | 'watchlist' | 'portfolio' | 'options' | 'history' | 'chat' | 'floor';

interface CollapsibleSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  portfolio: Portfolio;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'watchlist' as TabType, label: 'Watchlist', icon: BarChart3 },
  { id: 'portfolio' as TabType, label: 'Portfolio', icon: PieChart },
  { id: 'options' as TabType, label: 'Options', icon: Layers },
  { id: 'history' as TabType, label: 'History', icon: Clock },
  { id: 'chat' as TabType, label: 'Trai', icon: Sparkles },
];

export const CollapsibleSidebar = ({ 
  activeTab, 
  onTabChange, 
  portfolio, 
  isCollapsed, 
  onToggleCollapse 
}: CollapsibleSidebarProps) => {
  const dailyPL = portfolio.dayPL;
  const dailyPLPercent = portfolio.dayPLPercent;

  const NavButton = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = activeTab === item.id;
    const button = (
      <button
        onClick={() => onTabChange(item.id)}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          "relative w-full flex items-center gap-3 rounded-xl transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isCollapsed ? "h-10 w-10 justify-center mx-auto" : "px-3 py-2",
          isActive
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 hover:scale-[1.03]"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
        )}
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {!isCollapsed && (
          <span className="text-sm font-medium truncate">{item.label}</span>
        )}
      </button>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return button;
  };

  return (
    <aside 
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 ease-in-out overflow-hidden",
        isCollapsed ? "w-[52px]" : "w-[180px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border shrink-0",
        isCollapsed ? "h-14 justify-center" : "h-14 px-3 gap-2"
      )}>
        <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center shrink-0">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-sm text-foreground truncate">TrAide</span>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 flex flex-col gap-0.5 py-2 overflow-y-auto scrollbar-thin",
          isCollapsed ? "px-1.5" : "px-2"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {!isCollapsed && (
          <p className="px-3 pb-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
            Menu
          </p>
        )}
        {navItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </nav>

      {/* Account summary */}
      <div className={cn(
        "border-t border-sidebar-border shrink-0",
        isCollapsed ? "p-1.5" : "p-2.5"
      )}>
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className={cn(
                "w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-[10px] font-bold font-mono cursor-default",
                dailyPL >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              )}>
                {dailyPL >= 0 ? '+' : ''}{dailyPLPercent.toFixed(1)}%
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p className="font-mono font-semibold">${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-muted-foreground">Account Value</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="rounded-xl bg-secondary/40 p-2.5 space-y-0.5">
            <p className="text-[9px] text-muted-foreground font-medium">Account Value</p>
            <p className="font-mono text-xs font-bold text-foreground">
              ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <div className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold",
              dailyPL >= 0 ? "text-success" : "text-destructive"
            )}>
              {dailyPL >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {dailyPL >= 0 ? '+' : ''}{dailyPLPercent.toFixed(2)}% today
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <div className={cn(
        "border-t border-sidebar-border shrink-0",
        isCollapsed ? "p-1.5" : "px-2.5 py-1.5"
      )}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isCollapsed ? "h-8 w-10 mx-auto" : "h-7 px-3"
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <>
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Collapse</span>
                </>
              )}
            </button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" sideOffset={8}>Expand</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
};
