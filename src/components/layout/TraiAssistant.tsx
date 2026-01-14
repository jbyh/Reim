import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  Loader2,
  TrendingUp,
  PieChart,
  Layers,
  Eye,
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Stock, OrderIntent, Position } from '@/types/trading';
import { AIMessageRenderer } from '@/components/trading/widgets/AIMessageRenderer';
import { TradeTicketWidget } from '@/components/trading/widgets/TradeTicketWidget';

type TabType = 'dashboard' | 'watchlist' | 'portfolio' | 'options' | 'history' | 'chat' | 'floor';

interface QuickAction {
  label: string;
  action: string;
  icon: React.ElementType;
  variant: 'primary' | 'success' | 'warning';
}

interface TraiAssistantProps {
  messages: ChatMessage[];
  pendingOrder: OrderIntent | null;
  watchlist: Stock[];
  positions: Position[];
  isLoading: boolean;
  currentTab: TabType;
  currentSymbol?: string;
  onSendMessage: (message: string) => void;
  onConfirmOrder: () => void;
  onCancelOrder: () => void;
  onNavigate: (tab: TabType, symbol?: string) => void;
}

export const TraiAssistant = ({
  messages,
  pendingOrder,
  watchlist,
  positions,
  isLoading,
  currentTab,
  currentSymbol,
  onSendMessage,
  onConfirmOrder,
  onCancelOrder,
  onNavigate
}: TraiAssistantProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Context-aware quick actions based on current page
  const quickActions = useMemo((): QuickAction[] => {
    const baseActions: QuickAction[] = [];

    switch (currentTab) {
      case 'dashboard':
        baseActions.push(
          { label: "What's moving?", action: "What's moving in the market today?", icon: TrendingUp, variant: 'primary' },
          { label: "Portfolio review", action: "Review my portfolio performance", icon: PieChart, variant: 'success' },
          { label: "Find options", action: "Find me some good options plays", icon: Layers, variant: 'warning' }
        );
        break;
      case 'watchlist':
        baseActions.push(
          { label: "Top gainers", action: "Show me the top gainers from my watchlist", icon: TrendingUp, variant: 'success' },
          { label: "Risk analysis", action: "Analyze the risk in my watchlist", icon: Eye, variant: 'warning' }
        );
        break;
      case 'portfolio':
        if (positions.length > 0) {
          const topPosition = positions[0];
          baseActions.push(
            { label: `Analyze ${topPosition.symbol}`, action: `Analyze my ${topPosition.symbol} position`, icon: Eye, variant: 'primary' }
          );
        }
        baseActions.push(
          { label: "Rebalance tips", action: "Should I rebalance my portfolio?", icon: PieChart, variant: 'success' },
          { label: "Exit strategies", action: "What are my best exit strategies?", icon: TrendingUp, variant: 'warning' }
        );
        break;
      case 'options':
        if (currentSymbol) {
          baseActions.push(
            { label: `${currentSymbol} analysis`, action: `Analyze options for ${currentSymbol}`, icon: Layers, variant: 'primary' },
            { label: "Best strikes", action: `What strike prices look good for ${currentSymbol}?`, icon: TrendingUp, variant: 'success' }
          );
        }
        baseActions.push(
          { label: "IV insights", action: "Where is implied volatility high right now?", icon: Eye, variant: 'warning' }
        );
        break;
      case 'history':
        baseActions.push(
          { label: "Trade analysis", action: "Analyze my recent trading patterns", icon: Eye, variant: 'primary' },
          { label: "P&L breakdown", action: "Break down my profit and losses", icon: PieChart, variant: 'success' }
        );
        break;
      default:
        baseActions.push(
          { label: "Market pulse", action: "Give me a quick market pulse", icon: TrendingUp, variant: 'primary' },
          { label: "Trade ideas", action: "What are some trade ideas for today?", icon: Sparkles, variant: 'success' }
        );
    }

    return baseActions.slice(0, 3);
  }, [currentTab, currentSymbol, positions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const handleQuickAction = (action: string) => {
    onSendMessage(action);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  // Minimized state - just a floating button
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl gradient-purple glow-primary flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
      >
        <Sparkles className="h-6 w-6 text-white" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </button>
    );
  }

  // Collapsed state - compact bar at bottom
  if (!isExpanded) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none md:left-auto md:right-6 md:bottom-6 md:w-[420px]">
        <div className="pointer-events-auto glass-card rounded-2xl border border-primary/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Trai</p>
                <p className="text-xs text-muted-foreground">Ready to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsExpanded(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMinimized(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-3 flex gap-2 overflow-x-auto scrollbar-thin">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => handleQuickAction(qa.action)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
                  "border bg-secondary/50 hover:bg-secondary",
                  qa.variant === 'primary' && "border-primary/30 text-primary hover:border-primary/50",
                  qa.variant === 'success' && "border-success/30 text-success hover:border-success/50",
                  qa.variant === 'warning' && "border-warning/30 text-warning hover:border-warning/50"
                )}
              >
                <qa.icon className="h-3.5 w-3.5" />
                {qa.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 pt-0 flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Trai anything..."
              className="flex-1 h-10 bg-input/50 border-border/50 rounded-xl text-sm"
              disabled={isLoading}
              onFocus={() => setIsExpanded(true)}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Expanded state - full chat panel
  return (
    <div className="fixed bottom-0 right-0 z-50 w-full md:w-[450px] h-[70vh] md:h-[600px] md:bottom-6 md:right-6 pointer-events-none">
      <div className="pointer-events-auto h-full glass-card rounded-t-2xl md:rounded-2xl border border-primary/20 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-purple glow-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground">Trai</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Live • Viewing {currentTab}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded(false)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMinimized(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-2xl gradient-purple glow-primary flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">Hey! I'm Trai</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
                Your AI trading companion. I can analyze markets, suggest trades, and help you make smarter decisions.
              </p>
              <div className="w-full space-y-2">
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => handleQuickAction(qa.action)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <qa.icon className={cn(
                        "h-4 w-4",
                        qa.variant === 'primary' && "text-primary",
                        qa.variant === 'success' && "text-success",
                        qa.variant === 'warning' && "text-warning"
                      )} />
                      <span className="text-sm text-foreground">{qa.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
                      message.role === 'assistant' ? 'gradient-purple' : 'bg-primary/20'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <Bot className="h-4 w-4 text-white" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  
                  <div
                    className={cn(
                      'max-w-[80%]',
                      message.role === 'assistant' ? 'chat-bubble-ai' : 'chat-bubble-user'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      message.content ? (
                        <AIMessageRenderer content={message.content} watchlist={watchlist} />
                      ) : isLoading ? (
                        <span className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-muted-foreground">Thinking...</span>
                        </span>
                      ) : null
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    {message.content && (
                      <p className="text-[10px] mt-2 text-muted-foreground/60">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Order Confirmation */}
              {pendingOrder && (
                <div className="max-w-[90%] ml-11">
                  <TradeTicketWidget
                    order={pendingOrder}
                    stock={watchlist.find((s) => s.symbol === pendingOrder.symbol)}
                    onConfirm={onConfirmOrder}
                    onCancel={onCancelOrder}
                    showActions={true}
                  />
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions - When messages exist */}
        {messages.length > 0 && (
          <div className="px-4 py-2 border-t border-border/30 flex gap-2 overflow-x-auto scrollbar-thin">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => handleQuickAction(qa.action)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  "border bg-secondary/30 hover:bg-secondary",
                  qa.variant === 'primary' && "border-primary/30 text-primary",
                  qa.variant === 'success' && "border-success/30 text-success",
                  qa.variant === 'warning' && "border-warning/30 text-warning"
                )}
              >
                <qa.icon className="h-3 w-3" />
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border/30 bg-card/50">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Trai anything..."
              className="flex-1 h-11 bg-input border-border/50 rounded-xl"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 glow-primary"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
