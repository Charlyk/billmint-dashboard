# BillMint Reports Page Specification

## Overview

A comprehensive reports page that answers: "Where did my time go, how much did I earn, and how am I trending?"

**Philosophy:** Filters at top, summary cards, visual chart, breakdowns by project and client, comparison tools, and export options. Free users get basics, Pro users get the full picture.

---

## Free vs Pro Features

| Feature | Free | Pro |
|---------|------|-----|
| Summary cards (4 stats) | ✅ | ✅ |
| By project table | ✅ | ✅ |
| CSV export | ✅ | ✅ |
| Date range filter | ✅ | ✅ |
| Hours per day/week chart | ❌ | ✅ |
| By client breakdown | ❌ | ✅ |
| Billable % trend | ❌ | ✅ |
| Compare periods | ❌ | ✅ |
| PDF export (branded) | ❌ | ✅ |
| Project/client/billable filters | ❌ | ✅ |

---

## Page Layout (Pro View)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Reports                                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐ │
│ │This Month▼│ │All Projects│ │All Clients│ │Billable ▼│ │Group by▼│ │
│ └───────────┘ └───────────┘ └───────────┘ └──────────┘ └─────────┘ │
│                                                                     │
│ ☑ Compare to: [Last Month ▼]                  [Export CSV] [PDF]   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────┐│
│ │  Total Time   │ │   Billable    │ │ Non-Billable  │ │  Amount   ││
│ │               │ │               │ │               │ │           ││
│ │   48h 30m     │ │   42h 15m     │ │    6h 15m     │ │$3,168.75  ││
│ │   ▲ 12%       │ │   87%         │ │    13%        │ │  ▲ 8%     ││
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────┘│
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Hours per Day                                                       │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │     ██                                                          │ │
│ │     ██  ██      ██                                              │ │
│ │ ██  ██  ██  ██  ██  ██                                          │ │
│ │ ██  ██  ██  ██  ██  ██  ██                                      │ │
│ │ Mon Tue Wed Thu Fri Sat Sun                                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Billable: ██ 87%    Non-billable: ░░ 13%                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [By Project]  [By Client]                                           │
│                                                                     │
│ By Project                                    Time        Amount    │
│ ────────────────────────────────────────────────────────────────── │
│ ● Website Redesign      Acme Corp          32h 15m    $2,418.75    │
│ ● Mobile App            BayShop Inc.       10h 00m      $750.00    │
│ ● Consulting            —                   6h 15m           —     │
│ ────────────────────────────────────────────────────────────────── │
│   Total                                    48h 30m    $3,168.75    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Period Comparison                     This Month    Last Month      │
│ ────────────────────────────────────────────────────────────────── │
│ Total Time                              48h 30m       43h 15m  ▲12% │
│ Billable Time                           42h 15m       38h 00m  ▲11% │
│ Billable Amount                       $3,168.75     $2,850.00   ▲8% │
│ Billable %                                  87%           88%   ▼1% │
│ Avg Daily (weekdays)                    2h 25m        2h 10m  ▲12% │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Filters

### Filter Bar Layout

```
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐
│This Month▼│ │All Projects│ │All Clients│ │Billable ▼│ │Group by▼│
└───────────┘ └───────────┘ └───────────┘ └──────────┘ └─────────┘

☑ Compare to: [Last Month ▼]                  [Export CSV] [PDF ⭐]
```

⭐ = Pro only feature

---

### 1. Date Range Filter

| Preset | Date Range |
|--------|------------|
| Today | Current day |
| Yesterday | Previous day |
| This Week | Monday → Sunday (current) |
| Last Week | Monday → Sunday (previous) |
| This Month | 1st → today |
| Last Month | Full previous month |
| This Quarter | Q1/Q2/Q3/Q4 of current year |
| Last Quarter | Previous quarter |
| This Year | Jan 1 → today |
| Last Year | Full previous year |
| Custom | User picks start/end dates |

**Default:** This Month

**Custom date picker:**
- Two date inputs: Start date, End date
- Calendar popup for selection
- Validate: start ≤ end
- Max range: 1 year (for performance)

---

### 2. Project Filter (Pro only)

