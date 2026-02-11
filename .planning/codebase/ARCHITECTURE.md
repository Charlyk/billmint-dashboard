# Architecture

**Analysis Date:** 2026-02-11

## Pattern Overview

**Overall:** Layered Full-Stack Next.js with Clear Separation of Concerns

**Key Characteristics:**
- Next.js App Router (React 19 with Server Components)
- Service layer abstraction between API routes and database
- Client-side state management via SWR (data fetching) and React Context (UI state)
- Type-safe database queries via RPC functions to Supabase PostgreSQL
- Middleware-based authentication with server-side session validation

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render user interface with interactive elements
- Location: `src/components/` and `src/app/`
- Contains: React components (both server and client), page components, layouts
- Depends on: Hooks, Contexts, API client, UI components library
- Used by: End users through browser

**Page/Route Layer:**
- Purpose: Define URL routing and page composition for Next.js App Router
- Location: `src/app/` directory structure (dashboard, auth, public pages)
- Contains: Page components, layouts, error boundaries, special files (error.tsx, not-found.tsx)
- Depends on: Components, services, contexts, layouts
- Used by: Next.js router, browser navigation

**API Route Layer:**
- Purpose: Handle HTTP requests and responses for client-side and external requests
- Location: `src/app/api/` (organized by feature: auth, invoices, clients, projects, time-entries, reports)
- Contains: POST/GET/PATCH/DELETE route handlers
- Depends on: Services layer, validation, error handling utilities
- Used by: Client-side API calls, external integrations (webhooks)

**Service Layer:**
- Purpose: Encapsulate business logic and data operations
- Location: `src/lib/services/` (14 service files)
- Contains: Functions for auth, invoices, time entries, clients, projects, billing, email, reports
- Depends on: Supabase client, utilities (validation, errors, formatters)
- Used by: API routes and client-side code

**Data Access Layer (Supabase):**
- Purpose: Communicate with PostgreSQL database via RPC and direct queries
- Location: `src/lib/supabase/` (client.ts, server.ts, middleware.ts)
- Contains: Supabase client initialization, session management, middleware
- Depends on: Supabase SDK (@supabase/supabase-js, @supabase/ssr)
- Used by: Services layer

**Context/State Management Layer:**
- Purpose: Manage global application state (auth, timer, user settings)
- Location: `src/contexts/` (auth-context, timer-context, user-settings-context)
- Contains: React Context providers, custom hooks for state
- Depends on: Supabase client, services
- Used by: Components, pages, layout

**API Client Layer:**
- Purpose: Provide type-safe client-side fetching and API communication
- Location: `src/lib/api/` (organized by feature: auth.ts, invoices.ts, clients.ts, etc.)
- Contains: Fetch wrappers with error handling, type definitions
- Depends on: Validation schemas, error handling utilities
- Used by: Hooks and components

**Custom Hooks Layer:**
- Purpose: Encapsulate reusable logic for data fetching and mutations
- Location: `src/lib/hooks/` (use-auth, use-invoices, use-timer, use-clients, etc.)
- Contains: SWR data hooks, mutation hooks, custom logic hooks
- Depends on: API client layer, contexts
- Used by: Components and pages

**Utilities Layer:**
- Purpose: Provide helper functions and shared logic
- Location: `src/lib/utils/` (validation.ts, errors.ts, date.ts, currency.ts, etc.)
- Contains: Validation schemas (Zod), error classes, formatting utilities, PDF utilities
- Depends on: Third-party libraries (Zod)
- Used by: All layers

**Type System:**
- Purpose: Define type-safe interfaces across the application
- Location: `src/types/` (database.ts, api.ts, index.ts)
- Contains: Database schema types from Supabase, API response/request types
- Depends on: None (pure type definitions)
- Used by: All code

## Data Flow

**Authentication Flow:**

1. User visits `/login` or `/signup` page
2. Client-side form submits to `/api/auth/login` or `/api/auth/signup`
3. API route calls `auth.service.login()` or `auth.service.signup()`
4. Service validates credentials via Supabase auth and database
5. Service returns authenticated user + session token
6. Client stores session via Supabase SSR cookie mechanism
7. Middleware (`src/middleware.ts`) validates session on protected routes
8. `AuthProvider` context fetches and caches user state with `useAuth()` hook
9. Protected pages/components access user via `useAuth()` context hook

