# Coding Conventions

**Analysis Date:** 2026-02-11

## Naming Patterns

**Files:**
- Component files: PascalCase (e.g., `timer-controls.tsx`, `auth-context.tsx`)
- Service files: kebab-case with `.service.ts` suffix (e.g., `user.service.ts`, `invoice.service.ts`)
- Hook files: kebab-case with `use-` prefix (e.g., `use-auth.ts`, `use-timer.ts`)
- Utility files: kebab-case (e.g., `validation.ts`, `date.ts`, `errors.ts`)
- Type/database files: kebab-case (e.g., `database.ts`, `api.ts`)
- UI component subdirectories use kebab-case (e.g., `/ui/`, `/timer/`, `/dashboard/`)

**Functions:**
- Async functions: camelCase (e.g., `getProfile()`, `updateSettings()`, `listInvoices()`)
- Handler functions: camelCase with `handle` prefix (e.g., `handleStart()`, `handleDiscard()`)
- React component functions: PascalCase (e.g., `TimerControls`, `AuthProvider`, `CardHeader()`)
- Format/utility functions: camelCase with semantic prefix (e.g., `formatDate()`, `formatDuration()`, `parseDuration()`)
- Type guards: camelCase with `is` prefix (e.g., `isAppError()`, `isToday()`, `isPast()`)
- Calculate/derive functions: camelCase with semantic verb (e.g., `getCurrentWeekRange()`, `getRelativeTime()`, `diffInDays()`)

**Variables:**
- Local variables: camelCase (e.g., `currentUser`, `timerState`, `description`)
- Constants: SCREAMING_SNAKE_CASE or camelCase depending on scope
  - Module-level constants: SCREAMING_SNAKE_CASE (e.g., `TIMER_STORAGE_KEY`, `SYNC_INTERVAL`)
  - Object/config constants: camelCase (e.g., `defaultProps`, `params`)
- State variables: camelCase (e.g., `isSubmitting`, `authError`, `projectId`)
- Boolean flags: camelCase with `is`/`has` prefix (e.g., `isBillable`, `isLoading`, `hasError`)
- Error objects: camelCase (e.g., `error`, `otpError`, `insertError`)

**Types:**
- Type names: PascalCase (e.g., `User`, `UserSettings`, `TimerState`, `AuthContextType`)
- Type exports: PascalCase (e.g., `CreateClientInput`, `UpdateProjectInput`, `UserWithSettings`)
- Zod schemas: camelCase with `Schema` suffix (e.g., `createClientSchema`, `updateProjectSchema`)
- Interface names: PascalCase with optional `Type` suffix for context interfaces (e.g., `AuthContextType`, `TimerControlsProps`)

## Code Style

**Formatting:**
- No explicit formatter configured (Prettier not present)
- ESLint enforces Next.js and TypeScript standards
- Use consistent spacing: 2-space indentation throughout

**Linting:**
- ESLint 9 with Next.js 16 configuration
- Config file: `eslint.config.mjs` (ESLint flat config format)
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` extends
- Key rules: Standard Next.js and TypeScript best practices enforced
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`
- ESLint disable comments used sparingly for TypeScript type assertions (e.g., `// eslint-disable-next-line @typescript-eslint/no-explicit-any`)

## Import Organization

**Order:**
1. React/Next.js imports (e.g., `import { useState } from 'react'`)
2. Third-party library imports (e.g., `import useSWR from 'swr'`, `import { z } from 'zod'`)
3. Local absolute imports from `@/` paths (e.g., `import { createClient } from '@/lib/supabase/server'`)
4. Relative imports (rarely used; absolute paths preferred)
5. Type imports (separated with `type` keyword if needed)

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in tsconfig.json)
- All imports should use `@/` prefix instead of relative paths
- Example: `import { cn } from '@/lib/utils'` instead of `import { cn } from '../../../lib/utils'`

**Example import structure:**
```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { authApi } from '@/lib/api'
import type { User, SessionResponse } from '@/types'
```

## Error Handling

