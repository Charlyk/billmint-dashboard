# BillMint Production Readiness Checklist

## Overview

This checklist covers everything needed before launching BillMint to real users. Not everything is required for day 1, but core items are marked as **[MUST]** vs **[NICE]**.

---

## 1. Core Features Working

### Timer
- [x] **[MUST]** Start/pause/resume/stop works
- [x] **[MUST]** Timer persists across page refresh
- [x] **[MUST]** Timer recovers after browser close
- [x] **[MUST]** Only one active timer per user
- [x] **[MUST]** Optimistic UI (feels instant)
- [x] **[MUST]** Description/project editable while running
- [x] **[MUST]** Billable toggle works
- [x] **[NICE]** Keyboard shortcuts
- [x] **[NICE]** Auto-pause after X hours
- [x] **[NICE]** Tab title shows running time

### Time Entries
- [x] **[MUST]** List entries grouped by day
- [x] **[MUST]** Create manual entry
- [x] **[MUST]** Edit entry (description, project, duration, billable)
- [x] **[MUST]** Delete entry
- [x] **[MUST]** Filter by date range
- [x] **[NICE]** Filter by project/client
- [x] **[NICE]** Duplicate entry
- [x] **[NICE]** Bulk actions

### Projects
- [x] **[MUST]** Create project (name, client, rate, currency, color)
- [x] **[MUST]** Edit project
- [x] **[MUST]** Archive project
- [x] **[MUST]** Rate inheritance (project → profile default)
- [ ] **[NICE]** Delete project (with entries check)

### Clients
- [x] **[MUST]** Create client (name, email, address)
- [x] **[MUST]** Edit client
- [x] **[MUST]** Archive client
- [ ] **[NICE]** Delete client (with projects/invoices check)

### Invoices
- [x] **[MUST]** Create invoice with line items
- [x] **[MUST]** Import unbilled time as line items
- [x] **[MUST]** Auto-calculate totals
- [x] **[MUST]** Save as draft
- [x] **[MUST]** Send invoice (mark as sent)
- [x] **[MUST]** Public invoice view (shareable link)
- [x] **[MUST]** Mark as paid
- [x] **[MUST]** Invoice number auto-generation
- [x] **[NICE]** PDF download
- [x] **[NICE]** Void invoice
- [x] **[NICE]** Duplicate invoice

### Dashboard
- [x] **[MUST]** Today's time + earnings
- [x] **[MUST]** This week's time + earnings
- [x] **[MUST]** Unbilled amount
- [x] **[MUST]** Recent entries list
- [x] **[NICE]** Overdue invoices alert

### Settings
- [x] **[MUST]** Update profile (name)
- [x] **[MUST]** Set default hourly rate
- [x] **[MUST]** Set default currency
- [x] **[MUST]** Set timezone
- [x] **[NICE]** Auto-pause timer setting
- [x] **[NICE]** Delete account

---

## 2. Authentication & Authorization

### Auth
- [x] **[MUST]** Sign up with email/password
- [x] **[MUST]** Login
- [x] **[MUST]** Logout
- [x] **[MUST]** Password reset flow
- [ ] **[NICE]** Google OAuth
- [ ] **[NICE]** Email verification

### Authorization
- [x] **[MUST]** Users can only see their own data
- [x] **[MUST]** RLS policies on all tables
- [x] **[MUST]** API routes check user ownership
- [ ] **[MUST]** Public invoice route validates token (not user)

---

## 3. Data Integrity

### Validation
- [ ] **[MUST]** Required fields enforced (client-side)
- [ ] **[MUST]** Required fields enforced (server-side)
- [ ] **[MUST]** Email format validation
- [ ] **[MUST]** Positive numbers for rates/amounts
- [ ] **[MUST]** Duration cannot be negative
- [ ] **[MUST]** Invoice totals match line items

### Edge Cases
- [ ] **[MUST]** Can't delete project with unbilled entries (warn first)
- [ ] **[MUST]** Can't delete client with unpaid invoices (warn first)
- [ ] **[MUST]** Archiving works correctly (hidden from lists, data preserved)
- [ ] **[MUST]** Currency consistency on invoices

---

## 4. Error Handling

### API Errors
- [ ] **[MUST]** All API routes have try/catch
- [ ] **[MUST]** Meaningful error messages returned
- [ ] **[MUST]** 401 redirects to login
- [ ] **[MUST]** 404 shows not found page
- [ ] **[MUST]** 500 shows generic error (no stack trace)

### UI Errors
- [ ] **[MUST]** Toast notifications for errors
- [ ] **[MUST]** Form validation errors shown inline
- [ ] **[MUST]** Network error handling (offline state)
- [ ] **[MUST]** Optimistic UI reverts on error
- [ ] **[NICE]** Global error boundary

---

## 5. UI/UX Polish

### Loading States
- [ ] **[MUST]** Loading spinner/skeleton for lists
- [ ] **[MUST]** Button loading state (disabled + spinner)
- [ ] **[MUST]** No layout shift when data loads

### Empty States
- [ ] **[MUST]** No projects: "Create your first project"
- [ ] **[MUST]** No clients: "Add your first client"
- [ ] **[MUST]** No entries: "Start tracking time"
- [ ] **[MUST]** No invoices: "Create your first invoice"

### Confirmations
- [ ] **[MUST]** Confirm before delete (entries, projects, clients)
- [ ] **[MUST]** Confirm before discard timer
- [ ] **[MUST]** Confirm before void invoice
- [ ] **[NICE]** Unsaved changes warning

### Responsive
- [ ] **[MUST]** Works on desktop (1024px+)
- [ ] **[MUST]** Works on tablet (768px+)
- [ ] **[NICE]** Works on mobile (bottom nav)

