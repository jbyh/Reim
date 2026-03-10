import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, AlertCircle, Calendar, Send, X } from 'lucide-react';
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
  const [insights, setInsights] = useState<string[]>([]);
  const [previewAction, setPreviewAction] = useState<string | null>(null);

  useEffect(() => {
    const newInsights: string[] = [];
    
    if (portfolio.dayPL !== 0) {
      if (portfolio.dayPL > 0) {
        newInsights.push(`Up $${portfolio.dayPL.toFixed(2)} today (+${portfolio.dayPLPercent.toFixed(2)}%)`);
      } else {
        newInsights.push(`Down $${Math.abs(portfolio.dayPL).toFixed(2)} today (${portfolio.dayPLPercent.toFixed(2)}%)`);
      }
    }

    const topMover = [...positions].sort((a, b) => 
      Math.abs(b.unrealizedPLPercent) - Math.abs(a.unrealizedPLPercent)
    )[0];
    if (topMover) {
      if (topMover.unrealizedPLPercent > 0) {
        newInsights.push(`${topMover.symbol} top gainer +${topMover.unrealizedPLPercent.toFixed(1)}%`);
      } else {
        newInsights.push(`${topMover.symbol} needs attention ${topMover.unrealizedPLPercent.toFixed(1)}%`);
      }
    }

    if (portfolio.buyingPower > 0) {
      newInsights.push(`$${(portfolio.buyingPower / 1000).toFixed(1)}k buying power available`);
    }

    setInsights(newInsights);
  }, [portfolio, positions]);

  const quickActions = [
    { label: "What's moving?", icon: TrendingUp },
    { label: "Review portfolio", icon: AlertCircle },
    { label: "Options plays", icon: Calendar },
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
      <div className="flex items-center gap-2.5 px-3.5 py-3 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="p-2 rounded-lg gradient-purple shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-foreground truncate">Trai Insights</h2>
          <p className="text-[10px] text-muted-foreground">AI-powered overview</p>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="px-3.5 py-2.5 space-y-1.5 border-b border-border/30">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[12px]">
              <div className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0 mt-1.5",
                idx === 0 ? "bg-primary" : idx === 1 ? "bg-success" : "bg-warning"
              )} />
              <p className="text-foreground leading-snug min-w-0">{insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-3 space-y-1.5">
        {previewAction ? (
          <div className="rounded-lg bg-secondary/50 p-2.5 space-y-2">
            <p className="text-[10px] text-muted-foreground">Ask Trai:</p>
            <p className="text-xs font-medium text-foreground">"{previewAction}"</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPreviewAction(null)} className="flex-1 text-[10px] h-7 rounded-lg">
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={confirmAction} className="flex-1 text-[10px] h-7 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                <Send className="h-3 w-3 mr-1" /> Send
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.label)}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
              >
                <action.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs text-foreground flex-1 truncate">{action.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
