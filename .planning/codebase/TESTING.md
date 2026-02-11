# Testing Patterns

**Analysis Date:** 2026-02-11

## Current State

**No automated tests exist in this codebase.** There are no test files, no test framework installed, and no test infrastructure configured. This is a significant gap given the critical nature of billing, authentication, and invoicing functionality.

## Test Framework

**Runner:**
- Not configured - No test runner installed (Jest, Vitest, etc. are absent from package.json)
- No test configuration files present

**Assertion Library:**
- Not configured

**Run Commands:**
- Not applicable (no tests present)

## Testing Recommendations

**Priority Areas to Test (in order of criticality):**

1. **Authentication & Authorization** - `src/lib/services/auth.service.ts`
   - Signup validation and user creation
   - Login flow and session management
   - Password reset flow with email verification
   - Token generation and validation
   - Timezone detection for time format preferences

2. **Billing Service** - `src/lib/services/billing.service.ts`
   - Stripe customer creation and subscription handling
   - Subscription period calculations (start/end dates)
   - Checkout session creation
   - Invoice fetching from Stripe
   - Customer metadata updates

3. **Invoice Operations** - `src/lib/services/invoice.service.ts`
   - Invoice creation with line items
   - Invoice status transitions (draft → sent → paid)
   - Invoice duplication
   - Invoice voiding
   - PDF generation and public link handling
   - Reminder email sending

4. **Validation Schemas** - `src/lib/utils/validation.ts`
   - All Zod schemas should have unit tests for edge cases
   - Required field validation
   - Currency enum validation
   - Date/time format validation
   - Pagination parameter validation

5. **Time Entry Operations** - `src/lib/services/time-entry.service.ts`
   - Timer start/stop/pause/resume
   - Time entry creation from timer
   - Billable flag toggling
   - Bulk operations (delete, mark billable, etc.)
   - Duration calculations

6. **Utility Functions** - `src/lib/utils/date.ts` and `src/lib/utils/currency.ts`
   - Duration formatting (HH:MM:SS, human-readable, decimal hours)
   - Date range calculations
   - Date arithmetic
   - Currency formatting
   - Timezone-aware operations

## Suggested Test Setup

**Recommended Stack for this codebase:**

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "@testing-library/react": "^15.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "msw": "^2.1.0",
    "@vitest/coverage-v8": "^2.0.0"
  }
}
```

**Rationale:**
- Vitest: Modern, fast, ESM-first test runner (preferred over Jest for Next.js 16)
- Testing Library: React component testing following best practices
- MSW (Mock Service Worker): API mocking at the network level
- Coverage: Built-in coverage reporting

## Test File Organization

**Suggested Location Pattern:**

Co-located test files with implementation:

```
src/
├── lib/
│   ├── services/
│   │   ├── user.service.ts
│   │   ├── user.service.test.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.test.ts
│   │   ├── billing.service.ts
│   │   └── billing.service.test.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── validation.test.ts
│   │   ├── date.ts
│   │   └── date.test.ts
│   └── hooks/
│       ├── use-auth.ts
│       └── use-auth.test.tsx
├── components/
│   ├── timer/
│   │   ├── timer-controls.tsx
│   │   └── timer-controls.test.tsx
```

**Naming:**
- Test files: `[name].test.ts` for utilities/services
- Test files: `[name].test.tsx` for React components
- Spec files: Alternative `[name].spec.ts(x)` (optional)

## Test Structure Pattern

**Utility/Service Tests:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { formatDate, formatDuration, isToday } from '@/lib/utils/date'

describe('date utilities', () => {
  describe('formatDate', () => {
    it('should format ISO date string to readable format', () => {
      const result = formatDate('2026-02-11T10:30:00Z')
      expect(result).toMatch(/Feb 11, 2026/)
    })

    it('should handle Date object', () => {
      const date = new Date('2026-02-11T10:30:00Z')
      const result = formatDate(date)
      expect(result).toMatch(/Feb 11, 2026/)
    })
  })

  describe('formatDuration', () => {
    it('should convert seconds to HH:MM:SS', () => {
      expect(formatDuration(3661)).toBe('01:01:01')
      expect(formatDuration(0)).toBe('00:00:00')
      expect(formatDuration(59)).toBe('00:00:59')
    })
  })

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true)
    })

    it('should return false for past date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isToday(yesterday)).toBe(false)
    })
  })
})
```

**Service Tests with Mocking:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { getProfile, updateSettings } from '@/lib/services/user.service'
import { ValidationError } from '@/lib/utils/errors'

vi.mock('@/lib/supabase/server')
vi.mock('./auth.service', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com'
  })
}))