### Accessibility
- [ ] **[MUST]** Keyboard navigation works
- [ ] **[MUST]** Focus states visible
- [ ] **[MUST]** Form labels present
- [ ] **[NICE]** Screen reader friendly

---

## 6. Performance

### Frontend
- [ ] **[MUST]** Pages load in <3 seconds
- [ ] **[MUST]** Timer tick doesn't cause re-renders
- [ ] **[MUST]** Lists virtualized if >100 items (or paginated)
- [ ] **[NICE]** Lighthouse score >80

### Backend
- [ ] **[MUST]** API responses <500ms
- [ ] **[MUST]** Database indexes on foreign keys
- [ ] **[MUST]** Database indexes on user_id columns
- [ ] **[MUST]** Paginated endpoints for lists

---

## 7. Security

### Data
- [ ] **[MUST]** HTTPS only
- [ ] **[MUST]** RLS enabled on all Supabase tables
- [ ] **[MUST]** No sensitive data in client-side logs
- [ ] **[MUST]** SQL injection prevented (parameterized queries)
- [ ] **[MUST]** XSS prevented (React escapes by default)

### Auth
- [ ] **[MUST]** Passwords hashed (Supabase handles this)
- [ ] **[MUST]** Session tokens secure (Supabase handles this)
- [ ] **[MUST]** Password reset tokens expire
- [ ] **[NICE]** Rate limiting on auth endpoints

### Invoices
- [ ] **[MUST]** Public invoice URLs use random tokens, not IDs
- [ ] **[MUST]** Tokens are unguessable (UUID or similar)

---

## 8. Payments (Stripe)

### Subscription
- [ ] **[MUST]** Free tier works without payment
- [ ] **[MUST]** Upgrade to Pro flow
- [ ] **[MUST]** Stripe Checkout integration
- [ ] **[MUST]** Webhook handles successful payment
- [ ] **[MUST]** Webhook handles failed payment
- [ ] **[MUST]** Webhook handles cancellation
- [ ] **[MUST]** User can see current plan
- [ ] **[NICE]** User can cancel subscription
- [ ] **[NICE]** User can update payment method

### Feature Gating
- [ ] **[MUST]** Free users: timer + entries only
- [ ] **[MUST]** Free users see upgrade prompt on invoices
- [ ] **[MUST]** Pro users: all features
- [ ] **[MUST]** Graceful handling if subscription lapses

---

## 9. Legal & Compliance

### Pages
- [ ] **[MUST]** Privacy Policy page
- [ ] **[MUST]** Terms of Service page
- [ ] **[NICE]** Cookie banner (if needed for your market)

### Data
- [ ] **[MUST]** Users can export their data
- [ ] **[MUST]** Users can delete their account
- [ ] **[NICE]** GDPR compliance documented

---

## 10. Infrastructure

### Hosting
- [ ] **[MUST]** Production environment set up (Vercel/other)
- [ ] **[MUST]** Environment variables configured
- [ ] **[MUST]** Domain connected (billmint.io)
- [ ] **[MUST]** SSL certificate active

### Database
- [ ] **[MUST]** Supabase production project (not dev)
- [ ] **[MUST]** Database backups enabled
- [ ] **[MUST]** Connection pooling configured
- [ ] **[NICE]** Read replicas if needed

### Monitoring
- [ ] **[MUST]** Error tracking (Sentry or similar)
- [ ] **[NICE]** Uptime monitoring
- [ ] **[NICE]** Performance monitoring
- [ ] **[NICE]** Analytics (Plausible/PostHog)

---

## 11. Pre-Launch Testing

### Manual Testing
- [ ] **[MUST]** Complete user flow: sign up → track time → create invoice
- [ ] **[MUST]** Test on Chrome, Firefox, Safari
- [ ] **[MUST]** Test on Mac and Windows
- [ ] **[MUST]** Test payment flow with Stripe test mode
- [ ] **[MUST]** Test password reset flow
- [ ] **[MUST]** Test with slow network (Chrome DevTools throttle)

### Data Testing
- [ ] **[MUST]** Test with empty account (new user)
- [ ] **[MUST]** Test with lots of data (100+ entries)
- [ ] **[MUST]** Test currency display (USD, EUR, RON)
- [ ] **[MUST]** Test timezone handling

### Edge Cases
- [ ] **[MUST]** Timer running when closing browser
- [ ] **[MUST]** Multiple tabs open
- [ ] **[MUST]** Session expires while using app
- [ ] **[MUST]** Network disconnects mid-action

---

## 12. Launch Prep

### Marketing
- [ ] **[NICE]** Landing page with value prop
- [ ] **[NICE]** Screenshots/demo GIF
- [ ] **[NICE]** Launch tweet/post ready
- [ ] **[NICE]** Product Hunt draft

### Support
- [ ] **[MUST]** Support email set up (support@billmint.io)
- [ ] **[NICE]** Help docs / FAQ
- [ ] **[NICE]** In-app feedback widget

### Backup Plan
- [ ] **[MUST]** Know how to rollback deploy
- [ ] **[MUST]** Know how to restore database
- [ ] **[MUST]** Have downtime page ready

---

## Launch Confidence Score

Count your **[MUST]** items completed:

| Score | Status |
|-------|--------|
| 100% | Ship it 🚀 |
| 90%+ | Ship it, fix rest in week 1 |
| 80%+ | Soft launch to beta users |
| <80% | Not ready |

---

## Post-Launch (Week 1)

- [ ] Monitor error tracking daily
- [ ] Respond to support emails <24h
- [ ] Fix critical bugs immediately
- [ ] Note feature requests for later
- [ ] Don't add features, stabilize first
