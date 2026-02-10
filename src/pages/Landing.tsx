import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Shield, Zap, BarChart3, LineChart, ArrowRight, CheckCircle2, Brain, Activity, Target, Users } from 'lucide-react';
import heroImage from '@/assets/landing-hero.jpg';
import featureAi from '@/assets/feature-ai.jpg';
import featureData from '@/assets/feature-data.jpg';
import featureOptions from '@/assets/feature-options.jpg';
import featureFloor from '@/assets/feature-floor.jpg';

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
            <Button variant="ghost" onClick={() => navigate('/auth')} className="h-10 px-5">
              Sign In
            </Button>
            <Button onClick={() => navigate('/auth')} className="glow-primary h-10 px-6">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px]" style={{ background: 'hsl(262 80% 65%)' }} />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-[100px]" style={{ background: 'hsl(280 90% 70%)' }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-sm text-primary mb-6">
                <Zap className="h-3.5 w-3.5" />
                AI-Powered Trading Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
                Your Edge
                <br />
                <span className="text-gradient-purple">Starts Here.</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                <strong className="text-foreground">Trai</strong> isn't just another tool — it's your AI trading companion 
                that thinks with you, learns with you, and executes with precision. 
                Real-time data. Intuitive options. Zero noise.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="glow-primary text-base h-14 px-10 rounded-xl font-semibold"
                >
                  Start Trading Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-base h-14 px-10 rounded-xl font-semibold"
                >
                  See Features
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
                {['Paper trading included', 'No credit card', 'Encrypted credentials'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="relative group">
              <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl" style={{ background: 'hsl(262 80% 65%)' }} />
              <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl">
                <img
                  src={heroImage}
                  alt="TrAide trading dashboard with AI-powered analytics"
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Strip */}
      <section className="py-10 sm:py-14 px-4 border-y border-border/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: Brain, value: 'AI-First', label: 'Built around intelligence' },
            { icon: Activity, value: 'Real-Time', label: 'Live market data' },
            { icon: Shield, value: 'Secure', label: 'AES-256 encrypted' },
            { icon: Target, value: 'Precise', label: 'Options analytics' },
          ].map((stat) => (
            <div key={stat.value} className="flex flex-col items-center gap-2">
              <stat.icon className="h-6 w-6 text-primary mb-1" />
              <span className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features with Images */}
      <section id="features" className="py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for Traders Who Want More</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Professional-grade tools wrapped in an intuitive interface. 
              Every feature designed to give you an unfair advantage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'Trai AI Assistant',
                desc: 'Not a chatbot — a trading companion. Trai understands market context, analyzes your portfolio in real-time, and turns conversations into executable trades. Ask anything, get answers that matter.',
                image: featureAi,
                accent: 'primary',
              },
              {
                icon: LineChart,
                title: 'Real-Time Market Data',
                desc: 'Live prices, streaming quotes, and dynamic charts powered by Alpaca. Paper or live trading — you decide. Never miss a move, never trade blind.',
                image: featureData,
                accent: 'success',
              },
              {
                icon: BarChart3,
                title: 'Intuitive Options Trading',
                desc: 'Visual options chains, Greeks analysis, and P/L curves that actually make sense. Options trading reimagined for clarity, not complexity.',
                image: featureOptions,
                accent: 'primary',
              },
              {
                icon: TrendingUp,
                title: 'The Floor',
                desc: 'An immersive market floor experience. Sector heat maps, sentiment gauges, live indices, and AI-generated market briefs — all in one commanding view.',
                image: featureFloor,
                accent: 'warning',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img
                    src={f.image}
                    alt={f.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  <div className="absolute bottom-4 left-5">
                    <div className={`w-10 h-10 rounded-lg bg-${f.accent}/20 backdrop-blur-sm border border-${f.accent}/30 flex items-center justify-center`}>
                      <f.icon className={`h-5 w-5 text-${f.accent}`} />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why TrAide - Differentiator */}
      <section className="py-20 sm:py-28 px-4 relative">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why TrAide Is Different</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Most platforms give you data. We give you an edge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'AI That Understands You',
                desc: 'Trai learns your style, your risk tolerance, your portfolio. Every conversation makes it smarter.',
              },
              {
                icon: Zap,
                title: 'Instant Execution',
                desc: 'From idea to trade in seconds. Talk to Trai, confirm with one click, done. No forms, no friction.',
              },
              {
                icon: Shield,
                title: 'Bank-Grade Security',
                desc: 'AES-256 encrypted API keys. Your credentials never touch our servers in plain text. Period.',
              },
              {
                icon: Target,
                title: 'Options Made Visual',
                desc: 'See profit curves, Greeks impact, and risk/reward before you trade. Clarity over complexity.',
              },
              {
                icon: Activity,
                title: 'Live Market Pulse',
                desc: 'Real-time data, sector heat maps, sentiment analysis — all streaming live to your screen.',
              },
              {
                icon: Users,
                title: 'Paper → Live Seamless',
                desc: 'Practice with paper trading, switch to live when ready. Same platform, same AI, real results.',
              },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-2xl border border-border/30 bg-card/50 hover:border-primary/20 transition-colors">
                <item.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Up and Running in 3 Minutes</h2>
            <p className="text-muted-foreground text-lg">No downloads. No complex setup. Just sign up and trade.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up with your email. Free, instant, no credit card.' },
              { step: '02', title: 'Connect Alpaca', desc: 'Paste your API keys. We encrypt them instantly. Paper or live.' },
              { step: '03', title: 'Trade with Trai', desc: 'Chat with your AI, execute trades, manage your portfolio.' },
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Trade Different?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Stop scrolling through noise. Start trading with conviction. 
              TrAide is where AI meets action.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="glow-primary text-base h-14 px-12 rounded-xl font-semibold"
            >
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
