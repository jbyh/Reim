import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Shield, Zap, BarChart3, LineChart, ArrowRight, CheckCircle2 } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">TrAide</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/auth')} className="glow-primary">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px]" style={{ background: 'hsl(262 80% 65%)' }} />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-[100px]" style={{ background: 'hsl(280 90% 70%)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-sm text-primary mb-8">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Trading Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Trade Smarter
            <br />
            <span className="text-gradient-purple">with AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Meet <strong className="text-foreground">Trai</strong> — your AI trading companion. 
            Real-time market data, intuitive options trading, and intelligent portfolio management, 
            all in one elite platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="glow-primary text-base h-13 px-8">
              Start Trading Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }} className="text-base h-13 px-8">
              See Features
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Trade</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Professional-grade tools wrapped in an intuitive interface, powered by artificial intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Sparkles,
                title: 'Trai AI Assistant',
                desc: 'Chat with your AI trading coach. Get market analysis, trade ideas, and portfolio insights in real-time.',
                color: 'primary',
              },
              {
                icon: LineChart,
                title: 'Real-Time Data',
                desc: 'Live prices, quotes, and charts powered by Alpaca. Never miss a market move.',
                color: 'success',
              },
              {
                icon: BarChart3,
                title: 'Options Trading',
                desc: 'Visual options chain, greeks analysis, and profit/loss charting made intuitive.',
                color: 'warning',
              },
              {
                icon: TrendingUp,
                title: 'The Floor',
                desc: 'Immersive market floor experience with heat maps, sentiment gauges, and live indices.',
                color: 'purple',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-${f.color}/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`h-6 w-6 text-${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 px-4 relative">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get Started in 3 Steps</h2>
            <p className="text-muted-foreground text-lg">From sign-up to your first trade in under 5 minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Account',
                desc: 'Sign up with your email. Free and instant.',
              },
              {
                step: '02',
                title: 'Connect Alpaca',
                desc: 'Link your Alpaca brokerage account with API keys. Paper trading supported.',
              },
              {
                step: '03',
                title: 'Start Trading',
                desc: 'Access your dashboard, chat with Trai, and execute trades instantly.',
              },
            ].map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px border-t border-dashed border-border/60" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-purple text-primary-foreground text-xl font-bold mb-5">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial-purple pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Trade Smarter?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join TrAide and let AI elevate your trading strategy.
            </p>
            <Button size="lg" onClick={() => navigate('/auth')} className="glow-primary text-base h-13 px-10">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
              {['Paper trading included', 'No credit card required', 'AES-encrypted credentials'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">TrAide</span>
          </div>
          <p>© {new Date().getFullYear()} TrAide. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
