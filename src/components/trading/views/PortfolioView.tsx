import { Portfolio, Position, Activity } from '@/types/trading';
import { PortfolioPanel } from '@/components/trading/PortfolioPanel';
import { PositionDetail } from '@/components/trading/PositionDetail';

interface PortfolioViewProps {
  portfolio: Portfolio;
  positions: Position[];
  selectedPosition: Position | null;
  activities: Activity[];
  onPositionClick: (position: Position) => void;
  onBack: () => void;
}

export const PortfolioView = ({
  portfolio,
  positions,
  selectedPosition,
  activities,
  onPositionClick,
  onBack,
}: PortfolioViewProps) => {
  if (selectedPosition) {
    return (
      <PositionDetail 
        position={selectedPosition} 
        activities={activities}
        onBack={onBack} 
      />
    );
  }

  return (
    <PortfolioPanel 
      portfolio={portfolio} 
      positions={positions} 
      onPositionClick={onPositionClick}
    />
  );
};
