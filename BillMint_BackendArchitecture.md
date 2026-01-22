# BillMint.io - Backend Architecture & Sitemap

## Document Info
- **Version:** 1.1
- **Date:** January 21, 2026
- **Status:** Draft
- **Stack:** Next.js (frontend + API routes) + Supabase
- **Related:** BillMint.io PRD v1.0, First Time User Flow v1.0

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Module Dependency Graph](#3-module-dependency-graph)
4. [Service Specifications](#4-service-specifications)
5. [API Route Map](#5-api-route-map)
6. [Database Schema](#6-database-schema)
7. [Frontend-Backend Communication](#7-frontend-backend-communication)
8. [Free vs Paid Gating](#8-free-vs-paid-gating)
9. [Error Handling](#9-error-handling)
10. [Open Questions](#10-open-questions)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APPLICATION                                  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  FRONTEND (React / App Router)                                         │  │
│  │                                                                         │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │  │
│  │  │  Auth   │ │Dashboard│ │Projects │ │  Time   │ │Invoices │          │  │
│  │  │  Pages  │ │  Page   │ │  Page   │ │  Page   │ │  Page   │          │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │  │
│  │                                                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │  │  State: AuthContext | TimerContext | SWR Cache                   │   │  │
│  │  └─────────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      │ fetch('/api/...')                     │
│                                      ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  API ROUTES (app/api/)                                                 │  │
│  │                                                                         │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │  │
│  │  │ /auth  │ │/users  │ │/clients│ │/projects│ │ /time  │ │/invoice│   │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │  │
│  │                                      │                                  │  │
│  │                                      ▼                                  │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │  │  SERVICE LAYER (lib/services/)                                   │   │  │
│  │  │  Business logic, validation, data transformation                 │   │  │
│  │  └─────────────────────────────────────────────────────────────────┘   │  │
│  │                                      │                                  │  │
│  │                                      ▼                                  │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │  │  UTILITIES (lib/)                                                │   │  │
│  │  │  Supabase client | Stripe | Resend email | PDF generator         │   │  │
│  │  └─────────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                  │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Supabase │  │  Stripe  │  │  Google  │  │  Resend  │  │  Zapier  │      │
│  │ DB + Auth│  │ Payments │  │  OAuth   │  │  Email   │  │ Webhooks │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Architecture Decisions:**
- **Single Next.js app** - No separate backend server, faster iteration
- **API Route Handlers** - `app/api/` using Next.js 14+ route handlers
- **Services layer** - Business logic separated from route handlers
- **Supabase** - Database + Auth + Row Level Security
- **SWR** - Client-side data fetching with caching

---

## 2. Project Structure

```
billmint/
│
├── app/
│   │
│   ├── (auth)/                          # Auth route group (no sidebar layout)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (dashboard)/                     # Dashboard route group (with sidebar)
│   │   ├── layout.tsx                   # Sidebar + Navbar + Timer widget
│   │   ├── page.tsx                     # Dashboard home
│   │   │
│   │   ├── projects/
│   │   │   ├── page.tsx                 # Projects list
│   │   │   └── [id]/page.tsx            # Project detail
│   │   │
│   │   ├── clients/
│   │   │   ├── page.tsx                 # Clients list
│   │   │   └── [id]/page.tsx            # Client detail
│   │   │
│   │   ├── time/
│   │   │   └── page.tsx                 # Time entries list + filters
│   │   │
│   │   ├── invoices/                    # [PAID FEATURE]
│   │   │   ├── page.tsx                 # Invoice list
│   │   │   ├── new/page.tsx             # Invoice builder
│   │   │   └── [id]/page.tsx            # Invoice detail
│   │   │
│   │   ├── reports/                     # [PAID FEATURE]
│   │   │   └── page.tsx
│   │   │
│   │   ├── settings/
│   │   │   ├── page.tsx                 # Profile settings
│   │   │   ├── billing/page.tsx         # Subscription management
│   │   │   └── integrations/page.tsx    # Zapier, Google Calendar
│   │   │
│   │   └── pricing/page.tsx             # Upgrade page
│   │
│   ├── invoice/
│   │   └── [token]/page.tsx             # Public invoice view (no auth)
│   │
│   └── api/                             # ═══ API ROUTE HANDLERS ═══
│       │
│       ├── auth/
│       │   ├── signup/route.ts          # POST
│       │   ├── login/route.ts           # POST
│       │   ├── logout/route.ts          # POST
│       │   ├── session/route.ts         # GET
│       │   ├── google/route.ts          # GET (initiate OAuth)
│       │   ├── google/callback/route.ts # GET (OAuth callback)
│       │   ├── verify-email/route.ts    # POST
│       │   ├── resend-verification/route.ts # POST
│       │   ├── forgot-password/route.ts # POST
│       │   └── reset-password/route.ts  # POST
│       │
│       ├── users/
│       │   └── me/
│       │       ├── route.ts             # GET, PATCH, DELETE
│       │       ├── settings/route.ts    # GET, PATCH
│       │       └── onboarding/route.ts  # GET, PATCH
│       │
│       ├── clients/
│       │   ├── route.ts                 # GET (list), POST (create)
│       │   └── [id]/
│       │       ├── route.ts             # GET, PATCH, DELETE
│       │       ├── projects/route.ts    # GET
│       │       └── invoices/route.ts    # GET
│       │
│       ├── projects/
│       │   ├── route.ts                 # GET, POST
│       │   └── [id]/
│       │       ├── route.ts             # GET, PATCH, DELETE
│       │       ├── entries/route.ts     # GET
│       │       └── stats/route.ts       # GET
│       │
│       ├── time-entries/
│       │   ├── route.ts                 # GET, POST
│       │   ├── unbilled/route.ts        # GET
│       │   └── [id]/route.ts            # GET, PATCH, DELETE
│       │
│       ├── timer/                       # RPC-style actions
│       │   ├── route.ts                 # GET (active timer)
│       │   ├── start/route.ts           # POST
│       │   ├── stop/route.ts            # POST → creates time entry
│       │   ├── pause/route.ts           # POST
│       │   ├── resume/route.ts          # POST
│       │   ├── discard/route.ts         # POST
│       │   └── sync/route.ts            # POST (client state sync)
│       │
│       ├── invoices/                    # [PAID FEATURE]
│       │   ├── route.ts                 # GET, POST
│       │   └── [id]/
│       │       ├── route.ts             # GET, PATCH, DELETE
│       │       ├── send/route.ts        # POST (send email)
│       │       ├── remind/route.ts      # POST (send reminder)
│       │       ├── mark-paid/route.ts   # POST
│       │       ├── void/route.ts        # POST
│       │       ├── pdf/route.ts         # GET (download PDF)
│       │       └── public/route.ts      # GET (no auth, public view)
│       │
│       ├── billing/
│       │   ├── subscription/route.ts    # GET
│       │   ├── checkout/route.ts        # POST (create Stripe session)
│       │   ├── portal/route.ts          # POST (Stripe billing portal)
│       │   └── webhook/route.ts         # POST (Stripe webhook, no auth)
│       │
│       ├── dashboard/
│       │   ├── stats/route.ts           # GET
│       │   ├── recent/route.ts          # GET
│       │   └── activity/route.ts        # GET
│       │
│       ├── reports/                     # [PAID FEATURE]
│       │   ├── time/route.ts            # GET
│       │   ├── profitability/route.ts   # GET
│       │   ├── invoices/route.ts        # GET
│       │   └── export/
│       │       ├── csv/route.ts         # GET
│       │       └── pdf/route.ts         # GET
│       │
│       └── integrations/                # [PAID FEATURE]
│           ├── zapier/
│           │   ├── subscribe/route.ts   # POST
│           │   ├── unsubscribe/route.ts # DELETE
│           │   └── sample/[event]/route.ts # GET
│           └── google-calendar/
│               ├── connect/route.ts     # GET
│               ├── callback/route.ts    # GET
│               ├── disconnect/route.ts  # DELETE
│               └── sync/route.ts        # POST
│
├── components/
│   ├── ui/                              # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   ├── user-menu.tsx
│   │   └── mobile-nav.tsx
│   │
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── google-button.tsx
│   │
│   ├── dashboard/
│   │   ├── stats-cards.tsx
│   │   ├── onboarding-checklist.tsx
│   │   ├── recent-entries.tsx
│   │   └── quick-actions.tsx
│   │
│   ├── timer/
│   │   ├── timer-widget.tsx             # Navbar compact timer
│   │   ├── timer-expanded.tsx           # Full timer panel
│   │   └── timer-provider.tsx           # Timer context provider
│   │
│   ├── time-entries/
│   │   ├── entry-list.tsx
│   │   ├── entry-row.tsx
│   │   ├── entry-form-modal.tsx
│   │   └── entry-filters.tsx
│   │
│   ├── projects/
│   │   ├── project-list.tsx
│   │   ├── project-card.tsx
│   │   ├── project-form-modal.tsx
│   │   └── project-select.tsx           # Reusable dropdown
│   │
│   ├── clients/
│   │   ├── client-list.tsx
│   │   ├── client-card.tsx
│   │   ├── client-form-modal.tsx
│   │   └── client-select.tsx            # Reusable dropdown
│   │
│   ├── invoices/
│   │   ├── invoice-list.tsx
│   │   ├── invoice-builder.tsx
│   │   ├── line-items-table.tsx
│   │   ├── invoice-preview.tsx
│   │   └── invoice-public-view.tsx
│   │
│   └── shared/
│       ├── empty-state.tsx
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       ├── confirm-dialog.tsx
│       └── upgrade-prompt.tsx
│
├── lib/
│   │
│   ├── supabase/
│   │   ├── client.ts                    # Browser client (createBrowserClient)
│   │   ├── server.ts                    # Server client (createServerClient)
│   │   ├── middleware.ts                # Auth middleware helper
│   │   └── types.ts                     # Generated database types
│   │
│   ├── services/                        # ═══ BUSINESS LOGIC LAYER ═══
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── client.service.ts
│   │   ├── project.service.ts
│   │   ├── time-entry.service.ts
│   │   ├── timer.service.ts
│   │   ├── invoice.service.ts
│   │   ├── billing.service.ts
│   │   ├── dashboard.service.ts
│   │   └── report.service.ts
│   │
│   ├── api/                             # Frontend API client functions
│   │   ├── client.ts                    # Base fetcher with error handling
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── clients.ts
│   │   ├── projects.ts
│   │   ├── time-entries.ts
│   │   ├── timer.ts
│   │   ├── invoices.ts
│   │   ├── billing.ts
│   │   └── dashboard.ts
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-timer.ts
│   │   ├── use-projects.ts
│   │   ├── use-clients.ts
│   │   ├── use-time-entries.ts
│   │   ├── use-invoices.ts
│   │   ├── use-paid-feature.ts
│   │   └── use-onboarding.ts
│   │
│   ├── utils/
│   │   ├── date.ts                      # Date formatting, duration calc
│   │   ├── currency.ts                  # Currency formatting
│   │   ├── validation.ts                # Zod schemas
│   │   └── errors.ts                    # Error classes
│   │
│   ├── email/
│   │   ├── client.ts                    # Resend client
│   │   └── templates/
│   │       ├── verification.tsx
│   │       ├── password-reset.tsx
│   │       ├── invoice-sent.tsx
│   │       └── payment-reminder.tsx
│   │
│   ├── pdf/
│   │   └── invoice-generator.ts
│   │
│   └── stripe/
│       ├── client.ts
│       └── webhook.ts
│
├── contexts/
│   ├── auth-context.tsx
│   ├── timer-context.tsx
│   └── ui-context.tsx
│
├── types/
│   ├── database.ts                      # Supabase generated types
│   ├── api.ts                           # Request/Response types
│   └── index.ts
│
├── middleware.ts                        # Next.js middleware (auth redirects)
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 3. Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE DEPENDENCIES                                │
└─────────────────────────────────────────────────────────────────────────────┘

Level 0: Core Utilities (no internal deps)
──────────────────────────────────────────
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│  Supabase  │  │   Utils    │  │   Types    │  │   Email    │
│   Client   │  │            │  │            │  │   Client   │
└────────────┘  └────────────┘  └────────────┘  └────────────┘


Level 1: Auth (standalone)
──────────────────────────
┌─────────────────────┐
│   auth.service.ts   │
└─────────────────────┘


Level 2: User & Billing (depend on Auth)
────────────────────────────────────────
┌─────────────────────┐       ┌─────────────────────┐
│   user.service.ts   │       │  billing.service.ts │
└─────────────────────┘       └─────────────────────┘
           │
           │ provides user context
           ▼

Level 3: Clients & Projects (depend on User)
────────────────────────────────────────────
┌─────────────────────┐       ┌─────────────────────┐
│  client.service.ts  │ ◄──── │ project.service.ts  │
└─────────────────────┘       └─────────────────────┘
                                (projects ref clients)


Level 4: Time Tracking (depend on Projects)
───────────────────────────────────────────
┌─────────────────────┐       ┌─────────────────────┐
│time-entry.service.ts│       │  timer.service.ts   │
└─────────────────────┘       └─────────────────────┘


Level 5: Invoicing (depends on Clients + Time) [PAID]
─────────────────────────────────────────────────────
┌─────────────────────┐
│ invoice.service.ts  │ ◄── aggregates time entries, refs clients
└─────────────────────┘


Level 6: Aggregation (depend on multiple services)
──────────────────────────────────────────────────
┌─────────────────────┐       ┌─────────────────────┐
│dashboard.service.ts │       │  report.service.ts  │ [PAID]
└─────────────────────┘       └─────────────────────┘


SERVICE → API ROUTE MAPPING
═══════════════════════════
┌──────────────────────┬─────────────────────────────┐
│ Service              │ API Routes                  │
├──────────────────────┼─────────────────────────────┤
│ auth.service.ts      │ /api/auth/*                 │
│ user.service.ts      │ /api/users/me/*             │
│ client.service.ts    │ /api/clients/*              │
│ project.service.ts   │ /api/projects/*             │
│ time-entry.service.ts│ /api/time-entries/*         │
│ timer.service.ts     │ /api/timer/*                │
│ invoice.service.ts   │ /api/invoices/*             │
│ billing.service.ts   │ /api/billing/*              │
│ dashboard.service.ts │ /api/dashboard/*            │
│ report.service.ts    │ /api/reports/*              │
└──────────────────────┴─────────────────────────────┘
```

---

## 4. Service Specifications

### auth.service.ts
```typescript
// Dependencies: supabase/server, email/client

signup(email: string, password: string, name?: string): Promise<{ user, session }>
login(email: string, password: string): Promise<{ user, session }>
logout(): Promise<void>
getSession(): Promise<{ user } | null>
getCurrentUser(): Promise<User | null>

// OAuth
initiateGoogleOAuth(): Promise<{ url: string }>
handleGoogleCallback(code: string): Promise<{ user, session }>

// Email verification
verifyEmail(token: string): Promise<{ user }>
resendVerification(email: string): Promise<void>

// Password reset
requestPasswordReset(email: string): Promise<void>
resetPassword(token: string, newPassword: string): Promise<void>
```

### user.service.ts
```typescript
// Dependencies: supabase/server, billing.service

getProfile(userId: string): Promise<UserProfile>
updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfile>
deleteAccount(userId: string): Promise<void>

getSettings(userId: string): Promise<UserSettings>
updateSettings(userId: string, data: UpdateSettingsInput): Promise<UserSettings>

getOnboardingState(userId: string): Promise<OnboardingState>
updateOnboardingState(userId: string, data: UpdateOnboardingInput): Promise<OnboardingState>

getUserTier(userId: string): Promise<'FREE' | 'PAID'>
```

### client.service.ts
```typescript
// Dependencies: supabase/server

list(userId: string, filters?: ClientFilters): Promise<{ clients: Client[], total: number }>
create(userId: string, data: CreateClientInput): Promise<Client>
getById(userId: string, clientId: string): Promise<Client>
update(userId: string, clientId: string, data: UpdateClientInput): Promise<Client>
delete(userId: string, clientId: string): Promise<void>
getProjects(userId: string, clientId: string): Promise<Project[]>
getInvoices(userId: string, clientId: string): Promise<Invoice[]>
count(userId: string): Promise<number>
```

### project.service.ts
```typescript
// Dependencies: supabase/server

list(userId: string, filters?: ProjectFilters): Promise<{ projects: Project[], total: number }>
create(userId: string, data: CreateProjectInput): Promise<Project>
getById(userId: string, projectId: string): Promise<Project>
update(userId: string, projectId: string, data: UpdateProjectInput): Promise<Project>
archive(userId: string, projectId: string): Promise<void>
getEntries(userId: string, projectId: string, dateRange?: DateRange): Promise<TimeEntry[]>
getStats(userId: string, projectId: string): Promise<ProjectStats>
count(userId: string): Promise<number>
```

### time-entry.service.ts
```typescript
// Dependencies: supabase/server, project.service

list(userId: string, filters: EntryFilters): Promise<{ 
  entries: TimeEntry[], 
  total: number,
  totalDuration: number,
  totalBillable: number 
}>
create(userId: string, data: CreateEntryInput): Promise<TimeEntry>
getById(userId: string, entryId: string): Promise<TimeEntry>
update(userId: string, entryId: string, data: UpdateEntryInput): Promise<TimeEntry>
delete(userId: string, entryId: string): Promise<void>
getUnbilled(userId: string, clientId?: string, projectId?: string): Promise<TimeEntry[]>
markAsInvoiced(entryIds: string[], invoiceId: string): Promise<void>
count(userId: string): Promise<number>
```

### timer.service.ts
```typescript
// Dependencies: supabase/server, time-entry.service

getActive(userId: string): Promise<ActiveTimer | null>
start(userId: string, data: StartTimerInput): Promise<ActiveTimer>
stop(userId: string): Promise<TimeEntry>  // Creates time entry from timer
pause(userId: string): Promise<ActiveTimer>
resume(userId: string): Promise<ActiveTimer>
discard(userId: string): Promise<void>
sync(userId: string, clientState: SyncTimerInput): Promise<ActiveTimer>
```

### invoice.service.ts [PAID]
```typescript
// Dependencies: supabase/server, client.service, time-entry.service, 
//               billing.service, email/client, pdf/invoice-generator

list(userId: string, filters?: InvoiceFilters): Promise<{ 
  invoices: Invoice[], 
  total: number,
  totalOutstanding: number,
  totalPaid: number 
}>
create(userId: string, data: CreateInvoiceInput): Promise<Invoice>
getById(userId: string, invoiceId: string): Promise<Invoice>
update(userId: string, invoiceId: string, data: UpdateInvoiceInput): Promise<Invoice>
delete(userId: string, invoiceId: string): Promise<void>

// Actions
send(userId: string, invoiceId: string): Promise<Invoice>
sendReminder(userId: string, invoiceId: string): Promise<Invoice>
markAsPaid(userId: string, invoiceId: string, paidAt?: Date): Promise<Invoice>
void(userId: string, invoiceId: string): Promise<Invoice>

// PDF
generatePdf(invoiceId: string): Promise<Buffer>

// Public access
getPublic(publicToken: string): Promise<Invoice>

count(userId: string): Promise<number>
generateInvoiceNumber(userId: string): Promise<string>
```

### billing.service.ts
```typescript
// Dependencies: supabase/server, stripe/client

getSubscription(userId: string): Promise<Subscription | null>
createCheckoutSession(userId: string, plan: 'MONTHLY' | 'YEARLY'): Promise<{ checkoutUrl: string }>
createPortalSession(userId: string): Promise<{ portalUrl: string }>
handleWebhook(event: Stripe.Event): Promise<void>
isUserPaid(userId: string): Promise<boolean>
getUserTier(userId: string): Promise<'FREE' | 'PAID'>
```

### dashboard.service.ts
```typescript
// Dependencies: time-entry.service, invoice.service, project.service

getStats(userId: string): Promise<DashboardStats>
getRecentEntries(userId: string, limit?: number): Promise<TimeEntry[]>
getActivity(userId: string, limit?: number): Promise<ActivityItem[]>
```

### report.service.ts [PAID]
```typescript
// Dependencies: time-entry.service, project.service, client.service, invoice.service

generateTimeReport(userId: string, filters: ReportFilters): Promise<TimeReport>
generateProfitabilityReport(userId: string, filters: ReportFilters): Promise<ProfitabilityReport>
generateInvoiceReport(userId: string, filters: ReportFilters): Promise<InvoiceReport>
exportToCsv(report: Report): Promise<Buffer>
exportToPdf(report: Report): Promise<Buffer>
```

---

## 5. API Route Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API ROUTES                                      │
└─────────────────────────────────────────────────────────────────────────────┘

/api
│
├── /auth                                         [PUBLIC]
│   ├── POST   /signup
│   ├── POST   /login
│   ├── POST   /logout
│   ├── GET    /session
│   ├── GET    /google
│   ├── GET    /google/callback
│   ├── POST   /verify-email
│   ├── POST   /resend-verification
│   ├── POST   /forgot-password
│   └── POST   /reset-password
│
├── /users                                        [AUTHENTICATED]
│   └── /me
│       ├── GET                                   Get profile
│       ├── PATCH                                 Update profile
│       ├── DELETE                                Delete account
│       ├── GET    /settings
│       ├── PATCH  /settings
│       ├── GET    /onboarding
│       └── PATCH  /onboarding
│
├── /clients                                      [AUTHENTICATED]
│   ├── GET                                       List clients
│   ├── POST                                      Create client
│   └── /[id]
│       ├── GET                                   Get client
│       ├── PATCH                                 Update client
│       ├── DELETE                                Archive client
│       ├── GET    /projects                      Client's projects
│       └── GET    /invoices                      Client's invoices
│
├── /projects                                     [AUTHENTICATED]
│   ├── GET                                       List projects
│   ├── POST                                      Create project
│   └── /[id]
│       ├── GET                                   Get project
│       ├── PATCH                                 Update project
│       ├── DELETE                                Archive project
│       ├── GET    /entries                       Project's entries
│       └── GET    /stats                         Project statistics
│
├── /time-entries                                 [AUTHENTICATED]
│   ├── GET                                       List entries (filterable)
│   ├── POST                                      Create entry
│   ├── GET    /unbilled                          Unbilled entries
│   └── /[id]
│       ├── GET                                   Get entry
│       ├── PATCH                                 Update entry
│       └── DELETE                                Delete entry
│
├── /timer                                        [AUTHENTICATED]
│   ├── GET                                       Get active timer
│   ├── POST   /start                             Start timer
│   ├── POST   /stop                              Stop → create entry
│   ├── POST   /pause                             Pause timer
│   ├── POST   /resume                            Resume timer
│   ├── POST   /discard                           Discard timer
│   └── POST   /sync                              Sync client state
│
├── /invoices                                     [AUTHENTICATED] [PAID]
│   ├── GET                                       List invoices
│   ├── POST                                      Create invoice
│   └── /[id]
│       ├── GET                                   Get invoice
│       ├── PATCH                                 Update (draft only)
│       ├── DELETE                                Delete (draft only)
│       ├── POST   /send                          Send email
│       ├── POST   /remind                        Send reminder
│       ├── POST   /mark-paid                     Mark as paid
│       ├── POST   /void                          Void invoice
│       ├── GET    /pdf                           Download PDF
│       └── GET    /public                        Public view [PUBLIC]
│
├── /billing                                      [AUTHENTICATED]
│   ├── GET    /subscription                      Get subscription
│   ├── POST   /checkout                          Stripe checkout
│   ├── POST   /portal                            Stripe portal
│   └── POST   /webhook                           Stripe webhook [PUBLIC]
│
├── /dashboard                                    [AUTHENTICATED]
│   ├── GET    /stats                             Overview stats
│   ├── GET    /recent                            Recent entries
│   └── GET    /activity                          Activity feed
│
├── /reports                                      [AUTHENTICATED] [PAID]
│   ├── GET    /time                              Time report
│   ├── GET    /profitability                     Profit report
│   ├── GET    /invoices                          Invoice report
│   └── /export
│       ├── GET    /csv                           Export CSV
│       └── GET    /pdf                           Export PDF
│
└── /integrations                                 [AUTHENTICATED] [PAID]
    ├── /zapier
    │   ├── POST   /subscribe
    │   ├── DELETE /unsubscribe
    │   └── GET    /sample/[event]
    └── /google-calendar
        ├── GET    /connect
        ├── GET    /callback
        ├── DELETE /disconnect
        └── POST   /sync


╔═══════════════════════════════════════════════════════════════════════════╗
║ LEGEND                                                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ [PUBLIC]        No authentication required                                 ║
║ [AUTHENTICATED] Requires valid session cookie                              ║
║ [PAID]          Requires active subscription (returns 402 if free tier)   ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 6. Database Schema

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- DATABASE SCHEMA (Supabase / PostgreSQL)
-- ═══════════════════════════════════════════════════════════════════════════

-- Note: auth.users is managed by Supabase Auth
-- We extend it with profiles and settings tables

-- ───────────────────────────────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 VARCHAR(100),
  timezone             VARCHAR(100) DEFAULT 'UTC',
  default_currency     VARCHAR(3) DEFAULT 'USD',
  default_hourly_rate  DECIMAL(10,2),
  onboarding_dismissed BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────
-- USER SETTINGS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE user_settings (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme       VARCHAR(20) DEFAULT 'system',    -- 'light' | 'dark' | 'system'
  week_start  VARCHAR(10) DEFAULT 'monday',    -- 'sunday' | 'monday'
  time_format VARCHAR(5) DEFAULT '24h',        -- '12h' | '24h'
  date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id      VARCHAR(255) NOT NULL,
  stripe_subscription_id  VARCHAR(255) NOT NULL,
  plan                    VARCHAR(20) NOT NULL,      -- 'MONTHLY' | 'YEARLY'
  status                  VARCHAR(20) NOT NULL,      -- 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
  current_period_end      TIMESTAMPTZ NOT NULL,
  cancel_at_period_end    BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────
-- CLIENTS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  contact_name  VARCHAR(100),
  contact_email VARCHAR(255),
  address       TEXT,
  archived      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_user ON clients(user_id) WHERE archived = FALSE;

-- ───────────────────────────────────────────────────────────────────────────
-- PROJECTS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,
  name                VARCHAR(200) NOT NULL,
  color               VARCHAR(7),               -- Hex color
  billable_rate       DECIMAL(10,2),
  cost_rate           DECIMAL(10,2),
  currency            VARCHAR(3) DEFAULT 'USD',
  is_billable_default BOOLEAN DEFAULT TRUE,
  archived            BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user ON projects(user_id) WHERE archived = FALSE;
CREATE INDEX idx_projects_client ON projects(client_id);

-- ───────────────────────────────────────────────────────────────────────────
-- TIME ENTRIES
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE time_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_id       UUID REFERENCES invoices(id) ON DELETE SET NULL,
  description      TEXT,
  date             DATE NOT NULL,
  duration_seconds INTEGER NOT NULL,
  is_billable      BOOLEAN DEFAULT TRUE,
  billable_amount  DECIMAL(10,2),              -- Calculated
  cost_amount      DECIMAL(10,2),              -- Calculated
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date DESC);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_invoice ON time_entries(invoice_id);
CREATE INDEX idx_time_entries_unbilled ON time_entries(user_id) WHERE invoice_id IS NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- ACTIVE TIMERS (one per user)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE active_timers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,
  description         TEXT,
  is_billable         BOOLEAN DEFAULT TRUE,
  started_at          TIMESTAMPTZ NOT NULL,
  paused_at           TIMESTAMPTZ,
  accumulated_seconds INTEGER DEFAULT 0,
  status              VARCHAR(20) DEFAULT 'RUNNING',  -- 'RUNNING' | 'PAUSED'
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────
-- INVOICES
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  public_token        VARCHAR(64) UNIQUE NOT NULL,
  invoice_number      VARCHAR(50) NOT NULL,
  status              VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT|SENT|VIEWED|PAID|OVERDUE|VOID
  issue_date          DATE NOT NULL,
  due_date            DATE NOT NULL,
  currency            VARCHAR(3) DEFAULT 'USD',
  subtotal            DECIMAL(10,2) NOT NULL,
  tax_rate            DECIMAL(5,2),
  tax_amount          DECIMAL(10,2),
  discount_amount     DECIMAL(10,2),
  total               DECIMAL(10,2) NOT NULL,
  notes               TEXT,
  stripe_payment_link TEXT,
  sent_at             TIMESTAMPTZ,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, invoice_number)
);

CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_public_token ON invoices(public_token);

-- ───────────────────────────────────────────────────────────────────────────
-- INVOICE LINE ITEMS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE invoice_line_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
  description   TEXT NOT NULL,
  quantity      DECIMAL(10,2) NOT NULL,
  unit_price    DECIMAL(10,2) NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  sort_order    INTEGER DEFAULT 0
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);

-- ───────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

-- ... similar policies for all tables
```

---

## 7. Frontend-Backend Communication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA FETCHING PATTERNS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

PATTERN 1: SWR for data fetching
────────────────────────────────
// lib/hooks/use-projects.ts
export function useProjects(filters?: ProjectFilters) {
  const params = new URLSearchParams(filters)
  return useSWR(`/api/projects?${params}`, fetcher)
}

// Usage in component
function ProjectList() {
  const { data, isLoading, error, mutate } = useProjects()
  // render...
}


PATTERN 2: Direct API calls for mutations
─────────────────────────────────────────
// lib/api/projects.ts
export const projectsApi = {
  create: async (data: CreateProjectInput) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new ApiError(res)
    return res.json()
  },
  
  update: async (id: string, data: UpdateProjectInput) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new ApiError(res)
    return res.json()
  }
}

// Usage with SWR mutation
const handleCreate = async (data: CreateProjectInput) => {
  await projectsApi.create(data)
  mutate('/api/projects')  // Revalidate cache
  toast.success('Project created')
}


PATTERN 3: Context for global/persistent state
──────────────────────────────────────────────
// contexts/timer-context.tsx
export function TimerProvider({ children }) {
  const { data: serverTimer, mutate } = useSWR('/api/timer')
  const [localTimer, setLocalTimer] = useState<ActiveTimer | null>(null)

  // Sync to server every 30 seconds
  useEffect(() => {
    if (localTimer?.status !== 'RUNNING') return
    
    const interval = setInterval(async () => {
      await timerApi.sync(localTimer)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [localTimer])

  const start = async (data: StartTimerInput) => {
    const timer = await timerApi.start(data)
    setLocalTimer(timer)
    localStorage.setItem('billmint_timer', JSON.stringify(timer))
  }

  const stop = async () => {
    const entry = await timerApi.stop()
    setLocalTimer(null)
    localStorage.removeItem('billmint_timer')
    mutate('/api/time-entries')  // Refresh entries
    return entry
  }

  return (
    <TimerContext.Provider value={{ timer: localTimer, start, stop, pause, resume }}>
      {children}
    </TimerContext.Provider>
  )
}


STATE → ENDPOINT MAPPING
────────────────────────
┌──────────────────────────────┬─────────────────────────────┐
│ Frontend State               │ Backend Endpoint            │
├──────────────────────────────┼─────────────────────────────┤
│ AuthContext.user             │ GET /api/auth/session       │
│ AuthContext.tier             │ GET /api/users/me → tier    │
│ AuthContext.logout()         │ POST /api/auth/logout       │
├──────────────────────────────┼─────────────────────────────┤
│ TimerContext.timer           │ GET /api/timer              │
│ TimerContext.start()         │ POST /api/timer/start       │
│ TimerContext.stop()          │ POST /api/timer/stop        │
│ TimerContext.sync()          │ POST /api/timer/sync        │
├──────────────────────────────┼─────────────────────────────┤
│ SWR: /api/projects           │ GET /api/projects           │
│ SWR: /api/clients            │ GET /api/clients            │
│ SWR: /api/time-entries       │ GET /api/time-entries       │
│ SWR: /api/invoices           │ GET /api/invoices           │
│ SWR: /api/dashboard/stats    │ GET /api/dashboard/stats    │
│ SWR: /api/users/me           │ GET /api/users/me           │
└──────────────────────────────┴─────────────────────────────┘
```

---

## 8. Free vs Paid Gating

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FEATURE MATRIX                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┬───────────┬───────────┐
│ Feature                             │   FREE    │   PAID    │
├─────────────────────────────────────┼───────────┼───────────┤
│ Time tracking (timer + manual)      │     ✓     │     ✓     │
│ Projects (unlimited)                │     ✓     │     ✓     │
│ Clients (unlimited)                 │     ✓     │     ✓     │
│ Dashboard                           │     ✓     │     ✓     │
│ Basic reports (week/month view)     │     ✓     │     ✓     │
│ CSV export of time entries          │     ✓     │     ✓     │
├─────────────────────────────────────┼───────────┼───────────┤
│ Invoice creation                    │     ✗     │     ✓     │
│ Invoice sending (email)             │     ✗     │     ✓     │
│ Stripe payment links                │     ✗     │     ✓     │
│ PDF generation                      │     ✗     │     ✓     │
│ Advanced reports (profitability)    │     ✗     │     ✓     │
│ Custom date range reports           │     ✗     │     ✓     │
│ Zapier integration                  │     ✗     │     ✓     │
│ Google Calendar sync                │     ✗     │     ✓     │
│ Team features (future)              │     ✗     │     ✓     │
└─────────────────────────────────────┴───────────┴───────────┘


BACKEND IMPLEMENTATION
──────────────────────

// lib/middleware/require-paid.ts
const PAID_ROUTES = [
  '/api/invoices',
  '/api/reports',
  '/api/integrations'
]

export async function requirePaidTier(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  if (PAID_ROUTES.some(route => pathname.startsWith(route))) {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    }
    
    const isPaid = await billingService.isUserPaid(user.id)
    
    if (!isPaid) {
      return NextResponse.json({
        error: {
          code: 'PAYMENT_REQUIRED',
          message: 'This feature requires a paid subscription',
          upgradeUrl: '/pricing'
        }
      }, { status: 402 })
    }
  }
}


FRONTEND HOOK
─────────────

// lib/hooks/use-paid-feature.ts
export function usePaidFeature(featureName: string) {
  const { tier } = useAuth()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  const isPaid = tier === 'PAID'
  
  const guardedAction = useCallback((action: () => void) => {
    if (isPaid) {
      action()
    } else {
      setShowUpgradeModal(true)
    }
  }, [isPaid])
  
  return {
    isPaid,
    guardedAction,
    showUpgradeModal,
    closeUpgradeModal: () => setShowUpgradeModal(false)
  }
}

// Usage example
function CreateInvoiceButton() {
  const router = useRouter()
  const { isPaid, guardedAction, showUpgradeModal, closeUpgradeModal } = usePaidFeature('invoicing')
  
  return (
    <>
      <Button onClick={() => guardedAction(() => router.push('/invoices/new'))}>
        {!isPaid && <LockIcon className="mr-2 h-4 w-4" />}
        Create Invoice
      </Button>
      
      <UpgradeDialog 
        open={showUpgradeModal} 
        onClose={closeUpgradeModal}
        feature="invoicing"
      />
    </>
  )
}


UPGRADE PROMPT LOCATIONS
────────────────────────
1. Navbar: "Upgrade" button (visible only to free users)
2. Sidebar: Lock icons on Invoices, Reports, Integrations
3. Dashboard: "Start invoicing" card with upgrade CTA
4. Time entries: "You have X unbilled hours" with upgrade prompt
5. After completing onboarding checklist
```

---

## 9. Error Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR RESPONSE FORMAT                                │
└─────────────────────────────────────────────────────────────────────────────┘

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Must be at least 8 characters" }
    ]
  }
}


HTTP STATUS CODES
─────────────────
┌────────┬──────────────────────┬────────────────────────────────────────────┐
│ Status │ Code                 │ When to use                                │
├────────┼──────────────────────┼────────────────────────────────────────────┤
│  200   │ OK                   │ Successful GET, PATCH, DELETE              │
│  201   │ CREATED              │ Successful POST creating a resource        │
│  400   │ BAD_REQUEST          │ Validation errors, malformed input         │
│  401   │ UNAUTHORIZED         │ Missing or invalid session                 │
│  402   │ PAYMENT_REQUIRED     │ Free user accessing paid feature           │
│  403   │ FORBIDDEN            │ Valid session but no permission            │
│  404   │ NOT_FOUND            │ Resource doesn't exist                     │
│  409   │ CONFLICT             │ Duplicate entry, state conflict            │
│  500   │ INTERNAL_ERROR       │ Unexpected server error                    │
└────────┴──────────────────────┴────────────────────────────────────────────┘


ERROR CLASSES
─────────────

// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 400,
    public details?: { field: string; message: string }[]
  ) {
    super(message)
  }
}

export class ValidationError extends AppError {
  constructor(details: { field: string; message: string }[]) {
    super('VALIDATION_ERROR', 'Invalid input data', 400, details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource.toUpperCase()}_NOT_FOUND`, `${resource} not found`, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('UNAUTHORIZED', 'Authentication required', 401)
  }
}

export class PaymentRequiredError extends AppError {
  constructor(feature: string) {
    super('PAYMENT_REQUIRED', `Upgrade to access ${feature}`, 402)
  }
}


API ROUTE ERROR HANDLING
────────────────────────

// app/api/projects/route.ts
export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validated = createProjectSchema.safeParse(body)
    
    if (!validated.success) {
      throw new ValidationError(
        validated.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message
        }))
      )
    }

    const project = await projectService.create(user.id, validated.data)
    return NextResponse.json(project, { status: 201 })

  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: error.status }
      )
    }
    
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}