```
┌─────────────────────────┐
│ All Projects          ▼ │
├─────────────────────────┤
│ ☑ All Projects          │
│ ───────────────────────│
│ ☑ Website Redesign      │
│ ☑ Mobile App            │
│ ☑ Consulting            │
│ ☐ Old Project (archived)│
│ ───────────────────────│
│ ☑ No Project            │
└─────────────────────────┘
```

- **Multi-select** (can pick multiple projects)
- Default: All Projects
- Include "No Project" option for entries without project
- Show archived projects at bottom (dimmed)
- Show project color dot next to name

---

### 3. Client Filter (Pro only)

```
┌─────────────────────────┐
│ All Clients           ▼ │
├─────────────────────────┤
│ ☑ All Clients           │
│ ───────────────────────│
│ ☑ Acme Corp             │
│ ☑ BayShop Inc.          │
│ ☑ StartupXYZ            │
│ ───────────────────────│
│ ☑ No Client             │
└─────────────────────────┘
```

- **Multi-select** (can pick multiple clients)
- Default: All Clients
- Include "No Client" option
- Filter updates project dropdown to only show relevant projects

---

### 4. Billable Filter (Pro only)

```
┌─────────────────────────┐
│ All Entries           ▼ │
├─────────────────────────┤
│ ○ All Entries           │
│ ○ Billable Only         │
│ ○ Non-Billable Only     │
└─────────────────────────┘
```

- Default: All Entries
- Single select

---

### 5. Group By Filter (Pro only)

```
┌─────────────────────────┐
│ Group by: Project     ▼ │
├─────────────────────────┤
│ ○ Project               │
│ ○ Client                │
│ ○ Day                   │
│ ○ Week                  │
└─────────────────────────┘
```

- Default: Project
- Changes the breakdown table view

---

### 6. Compare Period Toggle (Pro only)

```
☑ Compare to: [Last Month ▼]
```

Options:
- Previous period (auto-matches range length)
- Last month
- Last quarter
- Last year
- Custom range

When enabled, shows comparison data in summary cards and adds Period Comparison section.

---

## Summary Cards

Four stat cards showing filtered totals with optional comparison:

### Card 1: Total Time
```
┌─────────────────┐
│   Total Time    │
│                 │
│    48h 30m      │
│    ▲ 12%        │  ← comparison indicator (Pro)
└─────────────────┘
```
- Sum of all entry durations in filter range
- Comparison: % change vs comparison period (green ▲ / red ▼)

### Card 2: Billable Time
```
┌─────────────────┐
│    Billable     │
│                 │
│    42h 15m      │
│      87%        │  ← percentage of total
└─────────────────┘
```
- Sum of billable entry durations
- Shows percentage of total time

### Card 3: Non-Billable Time
```
┌─────────────────┐
│  Non-Billable   │
│                 │
│     6h 15m      │
│      13%        │
└─────────────────┘
```
- Sum of non-billable entry durations
- Shows percentage of total time

### Card 4: Billable Amount
```
┌─────────────────┐
│     Amount      │
│                 │
│   $3,168.75     │
│     ▲ 8%        │  ← comparison indicator (Pro)
└─────────────────┘
```
- Sum of (billable hours × rate) for all entries
- Use user's default currency for display
- Comparison: % change vs comparison period

### Comparison Indicators

| Change | Display |
|--------|---------|
| Positive | ▲ 12% (green) |
| Negative | ▼ 8% (red) |
| No change | — 0% (gray) |
| No comparison data | Hide indicator |

---

## Hours Chart (Pro Only)

Visual bar chart showing time distribution:

### Daily View (for ranges ≤ 2 weeks)

```
Hours per Day
┌─────────────────────────────────────────────────────────────────────┐
│ 8h │                                                                │
│    │         ██                                                     │
│ 6h │     ██  ██      ██                                            │
│    │     ██  ██  ██  ██  ██                                        │
│ 4h │ ██  ██  ██  ██  ██  ██                                        │
│    │ ██  ██  ██  ██  ██  ██  ██                                    │
│ 2h │ ██  ██  ██  ██  ██  ██  ██                                    │
│    │ ██  ██  ██  ██  ██  ██  ██                                    │
│ 0h └────────────────────────────────────────────────────────────── │
│     Mon Tue Wed Thu Fri Sat Sun Mon Tue Wed Thu Fri Sat Sun        │
│     Jan 6                      Jan 13                               │
└─────────────────────────────────────────────────────────────────────┘

Legend:  ██ Billable (87%)    ░░ Non-billable (13%)
```

