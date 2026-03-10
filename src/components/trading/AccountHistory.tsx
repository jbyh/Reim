import { Activity } from '@/types/trading';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  DollarSign,
  RefreshCw,
  Filter,
  ArrowRightLeft,
  Ban,
  Minus,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AccountHistoryProps {
  activities: Activity[];
  isLoading: boolean;
  onRefresh: () => void;
}

/** Resolve the best available date from an activity record */
const resolveDate = (activity: Activity): Date | null => {
  const raw = activity.transaction_time || activity.created_at || activity.date;
  if (!raw) return null;
  try {
    // activity.date is "YYYY-MM-DD" (no time), others are ISO strings
    if (raw.length === 10) return parseISO(raw + 'T00:00:00Z');
    return new Date(raw);
  } catch {
    return null;
  }
};

const formatActivityDate = (activity: Activity): string => {
  const d = resolveDate(activity);
  if (!d || isNaN(d.getTime())) return '—';
  // If we only have a date (no time component), show date only
  if (!activity.transaction_time && !activity.created_at && activity.date) {
    return format(d, 'MMM dd, yyyy');
  }
  return format(d, 'MMM dd, yyyy · h:mm a') + ' UTC';
};

const getActivityIcon = (type: string, side?: string) => {
  if (type === 'FILL') {
    return side === 'buy' ? (
      <ArrowDownRight className="h-4 w-4 text-success" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-destructive" />
    );
  }
  if (type === 'OPEXP') return <Ban className="h-4 w-4 text-warning" />;
  if (type === 'FEE' || type === 'CFEE') return <Minus className="h-4 w-4 text-destructive" />;
  if (type === 'DIV' || type === 'DIVCGL' || type === 'DIVNRA' || type === 'INT') {
    return <DollarSign className="h-4 w-4 text-success" />;
  }
  if (type === 'TRANS' || type === 'CSD' || type === 'CSW' || type === 'JNLC' || type === 'JNLS') {
    return <ArrowRightLeft className="h-4 w-4 text-primary" />;
  }
  return <FileText className="h-4 w-4 text-muted-foreground" />;
};

const getActivityLabel = (activity: Activity): string => {
  const { activity_type, activity_sub_type } = activity;
  const labels: Record<string, string> = {
    'FILL': 'Trade Fill',
    'TRANS': 'Transfer',
    'DIV': 'Dividend',
    'DIVCGL': 'Capital Gain',
    'DIVNRA': 'NRA Dividend',
    'CSD': 'Cash Deposit',
    'CSW': 'Cash Withdrawal',
    'INT': 'Interest',
    'JNLC': 'Journal (Cash)',
    'JNLS': 'Journal (Stock)',
    'FEE': 'Fee',
    'ACATC': 'ACAT Transfer',
    'ACATS': 'ACAT Transfer',
    'CFEE': 'Commission',
    'PTC': 'Pass-Thru Charge',
    'OPEXP': 'Options Expiry',
  };
  let label = labels[activity_type] || activity_type;
  if (activity_type === 'FEE' && activity_sub_type) {
    label = `Fee (${activity_sub_type})`;
  }
  return label;
};

const getActivityColor = (type: string, side?: string) => {
  if (type === 'FILL') {
    return side === 'buy' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive';
  }
  if (type === 'OPEXP') return 'bg-warning/20 text-warning';
  if (type === 'DIV' || type === 'INT' || type === 'CSD' || type === 'JNLC') {
    return 'bg-success/20 text-success';
  }
  if (type === 'CSW' || type === 'FEE' || type === 'CFEE') {
    return 'bg-destructive/20 text-destructive';
  }
  return 'bg-primary/20 text-primary';
};

type FilterType = 'all' | 'trades' | 'fees' | 'transfers' | 'options';

