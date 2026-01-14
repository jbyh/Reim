import { Activity } from '@/types/trading';
import { AccountHistory } from '@/components/trading/AccountHistory';

interface HistoryViewProps {
  activities: Activity[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const HistoryView = ({ activities, isLoading, onRefresh }: HistoryViewProps) => {
  return (
    <div className="h-full">
      <AccountHistory 
        activities={activities} 
        isLoading={isLoading} 
        onRefresh={onRefresh} 
      />
    </div>
  );
};
