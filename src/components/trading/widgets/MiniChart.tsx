import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface MiniChartProps {
  data?: number[];
  positive?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const MiniChart = ({ 
  data,
  positive = true, 
  width = 100, 
  height = 40,
  className 
}: MiniChartProps) => {
  // Generate mock sparkline data if not provided
  const chartData = useMemo(() => {
    if (data && data.length > 0) return data;
    
    // Generate realistic looking price movement
    const points: number[] = [];
    let value = 100;
    for (let i = 0; i < 20; i++) {
      value += (Math.random() - (positive ? 0.4 : 0.6)) * 3;
      points.push(value);
    }
    return points;
  }, [data, positive]);

  const min = Math.min(...chartData);
  const max = Math.max(...chartData);
  const range = max - min || 1;

  const pathD = chartData
    .map((value, index) => {
      const x = (index / (chartData.length - 1)) * width;
      const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const gradientId = useMemo(() => `gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <svg 
      width={width} 
      height={height} 
      className={cn('overflow-visible', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop 
            offset="0%" 
            stopColor={positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
            stopOpacity="0.3" 
          />
          <stop 
            offset="100%" 
            stopColor={positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
            stopOpacity="0" 
          />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <path
        d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
        fill={`url(#${gradientId})`}
      />
      
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* End dot */}
      <circle
        cx={width}
        cy={height - ((chartData[chartData.length - 1] - min) / range) * height * 0.8 - height * 0.1}
        r="3"
        fill={positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
        className="animate-pulse"
      />
    </svg>
  );
};
