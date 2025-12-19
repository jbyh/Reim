import { TradingDashboard } from '@/components/trading/TradingDashboard';
import { Helmet } from 'react-helmet';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>TradePilot AI - Intelligent Trading Assistant</title>
        <meta name="description" content="Professional AI-powered trading coach with real-time market data, portfolio management, and intelligent trade execution." />
      </Helmet>
      <TradingDashboard />
    </>
  );
};

export default Index;