### Weekly View (for ranges > 2 weeks)

```
Hours per Week
┌─────────────────────────────────────────────────────────────────────┐
│ 40h│     ████                                                       │
│    │ ████████  ████                                                │
│ 30h│ ████████  ████████  ████                                      │
│    │ ████████  ████████  ████████  ████                            │
│ 20h│ ████████  ████████  ████████  ████████                        │
│    │ ████████  ████████  ████████  ████████                        │
│ 10h│ ████████  ████████  ████████  ████████                        │
│    │ ████████  ████████  ████████  ████████                        │
│ 0h └────────────────────────────────────────────────────────────── │
│     Week 1   Week 2   Week 3   Week 4                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Chart Features

- Stacked bars: Billable (teal) + Non-billable (gray)
- Hover tooltip: "Wed Jan 8: 6h 30m billable, 1h 15m non-billable"
- Click bar: Could filter table to that day/week (nice-to-have)

---

## Billable Percentage Trend (Pro Only)

Shows billable ratio over time:

```
Billable % Trend
┌─────────────────────────────────────────────────────────────────────┐
│100%│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│    │         ●───●                                                  │
│ 80%│     ●───┘       ●───●───●                                     │
│    │ ●───┘                                                          │
│ 60%│                                                                │
│    │                                                                │
│ 0% └────────────────────────────────────────────────────────────── │
│     Week 1   Week 2   Week 3   Week 4                               │
└─────────────────────────────────────────────────────────────────────┘

Average: 85%    Goal: 80% ✓
```

- Line chart showing billable % per day/week
- Horizontal reference line at 80% (or user-configurable goal)
- Shows if user is maintaining healthy billable ratio

---

## Breakdown Tables

### Tab Selector

```
[By Project]  [By Client]
     ↓
  active tab underlined
```

---

### By Project View (Default)

| Column | Content | Alignment |
|--------|---------|-----------|
| Color dot | Project color | Left |
| Project Name | Name or "No Project" | Left |
| Client | Client name or "—" | Left |
| Time | Total hours:minutes | Right |
| Amount | Billable amount or "—" | Right |
| % of Total | Percentage bar | Right |

```
By Project                                    Time       Amount    % Total
─────────────────────────────────────────────────────────────────────────────
● Website Redesign      Acme Corp          32h 15m   $2,418.75   ████████░░ 67%
● Mobile App            BayShop Inc.       10h 00m     $750.00   ███░░░░░░░ 21%
● Consulting            —                   6h 15m          —    ██░░░░░░░░ 12%
─────────────────────────────────────────────────────────────────────────────
  Total                                    48h 30m   $3,168.75              100%
```

**Sorting:** By time descending (most hours first), click header to change

**Row interaction:**
- Hover: Subtle highlight
- Click: Expand to show individual entries (Pro)

**Expanded View (when row clicked):**
```
● Website Redesign      Acme Corp          32h 15m   $2,418.75   ████████░░ 67%
  ├─ Jan 20  API integration                2h 15m     $168.75
  ├─ Jan 20  Bug fixes                      1h 30m     $112.50
  ├─ Jan 21  Landing page design            4h 00m     $300.00
  └─ ... 12 more entries                   24h 30m   $1,837.50   [View all →]
```

---

### By Client View (Pro Only)

```
By Client                                     Time       Amount    % Total
─────────────────────────────────────────────────────────────────────────────
Acme Corp                                  32h 15m   $2,418.75   ████████░░ 67%
  ● Website Redesign                       32h 15m   $2,418.75
BayShop Inc.                               10h 00m     $750.00   ███░░░░░░░ 21%
  ● Mobile App                             10h 00m     $750.00
No Client                                   6h 15m          —    ██░░░░░░░░ 12%
  ● Consulting                              6h 15m          —
─────────────────────────────────────────────────────────────────────────────
  Total                                    48h 30m   $3,168.75              100%
