

# Landing Page, Auth Flow & Onboarding Overhaul

## Problem

1. **No public landing page** -- unauthenticated users land directly on the full trading dashboard (AppShell), which looks broken without data and is confusing for new visitors
2. **Dashboard layout breaks** at certain browser widths due to the 12-column bento grid not having smooth intermediate breakpoints
3. **No onboarding flow** -- after sign-up, users are dumped into the dashboard with no guidance on connecting their Alpaca keys
4. **Auth page (`/auth`) exists** but is disconnected from the main flow -- users must manually find it

## Solution

### 1. New Landing Page (`src/pages/Landing.tsx`)

A single-page, elite marketing homepage that serves as the entry point for unauthenticated users. Key sections:

- **Hero Section**: Bold headline ("Trade Smarter with AI"), animated gradient background, CTA buttons for Sign Up and Sign In
- **Feature Cards**: 3-4 cards highlighting core features (Trai AI Assistant, Real-Time Data, Options Trading, The Floor)
- **How It Works**: 3-step visual flow (Sign Up, Connect Alpaca, Start Trading)
- **Footer**: Minimal branding

Design: Dark premium aesthetic matching the existing theme, with purple gradient accents and glassmorphism cards.

### 2. Updated Routing (`src/App.tsx`)

```text
/          --> Landing page (if not authenticated) OR Dashboard (if authenticated)
/auth      --> Sign In / Sign Up (stays as-is, minor tweaks)
/profile   --> Settings & API key onboarding
/app       --> Main trading app (AppShell) -- protected route
```

- `Index.tsx` will check auth state: if authenticated, render `AppShell`; if not, render `Landing`
- After sign-up/sign-in, redirect to `/profile` if no Alpaca keys are configured, otherwise to `/`

### 3. Auth Flow Update (`src/pages/Auth.tsx`)

- After successful sign-in/sign-up, check if user has Alpaca credentials
- If no credentials: redirect to `/profile` with a query param `?onboarding=true`
- If credentials exist: redirect to `/` (dashboard)

### 4. Profile Onboarding Mode (`src/pages/Profile.tsx`)

- Detect `?onboarding=true` query param
- Show a welcome banner at the top: "Welcome to TrAide! Let's get you set up."
- Add step indicators (1. Create Account [done], 2. Connect Alpaca [current], 3. Start Trading)
- After saving Alpaca keys, show a success state with a "Go to Dashboard" button
- The existing Alpaca setup instructions already explain where to get keys -- keep those

### 5. Dashboard Responsive Fix (`src/components/trading/views/DashboardView.tsx`)

Fix the bento grid to work at all widths:

```text
Current:  grid-cols-1 md:grid-cols-2 xl:grid-cols-12
Problem:  Between md and xl (768-1280px), the 2-col layout with nested col-spans breaks

Fix:
- Simplify to grid-cols-1 md:grid-cols-2 lg:grid-cols-12
- Drop xl breakpoint to lg (1024px)
- Ensure all cards use col-span-1 on md, proper spans on lg
- Make the Positions + Countdown + TopMovers row stack as full-width on md
```

---

## Technical Details

### New File: `src/pages/Landing.tsx`

A self-contained marketing page with:
- No dependency on `useTradingState` or any trading hooks
- Uses `useAuth` to check login state and redirect if already authenticated
- Uses `useNavigate` for CTA buttons
- Sections: Hero, Features, How It Works, CTA, Footer
- All inline styling with Tailwind -- no new CSS files
- Responsive: single column on mobile, multi-column on desktop

### Modified: `src/pages/Index.tsx`

```typescript
// Check auth state
// If authenticated -> render <AppShell />
// If not authenticated -> render <Landing />
// If loading -> show spinner
```

### Modified: `src/pages/Auth.tsx`

- After successful sign-in: check `hasAlpacaCredentials`
  - If false: `navigate('/profile?onboarding=true')`
  - If true: `navigate('/')`
- After successful sign-up: always `navigate('/profile?onboarding=true')`

### Modified: `src/pages/Profile.tsx`

- Read `onboarding` query param from URL
- If onboarding mode:
  - Show welcome banner with step progress (1-2-3)
  - After saving credentials, show "Setup Complete" state with dashboard link
  - Hide the "Back" arrow (no dashboard to go back to yet)
- Existing functionality remains unchanged

### Modified: `src/components/trading/views/DashboardView.tsx`

- Change grid breakpoints: `grid-cols-1 md:grid-cols-2 lg:grid-cols-12`
- Positions card: `md:col-span-2 lg:col-span-5` (full width at md)
- Market Countdown: `md:col-span-1 lg:col-span-3`
- Top Movers: `md:col-span-1 lg:col-span-4`
- Pending Orders: `md:col-span-1 lg:col-span-5`
- Quick Actions: `md:col-span-1 lg:col-span-7`
- Ensure no card overflows at any width

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/pages/Landing.tsx` | **New** | Full marketing landing page |
| `src/pages/Index.tsx` | Modify | Auth gate: Landing vs AppShell |
| `src/pages/Auth.tsx` | Modify | Post-auth redirect logic |
| `src/pages/Profile.tsx` | Modify | Onboarding mode with steps |
| `src/components/trading/views/DashboardView.tsx` | Modify | Fix responsive grid breakpoints |

