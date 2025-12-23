import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { OptionContract, PricePoint } from './OptionsView';

interface OptionsChartProps {
  currentPrice: number;
  selectedContract: OptionContract | null;
  onPathUpdate: (path: PricePoint[]) => void;
}

interface GridCell {
  x: number;
  y: number;
  price: number;
  date: Date;
  pnl: number;
  contractValue: number;
  opacity: number;
}

// Black-Scholes approximation for call options
const calculateCallPrice = (
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number, // in years
  volatility: number = 0.20,
  riskFreeRate: number = 0.05
): number => {
  if (timeToExpiry <= 0) {
    return Math.max(0, spotPrice - strikePrice);
  }
  
  const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate + (volatility ** 2) / 2) * timeToExpiry) / (volatility * Math.sqrt(timeToExpiry));
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
  
  // Standard normal CDF approximation
  const cdf = (x: number) => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
  };
  
  const callPrice = spotPrice * cdf(d1) - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * cdf(d2);
  return Math.max(0, callPrice);
};

export const OptionsChart = ({ currentPrice, selectedContract, onPathUpdate }: OptionsChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<PricePoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const animationRef = useRef<number>();

  // Price range for the chart
  const priceRange = { min: currentPrice * 0.96, max: currentPrice * 1.06 };
  const daysAhead = 14;

  // Generate mock price history
  const priceHistory = useCallback(() => {
    const points: { x: number; y: number }[] = [];
    let price = currentPrice - 5;
    for (let i = 0; i < 100; i++) {
      price += (Math.random() - 0.48) * 0.5;
      points.push({ 
        x: (i / 100) * dimensions.width * 0.4,
        y: dimensions.height - ((price - priceRange.min) / (priceRange.max - priceRange.min)) * dimensions.height
      });
    }
    return points;
  }, [currentPrice, dimensions, priceRange.min, priceRange.max]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: 450
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Convert screen coordinates to price/time
  const screenToChart = useCallback((x: number, y: number) => {
    const price = priceRange.max - (y / dimensions.height) * (priceRange.max - priceRange.min);
    const today = new Date();
    const dayOffset = ((x - dimensions.width * 0.4) / (dimensions.width * 0.6)) * daysAhead;
    const time = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    return { price, time };
  }, [dimensions, priceRange, daysAhead]);

  // Calculate P&L for a grid cell
  const calculatePnL = useCallback((price: number, date: Date, contract: OptionContract | null): { pnl: number; value: number } => {
    if (!contract) return { pnl: 0, value: 0 };
    
    const today = new Date();
    const daysLeft = Math.max(0, contract.daysToExpiry - Math.floor((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
    const timeToExpiry = daysLeft / 365;
    
    const contractValue = calculateCallPrice(price, contract.strike, timeToExpiry) * 100; // 100 shares per contract
    const costBasis = contract.premium * 100;
    const pnl = contractValue - costBasis;
    
    return { pnl, value: contractValue };
  }, []);

  // Draw the main chart
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw grid
    ctx.strokeStyle = 'hsl(230, 20%, 15%)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (price levels)
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * dimensions.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.width, y);
      ctx.stroke();
      
      // Price labels
      const price = priceRange.max - (i / 10) * (priceRange.max - priceRange.min);
      ctx.fillStyle = 'hsl(215, 20%, 55%)';
      ctx.font = '11px Inter';
      ctx.fillText(`$${price.toFixed(0)}`, 8, y + 4);
    }

    // Vertical grid lines (time)
    const labels = ['TODAY', 'SEP 18', 'SEP 22', 'SEP 25', 'SEP 29'];
    for (let i = 0; i <= 4; i++) {
      const x = dimensions.width * 0.4 + (i / 4) * (dimensions.width * 0.6);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, dimensions.height);
      ctx.stroke();
      
      // Date labels
      ctx.fillStyle = 'hsl(215, 20%, 55%)';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x, dimensions.height - 8);
    }

    // Draw price history
    const history = priceHistory();
    ctx.beginPath();
    ctx.strokeStyle = 'hsl(262, 80%, 65%)';
    ctx.lineWidth = 2;
    history.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw current price marker
    const currentY = dimensions.height - ((currentPrice - priceRange.min) / (priceRange.max - priceRange.min)) * dimensions.height;
    const currentX = dimensions.width * 0.4;
    
    // Horizontal line from current price
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'hsl(262, 80%, 65%)';
    ctx.beginPath();
    ctx.moveTo(currentX, currentY);
    ctx.lineTo(dimensions.width, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price dot
    ctx.beginPath();
    ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(230, 25%, 11%)';
    ctx.fill();
    ctx.strokeStyle = 'hsl(262, 80%, 65%)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Price label
    ctx.fillStyle = 'hsl(215, 20%, 55%)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('LIVE PRICE', currentX - 60, currentY - 20);
    ctx.fillStyle = 'hsl(210, 40%, 98%)';
    ctx.font = 'bold 13px JetBrains Mono';
    ctx.fillText(`$${currentPrice.toFixed(2)}`, currentX - 60, currentY - 5);

  }, [dimensions, currentPrice, priceRange, priceHistory]);

  // Draw overlay with grid cells and path
  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw glowing grid cells
    gridCells.forEach(cell => {
      if (cell.opacity <= 0) return;
      
      const cellWidth = 40;
      const cellHeight = 30;
      
      const isProfitable = cell.pnl > 0;
      const intensity = Math.min(Math.abs(cell.pnl) / 500, 1);
      
      // Glow effect
      const gradient = ctx.createRadialGradient(
        cell.x, cell.y, 0,
        cell.x, cell.y, cellWidth
      );
      
      if (isProfitable) {
        gradient.addColorStop(0, `hsla(142, 70%, 50%, ${0.4 * cell.opacity * intensity})`);
        gradient.addColorStop(1, `hsla(142, 70%, 50%, 0)`);
      } else {
        gradient.addColorStop(0, `hsla(0, 85%, 60%, ${0.4 * cell.opacity * intensity})`);
        gradient.addColorStop(1, `hsla(0, 85%, 60%, 0)`);
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(cell.x - cellWidth/2, cell.y - cellHeight/2, cellWidth, cellHeight);
      
      // Cell border
      ctx.strokeStyle = isProfitable 
        ? `hsla(142, 70%, 50%, ${0.5 * cell.opacity})` 
        : `hsla(0, 85%, 60%, ${0.5 * cell.opacity})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(cell.x - cellWidth/2, cell.y - cellHeight/2, cellWidth, cellHeight);
      
      // P&L text
      if (cell.opacity > 0.3) {
        ctx.fillStyle = isProfitable 
          ? `hsla(142, 70%, 60%, ${cell.opacity})` 
          : `hsla(0, 85%, 65%, ${cell.opacity})`;
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${isProfitable ? '+' : ''}$${cell.pnl.toFixed(0)}`,
          cell.x,
          cell.y + 3
        );
      }
    });

    // Draw the prediction path
    if (drawnPoints.length > 1) {
      // Main path glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'hsl(38, 95%, 55%)';
      ctx.beginPath();
      ctx.strokeStyle = 'hsl(38, 95%, 55%)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      drawnPoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw points
      drawnPoints.forEach((point, i) => {
        const opacity = 1 - (i / drawnPoints.length) * 0.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(38, 95%, 55%, ${opacity})`;
        ctx.fill();
      });

      // Draw annotations on path
      const annotationPoints = [
        { index: Math.floor(drawnPoints.length * 0.3), label: 'Bullish Surge', probability: 75, color: 'hsl(142, 70%, 50%)' },
        { index: Math.floor(drawnPoints.length * 0.6), label: 'Sideways Consolidation', probability: 65, color: 'hsl(38, 95%, 55%)' },
        { index: Math.floor(drawnPoints.length * 0.9), label: 'Bearish Descent', probability: 60, color: 'hsl(0, 85%, 60%)' },
      ];

      annotationPoints.forEach(({ index, label, probability, color }) => {
        if (index < drawnPoints.length) {
          const point = drawnPoints[index];
          
          // Annotation dot
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          
          // Label background
          const labelWidth = ctx.measureText(`${label} (${probability}%)`).width + 16;
          ctx.fillStyle = 'hsla(230, 25%, 11%, 0.9)';
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(point.x - labelWidth/2, point.y - 30, labelWidth, 20, 4);
          ctx.fill();
          ctx.stroke();
          
          // Label text
          ctx.fillStyle = color;
          ctx.font = '10px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(`${label} (${probability}%)`, point.x, point.y - 16);
        }
      });
    }

  }, [dimensions, drawnPoints, gridCells]);

  // Update grid cells when drawing
  const updateGridCells = useCallback((newPoint: PricePoint) => {
    if (!selectedContract) return;
    
    const { pnl, value } = calculatePnL(newPoint.price, newPoint.time, selectedContract);
    
    setGridCells(prev => {
      // Add new cell
      const newCell: GridCell = {
        x: newPoint.x,
        y: newPoint.y,
        price: newPoint.price,
        date: newPoint.time,
        pnl,
        contractValue: value,
        opacity: 1
      };
      
      // Fade out older cells
      const updated = prev.map(cell => ({
        ...cell,
        opacity: Math.max(0, cell.opacity - 0.02)
      })).filter(cell => cell.opacity > 0);
      
      return [...updated, newCell];
    });
  }, [selectedContract, calculatePnL]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Only start drawing in the future area (right of current price line)
    if (x < dimensions.width * 0.4) return;
    
    setIsDrawing(true);
    setDrawnPoints([]);
    setGridCells([]);
    
    const { price, time } = screenToChart(x, y);
    const point: PricePoint = { x, y, price, time };
    setDrawnPoints([point]);
    updateGridCells(point);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Keep within bounds
    if (x < dimensions.width * 0.4 || x > dimensions.width || y < 0 || y > dimensions.height) return;
    
    const { price, time } = screenToChart(x, y);
    const point: PricePoint = { x, y, price, time };
    
    setDrawnPoints(prev => {
      // Throttle points to avoid too many
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (Math.abs(x - last.x) < 5 && Math.abs(y - last.y) < 5) return prev;
      }
      return [...prev, point];
    });
    
    updateGridCells(point);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    onPathUpdate(drawnPoints);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onPathUpdate(drawnPoints);
    }
  };

  // Clear drawing
  const clearDrawing = () => {
    setDrawnPoints([]);
    setGridCells([]);
    onPathUpdate([]);
  };

  // Animation loop for fading grid cells
  useEffect(() => {
    const animate = () => {
      setGridCells(prev => 
        prev.map(cell => ({
          ...cell,
          opacity: Math.max(0, cell.opacity - 0.005)
        })).filter(cell => cell.opacity > 0)
      );
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Redraw when dependencies change
  useEffect(() => {
    drawChart();
  }, [drawChart]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  return (
    <div ref={containerRef} className="glass-card rounded-2xl p-5 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Interactive Price Action Chart - {selectedContract ? selectedContract.symbol : 'Select a contract'}</h3>
        {drawnPoints.length > 0 && (
          <button 
            onClick={clearDrawing}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear Drawing
          </button>
        )}
      </div>
      
      {!selectedContract && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-2xl z-20">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">Select an option contract</p>
            <p className="text-sm text-muted-foreground">Then draw your price prediction to see P&L</p>
          </div>
        </div>
      )}
      
      <div className="relative" style={{ height: dimensions.height }}>
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
        />
        <canvas
          ref={overlayRef}
          width={dimensions.width}
          height={dimensions.height}
          className={cn(
            "absolute inset-0",
            selectedContract ? "cursor-crosshair" : "cursor-not-allowed"
          )}
          onMouseDown={selectedContract ? handleMouseDown : undefined}
          onMouseMove={selectedContract ? handleMouseMove : undefined}
          onMouseUp={selectedContract ? handleMouseUp : undefined}
          onMouseLeave={selectedContract ? handleMouseLeave : undefined}
        />
      </div>
      
      {selectedContract && (
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            Profit zones
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            Loss zones
          </span>
          <span>Click and drag to draw your price prediction</span>
        </div>
      )}
    </div>
  );
};
