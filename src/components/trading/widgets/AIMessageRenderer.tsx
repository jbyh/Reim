import { useMemo } from 'react';
import { Stock, OrderIntent } from '@/types/trading';
import { PriceWidget } from './PriceWidget';
import { TradeTicketWidget } from './TradeTicketWidget';
import { MiniChart } from './MiniChart';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Info, Lightbulb, AlertTriangle } from 'lucide-react';

interface AIMessageRendererProps {
  content: string;
  watchlist: Stock[];
  onOrderDetected?: (order: OrderIntent) => void;
}

interface ParsedContent {
  type: 'text' | 'price' | 'order' | 'insight' | 'warning';
  content: string;
  data?: any;
}

export const AIMessageRenderer = ({ 
  content, 
  watchlist,
}: AIMessageRendererProps) => {
  const parsedContent = useMemo(() => {
    const parts: ParsedContent[] = [];
    
    // Check for JSON order intent first
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    let remainingContent = content;
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.type === 'order_intent') {
          const stock = watchlist.find(s => s.symbol === parsed.symbol);
          parts.push({
            type: 'order',
            content: '',
            data: {
              order: {
                symbol: parsed.symbol,
                qty: parsed.quantity,
                side: parsed.side,
                type: parsed.orderType || 'market',
                limitPrice: parsed.suggestions?.limitPrice,
                stopLoss: parsed.suggestions?.stopLoss,
                takeProfit: parsed.suggestions?.takeProfit,
              },
              stock,
              reasoning: parsed.suggestions?.reasoning,
            }
          });
          remainingContent = content.replace(jsonMatch[0], '').trim();
        }
      } catch {
        // Not valid JSON, ignore
      }
    }
    
    // Parse remaining content for special formatting
    const lines = remainingContent.split('\n');
    let currentBlock: string[] = [];
    
    const flushBlock = () => {
      if (currentBlock.length > 0) {
        const text = currentBlock.join('\n').trim();
        if (text) {
          // Check for stock mentions and add price widgets
          const symbolPattern = /\b(SPY|QQQ|TSLA|NVDA|AAPL|MSFT|AMZN|GOOGL|META|AMD|PLUG)\b/gi;
          const mentions = text.match(symbolPattern);
          
          if (mentions && mentions.length > 0) {
            // Add text with inline price references
            parts.push({ type: 'text', content: text });
            
            // Add price widgets for mentioned stocks
            const uniqueSymbols = [...new Set(mentions.map(m => m.toUpperCase()))];
            uniqueSymbols.forEach(symbol => {
              const stock = watchlist.find(s => s.symbol === symbol);
              if (stock && stock.price > 0) {
                parts.push({ type: 'price', content: '', data: { stock } });
              }
            });
          } else {
            parts.push({ type: 'text', content: text });
          }
        }
        currentBlock = [];
      }
    };
    
    lines.forEach(line => {
      // Check for insight markers
      if (line.includes('💡') || line.toLowerCase().includes('tip:') || line.toLowerCase().includes('suggestion:')) {
        flushBlock();
        parts.push({ type: 'insight', content: line.replace(/💡/g, '').trim() });
      } else if (line.includes('⚠️') || line.toLowerCase().includes('warning:') || line.toLowerCase().includes('risk:')) {
        flushBlock();
        parts.push({ type: 'warning', content: line.replace(/⚠️/g, '').trim() });
      } else {
        currentBlock.push(line);
      }
    });
    
    flushBlock();
    
    return parts;
  }, [content, watchlist]);

  if (parsedContent.length === 0) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  return (
    <div className="space-y-3">
      {parsedContent.map((part, index) => {
        switch (part.type) {
          case 'order':
            return (
              <TradeTicketWidget
                key={index}
                order={part.data.order}
                stock={part.data.stock}
                reasoning={part.data.reasoning}
                showActions={false}
              />
            );
          
          case 'price':
            return (
              <PriceWidget 
                key={index} 
                stock={part.data.stock} 
                compact 
              />
            );
          
          case 'insight':
            return (
              <div 
                key={index} 
                className="flex items-start gap-2 rounded-lg bg-primary/10 border border-primary/20 p-3"
              >
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-primary/90">{part.content}</p>
              </div>
            );
          
          case 'warning':
            return (
              <div 
                key={index} 
                className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3"
              >
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive/90">{part.content}</p>
              </div>
            );
          
          case 'text':
          default:
            return (
              <p 
                key={index} 
                className="text-sm leading-relaxed whitespace-pre-wrap"
              >
                {part.content}
              </p>
            );
        }
      })}
    </div>
  );
};
