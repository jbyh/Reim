import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Activity, Gauge } from 'lucide-react';

interface FloorSentimentGaugeProps {
  stocks: { symbol: string; changePercent: number; price: number }[];
}

export const FloorSentimentGauge = ({ stocks }: FloorSentimentGaugeProps) => {
  const sentiment = useMemo(() => {
    if (stocks.length === 0) return { score: 50, label: 'Neutral', color: 'text-warning' };

    const gainers = stocks.filter(s => s.changePercent > 0).length;
    const avgChange = stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length;
    const bigMovers = stocks.filter(s => Math.abs(s.changePercent) > 2).length;

    // Score 0-100: 0 = Extreme Fear, 100 = Extreme Greed
    let score = 50;
    score += (gainers / stocks.length - 0.5) * 40; // Breadth: +/- 20
    score += Math.max(-20, Math.min(20, avgChange * 8)); // Magnitude: +/- 20
    score += (bigMovers / stocks.length) * 10; // Volatility contribution
    score = Math.max(0, Math.min(100, score));

    let label = 'Neutral';
    let color = 'text-warning';
    if (score >= 80) { label = 'Extreme Greed'; color = 'text-success'; }
    else if (score >= 60) { label = 'Greed'; color = 'text-success'; }
    else if (score <= 20) { label = 'Extreme Fear'; color = 'text-destructive'; }
    else if (score <= 40) { label = 'Fear'; color = 'text-destructive'; }

    return { score, label, color };
  }, [stocks]);

  // Needle rotation: -90 (fear) to +90 (greed)
  const needleAngle = ((sentiment.score / 100) * 180) - 90;

  return (
    <div className="glass-card rounded-2xl p-5 border border-border/40">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-primary/20">
          <Gauge className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Market Sentiment</p>
          <p className="text-[10px] text-muted-foreground">Based on market breadth</p>
        </div>
      </div>

      {/* Gauge */}
      <div className="relative flex justify-center mb-3">
        <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
          {/* Background arc segments */}
          <path d="M 20 100 A 80 80 0 0 1 60 34" fill="none" stroke="hsl(var(--destructive))" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
          <path d="M 60 34 A 80 80 0 0 1 100 20" fill="none" stroke="hsl(var(--destructive))" strokeWidth="10" strokeLinecap="round" opacity="0.15" />
          <path d="M 100 20 A 80 80 0 0 1 140 34" fill="none" stroke="hsl(var(--success))" strokeWidth="10" strokeLinecap="round" opacity="0.15" />
          <path d="M 140 34 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--success))" strokeWidth="10" strokeLinecap="round" opacity="0.3" />

          {/* Needle */}
          <g transform={`rotate(${needleAngle}, 100, 100)`} className="transition-transform duration-1000 ease-out">
            <line x1="100" y1="100" x2="100" y2="30" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="100" r="5" fill="hsl(var(--primary))" className="animate-pulse-glow" />
          </g>

          {/* Labels */}
          <text x="15" y="108" fill="hsl(var(--destructive))" fontSize="8" fontWeight="600">FEAR</text>
          <text x="160" y="108" fill="hsl(var(--success))" fontSize="8" fontWeight="600">GREED</text>
        </svg>
      </div>

      <div className="text-center">
        <p className={cn("text-2xl font-mono font-bold", sentiment.color)}>{Math.round(sentiment.score)}</p>
        <p className={cn("text-sm font-semibold", sentiment.color)}>{sentiment.label}</p>
      </div>

      {/* Breadth stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/30">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Gainers</p>
          <p className="font-mono text-sm font-bold text-success">{stocks.filter(s => s.changePercent > 0).length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Flat</p>
          <p className="font-mono text-sm font-bold text-muted-foreground">{stocks.filter(s => s.changePercent === 0).length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Losers</p>
          <p className="font-mono text-sm font-bold text-destructive">{stocks.filter(s => s.changePercent < 0).length}</p>
        </div>
      </div>
    </div>
  );
};
