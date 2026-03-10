import { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
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
        setCountdown({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
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
        setCountdown({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "p-1.5 rounded-lg shrink-0",
            isMarketOpen ? "bg-success/20" : "bg-warning/20"
          )}>
            <Clock className={cn("h-4 w-4", isMarketOpen ? "text-success" : "text-warning")} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {isMarketOpen ? 'Market Open' : 'Market Closed'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isMarketOpen ? 'Closes in' : 'Opens in'}
            </p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0",
          isMarketOpen ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isMarketOpen ? "bg-success animate-pulse" : "bg-warning")} />
          {isMarketOpen ? 'LIVE' : 'CLOSED'}
        </div>
      </div>

      {/* Timer — fixed widths, no overflow possible */}
      <div className="px-3.5 pb-3">
        <div className="flex items-center justify-center gap-1">
          {[
            { value: countdown.hours, label: 'HRS' },
            { value: countdown.minutes, label: 'MIN' },
            { value: countdown.seconds, label: 'SEC' },
          ].map((item, idx) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className="bg-secondary/80 rounded-lg w-[46px] py-1.5 text-center">
                <p className="font-mono text-lg font-bold text-foreground leading-none">{pad(item.value)}</p>
                <p className="text-[8px] text-muted-foreground font-medium mt-0.5 uppercase">{item.label}</p>
              </div>
              {idx < 2 && <span className="text-base font-bold text-muted-foreground/40">:</span>}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-3.5 pb-3.5">
        <Button 
          onClick={onGoToFloor}
          size="sm"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium h-8 rounded-lg"
          aria-label="Enter The Floor live trading view"
        >
          <Zap className="h-3.5 w-3.5 mr-1.5" />
          Enter The Floor
        </Button>
      </div>
    </div>
  );
};
