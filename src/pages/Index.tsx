import { TradingDashboard } from '@/components/trading/TradingDashboard';
import { Helmet } from 'react-helmet';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>TrAide - AI-Powered Trading Platform</title>
        <meta name="description" content="Trade smarter with Trai AI. Real-time market data, intuitive options trading, and intelligent portfolio management." />
      </Helmet>
      <TradingDashboard />
    </>
  );
};

export default Index;
