import { GeneratedContract } from './IntuitiveOptionsChart';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Target, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelectedContractCardProps {
  contract: GeneratedContract;
  currentPrice: number;
  onClear: () => void;
  onTrade: () => void;
}

export const SelectedContractCard = ({ 
  contract, 
  currentPrice, 
  onClear, 
  onTrade 
}: SelectedContractCardProps) => {
  const isCall = contract.type === 'call';
  const distance = Math.abs(contract.strike - currentPrice);
  const distancePercent = (distance / currentPrice) * 100;
  const isITM = isCall ? currentPrice > contract.strike : currentPrice < contract.strike;
  const totalCost = contract.premium * 100;
  
  // Calculate max profit/loss
  const maxLoss = totalCost;
  const breakeven = isCall 
    ? contract.strike + contract.premium 
    : contract.strike - contract.premium;

  return (
    <div className={cn(
      "glass-card rounded-2xl overflow-hidden border-2",
      isCall ? "border-success/30" : "border-destructive/30"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 flex items-center justify-between",
        isCall ? "bg-success/10" : "bg-destructive/10"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isCall ? "bg-success/20" : "bg-destructive/20"
          )}>
            {isCall ? (
              <TrendingUp className={cn("h-5 w-5", isCall ? "text-success" : "text-destructive")} />
            ) : (
              <TrendingDown className={cn("h-5 w-5", isCall ? "text-success" : "text-destructive")} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-lg font-bold",
                isCall ? "text-success" : "text-destructive"
              )}>
                {contract.type.toUpperCase()}
              </span>
              <span className="font-mono font-bold text-foreground">
                ${contract.strike}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{contract.expiry}</p>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="p-2 hover:bg-secondary/60 rounded-lg transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Details */}
      <div className="p-4 space-y-4">
        {/* Price Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/40 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Premium</span>
            </div>
            <p className="font-mono font-bold text-lg">${contract.premium.toFixed(2)}</p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Days Left</span>
            </div>
            <p className="font-mono font-bold text-lg">{contract.daysToExpiry}</p>
          </div>
        </div>

        {/* Analysis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Distance from current</span>
            <span className={cn(
              "font-mono font-medium",
              isITM ? "text-success" : "text-warning"
            )}>
              {distancePercent.toFixed(1)}% {isITM ? 'ITM' : 'OTM'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Breakeven price</span>
            <span className="font-mono font-medium text-foreground">${breakeven.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Max loss</span>
            <span className="font-mono font-medium text-destructive">-${maxLoss.toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Max profit</span>
            <span className="font-mono font-medium text-success">Unlimited</span>
          </div>
        </div>

        {/* Total Cost */}
        <div className={cn(
          "rounded-xl p-4 text-center",
          isCall ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"
        )}>
          <p className="text-xs text-muted-foreground mb-1">Total Cost (1 contract)</p>
          <p className="font-mono text-2xl font-bold text-foreground">
            ${totalCost.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {contract.premium.toFixed(2)} × 100 shares
          </p>
        </div>

        {/* Trade Button */}
        <Button 
          onClick={onTrade}
          className={cn(
            "w-full h-12 font-semibold text-base",
            isCall 
              ? "bg-success hover:bg-success/90 text-success-foreground" 
              : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          )}
        >
          <Zap className="h-4 w-4 mr-2" />
          Buy {contract.type.toUpperCase()} Option
        </Button>
      </div>
    </div>
  );
};