**Invoice Fetching & Creation Flow:**

1. Dashboard page mounts, calls `useInvoices()` hook
2. Hook triggers SWR fetch to `/api/invoices` endpoint
3. API route receives request with optional filters (client_id, status, date range)
4. Route calls `invoice.service.listInvoices()` with filters
5. Service validates user authentication with `requireAuth()`
6. Service calls Supabase RPC function `list_invoices` with typed parameters
7. Database RPC returns paginated invoice list with computed fields
8. Service transforms response and returns to API route
9. API route wraps response in standard format and returns to client
10. Hook stores data in SWR cache, component re-renders with invoice list
11. User can create invoice: form submission → `/api/invoices` POST → `invoice.service.createInvoice()` → database INSERT + RPC → response

**Timer State Flow:**

1. Dashboard layout fetches active timer on server via `getActiveTimer()`
2. Timer state passed to `TimerProvider` context at layout level
3. Timer controls in header trigger context methods (startTimer, stopTimer, pauseTimer, resumeTimer)
4. Context methods call `timerApi` endpoints (`/api/timer/...`)
5. API routes call `timer.service` functions
6. Service persists to database and returns updated state
7. Context updates state, triggers SWR cache revalidation
8. Child components subscribed to timer context re-render with new state

**PDF Generation Flow:**

1. User requests invoice PDF via button click
2. Component calls `invoicesApi.downloadInvoicePdf(id)`
3. Client fetches `/api/invoices/[id]/pdf`
4. API route calls `invoice.service.getPdfData(id)` to fetch invoice data
5. Service retrieves invoice with computed fields from database
6. Route passes data to PDF generation service (`pdf.service`)
7. PDF service uses React PDF renderer to generate PDF stream
8. Route returns PDF as blob to client
9. Browser initiates download

**Email Sending Flow:**

1. User action triggers email (e.g., send invoice, password reset)
2. API route or service calls email function from `email.service.ts`
3. Email service formats email template with user/invoice/link data
4. Email service calls Resend SDK to send email asynchronously
5. No blocking - email sending happens in background
6. Response returns to user immediately

**State Management:**

- **Global Auth State:** Managed by `AuthProvider` context, synced with Supabase session
- **Timer State:** Managed by `TimerProvider` context with optimistic UI updates
- **User Settings:** Managed by `UserSettingsProvider` context, cached server-side in layout
- **Data Caching:** SWR handles HTTP caching with deduplication interval (5s) and stale-while-revalidate
- **Error Handling:** Centralized error classes (AppError, ValidationError, NotFoundError) propagate to API with proper status codes

## Key Abstractions

**Service Pattern:**
- Purpose: Encapsulate business logic away from HTTP handlers
- Examples: `src/lib/services/invoice.service.ts`, `src/lib/services/auth.service.ts`, `src/lib/services/timer.service.ts`
- Pattern: Exported async functions that handle validation, authorization, database operations, and error handling
- Benefit: Reusable logic, easy testing, clear separation from HTTP details

**Validation Schema Pattern:**
- Purpose: Validate and parse user input with type inference
- Examples: `src/lib/utils/validation.ts` (Zod schemas)
- Pattern: Define Zod schemas for all API inputs, use `.safeParse()` in routes
- Benefit: Type-safe runtime validation, consistent error messages

**Error Class Hierarchy:**
- Purpose: Standardize error handling across layers
- Examples: `AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ConflictError` in `src/lib/utils/errors.ts`
- Pattern: Extend base `AppError` with specific status codes and formats
- Benefit: Consistent error responses, proper HTTP status codes

**API Client Wrapper:**
- Purpose: Handle fetch logic, error parsing, type inference
- Examples: `src/lib/api/client.ts` exports `fetcher()` function
- Pattern: Generic function that handles query params, JSON serialization, error transformation
- Benefit: DRY, consistent error handling, type safety

