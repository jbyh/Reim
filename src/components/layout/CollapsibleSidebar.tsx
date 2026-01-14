import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

  return (
    <aside 
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "border-b border-sidebar-border flex items-center transition-all duration-300",
        isCollapsed ? "p-3 justify-center" : "p-5"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-xl text-foreground whitespace-nowrap overflow-hidden">
              TrAide
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-1 overflow-y-auto scrollbar-thin",
        isCollapsed ? "px-2 py-4" : "px-3 py-4"
      )}>
        {!isCollapsed && (
          <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Main Menu
          </p>
        )}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-secondary/60 hover:text-foreground",
              isCollapsed ? "p-3 justify-center" : "px-4 py-3",
              activeTab === item.id && "bg-primary/15 text-primary border border-primary/20"
            )}
          >
            <item.icon className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-5 w-5")} />
            {!isCollapsed && (
              <span className="font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className={cn(
        "border-t border-sidebar-border",
        isCollapsed ? "p-2" : "p-3"
      )}>
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* Account Card - Only when expanded */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="balance-card">
            <div className="relative z-10">
              <p className="text-xs text-white/70 mb-1">Account Value</p>
              <p className="font-mono text-xl font-bold text-white mb-2">
                ${portfolio.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold",
                dailyPL >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}>
                {dailyPL >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {dailyPL >= 0 ? '+' : ''}{dailyPLPercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Account Card when collapsed */}
      {isCollapsed && (
        <div className="p-2 border-t border-sidebar-border">
          <div className={cn(
            "rounded-xl p-2 flex items-center justify-center",
            dailyPL >= 0 ? "bg-success/20" : "bg-destructive/20"
          )}>
            {dailyPL >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-success" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