```

- Groups projects under their client
- Shows client totals with nested project breakdown
- Collapsed by default, click to expand

---

### By Day View (Pro Only, when Group by = Day)

```
By Day                                        Time       Amount    Billable %
─────────────────────────────────────────────────────────────────────────────
Mon, Jan 20                                  8h 15m     $618.75   100%
  ● Website Redesign                         5h 30m     $412.50
  ● Mobile App                               2h 45m     $206.25
Tue, Jan 21                                  7h 30m     $525.00    93%
  ● Website Redesign                         4h 00m     $300.00
  ● Consulting (non-billable)                0h 30m          —
  ● Mobile App                               3h 00m     $225.00
Wed, Jan 22                                  6h 45m     $506.25    89%
  ...
─────────────────────────────────────────────────────────────────────────────
  Total (5 days)                            48h 30m   $3,168.75    87%
```

---

### By Week View (Pro Only, when Group by = Week)

```
By Week                                       Time       Amount    Avg/Day
─────────────────────────────────────────────────────────────────────────────
Week 1 (Jan 6-12)                           24h 15m   $1,818.75    4h 51m
Week 2 (Jan 13-19)                          24h 15m   $1,350.00    4h 51m
─────────────────────────────────────────────────────────────────────────────
  Total                                     48h 30m   $3,168.75    4h 51m
```

---

## Period Comparison (Pro Only)

When "Compare to" is enabled, shows side-by-side metrics:

```
Period Comparison                       This Month    Last Month    Change
─────────────────────────────────────────────────────────────────────────────
Total Time                                48h 30m       43h 15m     ▲ 12%
Billable Time                             42h 15m       38h 00m     ▲ 11%
Billable Amount                         $3,168.75     $2,850.00      ▲ 8%
Billable %                                    87%           88%      ▼ 1%
Avg Daily (weekdays)                       2h 25m        2h 10m     ▲ 12%
Working Days                                   20            20        —
─────────────────────────────────────────────────────────────────────────────
```

### Metrics Explained

| Metric | Calculation |
|--------|-------------|
| Total Time | Sum of all durations |
| Billable Time | Sum of billable durations |
| Billable Amount | Sum of (hours × rate) |
| Billable % | Billable time ÷ Total time |
| Avg Daily | Total time ÷ Working days |
| Working Days | Days with at least 1 entry |

### Change Indicators

| Change | Color | Icon |
|--------|-------|------|
| Positive (good) | Green | ▲ |
| Negative (bad) | Red | ▼ |
| Neutral | Gray | — |

**Context-aware coloring:**
- More hours = green ▲
- More money = green ▲
- Lower billable % = red ▼ (this is bad)

---

## Export Options

### Export CSV (Free + Pro)

```
[↓ Export CSV]
```

**Filename:** `billmint-report-YYYY-MM-DD.csv`

**Contents (detailed entries):**

```csv
Date,Description,Project,Client,Duration,Billable,Rate,Currency,Amount
2026-01-20,API integration,Website Redesign,Acme Corp,2.25,Yes,75.00,USD,168.75
2026-01-20,Bug fixes,Website Redesign,Acme Corp,1.50,Yes,75.00,USD,112.50
2026-01-21,Team meeting,Consulting,,0.75,No,,,
2026-01-21,Code review,Mobile App,BayShop Inc.,2.00,Yes,75.00,USD,150.00
```

**Summary section at bottom:**

```csv
,,,,,,,,
,,,SUMMARY,,,,
,,,Total Time,48.50 hours,,,,
,,,Billable Time,42.25 hours,,,,
,,,Non-Billable Time,6.25 hours,,,,
,,,Billable Amount,,,,,$3168.75
```

---

### Export PDF (Pro Only)

```
[↓ PDF]
```

**Generates branded PDF report:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  [User's Logo]                                                      │
│                                                                     │
│  TIME REPORT                                                        │
│  ───────────────────────────────────────────────────────────────── │
│                                                                     │
│  Period: January 1 - January 31, 2026                               │
│  Prepared by: Eduard                                                │
│  Generated: January 31, 2026                                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ SUMMARY                                                      │   │
│  │                                                              │   │
│  │ Total Time:        48h 30m                                   │   │
│  │ Billable Time:     42h 15m (87%)                             │   │
│  │ Billable Amount:   $3,168.75                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  BREAKDOWN BY PROJECT                                               │
│  ───────────────────────────────────────────────────────────────── │
│                                                                     │
│  Website Redesign (Acme Corp)                                       │
│    Time: 32h 15m    Amount: $2,418.75                              │
│                                                                     │
│  Mobile App (BayShop Inc.)                                          │
│    Time: 10h 00m    Amount: $750.00                                │
│                                                                     │
│  Consulting                                                         │
│    Time: 6h 15m     Amount: —                                      │
│                                                                     │
│  ───────────────────────────────────────────────────────────────── │
│                                                                     │
│  DETAILED ENTRIES                                                   │
│  ───────────────────────────────────────────────────────────────── │
│                                                                     │
│  Jan 20, 2026                                                       │
│    API integration (Website Redesign)      2h 15m    $168.75       │
│    Bug fixes (Website Redesign)            1h 30m    $112.50       │
│                                                                     │
│  Jan 21, 2026                                                       │
│    Landing page design (Website Redesign)  4h 00m    $300.00       │
│    Team meeting (Consulting)               0h 30m    —             │
│                                                                     │
│  ... continued ...                                                  │
│                                                                     │
│  ───────────────────────────────────────────────────────────────── │
│  Generated by BillMint.io                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**PDF Options (nice-to-have):**
- Include/exclude detailed entries
- Filter to specific client (for client-facing reports)
- Add custom notes

**Use case:** Freelancer sends PDF to client as proof of work / timesheet.

---

## Data Queries

### Main Query (Pseudo-SQL)

```sql
SELECT 
  te.id,
  te.description,
  te.started_at,
  te.duration_seconds,
  te.billable,
  p.name as project_name,
  p.color as project_color,
  p.hourly_rate,
  p.currency,
  c.name as client_name
