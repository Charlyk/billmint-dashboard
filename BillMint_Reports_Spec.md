# BillMint Reports Page Specification

## Overview

A single, simple reports page that answers: "Where did my time go and how much did I earn?"

**Philosophy:** One page, filters at top, summary cards, breakdown table, export. No charts, no complexity.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Reports                                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                    │
│ │ This Month ▼│ │ All Projects│ │ All Clients │   [Export CSV]     │
│ └─────────────┘ └─────────────┘ └─────────────┘                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│ │ Total Time  │ │  Billable   │ │Non-Billable │ │   Amount    │    │
│ │             │ │             │ │             │ │             │    │
│ │  48h 30m    │ │  42h 15m    │ │   6h 15m    │ │ $3,168.75   │    │
│ │             │ │   (87%)     │ │   (13%)     │ │             │    │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ By Project                                                          │
│ ───────────────────────────────────────────────────────────────────│
│ ● Website Redesign      Acme Corp        32h 15m      $2,418.75    │
│ ● Mobile App            BayShop Inc.     10h 00m        $750.00    │
│ ● Consulting            —                 6h 15m             —     │
│ ───────────────────────────────────────────────────────────────────│
│   Total                                  48h 30m      $3,168.75    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Filters

### Date Range Filter

| Preset | Date Range |
|--------|------------|
| Today | Current day |
| This Week | Monday → Sunday (current) |
| Last Week | Monday → Sunday (previous) |
| This Month | 1st → today |
| Last Month | Full previous month |
| This Year | Jan 1 → today |
| Custom | User picks start/end dates |

**Default:** This Month

**Custom date picker:**
- Two date inputs: Start date, End date
- Calendar popup for selection
- Validate: start ≤ end

---

### Project Filter

```
┌─────────────────────────┐
│ All Projects          ▼ │
├─────────────────────────┤
│ ○ All Projects          │
│ ● Website Redesign      │
│ ● Mobile App            │
│ ● Consulting            │
│ ● No Project            │
└─────────────────────────┘
```

- Default: All Projects
- Include "No Project" option for entries without project
- Only show projects with entries in date range (optional optimization)

---

### Client Filter

```
┌─────────────────────────┐
│ All Clients           ▼ │
├─────────────────────────┤
│ ○ All Clients           │
│ ○ Acme Corp             │
│ ○ BayShop Inc.          │
│ ○ No Client             │
└─────────────────────────┘
```

- Default: All Clients
- Include "No Client" option
- Only show clients with entries in date range (optional)

---

## Summary Cards

Four stat cards showing filtered totals:

### Card 1: Total Time
```
┌─────────────────┐
│   Total Time    │
│                 │
│    48h 30m      │
└─────────────────┘
```
- Sum of all entry durations in filter range

### Card 2: Billable Time
```
┌─────────────────┐
│    Billable     │
│                 │
│    42h 15m      │
│     (87%)       │
└─────────────────┘
```
- Sum of billable entry durations
- Percentage of total

### Card 3: Non-Billable Time
```
┌─────────────────┐
│  Non-Billable   │
│                 │
│     6h 15m      │
│     (13%)       │
└─────────────────┘
```
- Sum of non-billable entry durations
- Percentage of total

### Card 4: Billable Amount
```
┌─────────────────┐
│     Amount      │
│                 │
│   $3,168.75     │
└─────────────────┘
```
- Sum of (billable hours × rate) for all entries
- Use user's default currency for display
- Note: If entries have mixed currencies, show warning or separate totals

---

## Breakdown Table

### By Project (Default View)

| Column | Content | Alignment |
|--------|---------|-----------|
| Color dot | Project color | Left |
| Project Name | Name or "No Project" | Left |
| Client | Client name or "—" | Left |
| Time | Total hours:minutes | Right |
| Amount | Billable amount or "—" | Right |

```
───────────────────────────────────────────────────────────────────────
● Website Redesign         Acme Corp              32h 15m    $2,418.75
● Mobile App               BayShop Inc.           10h 00m      $750.00
● Consulting               —                       6h 15m           —
○ No Project               —                       0h 00m           —
───────────────────────────────────────────────────────────────────────
  Total                                           48h 30m    $3,168.75
```

**Sorting:** By time descending (most hours first)

**Row behavior:**
- Hover: subtle highlight
- Click: could expand to show entries (nice-to-have, skip for MVP)

---

### Empty State

When no entries match filters:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                         No time tracked                             │
│                                                                     │
│         No entries found for the selected date range.               │
│                                                                     │
│                    [Start Tracking Time]                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Export CSV

### Button
```
[↓ Export CSV]
```

- Position: Top right, aligned with filters
- Exports current filtered view

### CSV Format

**Filename:** `billmint-report-YYYY-MM-DD.csv`

**Contents:**

```csv
Date,Description,Project,Client,Duration,Billable,Rate,Currency,Amount
2026-01-20,API integration,Website Redesign,Acme Corp,2.25,Yes,75.00,USD,168.75
2026-01-20,Bug fixes,Website Redesign,Acme Corp,1.50,Yes,75.00,USD,112.50
2026-01-21,Team meeting,Consulting,,0.75,No,,,
2026-01-21,Code review,Mobile App,BayShop Inc.,2.00,Yes,75.00,USD,150.00
```

**Columns:**

| Column | Format | Example |
|--------|--------|---------|
| Date | YYYY-MM-DD | 2026-01-20 |
| Description | String | API integration |
| Project | String (empty if none) | Website Redesign |
| Client | String (empty if none) | Acme Corp |
| Duration | Decimal hours | 2.25 |
| Billable | Yes/No | Yes |
| Rate | Decimal (empty if non-billable) | 75.00 |
| Currency | ISO code | USD |
| Amount | Decimal (empty if non-billable) | 168.75 |

**Summary rows at bottom (optional):**

```csv
,,,,,,,,
,,,Total,48.50,,,,$3168.75
,,,Billable,42.25,,,,$3168.75
,,,Non-Billable,6.25,,,,
```

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

**Option A (Recommended for MVP):** Show warning + separate totals

```
⚠️ Entries in multiple currencies

USD: 32h 15m — $2,418.75
EUR: 16h 15m — €1,218.75
```

**Option B:** Only show time totals, hide amount
```
Amount: — (mixed currencies)
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
| project_id | UUID | No | all | abc-123 |
| client_id | UUID | No | all | def-456 |

**Response:**

```json
{
  "summary": {
    "total_seconds": 174600,
    "billable_seconds": 152100,
    "non_billable_seconds": 22500,
    "billable_amount": 3168.75,
    "currency": "USD"
  },
  "by_project": [
    {
      "project_id": "abc-123",
      "project_name": "Website Redesign",
      "project_color": "#14b8a6",
      "client_name": "Acme Corp",
      "total_seconds": 116100,
      "billable_amount": 2418.75,
      "currency": "USD"
    },
    {
      "project_id": "def-456",
      "project_name": "Mobile App",
      "project_color": "#8b5cf6",
      "client_name": "BayShop Inc.",
      "total_seconds": 36000,
      "billable_amount": 750.00,
      "currency": "USD"
    },
    {
      "project_id": null,
      "project_name": null,
      "project_color": null,
      "client_name": null,
      "total_seconds": 22500,
      "billable_amount": null,
      "currency": null
    }
  ],
  "entries": [
    // Full entries array for CSV export
  ]
}
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
| Table row height | 48px |
| Table header color | slate-500 |
| Total row background | slate-50 |
| Total row font weight | 600 |