export const AccountHistory = ({ activities, isLoading, onRefresh }: AccountHistoryProps) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'trades') return activity.activity_type === 'FILL';
    if (filter === 'fees') return activity.activity_type === 'FEE' || activity.activity_type === 'CFEE';
    if (filter === 'transfers') return ['TRANS', 'CSD', 'CSW', 'JNLC', 'JNLS', 'DIV', 'INT'].includes(activity.activity_type);
    if (filter === 'options') return activity.activity_type === 'OPEXP';
    return true;
  });

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'trades', label: 'Trades' },
    { id: 'fees', label: 'Fees' },
    { id: 'options', label: 'Options' },
    { id: 'transfers', label: 'Transfers' },
  ];

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-4 md:p-6 border-b border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Account History</h2>
                <p className="text-xs text-muted-foreground">{activities.length} activities</p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh account history"
              className="p-2 rounded-xl hover:bg-secondary transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCw className={cn("h-5 w-5 text-muted-foreground", isLoading && "animate-spin")} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2" role="tablist" aria-label="Activity filters">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
              {filters.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    filter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin" role="list" aria-label="Activity list">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No activities found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter !== 'all' ? 'Try changing the filter' : 'Your account history will appear here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filteredActivities.map((activity) => {
                const dateStr = formatActivityDate(activity);
                const isFill = activity.activity_type === 'FILL';
                const isOpExp = activity.activity_type === 'OPEXP';
                const isFee = activity.activity_type === 'FEE' || activity.activity_type === 'CFEE';
                const isTransfer = ['JNLC', 'JNLS', 'CSD', 'CSW', 'TRANS'].includes(activity.activity_type);

                // Compute fill total
                const fillTotal = isFill && activity.qty && activity.price
                  ? parseFloat(activity.qty) * parseFloat(activity.price)
                  : null;

                return (
                  <div
                    key={activity.id}
                    role="listitem"
                    className="p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        getActivityColor(activity.activity_type, activity.side)
                      )}>
                        {getActivityIcon(activity.activity_type, activity.side)}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {getActivityLabel(activity)}
                          </span>
                          {activity.symbol && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-foreground font-mono truncate max-w-[140px] inline-block">
                                  {activity.symbol}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="font-mono text-xs">{activity.symbol}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {isFill && activity.side && (
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                              activity.side === 'buy' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                            )}>
                              {activity.side}
                            </span>
                          )}
                        </div>

                        {/* Detail line */}
                        <div className="text-xs text-muted-foreground mt-0.5 space-x-2">
                          {isFill && activity.qty && activity.price ? (
                            <>
                              <span>{activity.qty} {parseFloat(activity.qty) === 1 ? 'share' : 'shares'} @ ${parseFloat(activity.price).toFixed(2)}</span>
                              {activity.order_status && activity.order_status !== 'filled' && (
                                <span className="text-warning">({activity.order_status})</span>
                              )}
                            </>
                          ) : isOpExp ? (
                            <span>{activity.qty ? `${Math.abs(parseFloat(activity.qty))} contract(s) expired` : 'Contract expired'}</span>
                          ) : isFee && activity.description ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate inline-block max-w-[200px] md:max-w-[350px]">{activity.description}</span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-[300px]">
                                <p className="text-xs">{activity.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : isTransfer && activity.description ? (
                            <span>{activity.description || 'Transfer'}</span>
                          ) : null}
                        </div>

                        {/* Timestamp */}
                        <p className="text-[11px] text-muted-foreground/70 mt-1">{dateStr}</p>
                      </div>

                      {/* Amount / Value */}
                      <div className="text-right flex-shrink-0">
                        {fillTotal !== null && (
                          <p className="font-mono font-semibold text-sm text-foreground">
                            ${fillTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                        {activity.net_amount && (
                          <p className={cn(
                            "font-mono text-xs font-medium",
                            parseFloat(activity.net_amount) > 0 ? "text-success" : parseFloat(activity.net_amount) < 0 ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {parseFloat(activity.net_amount) > 0 ? '+' : ''}
                            ${Math.abs(parseFloat(activity.net_amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                        {!fillTotal && !activity.net_amount && (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                        {/* ID tooltip */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5 cursor-help truncate max-w-[80px] ml-auto">
                              {activity.id.split('::')[1]?.slice(0, 8) || activity.id.slice(0, 8)}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p className="font-mono text-[10px]">{activity.id}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