FROM time_entries te
LEFT JOIN projects p ON te.project_id = p.id
LEFT JOIN clients c ON p.client_id = c.id
WHERE te.user_id = :user_id
  AND te.started_at >= :start_date
  AND te.started_at < :end_date
  AND (:project_id IS NULL OR te.project_id = :project_id)
  AND (:client_id IS NULL OR p.client_id = :client_id)
ORDER BY te.started_at DESC
```

### Aggregation (Frontend or Backend)

```javascript
const summary = {
  totalSeconds: entries.reduce((sum, e) => sum + e.duration_seconds, 0),
  billableSeconds: entries.filter(e => e.billable).reduce((sum, e) => sum + e.duration_seconds, 0),
  billableAmount: entries.filter(e => e.billable).reduce((sum, e) => {
    const hours = e.duration_seconds / 3600;
    return sum + (hours * e.hourly_rate);
  }, 0),
};

const byProject = groupBy(entries, 'project_id');
```

---

## Currency Handling

### Single Currency (Simple Case)
If all entries in filter use same currency → display normally.

### Mixed Currencies
If entries have different currencies:

**Option A (Recommended):** Show separate totals per currency

```
Billable Amount

┌─────────────────┐
│     Amount      │
│                 │
│   $2,418.75     │
│   €750.00       │
└─────────────────┘
```

In breakdown table, group or show currency:

```
● Website Redesign      Acme Corp          32h 15m   $2,418.75
● EU Marketing          StartupXYZ         10h 00m     €750.00
```

---

## Empty States

### No entries match filters

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    📊 No data for this period                       │
│                                                                     │
│         No time entries found for the selected filters.             │
│                                                                     │
│              [Clear Filters]    [Start Tracking Time]               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### No entries at all (new user)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    📊 No reports yet                                │
│                                                                     │
│         Start tracking time to see your reports here.               │
│                                                                     │
│                     [Start Tracking Time]                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Free User Experience

Free users see basic reports with upgrade prompts for Pro features.

### Free View Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Reports                                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌───────────┐                                                       │
│ │This Month▼│                                       [Export CSV]    │
│ └───────────┘                                                       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────┐│
│ │  Total Time   │ │   Billable    │ │ Non-Billable  │ │  Amount   ││
│ │               │ │               │ │               │ │           ││
│ │   48h 30m     │ │   42h 15m     │ │    6h 15m     │ │$3,168.75  ││
│ │               │ │   87%         │ │    13%        │ │           ││
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────┘│
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📊 Unlock detailed reports with Pro                    [Upgrade]│ │
│ │    • Hours chart • Client breakdown • Period comparison • PDF   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ By Project                                    Time       Amount     │
│ ────────────────────────────────────────────────────────────────── │
│ ● Website Redesign      Acme Corp          32h 15m   $2,418.75     │
│ ● Mobile App            BayShop Inc.       10h 00m     $750.00     │
│ ● Consulting            —                   6h 15m          —      │
│ ────────────────────────────────────────────────────────────────── │
│   Total                                    48h 30m   $3,168.75     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Locked Feature Indicators

When free user hovers/clicks Pro features:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│ Filter by Project  🔒                                               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  🔒 Pro Feature                                              │   │
│  │                                                              │   │
│  │  Filter reports by project, client, and more.               │   │
│  │                                                              │   │
│  │                    [Upgrade to Pro - $5/mo]                  │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Responsive Design

### Desktop (1024px+)
- Full layout as shown above
- All filters in one row
- Table with all columns

### Tablet (768px - 1023px)
- Filters stack: date on top, project/client below
- Summary cards: 2x2 grid
- Table: hide client column, show on row expand

### Mobile (< 768px)
- Filters: full width, stacked
- Summary cards: 2x2 grid, smaller
- Table: card-based layout instead

```
┌─────────────────────────────────┐
│ ● Website Redesign              │
│   Acme Corp                     │
│   32h 15m            $2,418.75  │
└─────────────────────────────────┘
```

---

## Loading States

### Initial Load
```
┌─────────────────────────────────────────────────────────────────────┐
│ Reports                                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [Filters disabled/skeleton]                                         │
│                                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│ │ ░░░░░░░░░░░ │ │ ░░░░░░░░░░░ │ │ ░░░░░░░░░░░ │ │ ░░░░░░░░░░░ │    │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
│                                                                     │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Filter Change
- Show loading spinner overlay on table
- Keep summary cards visible (or show skeleton)
- Disable export button while loading

