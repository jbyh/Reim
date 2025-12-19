import { Activity } from '@/types/trading';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  DollarSign,
  RefreshCw,
  Filter,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';

interface AccountHistoryProps {
  activities: Activity[];
  isLoading: boolean;
  onRefresh: () => void;
}

const getActivityIcon = (type: string, side?: string) => {
  if (type === 'FILL') {
    return side === 'buy' ? (
      <ArrowDownRight className="h-4 w-4 text-success" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-destructive" />
    );
  }
  if (type === 'DIV' || type === 'DIVCGL' || type === 'DIVNRA') {
    return <DollarSign className="h-4 w-4 text-success" />;
  }
  if (type === 'TRANS' || type === 'CSD' || type === 'CSW') {
    return <ArrowRightLeft className="h-4 w-4 text-primary" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

const getActivityLabel = (type: string) => {
  const labels: Record<string, string> = {
    'FILL': 'Trade',
    'TRANS': 'Transfer',
    'DIV': 'Dividend',
    'DIVCGL': 'Capital Gain Dividend',
    'DIVNRA': 'NRA Dividend',
    'CSD': 'Cash Deposit',
    'CSW': 'Cash Withdrawal',
    'INT': 'Interest',
    'JNLC': 'Journal Entry',
    'JNLS': 'Journal Entry',
    'FEE': 'Fee',
    'ACATC': 'ACAT Transfer',
    'ACATS': 'ACAT Transfer',
    'CFEE': 'Commission Fee',
    'PTC': 'Pass-Thru Charge',
  };
  return labels[type] || type;
};

const getActivityColor = (type: string, side?: string) => {
  if (type === 'FILL') {
    return side === 'buy' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive';
  }
  if (type === 'DIV' || type === 'INT' || type === 'CSD') {
    return 'bg-success/20 text-success';
  }
  if (type === 'CSW' || type === 'FEE' || type === 'CFEE') {
    return 'bg-destructive/20 text-destructive';
  }
  return 'bg-primary/20 text-primary';
};

type FilterType = 'all' | 'trades' | 'transfers' | 'dividends';

export const AccountHistory = ({ activities, isLoading, onRefresh }: AccountHistoryProps) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'trades') return activity.activity_type === 'FILL';
    if (filter === 'transfers') return ['TRANS', 'CSD', 'CSW', 'JNLC', 'JNLS'].includes(activity.activity_type);
    if (filter === 'dividends') return ['DIV', 'DIVCGL', 'DIVNRA', 'INT'].includes(activity.activity_type);
    return true;
  });

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'trades', label: 'Trades' },
    { id: 'transfers', label: 'Transfers' },
    { id: 'dividends', label: 'Income' },
  ];

  return (
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
            className="p-2 rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-5 w-5 text-muted-foreground", isLoading && "animate-spin")} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
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
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No activities found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter !== 'all' ? 'Try changing the filter' : 'Your account history will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredActivities.map((activity) => {
              const date = activity.transaction_time 
                ? format(new Date(activity.transaction_time), 'MMM dd, yyyy · h:mm a')
                : 'Unknown date';
              
              return (
                <div
                  key={activity.id}
                  className="p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        getActivityColor(activity.activity_type, activity.side)
                      )}>
                        {getActivityIcon(activity.activity_type, activity.side)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {getActivityLabel(activity.activity_type)}
                          </span>
                          {activity.symbol && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-foreground font-mono">
                              {activity.symbol}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activity.activity_type === 'FILL' && activity.qty && activity.price
                            ? `${activity.side?.toUpperCase()} ${activity.qty} @ $${parseFloat(activity.price).toFixed(2)}`
                            : date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.net_amount && (
                        <p className={cn(
                          "font-mono font-semibold",
                          parseFloat(activity.net_amount) >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {parseFloat(activity.net_amount) >= 0 ? '+' : ''}
                          ${Math.abs(parseFloat(activity.net_amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      {activity.activity_type === 'FILL' && activity.qty && activity.price && (
                        <p className="font-mono font-semibold text-foreground">
                          ${(parseFloat(activity.qty) * parseFloat(activity.price)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {activity.activity_type === 'FILL' ? date : activity.status || ''}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};