import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

interface IntuitiveOptionsChartProps {
  currentPrice: number;
  symbol: string;
  priceHistory: { time: Date; price: number }[];
  onContractSelect: (contract: GeneratedContract) => void;
  selectedContract: GeneratedContract | null;
  outlook?: 'short' | 'long';
  optionsChainCache?: Record<string, any>;
}

export interface GeneratedContract {
  symbol: string;
  strike: number;
  expiry: string;
  expiryDate: Date;
  type: 'call' | 'put';
  premium: number;
  daysToExpiry: number;
  bid: number;
  ask: number;
  openInterest: number;
  // Real data fields from Alpaca
  realSymbol?: string;
  greeks?: { delta: number; gamma: number; theta: number; vega: number };
  impliedVolatility?: number;
  volume?: number;
  realPremium?: number;
  isLive?: boolean;
}

// Black-Scholes approximation for option pricing (fallback when no real data)
const calculateOptionPrice = (
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  type: 'call' | 'put',
  volatility: number = 0.25,
  riskFreeRate: number = 0.05
): number => {
  if (timeToExpiry <= 0) {
    return type === 'call'
      ? Math.max(0, spotPrice - strikePrice)
      : Math.max(0, strikePrice - spotPrice);
  }

  const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate + (volatility ** 2) / 2) * timeToExpiry) / (volatility * Math.sqrt(timeToExpiry));
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

  const cdf = (x: number) => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return 0.5 * (1.0 + sign * y);
  };

  if (type === 'call') {
    return spotPrice * cdf(d1) - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * cdf(d2);
  } else {
    return strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * cdf(-d2) - spotPrice * cdf(-d1);
  }
};

