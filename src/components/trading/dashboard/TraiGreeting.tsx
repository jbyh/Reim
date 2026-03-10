import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, AlertCircle, Calendar, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Position, Portfolio } from '@/types/trading';

interface TraiGreetingProps {
  portfolio: Portfolio;
  positions: Position[];
  onAskTrai: (message: string) => void;
  onNavigateToChat: () => void;
}

export const TraiGreeting = ({ portfolio, positions, onAskTrai, onNavigateToChat }: TraiGreetingProps) => {
  const [greeting, setGreeting] = useState('Good morning');
  const [insights, setInsights] = useState<string[]>([]);
  const [previewAction, setPreviewAction] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const newInsights: string[] = [];
    
    if (portfolio.dayPL !== 0) {
      if (portfolio.dayPL > 0) {
        newInsights.push(`You're up $${portfolio.dayPL.toFixed(2)} today (+${portfolio.dayPLPercent.toFixed(2)}%)`);
      } else {
        newInsights.push(`Your portfolio is down $${Math.abs(portfolio.dayPL).toFixed(2)} today`);
      }
    }

    const topMover = [...positions].sort((a, b) => 
      Math.abs(b.unrealizedPLPercent) - Math.abs(a.unrealizedPLPercent)
    )[0];
    if (topMover) {
      if (topMover.unrealizedPLPercent > 0) {
        newInsights.push(`${topMover.symbol} is your top gainer at +${topMover.unrealizedPLPercent.toFixed(1)}%`);
      } else {
        newInsights.push(`${topMover.symbol} needs attention: ${topMover.unrealizedPLPercent.toFixed(1)}%`);
      }
    }

    if (portfolio.buyingPower > 0) {
      newInsights.push(`You have $${(portfolio.buyingPower / 1000).toFixed(1)}k buying power available`);
    }

    setInsights(newInsights);
  }, [portfolio, positions]);

  const quickActions = [
    { label: "What's moving today?", icon: TrendingUp },
    { label: "Review my portfolio", icon: AlertCircle },
    { label: "Find options plays", icon: Calendar },
  ];

  const handleQuickAction = (label: string) => {
    setPreviewAction(label);
  };

  const confirmAction = () => {
    if (previewAction) {
      onAskTrai(previewAction);
      onNavigateToChat();
      setPreviewAction(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="relative px-5 py-6 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
        <div className="absolute inset-0 bg-gradient-radial-purple opacity-50" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 rounded-2xl gradient-purple glow-primary">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">
              {greeting}! <span className="text-gradient-purple">I'm Trai</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Your AI trading companion. Here's what's happening:
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="px-5 py-4 space-y-3 border-b border-border/30">
        {insights.length > 0 ? (
          insights.map((insight, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm">
              <div className={cn(
                "h-2 w-2 rounded-full flex-shrink-0",
                idx === 0 ? "bg-primary" : idx === 1 ? "bg-success" : "bg-warning"
              )} />
              <p className="text-foreground">{insight}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Loading your insights...</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">Quick Actions</p>
        
        {previewAction ? (
          <div className="rounded-xl bg-secondary/50 p-3 space-y-2">
            <p className="text-[11px] text-muted-foreground">I'll ask Trai:</p>
            <p className="text-sm font-medium text-foreground">"{previewAction}"</p>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setPreviewAction(null)} className="flex-1 text-xs h-8 rounded-lg">
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={confirmAction} className="flex-1 text-xs h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                <Send className="h-3 w-3 mr-1" /> Send
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.label)}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all group text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <action.icon className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground flex-1">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Button */}
      <div className="px-4 pb-4">
        <Button 
          onClick={onNavigateToChat}
          variant="outline" 
          className="w-full border-primary/30 text-primary hover:bg-primary/10"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Chat with Trai
        </Button>
      </div>
    </div>
  );
};