---

## URL State (Nice-to-Have)

Persist filters in URL for sharing/bookmarking:

```
/reports?range=this_month&project=abc123&client=def456
```

Or for custom dates:
```
/reports?start=2026-01-01&end=2026-01-31
```

---

## Implementation Checklist

### MVP (Must Have)
- [ ] Date range filter with presets
- [ ] Project filter dropdown
- [ ] Client filter dropdown
- [ ] Summary cards (4 stats)
- [ ] Breakdown table by project
- [ ] Export CSV button
- [ ] Empty state
- [ ] Loading state

### Post-MVP (Nice to Have)
- [ ] Custom date range picker
- [ ] URL state persistence
- [ ] Click row to see entries
- [ ] PDF export
- [ ] By Client view toggle
- [ ] Compare periods
- [ ] Charts (bar chart by day/week)

---

## API Endpoint

### GET /api/reports

**Query Parameters:**

| Param | Type | Required | Default | Example |
|-------|------|----------|---------|---------|
| start | ISO date | Yes | — | 2026-01-01 |
| end | ISO date | Yes | — | 2026-01-31 |
| project_ids | UUID[] | No | all | abc-123,def-456 |
| client_ids | UUID[] | No | all | abc-123,def-456 |
| billable | string | No | all | billable, non_billable, all |
| group_by | string | No | project | project, client, day, week |
| compare_start | ISO date | No | — | 2025-12-01 |
| compare_end | ISO date | No | — | 2025-12-31 |

**Response:**