// Find nearest real contract from cache
function findNearestFromCache(
  cache: Record<string, any>,
  targetStrike: number,
  targetDays: number,
  type: 'call' | 'put',
  currentPrice: number
): { occ: string; data: any } | null {
  let best: { occ: string; data: any; dist: number } | null = null;

  for (const [occ, data] of Object.entries(cache)) {
    const m = occ.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
    if (!m) continue;
    const cpFlag = m[3] === 'C' ? 'call' : 'put';
    if (cpFlag !== type) continue;

    const strike = parseInt(m[4]) / 1000;
    const year = 2000 + parseInt(m[2].substring(0, 2));
    const month = parseInt(m[2].substring(2, 4)) - 1;
    const day = parseInt(m[2].substring(4, 6));
    const expDate = new Date(year, month, day);
    const days = Math.max(1, Math.round((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    const strikeDist = Math.abs(strike - targetStrike) / currentPrice;
    const timeDist = Math.abs(days - targetDays) / 45;
    const dist = strikeDist * 2 + timeDist;

    if (!best || dist < best.dist) {
      best = { occ, data, dist };
    }
  }

  return best ? { occ: best.occ, data: best.data } : null;
}

export const IntuitiveOptionsChart = ({
  currentPrice,
  symbol,
  priceHistory,
  onContractSelect,
  selectedContract,
  outlook = 'short',
  optionsChainCache = {},
}: IntuitiveOptionsChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; price: number; date: Date; daysAhead: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Chart configuration — outlook-aware
  const historyWidth = 0.35;
  const futureWidth = 0.65;
  const daysAhead = outlook === 'short' ? 35 : 730;
  const priceBuffer = outlook === 'short' ? 0.06 : 0.18;

  const priceRange = {
    min: currentPrice * (1 - priceBuffer),
    max: currentPrice * (1 + priceBuffer)
  };

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: Math.min(520, Math.max(320, window.innerHeight * 0.42))
      });
      setIsMobile(window.innerWidth < 768);
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  // Screen to chart coordinate conversion
  const screenToChart = useCallback((x: number, y: number): { price: number; date: Date; daysAhead: number } | null => {
    const historyEnd = dimensions.width * historyWidth;

    if (x < historyEnd) return null;

    const futureProgress = (x - historyEnd) / (dimensions.width * futureWidth);
    const daysFromNow = Math.max(1, Math.round(futureProgress * daysAhead));
    const date = addDays(new Date(), daysFromNow);

    const priceProgress = 1 - (y / dimensions.height);
    const price = priceRange.min + priceProgress * (priceRange.max - priceRange.min);

    return { price, date, daysAhead: daysFromNow };
  }, [dimensions, priceRange, daysAhead]);

  // Generate contract from click position — snaps to real data when available
  const generateContract = useCallback((price: number, date: Date, daysFromNow: number): GeneratedContract => {
    const type: 'call' | 'put' = price >= currentPrice ? 'call' : 'put';

    const strikeRounding = currentPrice > 100 ? 2.5 : 1;
    const strike = Math.round(price / strikeRounding) * strikeRounding;

    // Try to snap to a real contract from the cache
    const hasCache = Object.keys(optionsChainCache).length > 0;
    if (hasCache) {
      const nearest = findNearestFromCache(optionsChainCache, strike, daysFromNow, type, currentPrice);
      if (nearest) {
        const d = nearest.data;
        const m = nearest.occ.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/)!;
        const realStrike = parseInt(m[4]) / 1000;
        const year = 2000 + parseInt(m[2].substring(0, 2));
        const month = parseInt(m[2].substring(2, 4)) - 1;
        const dayNum = parseInt(m[2].substring(4, 6));
        const expiryDate = new Date(year, month, dayNum);
        const daysToExp = Math.max(1, Math.round((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        const midPrice = d.bid > 0 && d.ask > 0 ? (d.bid + d.ask) / 2 : d.lastPrice || 0;

        return {
          symbol: nearest.occ,
          realSymbol: nearest.occ,
          strike: realStrike,
          expiry: format(expiryDate, 'MMM dd, yyyy').toUpperCase(),
          expiryDate,
          type,
          premium: midPrice > 0 ? midPrice : calculateOptionPrice(currentPrice, realStrike, daysToExp / 365, type),
          daysToExpiry: daysToExp,
          bid: d.bid || 0,
          ask: d.ask || 0,
          openInterest: d.openInterest || 0,
          volume: d.volume || 0,
          greeks: d.greeks,
          impliedVolatility: d.impliedVolatility || 0,
          realPremium: midPrice,
          isLive: true,
        };
      }
    }

    // Fallback: Black-Scholes estimate
    const timeToExpiry = daysFromNow / 365;
    const premium = calculateOptionPrice(currentPrice, strike, timeToExpiry, type);
    const spread = premium * 0.05;
    const expiryStr = format(date, 'MMM dd, yyyy').toUpperCase();
    const contractSymbol = `${symbol}${format(date, 'yyMMdd')}${type === 'call' ? 'C' : 'P'}${String(Math.round(strike * 1000)).padStart(8, '0')}`;

    return {
      symbol: contractSymbol,
      strike,
      expiry: expiryStr,
      expiryDate: date,
      type,
      premium: Math.max(0.01, premium),
      daysToExpiry: daysFromNow,
      bid: Math.max(0.01, premium - spread),
      ask: premium + spread,
      openInterest: 0
    };
  }, [currentPrice, symbol, optionsChainCache]);

  // Draw the chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const historyEnd = width * historyWidth;

    ctx.clearRect(0, 0, width, height);

    // Draw gradient background for future area
    const futureGradient = ctx.createLinearGradient(historyEnd, 0, width, 0);
    futureGradient.addColorStop(0, 'hsla(230, 25%, 11%, 0)');
    futureGradient.addColorStop(1, 'hsla(262, 80%, 65%, 0.05)');
    ctx.fillStyle = futureGradient;
    ctx.fillRect(historyEnd, 0, width - historyEnd, height);

    // Draw grid
    ctx.strokeStyle = 'hsla(230, 20%, 25%, 0.3)';
    ctx.lineWidth = 1;

    // Horizontal grid (price levels) — clutter guard
    const priceSteps = isMobile ? 4 : 6;
    const priceSpan = priceRange.max - priceRange.min;
    // Determine label interval: if strikes are dense, use $5 or $10 intervals
    const rawStepSize = priceSpan / priceSteps;
    const labelInterval = rawStepSize < 5 ? 5 : rawStepSize < 10 ? 10 : Math.round(rawStepSize);

    for (let i = 0; i <= priceSteps; i++) {
      const y = (i / priceSteps) * height;
      const price = priceRange.max - (i / priceSteps) * priceSpan;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Price labels
      ctx.fillStyle = 'hsl(215, 20%, 55%)';
      ctx.font = `${isMobile ? 10 : 11}px Inter`;
      ctx.textAlign = 'left';
      ctx.fillText(`$${price.toFixed(0)}`, 8, y + (i === 0 ? 14 : -4));
    }

    // Vertical grid (time) — outlook-aware tick count
    const today = new Date();
    const timeSteps = outlook === 'short' ? (isMobile ? 4 : 5) : (isMobile ? 4 : 6);
    for (let i = 0; i <= timeSteps; i++) {
      const x = historyEnd + (i / timeSteps) * (width - historyEnd);

      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      const daysFromNow = Math.round((i / timeSteps) * daysAhead);
      const date = addDays(today, daysFromNow);
      ctx.fillStyle = 'hsl(215, 20%, 55%)';
      ctx.font = `${isMobile ? 9 : 10}px Inter`;
      ctx.textAlign = 'center';
      ctx.fillText(
        i === 0 ? 'TODAY' : (outlook === 'long' ? format(date, 'MMM yyyy') : format(date, 'MMM d')),
        x,
        height - 8
      );
    }

    // Draw "NOW" separator
    ctx.strokeStyle = 'hsl(262, 80%, 65%)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(historyEnd, 0);
    ctx.lineTo(historyEnd, height);
    ctx.stroke();

    // Draw price history
    if (priceHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'hsl(262, 80%, 65%)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      priceHistory.forEach((point, i) => {
        const x = (i / (priceHistory.length - 1)) * historyEnd;
        const y = height - ((point.price - priceRange.min) / priceSpan) * height;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.shadowBlur = 10;
      ctx.shadowColor = 'hsl(262, 80%, 65%)';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw current price marker
    const currentY = height - ((currentPrice - priceRange.min) / priceSpan) * height;

    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'hsla(262, 80%, 65%, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(historyEnd, currentY);
    ctx.lineTo(width, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price dot
    ctx.beginPath();
    ctx.arc(historyEnd, currentY, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(230, 25%, 11%)';
    ctx.fill();
    ctx.strokeStyle = 'hsl(262, 80%, 65%)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Current price label
    ctx.fillStyle = 'hsl(210, 40%, 98%)';
    ctx.font = 'bold 12px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(`$${currentPrice.toFixed(2)}`, historyEnd - 16, currentY + 4);

    // Draw CALL/PUT zones
    ctx.font = `bold ${isMobile ? 12 : 14}px Inter`;
    ctx.textAlign = 'center';

    ctx.fillStyle = 'hsla(142, 70%, 50%, 0.15)';
    ctx.fillRect(historyEnd + 4, 0, width - historyEnd - 8, currentY);
    ctx.fillStyle = 'hsl(142, 70%, 50%)';
    ctx.fillText('CALLS', historyEnd + (width - historyEnd) / 2, 24);

    ctx.fillStyle = 'hsla(0, 85%, 60%, 0.08)';
    ctx.fillRect(historyEnd + 4, currentY, width - historyEnd - 8, height - currentY);
    ctx.fillStyle = 'hsl(0, 85%, 60%)';
    ctx.fillText('PUTS', historyEnd + (width - historyEnd) / 2, height - 24);

    // Draw hover indicator
    if (hoverPoint) {
      const y = height - ((hoverPoint.price - priceRange.min) / priceSpan) * height;

      ctx.strokeStyle = 'hsla(210, 40%, 98%, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hoverPoint.x, 0);
      ctx.lineTo(hoverPoint.x, height);
      ctx.moveTo(historyEnd, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]);

      const isCall = hoverPoint.price >= currentPrice;
      ctx.beginPath();
      ctx.arc(hoverPoint.x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = isCall ? 'hsla(142, 70%, 50%, 0.3)' : 'hsla(0, 85%, 60%, 0.3)';
      ctx.fill();
      ctx.strokeStyle = isCall ? 'hsl(142, 70%, 50%)' : 'hsl(0, 85%, 60%)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tooltip — shows real data when available
      const tooltipX = hoverPoint.x;
      const tooltipY = y < 80 ? y + 30 : y - 70;
      const contract = generateContract(hoverPoint.price, hoverPoint.date, hoverPoint.daysAhead);

      ctx.fillStyle = 'hsla(230, 25%, 11%, 0.95)';
      ctx.strokeStyle = isCall ? 'hsl(142, 70%, 50%)' : 'hsl(0, 85%, 60%)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const tooltipWidth = isMobile ? 150 : 190;
      const tooltipHeight = contract.isLive ? (isMobile ? 58 : 64) : (isMobile ? 45 : 50);
      ctx.roundRect(tooltipX - tooltipWidth / 2, tooltipY, tooltipWidth, tooltipHeight, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isCall ? 'hsl(142, 70%, 50%)' : 'hsl(0, 85%, 60%)';
      ctx.font = `bold ${isMobile ? 11 : 12}px Inter`;
      ctx.textAlign = 'center';
      ctx.fillText(`${contract.type.toUpperCase()} $${contract.strike}`, tooltipX, tooltipY + (isMobile ? 16 : 18));

      ctx.fillStyle = 'hsl(210, 40%, 98%)';
      ctx.font = `${isMobile ? 10 : 11}px JetBrains Mono`;

      if (contract.isLive && contract.bid > 0) {
        ctx.fillText(`Bid: $${contract.bid.toFixed(2)}  Ask: $${contract.ask.toFixed(2)}`, tooltipX, tooltipY + (isMobile ? 32 : 36));
        ctx.fillStyle = 'hsl(215, 20%, 65%)';
        ctx.font = `${isMobile ? 9 : 10}px Inter`;
        ctx.fillText(`${contract.expiry} · LIVE`, tooltipX, tooltipY + (isMobile ? 48 : 52));
      } else {
        ctx.fillText(`~$${contract.premium.toFixed(2)} × 100 = $${(contract.premium * 100).toFixed(0)}`, tooltipX, tooltipY + (isMobile ? 32 : 36));
      }
    }

    // Draw selected contract indicator
    if (selectedContract) {
      const selectedY = height - ((selectedContract.strike - priceRange.min) / priceSpan) * height;
      const selectedX = historyEnd + (selectedContract.daysToExpiry / daysAhead) * (width - historyEnd);

      ctx.beginPath();
      ctx.arc(selectedX, selectedY, 16, 0, Math.PI * 2);
      ctx.strokeStyle = selectedContract.type === 'call' ? 'hsl(142, 70%, 50%)' : 'hsl(0, 85%, 60%)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(selectedX, selectedY, 8, 0, Math.PI * 2);
      ctx.fillStyle = selectedContract.type === 'call' ? 'hsl(142, 70%, 50%)' : 'hsl(0, 85%, 60%)';
      ctx.fill();
    }

  }, [dimensions, currentPrice, priceHistory, priceRange, hoverPoint, selectedContract, generateContract, isMobile, daysAhead, outlook]);

  // Mouse/touch handlers
  const handleInteraction = useCallback((clientX: number, clientY: number, isClick: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const chartPoint = screenToChart(x, y);
    if (!chartPoint) {
      setHoverPoint(null);
      return;
    }

    setHoverPoint({ x, y, ...chartPoint });

    if (isClick) {
      const contract = generateContract(chartPoint.price, chartPoint.date, chartPoint.daysAhead);
      onContractSelect(contract);
    }
  }, [screenToChart, generateContract, onContractSelect]);

  const handleMouseMove = (e: React.MouseEvent) => handleInteraction(e.clientX, e.clientY);
  const handleClick = (e: React.MouseEvent) => handleInteraction(e.clientX, e.clientY, true);
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches?.[0];
    if (t) handleInteraction(t.clientX, t.clientY, false);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches?.[0];
    if (t) handleInteraction(t.clientX, t.clientY, false);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches?.[0];
    if (t) handleInteraction(t.clientX, t.clientY, true);
  };

  return (
    <div ref={containerRef} className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 md:p-5 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground text-sm md:text-base">
              Click Your Price Target
            </h3>
            <p className="text-xs text-muted-foreground">
              {outlook === 'short'
                ? 'Tap above current price for calls, below for puts (next 35 days)'
                : 'Tap to select LEAPS contracts (up to 2 years out)'
              }
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-success/50" />
              <span className="text-muted-foreground">Calls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-destructive/50" />
              <span className="text-muted-foreground">Puts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="cursor-crosshair touch-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPoint(null)}
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>
    </div>
  );
};
