# External Integrations

**Analysis Date:** 2026-02-11

## APIs & External Services

**Payment Processing:**
- Stripe - Manages billing, subscriptions, and invoices
  - SDK/Client: `stripe` (npm package v20.2.0)
  - Auth: `STRIPE_SECRET_KEY` (server-side), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client-side)
  - Service: `src/lib/services/billing.service.ts`

**Email Delivery:**
- Resend - Sends transactional and notification emails
  - SDK/Client: `resend` (npm package v6.8.0)
  - Auth: `RESEND_API_KEY`
  - Service: `src/lib/services/email.service.ts`
  - Features: Welcome emails, weekly/monthly summaries, invoice notifications, timer alerts, password resets

**Social Authentication:**
- Google OAuth - Federated login via Google
  - Implementation: Supabase OAuth provider
  - Config: `src/lib/services/auth.service.ts` line 484-499
  - Redirect: `{NEXT_PUBLIC_APP_URL}/api/auth/callback`

## Data Storage

**Primary Database:**
- Supabase PostgreSQL
  - Provider: Supabase (managed PostgreSQL)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (client) or `SUPABASE_SECRET_KEY` (server)
  - Client packages: `@supabase/supabase-js` 2.91.0, `@supabase/ssr` 0.8.0
  - Clients:
    - Browser client: `src/lib/supabase/client.ts`
    - Server client: `src/lib/supabase/server.ts`
    - Service client: `src/lib/supabase/server.ts` (admin operations)
    - Middleware client: `src/lib/supabase/middleware.ts`

**Tables:**
- `users` - User accounts, authentication, subscription status
  - Fields: id, email, full_name, company_name, avatar_url, tier (free/pro/business), stripe_customer_id, stripe_subscription_id, email_verified_at, created_at, updated_at
  - RLS: Enabled (users can only access own row)

- `user_settings` - User preferences and billing info
  - Fields: user_id, default_currency, default_hourly_rate, week_starts_on, time_format (12h/24h), date_format, invoice_prefix, invoice_notes, invoice_terms, max_timer_hours, timezone, logo_url, billing_email, onboarding_dismissed_at, created_at, updated_at

- `projects` - Client projects for time tracking
  - Time tracking organized by project with hourly rates

- `time_entries` - Individual tracked time blocks
  - Associated with projects and invoices

- `invoices` - Generated invoices
  - Tracks invoice status, payment, line items

- `clients` - Client information
  - Contact details for invoice recipients

- `password_reset_tokens` - One-time password reset links
  - Fields: email, token, expires_at, used_at

- `email_verification_tokens` - Email verification for signup
  - Fields: user_id, email, token, expires_at, verified_at, created_at

**File Storage:**
- Local filesystem for logos and documents
- Supabase Storage (potential, not yet integrated based on codebase review)

**Caching:**
- None detected - Uses SWR for client-side data fetching/caching
- Session cookies for authentication state

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (custom email/password)
  - Implementation: `src/lib/services/auth.service.ts`
  - Features:
    - Email/password signup and login
    - Email verification before account access
    - Password reset via token-based flow
    - Google OAuth integration
    - Session management with refresh tokens

**Authentication Flow:**
- Signup: Create auth user + profile in `users` table
- Login: Retrieve user profile with subscription status
- Session: Stored in cookies, managed by Supabase middleware
- API Routes: Protected with `requireAuth()` helper
- Paid Features: Protected with `requirePaidUser()` helper

## Monitoring & Observability

**Error Tracking:**
- Not detected - Console logging only
- Implement Sentry or similar for production

**Logs:**
- Console logging throughout service files (`console.log`, `console.error`)
- No centralized logging provider configured

**Webhook Handling:**
- Stripe webhooks logged with `console.log` for debugging

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase - Likely Vercel (typical for Next.js)

**CI Pipeline:**
- Not detected - No GitHub Actions or similar CI config in repo

**Environment Management:**
- `.env.example` - Template for required variables
- `.env.local` - Local development (not committed)
- Production via platform env vars (Vercel/Render/etc)

## Webhooks & Callbacks

**Incoming Webhooks:**

**Stripe Webhooks:**
- Endpoint: `POST /api/billing/webhook`
- Handler: `src/lib/services/billing.service.ts` → `handleWebhook()`
- Events:
  - `checkout.session.completed` - Customer purchased subscription, update user tier and stripe_subscription_id via RPC `handle_stripe_webhook`
  - `customer.subscription.updated` - Subscription status change (canceled/unpaid), call RPC `handle_stripe_webhook`
  - `customer.subscription.deleted` - Subscription cancelled, call RPC `handle_stripe_webhook`
  - `invoice.payment_failed` - Payment failed, logs message only
- Signature Verification: Stripe signature header validation
- Secret: `STRIPE_WEBHOOK_SECRET`

**Auth Callbacks:**
- `GET /api/auth/callback` - OAuth redirect endpoint
  - Handles Google OAuth callback
  - Sets session cookies

**Outgoing Webhooks:**
- None detected

## Email Events Sent

**Transactional Emails (via Resend):**
- Welcome email (after email verification)
- Email verification link
- Password reset link
- Account deletion OTP confirmation

**Notification Emails:**
- Weekly summary (time tracked, billable amount, projects)
- Monthly summary (hours, invoicing, overdue invoices)
- Timer auto-paused alert
- Timer running reminder (at time limit)
- Invoice sent notification (to client)
- Invoice payment reminder (to client)
- Invoice overdue alert (to owner)

## Stripe Integration Details

**Pricing Tiers:**
- Free - No subscription
- Pro - `STRIPE_PRO_PRICE_ID` (monthly), `STRIPE_PRO_YEARLY_PRICE_ID` (yearly)
- Business - `STRIPE_BUSINESS_PRICE_ID` (optional)

**Checkout Flow:**
1. User initiates upgrade in settings
2. Create/retrieve Stripe customer with metadata
3. Create checkout session
4. Redirect to Stripe-hosted checkout
5. On success, redirect to `/dashboard/settings?checkout=success`

**Subscription Management:**
- Portal: `POST /api/billing/portal` - Creates Stripe Customer Portal session
- Retrieve: `GET /api/billing/subscription` - Fetches current subscription status
- Invoices: `GET /api/billing/invoices` - Lists user's Stripe invoices

**Tier System:**
- User tier stored in `users.tier` column
- Updated via Stripe webhook handling
- Paid features gated by `requirePaidUser()` check

## Database RPC Functions

**`handle_stripe_webhook`:**
- Called from Stripe webhook handler
- Parameters: p_event_type, p_user_id, p_tier, p_stripe_subscription_id, p_stripe_customer_id
- Logic: Updates user tier and subscription tracking based on Stripe events

## API Routes Summary

**Authentication:**
- `POST /api/auth/signup` - Email/password signup
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/google` - Google OAuth initiation
- `GET /api/auth/callback` - OAuth callback handler

**Billing:**
- `POST /api/billing/checkout` - Create Stripe checkout session
- `GET /api/billing/subscription` - Get subscription status
- `POST /api/billing/portal` - Create billing portal session
- `GET /api/billing/invoices` - List Stripe invoices
- `POST /api/billing/webhook` - Stripe webhook endpoint

---

*Integration audit: 2026-02-11*
