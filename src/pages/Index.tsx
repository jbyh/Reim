import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { Helmet } from 'react-helmet';
import { Loader2 } from 'lucide-react';
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('./Landing'));

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <Helmet>
          <title>TrAide - AI-Powered Trading Platform</title>
          <meta name="description" content="Trade smarter with Trai AI. Real-time market data, intuitive options trading, and intelligent portfolio management." />
        </Helmet>
        <Landing />
      </Suspense>
    );
  }

  return (
    <>
      <Helmet>
        <title>TrAide - Dashboard</title>
        <meta name="description" content="Your AI-powered trading dashboard." />
      </Helmet>
      <AppShell />
    </>
  );
};

export default Index;
