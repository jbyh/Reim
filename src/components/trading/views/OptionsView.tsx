import { useState, useEffect } from 'react';
import { OptionsViewNew } from '@/components/trading/options/OptionsViewNew';

interface OptionsViewProps {
  initialSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

export const OptionsView = ({ initialSymbol = 'SPY', onSymbolChange }: OptionsViewProps) => {
  return (
    <div className="h-full">
      <OptionsViewNew />
    </div>
  );
};
