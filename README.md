# TrAide — AI-Powered Trading Platform

> **From vision to reality**: TrAide is a production-grade, AI-assisted trading platform built on Alpaca's brokerage API with a conversational AI companion ("Trai") that helps traders analyze markets, manage portfolios, and execute trades with confidence.

---

## 🎯 What Is TrAide?

TrAide is a **self-directed trading platform** that combines real-time market data, portfolio management, options analysis, and an AI trading assistant into a single, cohesive experience. It's designed for retail traders who want institutional-grade tools without the complexity.

**Core thesis**: The best trading tools don't just show data — they help you *understand* it. Trai (the AI) doesn't auto-trade; it educates, suggests, and requires explicit confirmation at every step.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite | SPA with instant HMR |
| **Styling** | Tailwind CSS + shadcn/ui | Design system with semantic tokens |
| **State** | React hooks + TanStack Query | Server state + local UI state |
| **Charts** | Recharts | Portfolio performance visualization |
| **Backend** | Lovable Cloud (Supabase) | Auth, database, edge functions |
| **Brokerage** | Alpaca Markets API | Paper/live trading, market data |
| **AI** | Lovable AI (Gemini/GPT) | Trai conversational assistant |

### Key Architectural Decisions

1. **No mock data in production**: Every number on screen comes from Alpaca's API via secure edge functions. Portfolio values, positions, watchlist prices, account history — all real.

2. **Edge functions as API proxy**: Alpaca API keys are encrypted and stored per-user. Edge functions decrypt them server-side, make brokerage API calls, and return sanitized data. Keys never touch the client.

3. **Explicit order lifecycle**: We deliberately rejected "one-click trading" patterns. The flow is:
   - Idea/Insight → Draft Order → User Confirms → Submit to Broker → Status Update
   - Quick actions show a preview ("Here's what I'll ask Trai: ...") and require explicit "Send"
   - No auto-pending, no auto-submission

4. **Mobile-first responsive design**: The layout uses CSS Grid with responsive breakpoints, not fixed pixel widths. Components use `min-w-0`, `truncate`, and `shrink-0` to prevent overflow at any viewport.

---

## 🖥️ Application Views

### Dashboard
The dashboard is a **bento-box grid** that adapts from 1 → 2 → 3 columns across breakpoints. Every tile has `h-full` and `flex flex-col` so they snap together with equal visual weight:

- **Portfolio Value Chart** (spans 2 cols) — Real equity curve from Alpaca portfolio history with dynamic Y-axis scaling. Period selector: 1D/1W/1M/3M/1Y.
- **Trai Insights** — AI-generated portfolio summary with quick-action buttons that preview before sending.
- **Positions** (spans 2 cols) — Top 5 positions with P&L indicators, links to full portfolio view.
- **Market Countdown** — Live countdown to market open/close with fixed-width digit containers to prevent text bleeding.
- **Top Movers** — Watchlist sorted by absolute % change.
- **Pending Orders** — Active orders with cancel actions.

### Watchlist
Real-time quotes for user-selected symbols. Each stock shows price, change %, and links to detailed asset pages and options chains.

### Portfolio
Full position breakdown with performance attribution. Click any position for a detail view showing entry price, current value, unrealized P&L, and related trade history.

### Options
Interactive options analysis with the ability to draw price predictions. Supports calls/puts visualization with strike price recommendations from Trai.

### History
Production-grade activity log pulled from Alpaca's account activities API. Every entry includes:
- UTC timestamp (resolves `transaction_time` → `created_at` → `date`)
- Activity type with descriptive labels (Trade, Dividend, Fee, Options Expiry, etc.)
- Symbol, quantity, fill price, fee, and P&L
- "Missing data" placeholders instead of "Unknown" — never shows broken state

### Trai AI (Chat)
Context-aware AI assistant that changes its quick actions based on which tab you're on. Three rendering modes:
- **Full page** — Dedicated chat tab
- **Sidebar** — Persistent right panel on desktop (320-360px), collapsible to 48px icon strip
- **Mobile overlay** — Bottom sheet with collapsed → half → full expansion states

### The Floor
Full-screen market screener with heatmap, sentiment gauges, indices strip, and live news feed.

---

## 🎨 Design System

### Philosophy
"Professional financial density" — inspired by Bloomberg Terminal aesthetics but with modern UI polish. Dark theme only (for now), optimized for extended screen time.

### Token Architecture
All colors are defined as HSL CSS variables in `index.css` and mapped through `tailwind.config.ts`. Components **never** use raw color values — everything goes through semantic tokens:

```css
--primary: 262 80% 65%;     /* Purple accent */
--success: 142 70% 50%;     /* Green — gains */
--destructive: 0 85% 60%;   /* Red — losses */
--warning: 38 95% 55%;      /* Amber — pending states */
```

### Typography
- **Display/UI**: Inter (variable weight)
- **Numbers/Data**: JetBrains Mono — monospaced for financial data alignment

