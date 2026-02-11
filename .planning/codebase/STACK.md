# Technology Stack

**Analysis Date:** 2026-02-11

## Languages

**Primary:**
- TypeScript 5.x - Full codebase (frontend, backend, types)
- JavaScript (JSX/TSX) - React components and server components

**Secondary:**
- SQL - Supabase database queries and RLS policies

## Runtime

**Environment:**
- Node.js (LTS) - Implied by Next.js 16.1.4

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.4 - Full-stack React framework with app router
  - React 19.2.3 - UI library
  - React DOM 19.2.3 - DOM rendering

**UI & Components:**
- Base UI (@base-ui/react) 1.1.0 - Unstyled, accessible components
- shadcn/ui - Imported via components.json config
- Tailwind CSS 4 - Utility-first styling
- @tailwindcss/postcss 4 - PostCSS plugin for Tailwind
- lucide-react 0.562.0 - Icon library (referenced in components.json)
- class-variance-authority 0.7.1 - Component class composition
- clsx 2.1.1 - Conditional class concatenation
- tailwind-merge 3.4.0 - Merge Tailwind classes intelligently
- tw-animate-css 1.4.0 - Animation utilities

**Data & State:**
- SWR 2.3.8 - Data fetching and caching for client-side operations
- Zod 4.3.5 - TypeScript-first schema validation

**PDF Generation:**
- @react-pdf/renderer 4.3.2 - Server-side PDF generation from React

**Email:**
- Resend 6.8.0 - Email service for sending templated emails

**Billing:**
- Stripe 20.2.0 - Payment processing and subscription management

**Database & Auth:**
- @supabase/supabase-js 2.91.0 - Supabase JS client for server and browser
- @supabase/ssr 0.8.0 - Server-side session management for Supabase

**Build & Dev Tools:**
- ESLint 9 - Code linting (eslint-config-next 16.1.4)
- babel-plugin-react-compiler 1.0.0 - React compiler optimization
- @types/node 20 - Node.js type definitions
- @types/react 19 - React type definitions
- @types/react-dom 19 - React DOM type definitions

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.91.0 - Primary database and authentication
- stripe 20.2.0 - Billing and subscription management
- resend 6.8.0 - Email notifications and alerts
- next 16.1.4 - Core framework with React Server Components and API routes
- @react-pdf/renderer 4.3.2 - Invoice PDF generation

**Infrastructure:**
- @supabase/ssr 0.8.0 - Handles cookie-based auth sessions server-side
- zod 4.3.5 - Runtime data validation across API boundaries

## Configuration

**Environment:**
- Configuration via `.env.local` (not committed)
- Required variables documented in `.env.example`:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase client key (public)
  - `SUPABASE_SECRET_KEY` - Supabase service role key (server-only)
  - `STRIPE_SECRET_KEY` - Stripe API secret key (server-only)
  - `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature verification (server-only)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe client key (public)
  - `STRIPE_PRO_PRICE_ID` - Stripe price ID for Pro tier
  - `STRIPE_PRO_YEARLY_PRICE_ID` - Stripe price ID for Pro yearly billing
  - `STRIPE_BUSINESS_PRICE_ID` - Stripe price ID for Business tier (optional)
  - `RESEND_API_KEY` - Resend API key for email (server-only)
  - `NEXT_PUBLIC_APP_URL` - Application base URL (defaults to `http://localhost:3001`)
  - `EMAIL_FROM` - Default sender email (optional, defaults to noreply@billmint.io)

**Build:**
- `next.config.ts` - Enables React Compiler for optimization
- `tsconfig.json` - Strict mode enabled, ES2017 target
- `postcss.config.mjs` - Tailwind CSS PostCSS plugin
- `components.json` - shadcn/ui configuration with New York style
- `eslint.config.mjs` - ESLint config (Next.js core web vitals + TypeScript)

## Platform Requirements

**Development:**
- Node.js (LTS version)
- npm
- TypeScript 5.x

**Production:**
- Node.js (LTS version) for server runtime
- Next.js static/serverless deployment (Vercel, self-hosted)
- Supabase instance (PostgreSQL backend)
- Stripe account with API keys and webhook endpoints configured
- Resend account with API key configured

**Database:**
- PostgreSQL (via Supabase)
- URL: `NEXT_PUBLIC_SUPABASE_URL`

**Deployment Target:**
- Vercel (optimal for Next.js)
- Self-hosted Node.js (next start)
- Serverless platforms supporting Node.js 18+

---

*Stack analysis: 2026-02-11*