describe('user service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should fetch user profile via RPC', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: { user_id: 'test-id', full_name: 'Test User' },
        error: null
      })

      vi.mocked(createClient).mockResolvedValue({
        rpc: mockRpc as any
      } as any)

      const result = await getProfile()

      expect(mockRpc).toHaveBeenCalledWith('get_user_profile', {
        p_user_id: 'test-user-id'
      })
      expect(result).toEqual(expect.objectContaining({
        full_name: 'Test User'
      }))
    })

    it('should throw ValidationError on RPC failure', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('RPC failed')
      })

      vi.mocked(createClient).mockResolvedValue({
        rpc: mockRpc as any
      } as any)

      await expect(getProfile()).rejects.toThrow(ValidationError)
    })
  })
})
```

**Component Tests:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimerControls } from '@/components/timer/timer-controls'

vi.mock('@/contexts', () => ({
  useTimerContext: vi.fn().mockReturnValue({
    timerState: 'idle',
    displayTime: '00:00:00',
    description: '',
    projectId: null,
    project: null,
    isBillable: true,
    isSubmitting: false,
    descriptionInputRef: null,
    projectSelectRef: null,
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
    discardTimer: vi.fn(),
    setDescription: vi.fn(),
    setProjectId: vi.fn(),
    setIsBillable: vi.fn()
  })
}))

describe('TimerControls', () => {
  it('should render timer display', () => {
    render(<TimerControls variant="desktop" />)
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('should handle mobile variant', () => {
    render(<TimerControls variant="mobile" />)
    expect(screen.getByPlaceholderText('What are you working on?')).toBeInTheDocument()
  })
})
```

## Mocking Strategy

**What to Mock:**
- Supabase client methods (RPC calls, auth operations)
- External services (Stripe API, email service, Resend)
- API fetch calls
- localStorage and sessionStorage
- Router navigation

**What NOT to Mock:**
- Utility functions (date formatting, currency formatting, validation)
- Custom error classes
- Business logic functions unless they depend on mocked services
- Zod schema validation

**Mocking Example with Supabase:**

```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn()
}))

// In test:
const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: '123', name: 'Test' },
          error: null
        })
      })
    })
  }),
  rpc: vi.fn().mockResolvedValue({
    data: { /* response data */ },
    error: null
  })
}

vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
```

## Async Testing Pattern

```typescript
describe('async operations', () => {
  it('should handle async function', async () => {
    const result = await asyncFunction()
    expect(result).toBeDefined()
  })

  it('should handle errors in async operations', async () => {
    await expect(failingAsyncFunction())
      .rejects
      .toThrow(ValidationError)
  })
})
```

## Error Testing Pattern

```typescript
describe('error handling', () => {
  it('should throw ValidationError with custom message', () => {
    expect(() => {
      throw new ValidationError('Custom message')
    }).toThrow(ValidationError)
  })

  it('should include error code in response', () => {
    const error = new NotFoundError('User')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })

  it('should serialize errors to JSON', () => {
    const error = new ValidationError('Invalid input', {
      name: ['Name is required']
    })
    const json = error.toJSON()
    expect(json.error.errors).toEqual({
      name: ['Name is required']
    })
  })
})
```

## Test Configuration (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        '**/*.test.ts',
        '**/*.test.tsx'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

## Coverage Goals

**Target Coverage:**
- Lines: 70%+
- Functions: 70%+
- Branches: 65%+ (complex conditionals often lower)
- Statements: 70%+

**Critical paths requiring 80%+ coverage:**
- Authentication flows
- Billing operations
- Invoice CRUD operations
- Payment processing
- Validation schemas

## Critical Test Cases by Module

**Authentication (`src/lib/services/auth.service.ts`):**
- [ ] Valid signup creates user and sends verification email
- [ ] Invalid email rejects signup
- [ ] Weak password rejects signup
- [ ] Existing email prevents signup (conflict)
- [ ] Login with valid credentials returns session
- [ ] Login with invalid password fails
- [ ] Password reset sends email with token
- [ ] Invalid token rejects password reset confirmation
- [ ] Email verification marks user as verified
- [ ] Timezone-based time format detection works correctly

**Billing (`src/lib/services/billing.service.ts`):**
- [ ] Stripe customer creation succeeds
- [ ] Subscription creation returns checkout session
- [ ] Existing subscription prevents duplicate subscription
- [ ] Stripe API errors handled gracefully
- [ ] Subscription period calculated correctly
- [ ] Invoice fetching from Stripe returns valid data
- [ ] Customer email updates sync to Stripe

**Invoices (`src/lib/services/invoice.service.ts`):**
- [ ] Invoice creation with valid line items succeeds
- [ ] Invoice number auto-generated if not provided
- [ ] Invoice status transitions validated (draft → sent → paid)
- [ ] Duplicate invoice copies all fields except ID
- [ ] Void invoice marks as void
- [ ] Invoice reminder email sent successfully
- [ ] Public invoice access via token works
- [ ] PDF generation returns valid PDF bytes

**Validation (`src/lib/utils/validation.ts`):**
- [ ] Client schema rejects invalid email
- [ ] Project schema enforces min/max constraints
- [ ] Invoice schema requires at least one line item
- [ ] Time entry schema accepts optional end_time
- [ ] Pagination schema coerces number strings
- [ ] Boolean string parsing handles 'true', 'false', '1', '0'
- [ ] Currency enum validates supported currencies

---

*Testing analysis: 2026-02-11*

**Note:** This codebase currently has zero test coverage. Implementation should begin with the critical areas identified above, prioritizing authentication and billing operations due to their security and financial impact.
