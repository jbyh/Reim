import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings
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
  orderStatus?: 'pending' | 'submitting' | 'confirmed' | 'failed' | null;
  onSendMessage: (message: string) => void;
  onConfirmOrder: () => void;
  onCancelOrder: () => void;
  onNavigate: (tab: TabType, symbol?: string) => void;
  isFullPage?: boolean;
  isSidebar?: boolean;
}

export const TraiAssistant = ({
  messages,
  pendingOrder,
  watchlist,
  positions,
  isLoading,
  currentTab,
  currentSymbol,
  orderStatus,
  onSendMessage,
  onConfirmOrder,
  onCancelOrder,
  onNavigate,
  isFullPage = false,
  isSidebar = false
}: TraiAssistantProps) => {
  // isExpanded: 'collapsed' | 'half' | 'full' - three states for mobile
  const [expansionState, setExpansionState] = useState<'collapsed' | 'half' | 'full'>('collapsed');
  const [isMinimized, setIsMinimized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [showConfirmAnimation, setShowConfirmAnimation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Context-aware quick actions based on current page
  const quickActions = useMemo((): QuickAction[] => {
    if (pendingOrder) {
      return [
        { label: 'Confirm & Execute', action: '__confirm_order__', icon: CheckCircle2, variant: 'success' },
        { label: 'Cancel', action: '__cancel_order__', icon: X, variant: 'warning' },
        { label: 'Adjust', action: 'Adjust the order (qty/limit/stop/target) before I confirm.', icon: Settings, variant: 'primary' },
      ];
    }

    const baseActions: QuickAction[] = [];

    switch (currentTab) {
      case 'dashboard':
        baseActions.push(
          { label: "What's moving?", action: "What's moving in the market today?", icon: TrendingUp, variant: 'primary' },
          { label: 'Portfolio review', action: 'Review my portfolio performance', icon: PieChart, variant: 'success' },
          { label: 'Find options', action: 'Find me some good options plays', icon: Layers, variant: 'warning' }
        );
        break;
      case 'watchlist':
        baseActions.push(
          { label: 'Top gainers', action: 'Show me the top gainers from my watchlist', icon: TrendingUp, variant: 'success' },
          { label: 'Risk analysis', action: 'Analyze the risk in my watchlist', icon: Eye, variant: 'warning' }
        );
        break;
      case 'portfolio':
        if (positions.length > 0) {
          const topPosition = positions[0];
          baseActions.push({ label: `Analyze ${topPosition.symbol}`, action: `Analyze my ${topPosition.symbol} position`, icon: Eye, variant: 'primary' });
        }
        baseActions.push(
          { label: 'Rebalance tips', action: 'Should I rebalance my portfolio?', icon: PieChart, variant: 'success' },
          { label: 'Exit strategies', action: 'What are my best exit strategies?', icon: TrendingUp, variant: 'warning' }
        );
        break;
      case 'options':
        if (currentSymbol) {
          baseActions.push(
            { label: `${currentSymbol} analysis`, action: `Analyze options for ${currentSymbol}`, icon: Layers, variant: 'primary' },
            { label: 'Best strikes', action: `What strike prices look good for ${currentSymbol}?`, icon: TrendingUp, variant: 'success' }
          );
        }
        baseActions.push({ label: 'IV insights', action: 'Where is implied volatility high right now?', icon: Eye, variant: 'warning' });
        break;
      case 'history':
        baseActions.push(
          { label: 'Trade analysis', action: 'Analyze my recent trading patterns', icon: Eye, variant: 'primary' },
          { label: 'P&L breakdown', action: 'Break down my profit and losses', icon: PieChart, variant: 'success' }
        );
        break;
      default:
        baseActions.push(
          { label: 'Market pulse', action: 'Give me a quick market pulse', icon: TrendingUp, variant: 'primary' },
          { label: 'Trade ideas', action: 'What are some trade ideas for today?', icon: Sparkles, variant: 'success' }
        );
    }

    return baseActions.slice(0, 3);
  }, [currentTab, currentSymbol, positions, pendingOrder]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    if (expansionState !== 'collapsed' || isFullPage) {
      scrollToBottom();
    }
  }, [messages, pendingOrder, expansionState, isFullPage]);

  useEffect(() => {
    if (orderStatus === 'confirmed') {
      setShowConfirmAnimation(true);
      setTimeout(() => setShowConfirmAnimation(false), 3000);
    }
  }, [orderStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    chatInputRef.current?.focus();
  };

  const handleQuickAction = (action: string) => {
    if (action === '__confirm_order__') {
      onConfirmOrder();
      return;
    }
    if (action === '__cancel_order__') {
      onCancelOrder();
      return;
    }

    onSendMessage(action);
    if (expansionState === 'collapsed' && !isFullPage) {
      setExpansionState('full');
    }
  };

  const toggleExpansion = () => {
    if (expansionState === 'collapsed') {
      setExpansionState('full'); // Go straight to full on mobile
    } else if (expansionState === 'half') {
      setExpansionState('full');
    } else {
      setExpansionState('collapsed');
    }
  };

  // Order status indicator
  const OrderStatusBadge = () => {
    if (!pendingOrder && !orderStatus) return null;
    
    let statusConfig = {
      icon: Clock,
      text: 'Order Pending',
      className: 'bg-warning/20 text-warning border-warning/30'
    };

    if (orderStatus === 'submitting') {
      statusConfig = {
        icon: Loader2,
        text: 'Submitting...',
        className: 'bg-primary/20 text-primary border-primary/30'
      };
    } else if (orderStatus === 'confirmed') {
      statusConfig = {
        icon: CheckCircle2,
        text: 'Confirmed!',
        className: 'bg-success/20 text-success border-success/30'
      };
    } else if (orderStatus === 'failed') {
      statusConfig = {
        icon: AlertCircle,
        text: 'Failed',
        className: 'bg-destructive/20 text-destructive border-destructive/30'
      };
    }

    const Icon = statusConfig.icon;
    
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border animate-in fade-in",
        statusConfig.className
      )}>
        <Icon className={cn("h-3 w-3", orderStatus === 'submitting' && "animate-spin")} />
        {statusConfig.text}
      </div>
    );
  };

  // Confirmation toast
  const ConfirmationToast = () => {
    if (!showConfirmAnimation) return null;
    return (
      <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="flex items-center gap-2 px-3 py-2 bg-success/20 border border-success/30 rounded-lg shadow-lg backdrop-blur">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-xs font-medium text-success">Order Confirmed!</span>
        </div>
      </div>
    );
  };

  // Chat content component - shared between overlay and full page
  // Uses absolute positioning for the scroll area to avoid mobile Safari flex bugs
  const ChatContent = ({ className = '' }: { className?: string }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const el = scrollContainerRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    }, [messages, pendingOrder, isLoading]);

    return (
      <div className={cn("flex flex-col", className)} style={{ minHeight: 0 }}>
        {/* Messages - relative wrapper with absolute scrollable child */}
        <div className="relative flex-1" style={{ minHeight: 0 }}>
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-y-auto overscroll-contain p-3 md:p-4 space-y-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-4" style={{ minHeight: '100%' }}>
                <div className="w-14 h-14 rounded-2xl gradient-purple glow-primary flex items-center justify-center mb-4">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Hey! I'm Trai</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-[260px]">
                  Your AI trading companion. I can analyze markets, suggest trades, and help you make smarter decisions.
                </p>
                <div className="w-full space-y-2 max-w-[280px]">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => handleQuickAction(qa.action)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <qa.icon className={cn(
                          "h-4 w-4",
                          qa.variant === 'primary' && "text-primary",
                          qa.variant === 'success' && "text-success",
                          qa.variant === 'warning' && "text-warning"
                        )} />
                        <span className="text-xs text-foreground">{qa.label}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-2',
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
                        message.role === 'assistant' ? 'gradient-purple' : 'bg-primary/20'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <Bot className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    
                    <div
                      className={cn(
                        'max-w-[85%]',
                        message.role === 'assistant' ? 'chat-bubble-ai' : 'chat-bubble-user'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        message.content ? (
                          <AIMessageRenderer content={message.content} watchlist={watchlist} />
                        ) : isLoading ? (
                          <span className="flex items-center gap-2 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            <span className="text-muted-foreground">Thinking...</span>
                          </span>
                        ) : null
                      ) : (
                        <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                      )}
                      {message.content && (
                        <p className="text-[9px] mt-1.5 text-muted-foreground/60">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Order Confirmation */}
                {pendingOrder && (
                  <div className="max-w-[90%] ml-9 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-warning" />
                      <span className="text-xs font-medium text-warning">Order Awaiting Confirmation</span>
                    </div>
                    <TradeTicketWidget
                      order={pendingOrder}
                      stock={watchlist.find((s) => s.symbol === pendingOrder.symbol)}
                      onConfirm={onConfirmOrder}
                      onCancel={onCancelOrder}
                      showActions={true}
                      isSubmitting={orderStatus === 'submitting'}
                    />
                  </div>
                )}
              </>
            )}
            <div className="h-1" />
          </div>
        </div>

        {/* Quick Actions - When messages exist */}
        {messages.length > 0 && (
          <div className="flex-shrink-0 px-3 py-2 border-t border-border/30 flex gap-1.5 overflow-x-auto scrollbar-thin">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => handleQuickAction(qa.action)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all",
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
        <div className="flex-shrink-0 p-3 border-t border-border/30 bg-card/50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={chatInputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Trai anything..."
              inputMode="text"
              enterKeyHint="send"
              autoComplete="off"
              autoFocus={false}
              className="flex-1 h-10 bg-input border-border/50 rounded-xl text-sm"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 glow-primary"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    );
  };

  // If this is the full page mode (dedicated chat tab), render full page experience
  if (isFullPage) {
    return (
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        <ConfirmationToast />
        <div className="flex items-center justify-between p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-purple glow-primary flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Trai</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                AI Trading Assistant • Live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/profile')}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ChatContent className="flex-1 min-h-0" />
      </div>
    );
  }

  // Sidebar mode - persistent right panel on desktop with collapse/expand
  if (isSidebar) {
    // sidebarOpen state is at top level

    if (!sidebarOpen) {
      return (
        <div className="h-full flex flex-col items-center border-l border-border/30 bg-card/30 w-12">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mt-3 w-9 h-9 rounded-xl gradient-purple glow-primary flex items-center justify-center hover:scale-105 transition-transform"
            title="Open Trai"
          >
            <Sparkles className="h-4 w-4 text-white" />
          </button>
          {pendingOrder && (
            <span className="mt-2 w-3 h-3 bg-warning rounded-full animate-pulse" />
          )}
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-card/30 overflow-hidden w-[340px] xl:w-[380px] border-l border-border/30">
        <ConfirmationToast />
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-purple glow-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Trai</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Live • {currentTab}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <OrderStatusBadge />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
              title="Collapse Trai"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Pending Order Alert */}
        {pendingOrder && (
          <div className="p-2 bg-warning/10 border-b border-warning/30 flex items-center gap-2">
            <Clock className="h-3 w-3 text-warning" />
            <span className="text-[10px] text-foreground">
              Pending: <strong>{pendingOrder.side.toUpperCase()}</strong> {pendingOrder.qty} {pendingOrder.symbol}
            </span>
          </div>
        )}

        <ChatContent className="flex-1 min-h-0" />
      </div>
    );
  }

  // Minimized state - just a floating button
  if (isMinimized) {
    return (
      <>
        <ConfirmationToast />
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-xl gradient-purple glow-primary flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
        >
          <Sparkles className="h-5 w-5 text-white" />
          {(pendingOrder || orderStatus === 'submitting') && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning text-warning-foreground text-[10px] rounded-full flex items-center justify-center animate-pulse">
              !
            </span>
          )}
        </button>
      </>
    );
  }

  // Collapsed state - compact bar at bottom
  if (expansionState === 'collapsed') {
    return (
      <>
        <ConfirmationToast />
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 pointer-events-none md:left-auto md:right-4 md:bottom-4 md:w-[380px]">
          <div className="pointer-events-auto glass-card rounded-xl border border-primary/20 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">Trai</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
                    Live • {currentTab}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <OrderStatusBadge />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/profile')}
                  title="Settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={toggleExpansion}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMinimized(true)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Pending Order Alert */}
            {pendingOrder && (
              <div className="p-2 bg-warning/10 border-b border-warning/30 flex items-center gap-2 animate-in slide-in-from-top-2">
                <Clock className="h-3 w-3 text-warning" />
                <span className="text-[10px] text-foreground">
                  Pending: <strong>{pendingOrder.side.toUpperCase()}</strong> {pendingOrder.qty} {pendingOrder.symbol}
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-auto h-6 text-[10px] px-2"
                  onClick={toggleExpansion}
                >
                  Review
                </Button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-2 flex gap-1.5 overflow-x-auto scrollbar-thin">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => handleQuickAction(qa.action)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all",
                    "border bg-secondary/50 hover:bg-secondary",
                    qa.variant === 'primary' && "border-primary/30 text-primary hover:border-primary/50",
                    qa.variant === 'success' && "border-success/30 text-success hover:border-success/50",
                    qa.variant === 'warning' && "border-warning/30 text-warning hover:border-warning/50"
                  )}
                >
                  <qa.icon className="h-3 w-3" />
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Input - use a fake button to avoid keyboard bounce on expand */}
            <div className="p-2 pt-0 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setExpansionState('full');
                  setTimeout(() => {
                    chatInputRef.current?.focus();
                  }, 350);
                }}
                className="flex-1 h-9 bg-input/50 border border-border/50 rounded-lg text-xs text-muted-foreground text-left px-3"
              >
                Ask Trai anything...
              </button>
              <Button 
                type="button" 
                size="icon"
                onClick={() => {
                  setExpansionState('full');
                  setTimeout(() => {
                    chatInputRef.current?.focus();
                  }, 350);
                }}
                className="h-9 w-9 rounded-lg bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Expanded state - full screen on mobile, panel on desktop
  return (
    <>
      <ConfirmationToast />
      {/* Mobile: Full screen overlay */}
      <div className={cn(
        "fixed z-50 pointer-events-none transition-all duration-300",
        // Mobile: full screen
        "inset-0 md:inset-auto",
        // Desktop: bottom right panel
        "md:bottom-4 md:right-4 md:w-[400px] md:h-[550px]"
      )}>
        <div className="pointer-events-auto h-full glass-card md:rounded-2xl border-t md:border border-primary/20 shadow-2xl flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl" style={{ height: '100dvh', maxHeight: '100dvh' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-purple glow-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Trai</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Live • Viewing {currentTab}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <OrderStatusBadge />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/profile')}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setExpansionState('collapsed')}
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

          <ChatContent className="flex-1 min-h-0" />
        </div>
      </div>
    </>
  );
};
