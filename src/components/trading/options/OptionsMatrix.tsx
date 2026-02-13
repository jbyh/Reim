import { useState } from 'react';
import { cn } from '@/lib/utils';
import { OptionContract } from './OptionsView';
import { Plus, Minus } from 'lucide-react';

interface OptionsMatrixProps {
  contracts: OptionContract[];
  selectedContract: OptionContract | null;
  onContractSelect: (contract: OptionContract) => void;
  currentPrice: number;
}

export const OptionsMatrix = ({ contracts, selectedContract, onContractSelect, currentPrice }: OptionsMatrixProps) => {
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');

  // Group contracts by expiry
  const groupedContracts = contracts
    .filter(c => c.type === optionType)
    .reduce((acc, contract) => {
      const key = contract.expiry;
      if (!acc[key]) {
        acc[key] = { expiry: contract.expiry, daysToExpiry: contract.daysToExpiry, contracts: [] };
      }
      acc[key].contracts.push(contract);
      return acc;
    }, {} as Record<string, { expiry: string; daysToExpiry: number; contracts: OptionContract[] }>);

  const expiryGroups = Object.values(groupedContracts);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border/40 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Options Matrix</h3>
        <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-1">
          <button
            onClick={() => setOptionType('call')}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              optionType === 'call' 
                ? "bg-success text-success-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            CALLS
          </button>
          <button
            onClick={() => setOptionType('put')}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              optionType === 'put' 
                ? "bg-destructive text-destructive-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            PUTS
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {expiryGroups.map(({ expiry, daysToExpiry, contracts: groupContracts }) => (
          <div key={expiry}>
            {/* Expiry Header */}
            <div className="px-4 py-2 bg-secondary/30 border-b border-border/30 flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{expiry}</span>
              <span className="text-xs text-muted-foreground">({daysToExpiry}D)</span>
            </div>
            
            {/* Header Row */}
            <div className="px-4 py-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border/20">
              <span>Strike</span>
              <span>Premium</span>
              <span>Bid/Ask</span>
              <span className="text-right">OI</span>
            </div>
            
            {/* Contract Rows */}
            {groupContracts.sort((a, b) => b.strike - a.strike).map((contract) => {
              const isSelected = selectedContract?.symbol === contract.symbol;
              const isITM = optionType === 'call' 
                ? contract.strike < currentPrice 
                : contract.strike > currentPrice;
              const isATM = Math.abs(contract.strike - currentPrice) < 2;
              
              return (
                <button
                  key={contract.symbol}
                  onClick={() => onContractSelect(contract)}
                  className={cn(
                    "w-full px-4 py-3 grid grid-cols-4 gap-2 text-sm transition-all border-l-2",
                    isSelected 
                      ? "bg-primary/15 border-l-primary" 
                      : "hover:bg-secondary/40 border-l-transparent",
                    isATM && !isSelected && "bg-warning/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono font-semibold",
                      isITM ? "text-success" : "text-foreground"
                    )}>
                      ${contract.strike.toFixed(2)}
                    </span>
                    {isATM && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-warning/20 text-warning">ATM</span>
                    )}
                  </div>
                  <span className="font-mono text-foreground">${contract.premium.toFixed(2)}</span>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="text-success">${contract.bid.toFixed(2)}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-destructive">${contract.ask.toFixed(2)}</span>
                  </div>
                  <span className="font-mono text-muted-foreground text-right">
                    {(contract.openInterest / 1000).toFixed(1)}k
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Footer with selected contract summary */}
      {selectedContract && (
        <div className="p-4 border-t border-border/40 bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">ESTIMATED LAUNCH COST</span>
            <span className="text-xs text-muted-foreground">PROBABILITY OF PROFIT</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-foreground">
              ${(selectedContract.premium * 100).toFixed(2)}
            </span>
            <span className="text-lg font-bold font-mono text-success">
              {selectedContract.strike < currentPrice 
                ? `${Math.min(95, Math.round(50 + (currentPrice - selectedContract.strike) / currentPrice * 100))}%`
                : `${Math.max(5, Math.round(50 - (selectedContract.strike - currentPrice) / currentPrice * 100))}%`
              }
            </span>
          </div>
          <button className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all btn-primary">
            <Plus className="h-4 w-4" />
            Engage Trajectory ${selectedContract.strike}
          </button>
        </div>
      )}
    </div>
  );
};