### Component Patterns
- `glass-card`: Semi-transparent card with backdrop blur and subtle border
- `gradient-purple`: Primary brand gradient for CTAs and identity elements
- `balance-card`: Radial gradient overlay for premium account summary
- Fixed-width containers for numeric displays (prevents layout shift on value changes)

---

## 🔒 Security Model

1. **Encrypted API keys**: Alpaca credentials are encrypted client-side before storage and decrypted only in edge functions.
2. **Row-Level Security**: All database tables have RLS policies scoped to `auth.uid()`.
3. **No client-side secrets**: Edge functions handle all external API calls.
4. **Explicit auth flow**: Email/password signup with email verification (no auto-confirm).

---

## 📱 Responsive Design

| Breakpoint | Layout |
|-----------|--------|
| < 768px | Single column, sidebar hidden (hamburger menu), Trai as bottom sheet |
| 768-1023px | 2-column grid, sidebar collapsed to icons |
| ≥ 1024px | 3-column grid, sidebar expanded, Trai as right panel |

Key overflow-prevention techniques:
- `min-w-0` on all flex children to allow text truncation
- `shrink-0` on fixed-width elements (icons, badges, avatars)
- `truncate` with `Tooltip` for long identifiers
- Fixed-width containers for countdown digits and numeric displays
- `overflow-hidden` on all card containers

---

## 🛠️ Build Process & Design Rationale

### The Journey

This project was built iteratively through a collaborative process between a product visionary and an AI engineering partner. Here's the decision log:

#### Phase 1: Foundation
- Set up Alpaca integration with encrypted key storage
- Built edge functions for market data, trading, and portfolio history
- Established the profile + auth system with Lovable Cloud

#### Phase 2: Core Views
- Dashboard, Watchlist, Portfolio, History, Options — all wired to real data
- Trai AI assistant integrated with context-aware quick actions
- Order lifecycle enforced: no auto-submit, explicit confirmation required

#### Phase 3: Design Overhaul
The initial UI had functional correctness but lacked visual cohesion:
- **Problem**: Cards didn't fill the screen, text bled out of containers, inconsistent spacing
- **Root cause**: Fixed pixel widths and missing overflow constraints
- **Solution**: Rebuilt with CSS Grid bento layout, `h-full` + `flex flex-col` on every tile, semantic spacing tokens

Key design decisions made during iteration:
1. **Sidebar width reduced** (200px → 180px expanded, 56px → 52px collapsed) — the old sidebar was disproportionately wide for its content
2. **Market countdown digits** use fixed `w-10` containers with `text-base` — prevents text bleeding at any countdown value
3. **Profile avatar** (circular, secondary bg) vs **Trai icon** (square, purple gradient) — visual differentiation between user identity and AI assistant
4. **Collapse button placement** — always at the very bottom of sidebar, below account value (logical hierarchy: navigation → account → controls)
5. **Quick actions require preview** — user sees "Here's what I'll ask Trai: ..." with Send/Cancel before anything happens

#### Phase 4: Production Hardening
- History page: resolved "Unknown date" by implementing date field fallback chain
- Chart Y-axis: dynamic domain with 15% padding so "flat" data still shows visible shape
- All empty states standardized with icon + message pattern
- Accessibility: ARIA labels, focus-visible states, keyboard navigation, semantic HTML

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Alpaca Markets paper trading account

### Development
```bash
npm install
npm run dev
```

### Configuration
1. Sign up and log in to the app
2. Navigate to Profile → API Keys
3. Enter your Alpaca paper trading API key and secret
4. The app will immediately start showing real portfolio data

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # AppShell, Sidebar, TopBar, TraiAssistant
│   ├── trading/
│   │   ├── dashboard/   # Dashboard tile components
│   │   ├── floor/       # The Floor market screener
│   │   ├── options/     # Options chain & analysis
│   │   ├── views/       # Page-level view compositions
│   │   └── widgets/     # Reusable trading widgets
│   └── ui/              # shadcn/ui components
├── hooks/               # useAuth, useTradingState, etc.
├── integrations/        # Supabase client (auto-generated)
├── lib/                 # Utilities, Alpaca helpers
├── pages/               # Route-level pages
├── types/               # TypeScript interfaces
└── index.css            # Design system tokens

supabase/
├── functions/           # Edge functions (market-data, trading-coach, etc.)
└── config.toml          # Supabase configuration
```

---

## 📊 Key Metrics

- **6 main views** + The Floor immersive experience
- **3 Trai rendering modes** (full page, sidebar, mobile overlay)
- **Real-time data** from Alpaca Markets API
- **Zero mock data** in production
- **Full RLS** on all database tables
- **Responsive** from 320px to ultrawide

---

## 🤝 Credits

Built with [Lovable](https://lovable.dev) — an AI-powered development platform that enables rapid iteration from concept to production-grade applications.

---

*TrAide is a paper trading platform for educational purposes. It is not a registered broker-dealer and does not provide investment advice. Always do your own research before making investment decisions.*
