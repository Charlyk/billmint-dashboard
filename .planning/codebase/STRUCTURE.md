# Codebase Structure

**Analysis Date:** 2026-02-11

## Directory Layout

```
billmint/
├── src/
│   ├── app/                    # Next.js App Router - pages, layouts, API routes
│   │   ├── api/                # API route handlers organized by feature
│   │   │   ├── auth/           # Authentication endpoints (login, signup, logout, etc.)
│   │   │   ├── invoices/       # Invoice CRUD and actions
│   │   │   ├── clients/        # Client management
│   │   │   ├── projects/       # Project management
│   │   │   ├── time-entries/   # Time entry CRUD
│   │   │   ├── timer/          # Timer operations
│   │   │   ├── billing/        # Billing and subscription endpoints
│   │   │   └── reports/        # Report generation
│   │   ├── dashboard/          # Protected dashboard routes
│   │   │   ├── invoices/       # Invoice pages (list, create, edit, view)
│   │   │   ├── time-entries/   # Time entry management
│   │   │   ├── projects/       # Project management UI
│   │   │   ├── clients/        # Client management UI
│   │   │   ├── reports/        # Reports UI
│   │   │   ├── settings/       # User settings
│   │   │   └── layout.tsx      # Dashboard layout with sidebar
│   │   ├── login/              # Login page
│   │   ├── signup/             # Signup page
│   │   ├── reset-password/     # Password reset page
│   │   ├── verify-email/       # Email verification page
│   │   ├── invoice/            # Public invoice sharing page
│   │   ├── help-center/        # Static help page
│   │   ├── privacy/            # Privacy policy
│   │   ├── terms/              # Terms of service
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── globals.css         # Global styles
│   │   └── error.tsx           # Global error boundary
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components (Button, Card, Dialog, etc.)
│   │   ├── timer/              # Timer-related components
│   │   ├── landing-page.tsx    # Landing page component
│   │   ├── landing-header.tsx  # Landing header with nav
│   │   ├── dashboard-shell.tsx # Dashboard sidebar and layout
│   │   ├── onboarding-checklist.tsx
│   │   └── email-verification-banner.tsx
│   │
│   ├── lib/                    # Core utilities and business logic
│   │   ├── api/                # API client layer
│   │   │   ├── client.ts       # Generic fetch wrapper
│   │   │   ├── auth.ts         # Auth API client
│   │   │   ├── invoices.ts     # Invoice API client
│   │   │   ├── clients.ts      # Client API client
│   │   │   ├── projects.ts     # Project API client
│   │   │   ├── time-entries.ts # Time entry API client
│   │   │   ├── timer.ts        # Timer API client
│   │   │   ├── billing.ts      # Billing API client
│   │   │   ├── reports.ts      # Reports API client
│   │   │   └── index.ts        # Re-exports all API modules
│   │   │
│   │   ├── services/           # Business logic layer
│   │   │   ├── auth.service.ts      # Authentication logic
│   │   │   ├── invoice.service.ts   # Invoice operations
│   │   │   ├── client.service.ts    # Client management
│   │   │   ├── project.service.ts   # Project management
│   │   │   ├── time-entry.service.ts # Time entry logic
│   │   │   ├── timer.service.ts     # Timer state logic
│   │   │   ├── user.service.ts      # User profile and settings
│   │   │   ├── billing.service.ts   # Subscription and billing
│   │   │   ├── email.service.ts     # Email sending via Resend
│   │   │   ├── report.service.ts    # Report generation
│   │   │   ├── pdf.service.ts       # PDF generation
│   │   │   ├── logo.service.ts      # Logo upload/storage
│   │   │   ├── dashboard.service.ts # Dashboard stats
│   │   │   └── cron.service.ts      # Scheduled tasks
│   │   │
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── use-auth.ts     # Authentication hook
│   │   │   ├── use-invoices.ts # Invoice fetching/mutations
│   │   │   ├── use-timer.ts    # Timer state and shortcuts
│   │   │   ├── use-clients.ts  # Client data fetching
│   │   │   ├── use-projects.ts # Project data fetching
│   │   │   ├── use-time-entries.ts # Time entry fetching
│   │   │   ├── use-reports.ts  # Report data fetching
│   │   │   ├── use-paid-feature.ts # Paid feature access
│   │   │   ├── use-online-status.ts # Network status
│   │   │   ├── use-dashboard.ts # Dashboard stats
│   │   │   ├── use-timer-shortcuts.ts # Keyboard shortcuts
│   │   │   └── index.ts        # Re-exports
│   │   │
│   │   ├── supabase/           # Supabase client initialization
│   │   │   ├── client.ts       # Browser client (createClient)
│   │   │   ├── server.ts       # Server client (createClient, createAdminClient)
│   │   │   └── middleware.ts   # Middleware session update
│   │   │
│   │   ├── utils/              # Utility functions
│   │   │   ├── validation.ts   # Zod schemas for all API inputs
│   │   │   ├── errors.ts       # Error classes (AppError, ValidationError, etc.)
│   │   │   ├── date.ts         # Date formatting and calculations
│   │   │   ├── currency.ts     # Currency formatting and conversion
│   │   │   ├── pdf-formatters.ts # PDF-specific formatting
│   │   │   └── index.ts        # Common utilities (cn, etc.)
│   │   │
│   │   └── pdf/                # PDF generation utilities
│   │       └── invoice-template.tsx # React PDF invoice template
│   │
│   ├── contexts/               # React Context providers for global state
│   │   ├── auth-context.tsx    # User authentication state
│   │   ├── timer-context.tsx   # Timer running/paused state
│   │   ├── user-settings-context.tsx # User preferences
│   │   ├── providers.tsx       # Root provider wrapper (SWR config, Auth, Toast)
│   │   └── index.ts            # Re-exports
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── database.ts         # Database schema types from Supabase
│   │   ├── api.ts              # API request/response types
│   │   └── index.ts            # Re-exports main types
│   │
│   └── middleware.ts           # Next.js middleware for authentication
│
├── public/                     # Static assets (images, logos, etc.)
├── supabase/                   # Supabase configuration and migrations
│   └── migrations/             # Database migration files
├── .planning/                  # GSD planning documents
│   └── codebase/               # This directory
├── package.json                # Node.js dependencies and scripts
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.mjs          # PostCSS configuration for Tailwind
├── eslint.config.mjs           # ESLint configuration
└── components.json             # shadcn/ui components registry

supabase/
├── migrations/                 # Database schema migrations in SQL
└── .temp/                      # Temporary files (git ignored)
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router routing and page components
- Contains: Page.tsx files, layouts, API routes, error boundaries
- Key files: `layout.tsx` (root), `error.tsx` (error boundary), `middleware.ts`

**`src/app/api/`:**
- Purpose: Backend API endpoints for frontend consumption and webhooks
- Contains: RESTful route handlers organized by feature domain
- Pattern: `[feature]/route.ts` for main resource, `[feature]/[id]/[action]/route.ts` for operations

**`src/app/dashboard/`:**
- Purpose: Protected user interface after authentication
- Contains: Page components for features (invoices, time entries, projects, etc.)
- Access: Requires authentication enforced by middleware

**`src/components/`:**
- Purpose: Reusable React components
- Contains: UI components (button, card, dialog), feature components (timer controls, dashboard shell)
- Pattern: One component per file, organized by feature or type

**`src/lib/api/`:**
- Purpose: Client-side API communication layer
- Contains: Fetch wrappers for each feature domain
- Pattern: Each file exports functions that call specific API endpoints with proper typing

**`src/lib/services/`:**
- Purpose: Business logic isolated from HTTP concerns
- Contains: Database operations, external integrations, business rules
- Pattern: Exported async functions that handle a domain (auth, invoices, etc.)
- Reusability: Can be called from API routes or services

**`src/lib/hooks/`:**
- Purpose: Reusable React hooks for data fetching and state management
- Contains: Custom hooks wrapping SWR calls with API client
- Pattern: `use[Resource]()` returns object with data, loading, error, mutate
- Convention: Hooks starting with "use" follow React hook rules

**`src/lib/supabase/`:**
- Purpose: Supabase client configuration and session management
- Contains: Client initialization, middleware for session sync
- Client types: `client.ts` (browser), `server.ts` (server/API routes)

**`src/lib/utils/`:**
- Purpose: Shared utilities and helpers
- Contains: Validation (Zod), error classes, formatting functions
- Scope: No state, no external dependencies except established libraries

**`src/contexts/`:**
- Purpose: Global application state management via React Context
- Contains: Context definitions and provider components
- Access: Via custom hooks (useAuth, useTimer, useUserSettings)

**`src/types/`:**
- Purpose: Centralized type definitions
- Contains: Database schema types (from Supabase), API types
- Scope: Pure TypeScript, no implementations

**`supabase/migrations/`:**
- Purpose: Database schema versioning and changes
- Contains: SQL migration files named with timestamp
- Format: Each migration is a single SQL file with forward and reverse operations

## Key File Locations

**Entry Points:**
- Root layout: `src/app/layout.tsx` - Sets up Providers, global styles
- Middleware: `src/middleware.ts` - Validates session on protected routes
- Dashboard entry: `src/app/dashboard/layout.tsx` - Fetches user/timer data server-side
- Landing page: `src/app/page.tsx` - Public home page

**Configuration:**
- TypeScript: `tsconfig.json`
- Next.js: `next.config.ts`
- Tailwind: `tailwind.config.ts`
- ESLint: `eslint.config.mjs`
- Dependencies: `package.json`

**Core Logic:**
- Authentication: `src/lib/services/auth.service.ts`
- Invoicing: `src/lib/services/invoice.service.ts`
- Timers: `src/lib/services/timer.service.ts` + `src/contexts/timer-context.tsx`
- Email: `src/lib/services/email.service.ts`
- Billing: `src/lib/services/billing.service.ts`
- Validation schemas: `src/lib/utils/validation.ts`
- Error handling: `src/lib/utils/errors.ts`

**Testing:**
- Tests not yet implemented in codebase
- No test directory currently exists

## Naming Conventions

**Files:**
- Page components: `page.tsx` (required by Next.js App Router)
- Layout wrappers: `layout.tsx` (required by Next.js App Router)
- API routes: `route.ts` (required by Next.js App Router)
- Services: `[domain].service.ts` (e.g., `invoice.service.ts`, `auth.service.ts`)
- Hooks: `use-[resource].ts` (camelCase with dash prefix, e.g., `use-invoices.ts`)
- Contexts: `[name]-context.tsx` (e.g., `auth-context.tsx`)
- API clients: `[resource].ts` (e.g., `invoices.ts`, `clients.ts`)
- Components: PascalCase filename matching export (e.g., `LandingPage.tsx`)
- Utilities: kebab-case for files with multiple exports (e.g., `pdf-formatters.ts`)

**Directories:**
- Feature-based: Domain-organized (api, services, hooks) with clear boundaries
- camelCase for feature names: `time-entries`, `user-settings`
- Plural for collections: `components`, `contexts`, `hooks`, `services`

**Naming Pattern Examples:**
- `src/lib/services/invoice.service.ts` - Domain + "service" suffix
- `src/lib/api/invoices.ts` - Plural resource name
- `src/lib/hooks/use-invoices.ts` - "use" prefix + resource name
- `src/app/api/invoices/[id]/send/route.ts` - Verb for action routes

## Where to Add New Code

**New Feature (e.g., Reports):**
- Primary code: `src/lib/services/report.service.ts` (business logic)
- API endpoint: `src/app/api/reports/route.ts`
- Client layer: `src/lib/api/reports.ts`
- Hook: `src/lib/hooks/use-reports.ts`
- Page: `src/app/dashboard/reports/page.tsx`
- UI components: `src/components/report-*.tsx` (feature components)
- Tests: Create matching `*.test.ts` or `*.spec.ts` (not yet in place)

**New Component/Module:**
- Implementation: `src/components/[feature-name].tsx` or `src/components/[category]/[name].tsx`
- If used in multiple pages, place in `src/components/`
- If specific to feature, place in `src/components/[feature]/`

**Utilities:**
- Shared helpers: `src/lib/utils/[domain].ts`
- Validation schemas: Add to `src/lib/utils/validation.ts`
- Error classes: Add to `src/lib/utils/errors.ts`
- Formatting: Create new file if distinct domain, or add to existing `src/lib/utils/[domain].ts`

**New API Endpoint:**
1. Create route file: `src/app/api/[feature]/[id]/[action]/route.ts`
2. Implement business logic in service if not exists: `src/lib/services/[feature].service.ts`
3. Create/update API client: `src/lib/api/[feature].ts`
4. Create/update hook if data-fetching: `src/lib/hooks/use-[feature].ts`
5. Add validation schema: `src/lib/utils/validation.ts`
6. Call from components via hook or direct API client

**Page Component:**
1. Create page file: `src/app/dashboard/[feature]/page.tsx`
2. Import and use custom hooks: `useInvoices()`, `useClients()`, etc.
3. Import components from `src/components/`
4. Handle loading and error states from hooks
5. Call mutate functions from API client or hooks for mutations

## Special Directories

**`src/components/ui/`:**
- Purpose: Base UI components library (shadcn/ui based)
- Generated: Partially (can be re-generated from registry)
- Committed: Yes, components are committed
- Content: Buttons, Cards, Dialogs, Menus, Forms, Tables, etc.
- Usage: Import and compose in feature components

**`supabase/migrations/`:**
- Purpose: Version-controlled database schema changes
- Generated: Manually created by developer
- Committed: Yes, part of source control
- Format: SQL files with timestamps (20240101120000_description.sql)
- Usage: Applied to database via Supabase CLI

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes, at build time
- Committed: No (gitignored)
- Content: Compiled pages, static assets, server functions

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes, via npm install
- Committed: No (gitignored)
- Management: Use package.json and package-lock.json for versioning

**`.planning/codebase/`:**
- Purpose: GSD planning documents for future development
- Generated: By GSD mapper agent
- Committed: Yes (informational, not executed code)
- Content: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

---

*Structure analysis: 2026-02-11*
