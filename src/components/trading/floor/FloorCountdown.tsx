import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FloorCountdown = () => {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [progress, setProgress] = useState(0);

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
        const openTime = new Date(nyTime);
        openTime.setHours(9, 30, 0, 0);
        const totalSession = closeTime.getTime() - openTime.getTime();
        const elapsed = nyTime.getTime() - openTime.getTime();
        setProgress(Math.min((elapsed / totalSession) * 100, 100));

        const diff = closeTime.getTime() - nyTime.getTime();
        setCountdown({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setIsMarketOpen(false);
        setProgress(0);
        let nextOpen = new Date(nyTime);
        nextOpen.setHours(9, 30, 0, 0);
        if (hours >= 16 || (afterOpen && isWeekday)) {
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

  const fmt = (n: number) => n.toString().padStart(2, '0');

  // SVG ring progress
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass-card rounded-2xl p-5 border border-border/40 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4 w-full">
        <div className={cn(
          "p-2 rounded-xl",
          isMarketOpen ? "bg-success/20" : "bg-warning/20"
        )}>
          <Clock className={cn("h-4 w-4", isMarketOpen ? "text-success" : "text-warning")} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {isMarketOpen ? 'Market Open' : 'Market Closed'}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isMarketOpen ? 'Session closes in' : 'Next session opens in'}
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide",
          isMarketOpen ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", isMarketOpen ? "bg-success animate-pulse" : "bg-warning")} />
          {isMarketOpen ? 'LIVE' : 'CLOSED'}
        </div>
      </div>

      {/* Circular countdown */}
      <div className="relative w-36 h-36 mb-4">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" opacity="0.3" />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={isMarketOpen ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
            style={{ filter: `drop-shadow(0 0 6px ${isMarketOpen ? 'hsl(var(--success) / 0.5)' : 'hsl(var(--primary) / 0.5)'})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-foreground leading-none">
            {fmt(countdown.hours)}:{fmt(countdown.minutes)}
          </span>
          <span className="font-mono text-lg text-muted-foreground">
            {fmt(countdown.seconds)}
          </span>
          <span className="text-[9px] text-muted-foreground mt-1 uppercase tracking-widest">
            {isMarketOpen ? 'til close' : 'til open'}
          </span>
        </div>
      </div>

      {/* Session progress bar (only when open) */}
      {isMarketOpen && (
        <div className="w-full">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>9:30 AM</span>
            <span>{progress.toFixed(0)}% complete</span>
            <span>4:00 PM</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
