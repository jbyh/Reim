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
      
      const isWeekday = day >= 1 && day <= 5;
      const afterOpen = hours > 9 || (hours === 9 && minutes >= 30);
      const beforeClose = hours < 16;
      
      if (isWeekday && afterOpen && beforeClose) {
        setIsMarketOpen(true);
        const closeTime = new Date(nyTime);
        closeTime.setHours(16, 0, 0, 0);
        const diff = closeTime.getTime() - nyTime.getTime();
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ hours: h, minutes: m, seconds: s });
      } else {
        setIsMarketOpen(false);
        let nextOpen = new Date(nyTime);
        nextOpen.setHours(9, 30, 0, 0);
        
        if (hours >= 16 || (hours === 9 && minutes >= 30 && isWeekday)) {
          nextOpen.setDate(nextOpen.getDate() + 1);
        }
        
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
    <div className="glass-card rounded-2xl p-4 border border-border/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-2 rounded-xl",
            isMarketOpen ? "bg-success/20" : "bg-warning/20"
          )}>
            <Clock className={cn("h-4 w-4", isMarketOpen ? "text-success" : "text-warning")} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isMarketOpen ? 'Market Open' : 'Market Closed'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isMarketOpen ? 'Closes in' : 'Opens in'}
            </p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold",
          isMarketOpen ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", isMarketOpen ? "bg-success animate-pulse" : "bg-warning")} />
          {isMarketOpen ? 'LIVE' : 'CLOSED'}
        </div>
      </div>

      {/* Countdown Timer – contained */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {[
          { value: countdown.hours, label: 'HRS' },
          { value: countdown.minutes, label: 'MIN' },
          { value: countdown.seconds, label: 'SEC' },
        ].map((item, idx) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="bg-secondary/80 rounded-lg px-2.5 py-2 text-center w-[52px]">
              <p className="font-mono text-xl font-bold text-foreground leading-none">{formatNum(item.value)}</p>
              <p className="text-[9px] text-muted-foreground font-medium mt-1">{item.label}</p>
            </div>
            {idx < 2 && <span className="text-lg font-bold text-muted-foreground/50">:</span>}
          </div>
        ))}
      </div>

      {/* Go to The Floor */}
      <Button 
        onClick={onGoToFloor}
        className="w-full btn-primary flex items-center justify-center gap-2 text-sm h-9"
        aria-label="Enter The Floor live trading view"
      >
        <Zap className="h-3.5 w-3.5" />
        Enter The Floor
        <TrendingUp className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
