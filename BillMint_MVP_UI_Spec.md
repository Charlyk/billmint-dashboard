# BillMint.io - MVP UI Specification

## Document Info
- **Version:** 1.0
- **Date:** January 21, 2026
- **Scope:** 7 screens, few evenings build with Claude Code
- **Stack:** Next.js + COSS UI (Base UI + Tailwind) + Supabase

---

## Design Decisions (Keep It Simple)

**Component Library:** COSS UI (coss.com/ui) - Built on Base UI + Tailwind, copy-paste model

**Colors:** 
- Primary: `slate` (neutral, professional)
- Accent: `teal-500` (#14B8A6) - mint green, matches "BillMint" branding
- Use COSS UI defaults for everything else

**Typography:** System fonts (Inter if you want to add one)

**Layout:** 
- Top bar: Logo + persistent timer (always visible)
- Left sidebar: Collapsible, icons-only when collapsed, toggle button at bottom
- Mobile: Top bar with timer, bottom nav with icons
- Max content width: 1200px

**No dark mode for MVP.**

---

## Pricing Model

| Plan | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 1 user, time tracking only, no invoices |
| **Pro** | $5/month | Up to 5 users, unlimited invoices |
| **Team** | $10/month | Up to 50 users, unlimited invoices |

*Note: "Users" is for future team feature. MVP is single-user, so Pro at $5/month is the upgrade path.*

---

## Rate & Currency Inheritance

**Hierarchy:** Profile → Project → Time Entry

```
┌─────────────────────────────────────────────────────────────────┐
│ RATE RESOLUTION                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  When creating a time entry:                                    │
│                                                                 │
│  1. If project has hourly_rate → use project rate & currency    │
│  2. Else → use profile default_hourly_rate & default_currency   │
│                                                                 │
│  Entry stores: billable_amount (calculated), currency           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CURRENCY HANDLING                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Profile:   default_currency (e.g., "USD")                      │
│             default_hourly_rate (e.g., 75.00)                   │
│                                                                 │
│  Project:   currency (e.g., "EUR") - can differ from profile    │
│             hourly_rate (e.g., 80.00) - optional                │
│                                                                 │
│  Entry:     currency (inherited from project or profile)        │
│             billable_amount (rate × hours)                      │
│                                                                 │
│  Invoice:   currency (from client's entries - must match!)      │
│             All line items must be same currency                │
│                                                                 │
│  ⚠️  MVP: No currency conversion. Invoice shows warning if      │
│      entries have mixed currencies.                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Display logic:**
- Time entries list: Show amount in entry's currency (e.g., "$150.00" or "€120.00")
- Dashboard stats: Group by currency if mixed, or show primary currency
- Invoices: Only allow entries with matching currency

---

## Screen 1: Auth (Login/Signup)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        BillMint.io                              │
│                   Track time. Send invoices.                    │
│                                                                 │
│                 ┌─────────────────────────┐                     │
│                 │                         │                     │
│                 │   [Google Sign In]      │                     │
│                 │                         │                     │
│                 │   ──── or ────          │                     │
│                 │                         │                     │
│                 │   Email                 │                     │
│                 │   ┌───────────────────┐ │                     │
│                 │   │                   │ │                     │
│                 │   └───────────────────┘ │                     │
│                 │                         │                     │
│                 │   Password              │                     │
│                 │   ┌───────────────────┐ │                     │
│                 │   │                   │ │                     │
│                 │   └───────────────────┘ │                     │
│                 │                         │                     │
│                 │   [Sign In]             │                     │
│                 │                         │                     │
│                 │   Don't have account?   │                     │
│                 │   Sign up               │                     │
│                 │                         │                     │
│                 └─────────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- Card (centered, max-w-md)
- Input (email, password)
- Button (primary for submit, outline for Google)
- Link (toggle login/signup)

**Implementation:** Use Supabase Auth UI or build simple form that calls `supabase.auth.signInWithPassword()` / `signUp()` / `signInWithOAuth({ provider: 'google' })`

**States:**
- Login form
- Signup form (add "Name" field)
- Forgot password (just email field + "Send reset link")

---

## Screen 2: App Layout (Shell)

This layout wraps all authenticated screens.

### Desktop Layout
```
┌──────┬────────────────────────────────────────────────────────────────────────┐
│      │ 🌿 BillMint    [What are you working on?    ] [Project ▼] [$]          │
│  📊  │                                 02:34:15            [⏸][⏹ Stop]        │
│      ├────────────────────────────────────────────────────────────────────────┤
│  🕐  │                                                                        │
│      │                                                                        │
│  📁  │                                                                        │
│      │                                                                        │
│  👥  │                            PAGE CONTENT                                │
│      │                                                                        │
│  📄  │                                                                        │
│      │                                                                        │
│──────│                                                                        │
│  ⚙️  │                                                                        │
│      │                                                                        │
│  ◀▶  │                                                                        │
└──────┴────────────────────────────────────────────────────────────────────────┘

Icons (top to bottom):
📊 Dashboard
🕐 Time Entries  
📁 Projects
👥 Clients
📄 Invoices
─── separator ───
⚙️ Settings
◀▶ Toggle expand/collapse

Top bar elements:
[$] = Billable toggle (teal when billable, gray when non-billable)
```

### Desktop Layout - Sidebar Expanded
```
┌─────────────┬────────────────────────────────────────────────────────────────────────┐
│             │ 🌿 BillMint        [What are you working on?      ] [Project ▼]        │
│  Dashboard  │                                 02:34:15            [⏸][⏹ Stop]        │
│             ├────────────────────────────────────────────────────────────────────────┤
│  Time       │                                                                        │
│             │                                                                        │
│  Projects   │                                                                        │
│             │                                                                        │
│  Clients    │                            PAGE CONTENT                                │
│             │                                                                        │
│  Invoices   │                                                                        │
│             │                                                                        │
│─────────────│                                                                        │
│  Settings   │                                                                        │
│             │                                                                        │
│  ◀ Collapse │                                                                        │
└─────────────┴────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────────────────────┐
│ 🌿 BillMint                        [AV] │
├─────────────────────────────────────────┤
│ [What are you working on?  ] [Proj ▼]  │
│           02:34:15          [⏸][⏹]     │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│            PAGE CONTENT                 │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│   📊      🕐      📁      👥      📄    │
│  Home    Time  Projects Clients  Inv.  │
└─────────────────────────────────────────┘

Settings accessible via avatar menu [AV] on mobile
```

**Top Bar Components:**
- Logo (links to dashboard)
- Timer description input (text, placeholder: "What are you working on?" - **optional**)
- Project dropdown (compact - **optional**, can be set later)
- Billable toggle ($ icon, toggles billable/non-billable)
- Timer display (HH:MM:SS)
- Timer controls:
  - Idle state: [▶ Start] button (teal) - **starts immediately, no fields required**
  - Running state: [⏸ Pause] + [⏹ Stop] buttons
  - Paused state: [▶ Resume] + [⏹ Stop] + [🗑 Discard] buttons

**Timer Behavior:**
- User can click Start with empty description and no project selected
- Description and project can be added/changed while timer is running
- Billable status can be toggled anytime (during timer or on saved entry)
- When stopped, creates entry with whatever info was provided
- Missing project = entry shows "No Project" (can be edited later)

**Right Sidebar Components:**
- Nav items with icons (active state: teal background/text)
- Separator line before Settings
- Toggle button at bottom (◀ when expanded, ▶ when collapsed)
- Collapsed width: ~60px
- Expanded width: ~180px
- Transition: smooth slide animation

**Responsive Breakpoints:**
- Desktop: ≥1024px (right sidebar)
- Tablet: 768-1023px (right sidebar, collapsed by default)
- Mobile: <768px (bottom nav, no sidebar)

---

## Screen 3: Dashboard

```
┌──────┬────────────────────────────────────────────────────────────────────────┐
│      │ 🌿 BillMint        [What are you working on?      ] [Project ▼]        │
│  📊  │                                 00:00:00                  [▶ Start]    │
│      ├────────────────────────────────────────────────────────────────────────┤
│ ...  │                                                                        │
│      │  Dashboard                                                             │
│      │                                                                        │
│      │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐    │
│      │  │ Today             │ │ This Week         │ │ Unbilled          │    │
│      │  │ 2h 34m            │ │ 24h 15m           │ │ $2,450            │    │
│      │  │ $187.50           │ │ $1,890            │ │ 32.5 hours        │    │
│      │  └───────────────────┘ └───────────────────┘ └───────────────────┘    │
│      │                                                                        │
│      │  Recent Entries                                     [View all →]      │
│      │  ┌─────────────────────────────────────────────────────────────────┐  │
│      │  │ Today                                                            │  │
│      │  │ ● API integration work          ProjectX       2h 15m   $168.75 │  │
│      │  │ ● Bug fixes                     ProjectX       1h 30m   $112.50 │  │
│      │  │                                                                  │  │
│      │  │ Yesterday                                                        │  │
│      │  │ ● Client meeting                ClientY        0h 45m    $56.25 │  │
│      │  │ ● Design review                 ProjectX       2h 00m   $150.00 │  │
│      │  └─────────────────────────────────────────────────────────────────┘  │
│      │                                                                        │
└──────┴────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- Stat cards (3x grid)
- Recent entries list (grouped by date)

**Timer is now in top bar, not on this page.**

---

## Screen 4: Time Entries

```
┌──────┬────────────────────────────────────────────────────────────────────────┐
│      │ 🌿 BillMint        [What are you working on?      ] [Project ▼]        │
│  📊  │                                 00:00:00                  [▶ Start]    │
│      ├────────────────────────────────────────────────────────────────────────┤
│  🕐  │                                                                        │
│      │  Time Entries                                       [+ Add Entry]     │
│  📁  │                                                                        │
│      │  ┌─────────────────────────────────────────────────────────────────┐  │
│  👥  │  │ Filters:  [This Week ▼]   [All Projects ▼]   [All Clients ▼]    │  │
│      │  └─────────────────────────────────────────────────────────────────┘  │
│  📄  │                                                                        │
│      │  ┌─────────────────────────────────────────────────────────────────┐  │
│──────│  │                                                                  │  │
│  ⚙️  │  │  Mon, Jan 20                                     Total: 6h 30m  │  │
│      │  │  ──────────────────────────────────────────────────────────────  │  │
│  ◀▶  │  │  ● API integration      [$]  ProjectX    2h 15m   $168.75  [⋮]  │  │
│      │  │  ● Bug fixes            [$]  ProjectX    1h 30m   $112.50  [⋮]  │  │
│      │  │  ● Client call          [–]  ClientY     0h 45m        –   [⋮]  │  │
│      │  │  ● Code review          [$]  ProjectX    2h 00m   $150.00  [⋮]  │  │
│      │  │                                                                  │  │
│      │  │  Sun, Jan 19                                     Total: 4h 00m  │  │
│      │  │  ──────────────────────────────────────────────────────────────  │  │
│      │  │  ● Planning session     [$]  ProjectZ    2h 00m   $150.00  [⋮]  │  │
│      │  │  ● Documentation        [$]  ProjectZ    2h 00m   $150.00  [⋮]  │  │
│      │  │                                                                  │  │
│      │  └─────────────────────────────────────────────────────────────────┘  │
│      │                                                                        │
│      │  Showing 24 entries • 32h 15m total • $2,418.75 billable              │
│      │                                                                        │
│      │  [$] = Billable (teal, clickable to toggle)                           │
│      │  [–] = Non-billable (gray, clickable to toggle)                       │
│      │                                                                        │
└──────┴────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- Page header with "Add Entry" button
- Filter bar (date range select, project select, client select, clear button)
- Entries list grouped by date
- Entry row (color dot, description, project, duration, amount, actions menu)
- Summary footer

**Entry Row Actions (⋮ dropdown):**
- Edit
- Duplicate
- Delete

**Add/Edit Entry Modal:**
```
┌─────────────────────────────────────────┐
│ Add Time Entry                     [x]  │
├─────────────────────────────────────────┤
│                                         │
│ Description                             │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Project                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Select project (optional)      ▼   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Date                Duration            │
│ ┌───────────────┐   ┌─────────────────┐ │
│ │ Jan 20, 2026  │   │ 2h 30m          │ │
│ └───────────────┘   └─────────────────┘ │
│                                         │
│ ☑ Billable                              │
│                                         │
│           [Cancel]  [Save Entry]        │
└─────────────────────────────────────────┘
```

**Billable checkbox behavior:**
- Default: checked (billable) - inherits from project setting if project selected
- When unchecked: entry won't contribute to billable amounts
- Can be toggled anytime, even after entry is saved

**Duration Input:** Accept formats like "2h 30m", "2.5", "2:30", "150m" - parse to seconds

---

## Screen 5: Projects

```
┌──────┬────────────────────────────────────────────────────────────────────────┐
│      │ 🌿 BillMint        [What are you working on?      ] [Project ▼]        │
│  📊  │                                 00:00:00                  [▶ Start]    │
│      ├────────────────────────────────────────────────────────────────────────┤
│  🕐  │                                                                        │
│      │  Projects                                       [+ New Project]       │
│  📁  │                                                                        │
│      │  ┌─────────────────────────────────────────────────────────────────┐  │
│  👥  │  │                                                                  │  │
│      │  │  ●  Website Redesign                                            │  │
│  📄  │  │     ClientName Inc.                                              │  │
│      │  │     €80/hr • 45h tracked • €3,600 total                  [⋮]    │  │
│──────│  │                                                                  │  │
│  ⚙️  │  │  ●  Mobile App MVP                                              │  │
│      │  │     StartupXYZ                                                   │  │
│  ◀▶  │  │     $100/hr • 120h tracked • $12,000 total               [⋮]    │  │
│      │  │                                                                  │  │
│      │  │  ●  Maintenance Contract                                        │  │
│      │  │     ClientName Inc.                                              │  │
│      │  │     $75/hr (default) • 20h tracked • $1,500 total        [⋮]    │  │
│      │  │                                                                  │  │
│      │  └─────────────────────────────────────────────────────────────────┘  │
│      │                                                                        │
│      │  □ Show archived projects                                             │
│      │                                                                        │
└──────┴────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- Page header with "New Project" button
- Project cards/rows (color dot, name, client, rate, stats, actions)
- "Show archived" checkbox

**Project Row Actions (⋮):**
- Edit
- View entries
- Archive

**Add/Edit Project Modal:**
```
┌─────────────────────────────────────────┐
│ New Project                        [x]  │
├─────────────────────────────────────────┤
│                                         │
│ Project Name *                          │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Client                                  │
│ ┌─────────────────────────────────────┐ │
│ │ Select client (optional)       ▼   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Hourly Rate            Currency         │
│ ┌─────────────────┐    ┌─────────────┐  │
│ │ 75.00           │    │ USD ▼       │  │
│ └─────────────────┘    └─────────────┘  │
│ Leave empty to use profile default      │
│ (currently: $75/hr USD)                 │
│                                         │
│ Color                                   │
│ ● ● ● ● ● ● ●                          │
│                                         │
│ □ Billable by default                   │
│                                         │
│           [Cancel]  [Create Project]    │
└─────────────────────────────────────────┘
```

**Rate/Currency logic in modal:**
- Show placeholder text with profile defaults
- If user enters rate, currency dropdown becomes required
- If user clears rate, currency resets to profile default
- Helper text shows "Leave empty to use profile default (currently: $X/hr)"

**Color picker:** 7-8 preset colors (emerald, blue, purple, pink, orange, yellow, slate, red)

---

## Screen 6: Clients

```
┌──────┬────────────────────────────────────────────────────────────────────────┐
│      │ 🌿 BillMint        [What are you working on?      ] [Project ▼]        │
│  📊  │                                 00:00:00                  [▶ Start]    │
│      ├────────────────────────────────────────────────────────────────────────┤
│  🕐  │                                                                        │
│      │  Clients                                         [+ New Client]       │
│  📁  │                                                                        │
│      │  ┌─────────────────────────────────────────────────────────────────┐  │
│  👥  │  │                                                                  │  │
│      │  │  ClientName Inc.                                                │  │
│  📄  │  │  john@clientname.com                                             │  │
│      │  │  3 projects • $15,200 invoiced • $2,400 outstanding      [⋮]    │  │
│──────│  │                                                                  │  │
│  ⚙️  │  │  StartupXYZ                                                     │  │
│      │  │  founder@startupxyz.com                                          │  │
│  ◀▶  │  │  1 project • $6,000 invoiced • $0 outstanding            [⋮]    │  │
│      │  │                                                                  │  │
│      │  │  Freelance Client                                               │  │
│      │  │  No email                                                        │  │
│      │  │  2 projects • $0 invoiced • $0 outstanding               [⋮]    │  │
│      │  │                                                                  │  │
│      │  └─────────────────────────────────────────────────────────────────┘  │
│      │                                                                        │
│      │  □ Show archived clients                                              │
│      │                                                                        │
└──────┴────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- Page header with "New Client" button
- Client cards/rows (name, email, stats, actions)
- "Show archived" checkbox

**Client Row Actions (⋮):**
- Edit
- View projects
- View invoices
- Archive

**Add/Edit Client Modal:**
```
┌─────────────────────────────────────────┐
│ New Client                         [x]  │
├─────────────────────────────────────────┤
│                                         │
│ Client/Company Name *                   │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Contact Name                            │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Contact Email                           │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Address (for invoices)                  │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│           [Cancel]  [Create Client]     │
└─────────────────────────────────────────┘
```

---

## Screen 7: Invoices

### 7a. Invoice List

```
┌──────┬────────────────────────────────────────────────────────────────────────┐
│      │ 🌿 BillMint        [What are you working on?      ] [Project ▼]        │
│  📊  │                                 00:00:00                  [▶ Start]    │
│      ├────────────────────────────────────────────────────────────────────────┤
│  🕐  │                                                                        │
│      │  Invoices                                       [+ New Invoice]       │
│  📁  │                                                                        │
│      │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐    │
│  👥  │  │ Outstanding       │ │ Overdue           │ │ Paid (this year)  │    │
│      │  │ $4,850            │ │ $1,200            │ │ $24,600           │    │
│  📄  │  │ 3 invoices        │ │ 1 invoice         │ │ 12 invoices       │    │
│      │  └───────────────────┘ └───────────────────┘ └───────────────────┘    │
│──────│                                                                        │
│  ⚙️  │  ┌─────────────────────────────────────────────────────────────────┐  │
│      │  │ Filter: [All Statuses ▼]  [All Clients ▼]                       │  │
│  ◀▶  │  └─────────────────────────────────────────────────────────────────┘  │
│      │                                                                        │
│      │  ┌─────────────────────────────────────────────────────────────────┐  │
│      │  │                                                                  │  │
│      │  │  INV-2026-0012     ClientName Inc.                              │  │
│      │  │  Jan 15, 2026      Due: Jan 30                                   │  │
│      │  │  [SENT]            $2,450.00                             [⋮]    │  │
│      │  │                                                                  │  │
│      │  │  INV-2026-0011     StartupXYZ                                   │  │
│      │  │  Jan 10, 2026      Due: Jan 25                                   │  │
│      │  │  [OVERDUE]         $1,200.00                             [⋮]    │  │
│      │  │                                                                  │  │
│      │  │  INV-2026-0010     ClientName Inc.                              │  │
│      │  │  Jan 5, 2026       Paid: Jan 12                                  │  │
│      │  │  [PAID]            $3,200.00                             [⋮]    │  │
│      │  │                                                                  │  │
│      │  └─────────────────────────────────────────────────────────────────┘  │
│      │                                                                        │
└──────┴────────────────────────────────────────────────────────────────────────┘
```

**Status badges:**
- DRAFT - gray
- SENT - blue  
- VIEWED - blue (optional, skip for MVP)
- PAID - green
- OVERDUE - red
- VOID - gray strikethrough

**Invoice Row Actions (⋮):**
- View/Edit (if draft)
- Download PDF
- Mark as Paid (if sent/overdue)
- Void (if not paid)
- Delete (if draft)

---

### 7b. Create/Edit Invoice

```
┌──────┬────────────────────────────────────────────────────────────────────────┐
│      │ 🌿 BillMint        [What are you working on?      ] [Project ▼]        │
│  📊  │                                 00:00:00                  [▶ Start]    │
│      ├────────────────────────────────────────────────────────────────────────┤
│ ...  │                                                                        │
│      │  ← Back to Invoices                         [Save Draft]    [Send]    │
│      │                                                                        │
│      │  New Invoice                                                           │
│      │                                                                        │
│      │  ┌────────────────────────────┐  ┌────────────────────────────┐       │
│      │  │ Client *                   │  │ Invoice Number             │       │
│      │  │ ┌────────────────────────┐ │  │ ┌────────────────────────┐ │       │
│      │  │ │ Select client...    ▼ │ │  │ │ INV-2026-0013          │ │       │
│      │  │ └────────────────────────┘ │  │ └────────────────────────┘ │       │
│      │  └────────────────────────────┘  └────────────────────────────┘       │
│      │                                                                        │
│      │  ┌────────────────────────────┐  ┌────────────────────────────┐       │
│      │  │ Issue Date                 │  │ Due Date                   │       │
│      │  │ ┌────────────────────────┐ │  │ ┌────────────────────────┐ │       │
│      │  │ │ Jan 20, 2026           │ │  │ │ Feb 4, 2026 (Net 15)   │ │       │
│      │  │ └────────────────────────┘ │  │ └────────────────────────┘ │       │
│      │  └────────────────────────────┘  └────────────────────────────┘       │
│      │                                                                        │
│      │  Line Items                                                            │
│      │  ┌─────────────────────────────────────────────────────────────────┐  │
│      │  │ Description                    Qty      Rate       Amount       │  │
│      │  ├─────────────────────────────────────────────────────────────────┤  │
│      │  │ API Integration - ProjectX     10h      $75.00     $750.00  [x] │  │
│      │  │ Bug Fixes - ProjectX           5h       $75.00     $375.00  [x] │  │
│      │  │ Client Meetings                2h       $75.00     $150.00  [x] │  │
│      │  ├─────────────────────────────────────────────────────────────────┤  │
│      │  │ [+ Add Line Item]   [+ Import Unbilled Time]                    │  │
│      │  └─────────────────────────────────────────────────────────────────┘  │
│      │                                                                        │
│      │                                              Subtotal:   $1,275.00    │
│      │                                              Tax (0%):       $0.00    │
│      │                                              ───────────────────────  │
│      │                                              Total:       $1,275.00   │
│      │                                                                        │
│      │  Notes (optional)                                                     │
│      │  ┌─────────────────────────────────────────────────────────────────┐  │
│      │  │ Payment due within 15 days. Thank you for your business!        │  │
│      │  └─────────────────────────────────────────────────────────────────┘  │
│      │                                                                        │
└──────┴────────────────────────────────────────────────────────────────────────┘
```

**"Import Unbilled Time" Flow:**
1. Click button → Modal opens
2. Shows unbilled entries for selected client (grouped by project)
3. Checkbox to select entries
4. "Import Selected" → adds as line items, marks entries as invoiced

**Line Item Row:**
- Description (text input)
- Quantity (number, can be hours or units)
- Rate (currency input)
- Amount (calculated, read-only)
- Delete button

---

### 7c. Invoice Public View (sent to client)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              INVOICE                                        │
│                                                                             │
│  From:                              To:                                     │
│  Your Name                          ClientName Inc.                         │
│  your@email.com                     123 Client Street                       │
│                                     City, State 12345                       │
│                                                                             │
│  Invoice: INV-2026-0012                                                    │
│  Issue Date: January 15, 2026                                              │
│  Due Date: January 30, 2026                                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Description                         Qty       Rate        Amount    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ API Integration - ProjectX          10h       $75.00      $750.00   │   │
│  │ Bug Fixes - ProjectX                5h        $75.00      $375.00   │   │
│  │ Client Meetings                     2h        $75.00      $150.00   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                              Subtotal:   $1,275.00  │   │
│  │                                              Total Due:  $1,275.00  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Notes:                                                                    │
│  Payment due within 15 days. Thank you for your business!                  │
│                                                                             │
│                           [Download PDF]                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**This is a public page** - no auth required, accessed via `/invoice/[token]`

---

## Screen 8: Settings

```
┌──────┬────────────────────────────────────────────────────────────────────────┐
│      │ 🌿 BillMint        [What are you working on?      ] [Project ▼]        │
│  📊  │                                 00:00:00                  [▶ Start]    │
│      ├────────────────────────────────────────────────────────────────────────┤
│  🕐  │                                                                        │
│      │  Settings                                                              │
│  📁  │                                                                        │
│      │  ┌──────────────┐                                                     │
│  👥  │  │ Profile      │ ←── active tab                                      │
│      │  │ Billing      │                                                     │
│  📄  │  └──────────────┘                                                     │
│      │                                                                        │
│──────│  ═══════════════════════════════════════════════════════════════════  │
│  ⚙️  │
│                                                                             │
│  Profile Settings                                                          │
│                                                                             │
│  Name                                                                       │
│  ┌─────────────────────────────────────┐                                   │
│  │ Your Name                           │                                   │
│  └─────────────────────────────────────┘                                   │
│                                                                             │
│  Email                                                                      │
│  ┌─────────────────────────────────────┐                                   │
│  │ your@email.com                      │  (read-only, from auth)          │
│  └─────────────────────────────────────┘                                   │
│                                                                             │
│  ─── Default Billing Settings ───                                          │
│  Used when project doesn't specify its own rate/currency                   │
│                                                                             │
│  Default Hourly Rate       Default Currency                                │
│  ┌───────────────────┐     ┌───────────────────┐                           │
│  │ 75.00             │     │ USD - US Dollar ▼ │                           │
│  └───────────────────┘     └───────────────────┘                           │
│                                                                             │
│  Timezone                                                                   │
│  ┌─────────────────────────────────────┐                                   │
│  │ Europe/Bucharest                 ▼  │                                   │
│  └─────────────────────────────────────┘                                   │
│                                                                             │
│                                    [Save Changes]                          │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  Danger Zone                                                               │
│  [Delete Account] - permanently delete your account and all data           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Billing Tab:**
```
│  Billing                                                                    │
│                                                                             │
│  Current Plan: Free                                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Pro Plan - $5/month                                                │   │
│  │  ────────────────────                                                │   │
│  │  ✓ Up to 5 team members                                             │   │
│  │  ✓ Unlimited invoices                                               │   │
│  │  ✓ PDF generation                                                   │   │
│  │  ✓ Payment reminders                                                │   │
│  │                                                                      │   │
│  │  [Upgrade to Pro]                                                   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Team Plan - $10/month                                              │   │
│  │  ─────────────────────                                               │   │
│  │  ✓ Up to 50 team members                                            │   │
│  │  ✓ Everything in Pro                                                │   │
│  │  ✓ Advanced reports                                                 │   │
│  │  ✓ Priority support                                                 │   │
│  │                                                                      │   │
│  │  [Upgrade to Team]                                                  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
```

*Note: Team features (multiple users) not in MVP. Show plans but disable team-specific features until implemented.*

---

## Component Inventory (COSS UI)

COSS UI: coss.com/ui - Built on Base UI + Tailwind CSS
Copy-paste model - you own the code, no npm dependency.

**Primitives (from COSS UI Components):**
- Button (variants: default, outline, ghost, destructive)
- Input
- Textarea
- Select
- Dialog (for modals)
- Menu (for action menus - replaces DropdownMenu)
- Popover
- Tooltip (for icon-only sidebar)
- Tabs
- Checkbox
- Switch

**Particles (pre-built patterns from COSS UI):**
- Check COSS UI Particles page for: tables, forms, date pickers
- May need to build custom particles for: timer widget, time entry rows

**Additional components to build:**
- TimerWidget (top bar timer)
- TimeEntryRow (list item with billable toggle)
- StatCard (dashboard stats)
- InvoiceLineItem (editable table row)

**Styling notes:**
- COSS UI uses CSS variables for theming (compatible with standard Tailwind)
- Add teal-500 as accent color in globals.css
- Configure `isolation: isolate` on root div for portaled components (dialogs, popovers)

---

## Layout Components (Custom)

**AppShell** - Main layout wrapper
- TopBar (logo, timer, user avatar)
- LeftSidebar (nav icons, toggle)
- MainContent (page content)

**TopBar**
- Fixed height: 64px
- Contains: Logo, Timer input, Project select, Timer display, Timer controls
- Mobile: Stack timer below logo

**LeftSidebar**
- Collapsed width: 60px
- Expanded width: 180px
- Fixed position on desktop
- Contains: Nav items, separator, settings, toggle button
- Smooth transition on expand/collapse
- Active item: teal-500 background, white text

**BottomNav (Mobile only)**
- Fixed to bottom
- 5 icons: Dashboard, Time, Projects, Clients, Invoices
- Settings in avatar menu

---

## Data Flow Summary

```
┌─────────────┬──────────────────────────────────────────────────────────────┐
│ Screen      │ API Endpoints Used                                           │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Dashboard   │ GET /api/timer                                               │
│             │ POST /api/timer/start, /stop, /pause, /resume                │
│             │ GET /api/dashboard/stats                                     │
│             │ GET /api/dashboard/recent                                    │
│             │ GET /api/projects (for timer dropdown)                       │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Time        │ GET /api/time-entries?filters                                │
│ Entries     │ POST /api/time-entries                                       │
│             │ PATCH /api/time-entries/:id                                  │
│             │ DELETE /api/time-entries/:id                                 │
│             │ GET /api/projects (for dropdown)                             │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Projects    │ GET /api/projects                                            │
│             │ POST /api/projects                                           │
│             │ PATCH /api/projects/:id                                      │
│             │ DELETE /api/projects/:id                                     │
│             │ GET /api/clients (for dropdown)                              │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Clients     │ GET /api/clients                                             │
│             │ POST /api/clients                                            │
│             │ PATCH /api/clients/:id                                       │
│             │ DELETE /api/clients/:id                                      │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Invoices    │ GET /api/invoices                                            │
│             │ POST /api/invoices                                           │
│             │ GET /api/invoices/:id                                        │
│             │ PATCH /api/invoices/:id                                      │
│             │ POST /api/invoices/:id/mark-paid                             │
│             │ GET /api/invoices/:id/pdf                                    │
│             │ GET /api/time-entries/unbilled?clientId=                     │
│             │ GET /api/clients (for dropdown)                              │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Settings    │ GET /api/users/me                                            │
│             │ PATCH /api/users/me                                          │
│             │ DELETE /api/users/me                                         │
└─────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Build Order (suggested)

1. **Auth** - Get login/signup working with Supabase
2. **Layout** - Navbar, basic routing
3. **Projects** - Simple CRUD, good warmup
4. **Clients** - Similar CRUD pattern
5. **Time Entries** - List + manual add (no timer yet)
6. **Timer** - Add timer to dashboard
7. **Dashboard** - Stats cards + recent entries
8. **Invoices** - The payoff feature
9. **Settings** - Profile basics
10. **Polish** - Loading states, error handling, empty states

---

## MVP Cuts (if running out of time)

If you need to cut scope further:

1. **Cut "Import Unbilled Time"** - Just manual line items for invoices
2. **Cut filters on Time Entries** - Just show all, paginated
3. **Cut client on Projects** - Projects exist standalone
4. **Cut PDF download** - Just the web view of invoice
5. **Cut invoice email sending** - Just copy public link manually

The absolute minimum: Timer → Entries → Invoices with manual line items