**SWR Custom Hooks:**
- Purpose: Provide reusable data fetching patterns
- Examples: `src/lib/hooks/use-invoices.ts`, `src/lib/hooks/use-auth.ts`, `src/lib/hooks/use-timer.ts`
- Pattern: Wrap SWR with API client calls and custom logic, return standardized object with data, loading, error
- Benefit: Code reuse across pages, automatic caching, built-in retry logic

**Context Provider Pattern:**
- Purpose: Share state across component tree without prop drilling
- Examples: `AuthProvider`, `TimerProvider`, `UserSettingsProvider` in `src/contexts/`
- Pattern: Create context with custom hook for accessing it
- Benefit: Avoid prop drilling, global state access, isolated state domains

## Entry Points

**Application Root:**
- Location: `src/app/layout.tsx`
- Triggers: Server startup, all page requests
- Responsibilities: Set up Providers wrapper, global styles, fonts, metadata

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: All requests to routes in matcher (except static/public)
- Responsibilities: Update Supabase session, validate authentication, redirect unauthenticated users

**Dashboard Entry:**
- Location: `src/app/dashboard/layout.tsx`
- Triggers: User navigates to `/dashboard` or any `/dashboard/*` route
- Responsibilities: Fetch user + timer + settings server-side, provide contexts to children

**API Route Handlers:**
- Location: `src/app/api/[feature]/route.ts`
- Triggers: HTTP GET/POST/PATCH/DELETE requests to `/api/[feature]`
- Responsibilities: Parse request, validate input, call service, return response

**Public Invoice Page:**
- Location: `src/app/invoice/[token]/page.tsx`
- Triggers: User opens invoice sharing link
- Responsibilities: Fetch public invoice data, render without authentication

## Error Handling

**Strategy:** Multi-layer error handling with standardized error classes and HTTP response formatting

**Patterns:**

- **Request Validation:** Zod schema validation in API routes, throws `ValidationError` with field-level errors
- **Authorization:** `requireAuth()` in service functions throws `UnauthorizedError` if user not authenticated
- **Resource Not Found:** Services throw `NotFoundError` with resource name
- **Conflict Errors:** Services throw `ConflictError` for duplicate/conflict scenarios
- **API Error Response:** `handleError()` utility in API routes catches errors, formats as JSON with status code and error details
- **Client Error Handling:** `ApiClientError` class in `src/lib/api/client.ts` parsed from JSON responses, caught in SWR hooks
- **SWR Error Handling:** Providers config in `src/contexts/providers.tsx` handles 401 errors by redirecting to login
- **Database Errors:** Service functions catch Supabase errors, log them, throw app-level errors with user-friendly messages

## Cross-Cutting Concerns

**Logging:**
- Approach: Console logging in services and API routes with prefixed identifiers (e.g., `[Invoice]`, `[Auth]`)
- Used for: Error tracking, debugging RPC failures, tracking user actions
- Not persisted or aggregated (could add Sentry/LogRocket)

**Validation:**
- Approach: Zod schemas in `src/lib/utils/validation.ts` for all API inputs and RPC parameters
- Enforced: API routes validate with `.safeParse()`, services validate RPC parameters
- Error format: Field-level errors returned to client

**Authentication:**
- Approach: Supabase Auth with email/password and OAuth (Google)
- Enforcement: Middleware checks session on protected routes, `requireAuth()` in services
- Protected: All `/dashboard` routes, most API routes except `/api/invoices/public` and auth routes

**Authorization:**
- Approach: User ID checks in services - all queries filter by `currentUser.id`
- Pattern: `requireAuth()` returns user object, service uses it to scope queries
- Data isolation: No cross-user data access via Supabase RLS (Row Level Security) on tables

**Rate Limiting:**
- Approach: Not implemented at application level
- Note: Supabase provides built-in rate limiting

**CORS:**
- Approach: Not needed - same-origin requests from Next.js frontend to API routes
- Public endpoints (`/api/invoices/public`) are open to cross-origin requests

---

*Architecture analysis: 2026-02-11*
