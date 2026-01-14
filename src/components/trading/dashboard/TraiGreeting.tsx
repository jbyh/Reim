import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, AlertCircle, Calendar } from 'lucide-react';
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

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Generate dynamic insights
    const newInsights: string[] = [];
    
    // Portfolio performance insight
    if (portfolio.dayPL !== 0) {
      if (portfolio.dayPL > 0) {
        newInsights.push(`You're up $${portfolio.dayPL.toFixed(2)} today (+${portfolio.dayPLPercent.toFixed(2)}%)`);
      } else {
        newInsights.push(`Your portfolio is down $${Math.abs(portfolio.dayPL).toFixed(2)} today`);
      }
    }

    // Top mover insight
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

    // Buying power insight
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
            <div 
              key={idx}
              className="flex items-center gap-3 text-sm"
            >
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
        <div className="grid gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                onAskTrai(action.label);
                onNavigateToChat();
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all group text-left w-full"
            >
              <action.icon className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground flex-1">{action.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
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
