import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { OptionContract, PricePoint } from './OptionsView';
import { Zap, TrendingUp, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OptionsInsightsProps {
  ticker: string;
  currentPrice: number;
  drawnPath: PricePoint[];
  selectedContract: OptionContract | null;
}

export const OptionsInsights = ({ ticker, currentPrice, drawnPath, selectedContract }: OptionsInsightsProps) => {
  // Calculate insights based on drawn path
  const pathInsights = useMemo(() => {
    if (drawnPath.length < 5) return null;
    
    const startPrice = drawnPath[0]?.price || currentPrice;
    const endPrice = drawnPath[drawnPath.length - 1]?.price || currentPrice;
    const maxPrice = Math.max(...drawnPath.map(p => p.price));
    const minPrice = Math.min(...drawnPath.map(p => p.price));
    
    const priceChange = ((endPrice - startPrice) / startPrice) * 100;
    const volatility = ((maxPrice - minPrice) / startPrice) * 100;
    const isBullish = priceChange > 0;
    
    // Calculate expected P&L if contract is selected
    let expectedPnL = 0;
    if (selectedContract) {
      const intrinsicAtEnd = Math.max(0, endPrice - selectedContract.strike);
      const contractValueAtEnd = intrinsicAtEnd * 100;
      const costBasis = selectedContract.premium * 100;
      expectedPnL = contractValueAtEnd - costBasis;
    }
    
    return {
      priceChange,
      volatility,
      isBullish,
      endPrice,
      maxPrice,
      minPrice,
      expectedPnL
    };
  }, [drawnPath, currentPrice, selectedContract]);

  // Sentiment indicators
  const sentimentTags = [
    { label: 'rocket_launch', sublabel: 'Ascending Flow', color: 'success' as const },
    { label: 'crisis_alert', sublabel: 'High Volatility Flux', color: 'destructive' as const },
  ];

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Cosmic Insight Engine</h3>
        </div>
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
          REAL-TIME FLUX
        </Badge>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Main Insight */}
        <div className="p-4 rounded-xl bg-secondary/40 border border-border/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {pathInsights ? (
              <>
                Based on your trajectory, {ticker} is projected to reach{' '}
                <span className="font-bold text-foreground">${pathInsights.endPrice.toFixed(2)}</span>{' '}
                with{' '}
                <span className={cn(
                  "font-bold",
                  pathInsights.isBullish ? "text-success" : "text-destructive"
                )}>
                  {pathInsights.priceChange > 0 ? '+' : ''}{pathInsights.priceChange.toFixed(1)}%
                </span>{' '}
                change. Volatility index: {pathInsights.volatility.toFixed(1)}%.
              </>
            ) : (
              <>
                {ticker}'s trajectory suggests high energy around the{' '}
                <span className="font-bold text-foreground">${(currentPrice * 1.003).toFixed(2)}</span>{' '}
                resistance nebula. Current sentiment, while volatile, points to a potential upward breach.
              </>
            )}
          </p>
        </div>

        {/* Sentiment Tags */}
        <div className="flex flex-wrap gap-2">
          {sentimentTags.map((tag, i) => (
            <div 
              key={i}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
                tag.color === 'success' && "bg-success/10 border border-success/30",
                tag.color === 'destructive' && "bg-destructive/10 border border-destructive/30"
              )}
            >
              <span className={cn(
                "font-medium",
                tag.color === 'success' && "text-success",
                tag.color === 'destructive' && "text-destructive"
              )}>
                {tag.label}
              </span>
              <span className="text-muted-foreground">{tag.sublabel}</span>
            </div>
          ))}
        </div>

        {/* Expected P&L from drawn path */}
        {pathInsights && selectedContract && (
          <div className={cn(
            "p-4 rounded-xl border",
            pathInsights.expectedPnL >= 0 
              ? "bg-success/10 border-success/30" 
              : "bg-destructive/10 border-destructive/30"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Expected P&L at Trajectory End
              </span>
              <Zap className={cn(
                "h-4 w-4",
                pathInsights.expectedPnL >= 0 ? "text-success" : "text-destructive"
              )} />
            </div>
            <p className={cn(
              "text-2xl font-bold font-mono",
              pathInsights.expectedPnL >= 0 ? "text-success" : "text-destructive"
            )}>
              {pathInsights.expectedPnL >= 0 ? '+' : ''}${pathInsights.expectedPnL.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on ${selectedContract.strike} {selectedContract.type.toUpperCase()} @ ${selectedContract.premium.toFixed(2)}
            </p>
          </div>
        )}

        {/* Deeper Scan Link */}
        <button className="flex items-center gap-2 text-primary text-sm hover:underline">
          <span>Deeper Cosmic Scan</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
