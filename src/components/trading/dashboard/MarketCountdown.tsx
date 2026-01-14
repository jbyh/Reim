import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MarketCountdownProps {
  onGoToFloor: () => void;
}

export const MarketCountdown = ({ onGoToFloor }: MarketCountdownProps) => {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const day = nyTime.getDay();
      const hours = nyTime.getHours();
      const minutes = nyTime.getMinutes();
      
      // Market hours: 9:30 AM - 4:00 PM ET, Mon-Fri
      const isWeekday = day >= 1 && day <= 5;
      const afterOpen = hours > 9 || (hours === 9 && minutes >= 30);
      const beforeClose = hours < 16;
      
      if (isWeekday && afterOpen && beforeClose) {
        setIsMarketOpen(true);
        // Time until close
        const closeTime = new Date(nyTime);
        closeTime.setHours(16, 0, 0, 0);
        const diff = closeTime.getTime() - nyTime.getTime();
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ hours: h, minutes: m, seconds: s });
      } else {
        setIsMarketOpen(false);
        // Calculate next open time
        let nextOpen = new Date(nyTime);
        nextOpen.setHours(9, 30, 0, 0);
        
        if (hours >= 16 || (hours === 9 && minutes >= 30 && isWeekday)) {
          // After today's close, next day
          nextOpen.setDate(nextOpen.getDate() + 1);
        }
        
        // Skip weekends
        while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
          nextOpen.setDate(nextOpen.getDate() + 1);
        }
        
        const diff = nextOpen.getTime() - nyTime.getTime();
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ hours: h, minutes: m, seconds: s });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNum = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="glass-card rounded-2xl p-5 border border-border/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isMarketOpen ? "bg-success/20" : "bg-warning/20"
          )}>
            <Clock className={cn("h-5 w-5", isMarketOpen ? "text-success" : "text-warning")} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isMarketOpen ? 'Market Open' : 'Market Closed'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isMarketOpen ? 'Closes in' : 'Opens in'}
            </p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
          isMarketOpen ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", isMarketOpen ? "bg-success animate-pulse" : "bg-warning")} />
          {isMarketOpen ? 'LIVE' : 'CLOSED'}
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {[
          { value: countdown.hours, label: 'HRS' },
          { value: countdown.minutes, label: 'MIN' },
          { value: countdown.seconds, label: 'SEC' },
        ].map((item, idx) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="bg-secondary/80 rounded-xl px-4 py-3 text-center min-w-[60px]">
              <p className="font-mono text-2xl font-bold text-foreground">{formatNum(item.value)}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{item.label}</p>
            </div>
            {idx < 2 && <span className="text-2xl font-bold text-muted-foreground">:</span>}
          </div>
        ))}
      </div>

      {/* Go to The Floor */}
      <Button 
        onClick={onGoToFloor}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        <Zap className="h-4 w-4" />
        Enter The Floor
        <TrendingUp className="h-4 w-4" />
      </Button>
    </div>
  );
};