FRONTEND ERROR HANDLING
───────────────────────

// lib/api/client.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { field: string; message: string }[]
  ) {
    super(message)
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  
  if (!res.ok) {
    const body = await res.json()
    throw new ApiError(
      res.status,
      body.error?.code || 'UNKNOWN',
      body.error?.message || 'Something went wrong',
      body.error?.details
    )
  }
  
  return res.json()
}

// Component usage
async function handleSubmit(data: FormData) {
  try {
    await projectsApi.create(data)
    toast.success('Project created')
    mutate('/api/projects')
  } catch (error) {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 401:
          router.push('/login')
          break
        case 402:
          setShowUpgradeModal(true)
          break
        case 400:
          if (error.details) {
            error.details.forEach(d => form.setError(d.field, { message: d.message }))
          }
          break
        default:
          toast.error(error.message)
      }
    }
  }
}
```

---

## 10. Open Questions

1. **Supabase Auth** - Using Supabase Auth (handles JWT, sessions, OAuth). Confirm this is acceptable vs custom auth?

2. **Rate limiting** - Next.js doesn't have built-in rate limiting. Options:
   - Vercel Edge Config
   - Upstash Redis
   - Custom middleware with in-memory store
   
3. **PDF generation** - Options:
   - `@react-pdf/renderer` (server-side)
   - `puppeteer` (heavier, more flexible)
   - External service (e.g., DocRaptor)

4. **Email provider** - Resend recommended (great DX, good pricing). Confirm or prefer SendGrid/Postmark?

5. **Invoice number format** - `INV-2026-0001` or let user customize?

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 21, 2026 | Claude | Initial architecture (Ktor backend) |
| 1.1 | Jan 21, 2026 | Claude | Simplified to Next.js API routes + Supabase |