**Patterns:**
- Custom error classes extend base `AppError` class
- Error hierarchy:
  - `AppError` - Base class with `statusCode` and `code` properties
  - `ValidationError` - Input validation errors (400)
  - `NotFoundError` - Resource not found (404)
  - `UnauthorizedError` - Authentication required (401)
  - `ForbiddenError` - Permission denied (403)
  - `PaymentRequiredError` - Subscription required (402)
  - `ConflictError` - Duplicate resource (409)
  - `RateLimitError` - Too many requests (429)
- All errors have `toJSON()` method for consistent API responses
- Type guard function: `isAppError(error)` for runtime checks
- Error handling: `handleError(error)` returns formatted Response object
- Service functions throw custom errors; API routes catch and format with `handleError()`
- Console logging for errors with context prefix (e.g., `console.error('[User] get_user_profile RPC error:', error)`)

## Logging

**Framework:** `console` (browser and server)

**Patterns:**
- Log errors with context prefix: `console.error('[Module] Operation description:', error)`
- Logging placed strategically in error paths and critical operations
- Used in: service layer for RPC errors, auth flows, email sends
- No structured logging or external logging service detected

## Comments

**When to Comment:**
- JSDoc comments on utility/format functions (e.g., `/** Format seconds into HH:MM:SS format */`)
- Inline comments explaining non-obvious logic (e.g., timezone detection, crypto operations)
- Comments in service files explain RPC operations and error handling
- Comments mark subtle behavior (e.g., timezone-based time format detection logic)

**JSDoc/TSDoc:**
- Used selectively on utility functions with clear purpose
- Pattern: Single-line JSDoc before function definition
- Example: `/** Format date for display */` above `formatDate()` function
- Not required on every function; typically on helper/utility functions
- React component JSDoc rarely used

## Function Design

**Size:** Functions typically 20-80 lines
- Service functions: 50-100+ lines (include validation, error handling, RPC calls)
- Hook functions: 30-80 lines (include state setup, effects, callbacks)
- Component functions: 50-150 lines (JSX + logic)
- Utility functions: 5-30 lines (focused single purpose)

**Parameters:**
- Use object destructuring for multiple parameters: `function updateSettings(data: Partial<UpdateUserSettings>)`
- Type parameters explicitly (no implicit `any`)
- Optional parameters use `?` with default values
- Named parameters preferred over positional for clarity

**Return Values:**
- Async functions return typed Promises: `Promise<User>`, `Promise<UserSettings>`
- RPC calls return typed responses with error handling
- API endpoints return `Response.json()` with status codes
- Component functions return JSX elements or `ReactNode`
- Hook functions return objects with state and callbacks

## Module Design

**Exports:**
- Named exports preferred for functions and constants
- Default exports used only for React components in some cases
- Type exports separated with `type` keyword: `export type UserWithSettings = ...`
- Zod schemas exported as named constants
- Index files (`index.ts`) used for barrel exports in hook and API directories

**Barrel Files:**
- Location: `src/lib/hooks/index.ts` and `src/lib/api/index.ts`
- Used to simplify imports: `import { useAuth, useTimer } from '@/lib/hooks'`
- Reduces import path complexity across the application
- Example: `src/contexts/index.ts` exports all context providers

## TypeScript Configuration

**Strict Mode:** Enabled
- `strict: true` enforces strict type checking
- `noEmit: true` - Type checking only, no output files
- `skipLibCheck: true` - Skip type checking of dependencies
- Requires explicit type annotations in critical paths
- No implicit `any` allowed (uses `any` comments for exceptions)

## API Route Patterns

**HTTP Handlers:**
- Named exports for HTTP methods: `export async function GET(request: NextRequest)`
- Input validation: Zod safeParse on request body/params
- Response format: `Response.json({ data: result })` with status codes
- Error handling: All errors caught and passed to `handleError()`
- Status codes: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Internal Error)

## Validation Patterns

**Zod Schemas:**
- Comprehensive schema definitions in `src/lib/utils/validation.ts`
- Schemas for: CRUD inputs, query parameters, pagination, pagination, bulk actions
- Type exports: `export type CreateClientInput = z.infer<typeof createClientSchema>`
- Usage: `safeParse()` with explicit error handling
- Field-level errors included in validation responses: `parsed.error.flatten().fieldErrors`

---

*Convention analysis: 2026-02-11*