```json
{
  "summary": {
    "total_seconds": 174600,
    "billable_seconds": 152100,
    "non_billable_seconds": 22500,
    "billable_amount": 3168.75,
    "currency": "USD",
    "working_days": 20,
    "avg_daily_seconds": 8730
  },
  "comparison": {
    "total_seconds": 155700,
    "billable_seconds": 136800,
    "non_billable_seconds": 18900,
    "billable_amount": 2850.00,
    "currency": "USD",
    "working_days": 20,
    "changes": {
      "total_seconds_pct": 12.1,
      "billable_seconds_pct": 11.2,
      "billable_amount_pct": 8.0,
      "billable_ratio_pct": -1.0
    }
  },
  "chart_data": {
    "type": "daily",
    "points": [
      { "date": "2026-01-20", "billable_seconds": 27000, "non_billable_seconds": 3600 },
      { "date": "2026-01-21", "billable_seconds": 25200, "non_billable_seconds": 1800 }
    ]
  },
  "by_project": [
    {
      "project_id": "abc-123",
      "project_name": "Website Redesign",
      "project_color": "#14b8a6",
      "client_id": "xyz-789",
      "client_name": "Acme Corp",
      "total_seconds": 116100,
      "billable_seconds": 116100,
      "billable_amount": 2418.75,
      "currency": "USD",
      "percentage": 67
    }
  ],
  "by_client": [
    {
      "client_id": "xyz-789",
      "client_name": "Acme Corp",
      "total_seconds": 116100,
      "billable_amount": 2418.75,
      "currency": "USD",
      "percentage": 67,
      "projects": [
        {
          "project_id": "abc-123",
          "project_name": "Website Redesign",
          "total_seconds": 116100,
          "billable_amount": 2418.75
        }
      ]
    }
  ],
  "entries": [
    // Full entries array for CSV/PDF export
  ]
}
```

---

## Implementation Checklist

### Free Tier (Must Have)
- [ ] Date range filter with presets
- [ ] Summary cards (4 stats)
- [ ] By project breakdown table
- [ ] CSV export
- [ ] Empty state
- [ ] Loading state

### Pro Tier (Must Have)
- [ ] Project filter (multi-select)
- [ ] Client filter (multi-select)
- [ ] Billable filter
- [ ] Hours per day/week chart
- [ ] By client breakdown view
- [ ] Period comparison toggle
- [ ] Comparison metrics table
- [ ] PDF export

### Pro Tier (Nice to Have)
- [ ] Group by filter (day, week)
- [ ] Billable % trend line chart
- [ ] Click row to expand entries
- [ ] URL state persistence
- [ ] Custom date range picker
- [ ] PDF customization options

---

## Responsive Design

### Desktop (1024px+)
- Full layout as shown above
- All filters in one row
- Chart and table side by side (optional)

### Tablet (768px - 1023px)
- Filters: 2 rows (date + project/client on row 1, billable + group on row 2)
- Summary cards: 2x2 grid
- Chart: full width
- Table: scrollable horizontally if needed

### Mobile (< 768px)
- Filters: stacked, full width dropdowns
- Summary cards: 2x2 grid, compact
- Chart: simplified, full width
- Table: card-based layout

```
┌─────────────────────────────────┐
│ ● Website Redesign              │
│   Acme Corp                     │
│   32h 15m            $2,418.75  │
│   ████████░░ 67%                │
└─────────────────────────────────┘
```

---

## Loading States

### Initial Load
- Skeleton for summary cards
- Skeleton for chart area
- Skeleton rows for table
- Filters disabled during load

### Filter Change
- Summary cards show skeleton or dim
- Chart shows loading spinner overlay
- Table shows loading spinner overlay
- Export buttons disabled

---

## URL State

Persist filters in URL for sharing/bookmarking:

```
/reports?range=this_month&projects=abc,def&clients=xyz&billable=all&compare=last_month
```

Custom dates:
```
/reports?start=2026-01-01&end=2026-01-31&compare_start=2025-12-01&compare_end=2025-12-31
```

---

## Design Tokens

| Element | Value |
|---------|-------|
| Card background | white |
| Card border | slate-200 |
| Card border radius | 8px |
| Card padding | 20px |
| Stat value font size | 24px |
| Stat value font weight | 600 |
| Stat label font size | 14px |
| Stat label color | slate-500 |
| Chart bar color (billable) | teal-500 (#14b8a6) |
| Chart bar color (non-billable) | slate-300 |
| Positive change color | green-600 |
| Negative change color | red-600 |
| Table row height | 48px |
| Table header color | slate-500 |
| Total row background | slate-50 |
| Total row font weight | 600 |
| Percentage bar background | slate-200 |
| Percentage bar fill | teal-500 |
| Locked feature overlay | slate-900/50 |
| Upgrade prompt background | teal-50 |
| Upgrade prompt border | teal-200 |
