# BillMint Backend Implementation Plan

## Status: ✅ BACKEND COMPLETE

All 7 phases of backend implementation are complete. The application builds successfully and all API routes, services, hooks, and contexts are in place.

**Next Steps:**
1. Configure Supabase database with the required schema
2. Set up environment variables in `.env.local`
3. Update dashboard pages to use real data hooks instead of mock data
4. Test all functionality end-to-end

---

## Overview
Build the business logic layer for BillMint following the architecture in `BillMint_BackendArchitecture.md`. The frontend UI is complete with mock data - this plan connects it to a real Supabase backend.

---

## Phase 1: Foundation Setup ✅ COMPLETE

### 1.1 Environment Configuration
Create `.env.example` with required variables:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Stripe (for billing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend (for email)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 1.2 Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr zod swr stripe resend
```

### 1.3 Supabase Client Setup
Create files:
- `src/lib/supabase/client.ts` - Browser client using `createBrowserClient`
- `src/lib/supabase/server.ts` - Server client using `createServerClient`
- `src/lib/supabase/middleware.ts` - Auth middleware helper

---

## Phase 2: Core Utilities ✅ COMPLETE

### 2.1 Error Handling (`src/lib/utils/errors.ts`)
- `AppError` base class
- `ValidationError`, `NotFoundError`, `UnauthorizedError`, `PaymentRequiredError`

### 2.2 Validation Schemas (`src/lib/utils/validation.ts`)
Zod schemas for all entities:
- `createClientSchema`, `updateClientSchema`
- `createProjectSchema`, `updateProjectSchema`
- `createTimeEntrySchema`, `updateTimeEntrySchema`
- `createInvoiceSchema`, `updateInvoiceSchema`
- `startTimerSchema`, `syncTimerSchema`

### 2.3 Date/Currency Utils (`src/lib/utils/`)
- `date.ts` - Duration formatting, date calculations
- `currency.ts` - Currency formatting

---

## Phase 3: Database Types ✅ COMPLETE

### 3.1 Generate Types
- `src/types/database.ts` - Supabase generated types (can use `supabase gen types typescript`)
- `src/types/api.ts` - Request/Response types for API routes
- `src/types/index.ts` - Re-exports

---

## Phase 4: Service Layer ✅ COMPLETE

### Level 0-1: Core Services
1. **`src/lib/services/auth.service.ts`**
   - `signup`, `login`, `logout`, `getSession`, `getCurrentUser`
   - OAuth methods for Google
   - Password reset flow

### Level 2: User & Billing
2. **`src/lib/services/user.service.ts`**
   - `getProfile`, `updateProfile`, `deleteAccount`
   - `getSettings`, `updateSettings`
   - `getUserTier`

3. **`src/lib/services/billing.service.ts`**
   - `getSubscription`, `createCheckoutSession`, `createPortalSession`
   - `handleWebhook`, `isUserPaid`

### Level 3: Clients & Projects
4. **`src/lib/services/client.service.ts`**
   - CRUD operations: `list`, `create`, `getById`, `update`, `delete`
   - Related: `getProjects`, `getInvoices`

5. **`src/lib/services/project.service.ts`**
   - CRUD operations
   - `getEntries`, `getStats`, `archive`

### Level 4: Time Tracking
6. **`src/lib/services/time-entry.service.ts`**
   - CRUD operations with filtering
   - `getUnbilled`, `markAsInvoiced`

7. **`src/lib/services/timer.service.ts`**
   - `getActive`, `start`, `stop`, `pause`, `resume`, `discard`, `sync`

### Level 5: Invoicing (Paid Feature)
8. **`src/lib/services/invoice.service.ts`**
   - CRUD operations
   - Actions: `send`, `sendReminder`, `markAsPaid`, `void`
   - PDF: `generatePdf`
   - Public: `getPublic`

### Level 6: Aggregation
9. **`src/lib/services/dashboard.service.ts`**
   - `getStats`, `getRecentEntries`, `getActivity`

10. **`src/lib/services/report.service.ts`** (Paid)
    - Report generation and export

---

## Phase 5: API Routes ✅ COMPLETE

### Auth Routes (`src/app/api/auth/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/signup` | POST | Create new account |
| `/login` | POST | Email/password login |
| `/logout` | POST | End session |
| `/session` | GET | Get current session |
| `/google` | GET | Initiate Google OAuth |
| `/google/callback` | GET | Handle OAuth callback |

### User Routes (`src/app/api/users/me/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Get profile |
| `/` | PATCH | Update profile |
| `/` | DELETE | Delete account |
| `/settings` | GET | Get settings |
| `/settings` | PATCH | Update settings |

### Client Routes (`src/app/api/clients/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | List clients |
| `/` | POST | Create client |
| `/[id]` | GET | Get client |
| `/[id]` | PATCH | Update client |
| `/[id]` | DELETE | Archive client |

### Project Routes (`src/app/api/projects/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | List projects |
| `/` | POST | Create project |
| `/[id]` | GET | Get project |
| `/[id]` | PATCH | Update project |
| `/[id]` | DELETE | Archive project |
| `/[id]/entries` | GET | Project's entries |
| `/[id]/stats` | GET | Project statistics |

### Time Entry Routes (`src/app/api/time-entries/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | List entries (filterable) |
| `/` | POST | Create entry |
| `/unbilled` | GET | Unbilled entries |
| `/[id]` | GET | Get entry |
| `/[id]` | PATCH | Update entry |
| `/[id]` | DELETE | Delete entry |

### Timer Routes (`src/app/api/timer/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Get active timer |
| `/start` | POST | Start timer |
| `/stop` | POST | Stop and create entry |
| `/pause` | POST | Pause timer |
| `/resume` | POST | Resume timer |
| `/discard` | POST | Discard timer |

### Invoice Routes (`src/app/api/invoices/`) - PAID FEATURE
| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | List invoices |
| `/` | POST | Create invoice |
| `/[id]` | GET | Get invoice |
| `/[id]` | PATCH | Update (draft only) |
| `/[id]` | DELETE | Delete (draft only) |
| `/[id]/send` | POST | Send email |
| `/[id]/mark-paid` | POST | Mark as paid |
| `/[id]/void` | POST | Void invoice |
| `/[id]/pdf` | GET | Download PDF |

### Dashboard Routes (`src/app/api/dashboard/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/stats` | GET | Overview stats |
| `/recent` | GET | Recent entries |

### Billing Routes (`src/app/api/billing/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/subscription` | GET | Get subscription |
| `/checkout` | POST | Stripe checkout |
| `/portal` | POST | Stripe portal |
| `/webhook` | POST | Stripe webhook |

---

## Phase 6: Frontend Integration ✅ COMPLETE

### 6.1 API Client (`src/lib/api/`)
- `client.ts` - Base fetcher with error handling
- `auth.ts` - Auth API functions
- `clients.ts` - Clients API functions
- `projects.ts` - Projects API functions
- `time-entries.ts` - Time entries API functions
- `timer.ts` - Timer API functions
- `invoices.ts` - Invoices API functions
- `dashboard.ts` - Dashboard API functions

### 6.2 Hooks (`src/lib/hooks/`)
- `use-auth.ts` - Auth state management
- `use-timer.ts` - Timer state with localStorage sync
- `use-clients.ts` - Clients data fetching
- `use-projects.ts` - Projects data fetching
- `use-time-entries.ts` - Time entries data fetching
- `use-invoices.ts` - Invoices data fetching
- `use-paid-feature.ts` - Feature gating

### 6.3 Contexts (`src/contexts/`)
- `auth-context.tsx` - User session, tier
- `timer-context.tsx` - Active timer state
- `ui-context.tsx` - UI state (sidebar collapsed, etc.)

---

## Phase 7: Middleware ✅ COMPLETE

### 7.1 Auth Middleware (`src/middleware.ts`)
- Protect dashboard routes
- Redirect unauthenticated users to login
- Handle paid feature routes (return 402)

---

## Files Summary

### New Files (~50+)
| Category | Files |
|----------|-------|
| Config | `.env.example` |
| Supabase | `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts` |
| Utils | `src/lib/utils/errors.ts`, `validation.ts`, `date.ts`, `currency.ts` |
| Types | `src/types/database.ts`, `api.ts`, `index.ts` |
| Services | 10 service files in `src/lib/services/` |
| API Routes | 30+ route files in `src/app/api/` |
| API Client | 8 client files in `src/lib/api/` |
| Hooks | 7 hook files in `src/lib/hooks/` |
| Contexts | 3 context files in `src/contexts/` |
| Middleware | `src/middleware.ts` |

### Existing Files to Update
- `/src/app/dashboard/layout.tsx` - Wrap with providers
- `/src/app/login/page.tsx` - Connect to auth API
- `/src/app/signup/page.tsx` - Connect to auth API
- `/src/app/dashboard/page.tsx` - Use real data hooks
- `/src/app/dashboard/time-entries/page.tsx` - Use real data
- `/src/app/dashboard/projects/page.tsx` - Use real data
- `/src/app/dashboard/clients/page.tsx` - Use real data
- `/src/app/dashboard/invoices/page.tsx` - Use real data
- `/src/app/dashboard/invoices/new/page.tsx` - Use real data
- `/src/app/dashboard/settings/page.tsx` - Use real data

---

## Verification Checklist

> **Note**: All backend code is implemented. Testing requires valid Supabase credentials and database schema.

- [ ] **Auth Flow**: Sign up, log in, log out, password reset
- [ ] **CRUD Operations**: Create/read/update/delete for clients, projects, time entries
- [ ] **Timer**: Start, pause, resume, stop (creates time entry)
- [ ] **Invoices**: Create invoice, add line items, send, mark paid
- [ ] **Dashboard**: Stats load correctly
- [ ] **Paid Features**: 402 error for free users on invoice routes

---

## Implementation Order

1. ✅ Foundation (env, deps, supabase client)
2. ✅ Utilities (errors, validation, types)
3. ✅ Core services (auth, user)
4. ✅ CRUD services (client, project, time-entry)
5. ✅ Timer service
6. ✅ API routes for above
7. ✅ Frontend hooks and contexts
8. ⏳ Connect UI pages to hooks (hooks ready, pages use mock data)
9. ✅ Invoice service and routes (paid feature)
10. ✅ Billing integration
11. ✅ Dashboard aggregation

---

## Related Documents
- `BillMint_BackendArchitecture.md` - Full architecture specification
- `BillMint_MVP_UI_Spec.md` - UI specifications