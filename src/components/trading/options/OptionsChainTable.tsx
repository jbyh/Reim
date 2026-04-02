import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { GeneratedContract } from './IntuitiveOptionsChart';
import { format } from 'date-fns';

interface ParsedContract {
  occSymbol: string;
  underlying: string;
  expiry: Date;
  expiryStr: string;
  type: 'call' | 'put';
  strike: number;
  bid: number;
  ask: number;
  lastPrice: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
}

interface OptionsChainTableProps {
  optionsChainCache: Record<string, any>;
  currentPrice: number;
  symbol: string;
  onContractSelect: (contract: GeneratedContract) => void;
}

function parseOCC(occSymbol: string): { underlying: string; expiry: Date; type: 'call' | 'put'; strike: number } | null {
  const match = occSymbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) return null;
  const [, underlying, dateStr, cpFlag, strikeStr] = match;
  const year = 2000 + parseInt(dateStr.substring(0, 2));
  const month = parseInt(dateStr.substring(2, 4)) - 1;
  const day = parseInt(dateStr.substring(4, 6));
  return {
    underlying,
    expiry: new Date(year, month, day),
    type: cpFlag === 'C' ? 'call' : 'put',
    strike: parseInt(strikeStr) / 1000,
  };
}

export const OptionsChainTable = ({ optionsChainCache, currentPrice, symbol, onContractSelect }: OptionsChainTableProps) => {
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null);

  const { contracts, expiryDates } = useMemo(() => {
    const parsed: ParsedContract[] = [];
    const expirySet = new Set<string>();

    for (const [occ, data] of Object.entries(optionsChainCache)) {
      const info = parseOCC(occ);
      if (!info) continue;

      const expiryStr = format(info.expiry, 'yyyy-MM-dd');
      expirySet.add(expiryStr);

      parsed.push({
        occSymbol: occ,
        underlying: info.underlying,
        expiry: info.expiry,
        expiryStr,
        type: info.type,
        strike: info.strike,
        bid: data.bid || 0,
        ask: data.ask || 0,
        lastPrice: data.lastPrice || 0,
        volume: data.volume || 0,
        openInterest: data.openInterest || 0,
        impliedVolatility: data.impliedVolatility || 0,
        delta: data.greeks?.delta || 0,
      });
    }

    const expiryDates = Array.from(expirySet).sort();
    return { contracts: parsed, expiryDates };
  }, [optionsChainCache]);

  const activeExpiry = selectedExpiry || expiryDates[0] || null;

  const filteredContracts = useMemo(() => {
    if (!activeExpiry) return { calls: [], puts: [] };
    const filtered = contracts.filter(c => c.expiryStr === activeExpiry);
    const calls = filtered.filter(c => c.type === 'call').sort((a, b) => a.strike - b.strike);
    const puts = filtered.filter(c => c.type === 'put').sort((a, b) => a.strike - b.strike);
    return { calls, puts };
  }, [contracts, activeExpiry]);

  // Get all unique strikes for this expiry
  const strikes = useMemo(() => {
    const s = new Set<number>();
    filteredContracts.calls.forEach(c => s.add(c.strike));
    filteredContracts.puts.forEach(c => s.add(c.strike));
    return Array.from(s).sort((a, b) => a - b);
  }, [filteredContracts]);

  const handleSelect = (contract: ParsedContract) => {
    const daysToExp = Math.max(1, Math.round((contract.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const midPrice = contract.bid > 0 && contract.ask > 0 ? (contract.bid + contract.ask) / 2 : contract.lastPrice;
    const data = optionsChainCache[contract.occSymbol] || {};

    onContractSelect({
      symbol: contract.occSymbol,
      realSymbol: contract.occSymbol,
      strike: contract.strike,
      expiry: format(contract.expiry, 'MMM dd, yyyy').toUpperCase(),
      expiryDate: contract.expiry,
      type: contract.type,
      premium: midPrice,
      daysToExpiry: daysToExp,
      bid: contract.bid,
      ask: contract.ask,
      openInterest: contract.openInterest,
      volume: contract.volume,
      greeks: data.greeks,
      impliedVolatility: contract.impliedVolatility,
      realPremium: midPrice,
      isLive: true,
    });
  };

  if (Object.keys(optionsChainCache).length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">No options chain data loaded yet. Select a symbol to view the chain.</p>
      </div>
    );
  }

  const callMap = new Map(filteredContracts.calls.map(c => [c.strike, c]));
  const putMap = new Map(filteredContracts.puts.map(c => [c.strike, c]));

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Expiry tabs */}
      <div className="p-3 border-b border-border/40 flex gap-2 overflow-x-auto scrollbar-thin">
        {expiryDates.map(exp => {
          const d = new Date(exp + 'T00:00:00');
          const daysOut = Math.max(1, Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          return (
            <button
              key={exp}
              onClick={() => setSelectedExpiry(exp)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                activeExpiry === exp
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              )}
            >
              {format(d, 'MMM d')} <span className="opacity-60">({daysOut}d)</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40">
              {/* Calls side */}
              <th className="p-2 text-right text-muted-foreground font-medium">Δ</th>
              <th className="p-2 text-right text-muted-foreground font-medium">IV</th>
              <th className="p-2 text-right text-muted-foreground font-medium">Vol</th>
              <th className="p-2 text-right text-muted-foreground font-medium">OI</th>
              <th className="p-2 text-right text-muted-foreground font-medium">Bid</th>
              <th className="p-2 text-right text-muted-foreground font-medium">Ask</th>
              {/* Strike center */}
              <th className="p-2 text-center font-bold text-foreground bg-secondary/40">Strike</th>
              {/* Puts side */}
              <th className="p-2 text-left text-muted-foreground font-medium">Bid</th>
              <th className="p-2 text-left text-muted-foreground font-medium">Ask</th>
              <th className="p-2 text-left text-muted-foreground font-medium">OI</th>
              <th className="p-2 text-left text-muted-foreground font-medium">Vol</th>
              <th className="p-2 text-left text-muted-foreground font-medium">IV</th>
              <th className="p-2 text-left text-muted-foreground font-medium">Δ</th>
            </tr>
          </thead>
          <tbody>
            {strikes.map(strike => {
              const call = callMap.get(strike);
              const put = putMap.get(strike);
              const isATM = Math.abs(strike - currentPrice) < (currentPrice * 0.01);
              const callITM = strike < currentPrice;
              const putITM = strike > currentPrice;

              return (
                <tr
                  key={strike}
                  className={cn(
                    "border-b border-border/20 transition-colors",
                    isATM && "bg-primary/10 border-primary/30"
                  )}
                >
                  {/* Call side */}
                  <td
                    className={cn("p-2 text-right font-mono cursor-pointer hover:bg-success/10", callITM && "bg-success/5")}
                    onClick={() => call && handleSelect(call)}
                  >
                    {call ? call.delta.toFixed(2) : '—'}
                  </td>
                  <td
                    className={cn("p-2 text-right font-mono cursor-pointer hover:bg-success/10", callITM && "bg-success/5")}
                    onClick={() => call && handleSelect(call)}
                  >
                    {call && call.impliedVolatility > 0 ? (call.impliedVolatility * 100).toFixed(0) + '%' : '—'}
                  </td>
                  <td
                    className={cn("p-2 text-right font-mono cursor-pointer hover:bg-success/10", callITM && "bg-success/5")}
                    onClick={() => call && handleSelect(call)}
                  >
                    {call ? call.volume.toLocaleString() : '—'}
                  </td>
                  <td
                    className={cn("p-2 text-right font-mono cursor-pointer hover:bg-success/10", callITM && "bg-success/5")}
                    onClick={() => call && handleSelect(call)}
                  >
                    {call ? call.openInterest.toLocaleString() : '—'}
                  </td>
                  <td
                    className={cn("p-2 text-right font-mono font-medium cursor-pointer hover:bg-success/10", callITM && "bg-success/5")}
                    onClick={() => call && handleSelect(call)}
                  >
                    <span className="text-success">{call && call.bid > 0 ? call.bid.toFixed(2) : '—'}</span>
                  </td>
                  <td
                    className={cn("p-2 text-right font-mono font-medium cursor-pointer hover:bg-success/10", callITM && "bg-success/5")}
                    onClick={() => call && handleSelect(call)}
                  >
                    <span className="text-success">{call && call.ask > 0 ? call.ask.toFixed(2) : '—'}</span>
                  </td>

                  {/* Strike */}
                  <td className={cn(
                    "p-2 text-center font-mono font-bold bg-secondary/40",
                    isATM && "text-primary"
                  )}>
                    ${strike.toFixed(strike >= 10 ? 0 : 2)}
                    {isATM && <Badge variant="outline" className="ml-1 text-[8px] px-1 py-0 border-primary/40 text-primary">ATM</Badge>}
                  </td>

                  {/* Put side */}
                  <td
                    className={cn("p-2 text-left font-mono font-medium cursor-pointer hover:bg-destructive/10", putITM && "bg-destructive/5")}
                    onClick={() => put && handleSelect(put)}
                  >
                    <span className="text-destructive">{put && put.bid > 0 ? put.bid.toFixed(2) : '—'}</span>
                  </td>
                  <td
                    className={cn("p-2 text-left font-mono font-medium cursor-pointer hover:bg-destructive/10", putITM && "bg-destructive/5")}
                    onClick={() => put && handleSelect(put)}
                  >
                    <span className="text-destructive">{put && put.ask > 0 ? put.ask.toFixed(2) : '—'}</span>
                  </td>
                  <td
                    className={cn("p-2 text-left font-mono cursor-pointer hover:bg-destructive/10", putITM && "bg-destructive/5")}
                    onClick={() => put && handleSelect(put)}
                  >
                    {put ? put.openInterest.toLocaleString() : '—'}
                  </td>
                  <td
                    className={cn("p-2 text-left font-mono cursor-pointer hover:bg-destructive/10", putITM && "bg-destructive/5")}
                    onClick={() => put && handleSelect(put)}
                  >
                    {put ? put.volume.toLocaleString() : '—'}
                  </td>
                  <td
                    className={cn("p-2 text-left font-mono cursor-pointer hover:bg-destructive/10", putITM && "bg-destructive/5")}
                    onClick={() => put && handleSelect(put)}
                  >
                    {put && put.impliedVolatility > 0 ? (put.impliedVolatility * 100).toFixed(0) + '%' : '—'}
                  </td>
                  <td
                    className={cn("p-2 text-left font-mono cursor-pointer hover:bg-destructive/10", putITM && "bg-destructive/5")}
                    onClick={() => put && handleSelect(put)}
                  >
                    {put ? put.delta.toFixed(2) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {strikes.length === 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No contracts found for this expiry date.
        </div>
      )}
    </div>
  );
};
