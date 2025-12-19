import { useState, useRef, useEffect } from 'react';
import { ChatMessage, OrderIntent, Stock } from '@/types/trading';
import { Send, Bot, User, Sparkles, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TradeTicketWidget } from './widgets/TradeTicketWidget';
import { AIMessageRenderer } from './widgets/AIMessageRenderer';

interface ChatPanelProps {
  messages: ChatMessage[];
  pendingOrder: OrderIntent | null;
  watchlist: Stock[];
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
  onConfirmOrder: () => void;
  onCancelOrder: () => void;
}

export const ChatPanel = ({
  messages,
  pendingOrder,
  watchlist,
  isLoading = false,
  onSendMessage,
  onConfirmOrder,
  onCancelOrder,
}: ChatPanelProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const quickActions = [
    { label: 'Buy NVDA', action: 'buy 5 NVDA', variant: 'buy' as const },
    { label: 'Sell TSLA', action: 'sell 10 TSLA', variant: 'sell' as const },
    { label: 'Market View', action: "What's your take on the market today?", variant: 'neutral' as const },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border/30 bg-gradient-radial">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl gradient-purple-gold">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gradient-purple-gold">AI Trading Coach</h2>
            <p className="text-xs text-muted-foreground">Live market data • Smart order suggestions</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-4 animate-fade-in',
              message.role === 'user' ? 'flex-row-reverse' : ''
            )}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center',
                message.role === 'assistant'
                  ? 'gradient-purple-gold'
                  : 'bg-primary/20'
              )}
            >
              {message.role === 'assistant' ? (
                <Bot className="h-5 w-5 text-white" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            
            <div
              className={cn(
                'max-w-[85%]',
                message.role === 'assistant'
                  ? 'chat-bubble-ai'
                  : 'chat-bubble-user'
              )}
            >
              {message.role === 'assistant' ? (
                message.content ? (
                  <AIMessageRenderer content={message.content} watchlist={watchlist} />
                ) : isLoading ? (
                  <span className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-highlight" />
                    <span className="text-muted-foreground">Analyzing markets...</span>
                  </span>
                ) : null
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              )}
              {message.content && (
                <p className="text-[10px] mt-3 text-muted-foreground/60">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Order Confirmation Card */}
        {pendingOrder && (
          <div className="animate-slide-in-right max-w-sm ml-14">
            <TradeTicketWidget
              order={pendingOrder}
              stock={watchlist.find((s) => s.symbol === pendingOrder.symbol)}
              onConfirm={onConfirmOrder}
              onCancel={onCancelOrder}
              showActions={true}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-5 py-3 border-t border-border/30 flex gap-2 overflow-x-auto scrollbar-thin">
        {quickActions.map((qa) => (
          <Button
            key={qa.label}
            variant="outline"
            size="sm"
            className={cn(
              "text-xs whitespace-nowrap rounded-xl font-semibold transition-all duration-200",
              qa.variant === 'buy' && "border-success/50 text-success hover:bg-success/10 hover:border-success",
              qa.variant === 'sell' && "border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive",
              qa.variant === 'neutral' && "border-highlight/50 text-highlight hover:bg-highlight/10 hover:border-highlight"
            )}
            onClick={() => onSendMessage(qa.action)}
            disabled={isLoading}
          >
            {qa.label}
          </Button>
        ))}
      </div>

      {/* Input */}
      <div className="p-5 border-t border-border/30 bg-card/50">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about markets or type 'buy 2 TSLA'..."
            className="flex-1 bg-input border-border/50 rounded-xl h-12 px-4 focus-visible:ring-primary/50 focus-visible:border-primary/50"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground glow-primary transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
