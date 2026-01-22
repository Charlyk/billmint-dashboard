# BillMint Timer Specification

## Overview

The timer is the core feature of BillMint. It must be fast, reliable, and feel instant. This document covers UX, architecture, keyboard shortcuts, and edge cases.

---

## Architecture

### Source of Truth: Server

```
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER (React state)                                           │
│                                                                 │
│ - Display ticks every 1s (local calculation from started_at)    │
│ - Description/project edits → debounced API call (500ms)        │
│ - Start/Stop/Pause → immediate optimistic UI + API call         │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│ SERVER (Supabase)                                               │
│                                                                 │
│ active_timers table:                                            │
│ - started_at (timestamptz)                                      │
│ - paused_at (timestamptz | null)                                │
│ - accumulated_seconds (for pause/resume cycles)                 │
│ - description, project_id, is_billable                          │
└─────────────────────────────────────────────────────────────────┘
```

### Why Not IndexedDB?

- Timer is one tiny piece of state, not a dataset
- IndexedDB adds complexity (migrations, sync conflicts)
- Multi-tab sync requires server as source of truth anyway
- Server already knows elapsed time from `started_at`

---

## Data Model

### Active Timer Table

```sql
CREATE TABLE active_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  is_billable BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL,
  paused_at TIMESTAMPTZ,  -- null = running, set = paused
  accumulated_seconds INTEGER DEFAULT 0,  -- time before current run
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)  -- only one active timer per user
);
```

### TypeScript Type

```typescript
interface ActiveTimer {
  id: string
  user_id: string
  description: string | null
  project_id: string | null
  is_billable: boolean
  started_at: string  // ISO 8601 UTC
  paused_at: string | null
  accumulated_seconds: number
}
```

---

## Timer States & Transitions

```
IDLE → [Start] → RUNNING → [Pause] → PAUSED → [Resume] → RUNNING
                    ↓                    ↓
                 [Stop]              [Stop]
                    ↓                    ↓
                 SAVED               SAVED

PAUSED → [Discard] → IDLE (no entry saved)
```

### State Visual Design

| State | Time Display | Buttons | Visual Cue |
|-------|--------------|---------|------------|
| IDLE | `00:00:00` | Start (teal) | Neutral |
| RUNNING | Ticking | Pause + Stop | Subtle pulse/glow |
| PAUSED | Frozen | Resume + Stop + Discard | Muted/dimmed |

---

## API Endpoints

| Action | Endpoint | Method | Body |
|--------|----------|--------|------|
| Get timer | `/api/timer` | GET | - |
| Start | `/api/timer/start` | POST | `{ startedAt, description?, projectId?, isBillable? }` |
| Pause | `/api/timer/pause` | POST | `{ pausedAt }` |
| Resume | `/api/timer/resume` | POST | `{ resumedAt }` |
| Stop | `/api/timer/stop` | POST | `{ stoppedAt }` |
| Update | `/api/timer` | PATCH | `{ description?, projectId?, isBillable? }` |
| Discard | `/api/timer` | DELETE | - |

### Important: Client Sends Timestamps

```typescript
// Client decides the time, server validates
api.timer.start({ startedAt: new Date().toISOString() })
```

Why? If server sets `started_at`, you get clock drift between "I clicked" and "server received". Client timestamp = what user saw.

Server should validate timestamp is within reasonable range (±5 seconds).

---

## Optimistic UI Pattern

Update state immediately, sync in background. Revert on error.

### Example: Start Timer

```typescript
// ❌ Slow (waits for API)
const handleStart = async () => {
  await api.timer.start()
  setTimer({ running: true })
}

// ✅ Instant (optimistic)
const handleStart = () => {
  const startedAt = new Date()
  setTimer({ running: true, startedAt })  // instant UI update
  
  api.timer.start({ startedAt: startedAt.toISOString() })
    .catch(() => {
      setTimer({ running: false })  // revert on error
      toast.error("Failed to start timer")
    })
}
```

### All Actions

| Action | Optimistic Update | API Call | On Error |
|--------|------------------|----------|----------|
| Start | Set `running: true`, `startedAt: now` | `POST /api/timer/start` | Revert to idle, toast |
| Pause | Set `paused: true`, `pausedAt: now` | `POST /api/timer/pause` | Revert to running |
| Resume | Set `paused: false`, update `startedAt` | `POST /api/timer/resume` | Revert to paused |
| Stop | Set `idle`, add entry to list | `POST /api/timer/stop` | Remove entry, restore timer |
| Discard | Set `idle` | `DELETE /api/timer` | Restore paused state |

### Prevent Double-Clicks

```typescript
const [pending, setPending] = useState(false)

const handleStart = () => {
  if (pending) return
  setPending(true)
  
  setTimer({ running: true, startedAt: new Date() })
  
  api.timer.start()
    .catch(() => { /* revert */ })
    .finally(() => setPending(false))
}
```

---

## Sync Strategy

| Event | Action |
|-------|--------|
| Page load | Fetch `/api/timer` → if exists, calculate elapsed, start tick |
| Start/Stop/Pause/Resume | Immediate API call |
| Edit description | Debounced PATCH (500ms after typing stops) |
| Edit project/billable | Immediate PATCH |
| Tab becomes visible | Refetch `/api/timer` to resync |
| Browser focus | Refetch `/api/timer` to resync |

### No Periodic Sync Needed

Server already knows elapsed time from `started_at`. Only sync on user actions and page focus.

---

## Keyboard Shortcuts

| Shortcut | Action | When |
|----------|--------|------|
| `S` | Start timer | When idle |
| `Space` | Pause/Resume | When running/paused |
| `Esc` | Stop timer (save entry) | When running/paused |
| `D` | Discard | When paused (requires confirm) |
| `/` | Focus description input | Always |
| `P` | Focus project dropdown | Always |
| `B` | Toggle billable | Always |

### Implementation Notes

- Shortcuts only work when not typing in an input field
- Show shortcuts in tooltip on hover over timer controls
- Optional: `Cmd/Ctrl + Shift + T` as global shortcut (for extension)

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement) {
      return
    }
    
    switch (e.key.toLowerCase()) {
      case 's':
        if (timer.state === 'idle') handleStart()
        break
      case ' ':
        e.preventDefault()
        if (timer.state === 'running') handlePause()
        else if (timer.state === 'paused') handleResume()
        break
      case 'escape':
        if (timer.state !== 'idle') handleStop()
        break
      case 'd':
        if (timer.state === 'paused') handleDiscard()
        break
      case '/':
        e.preventDefault()
        descriptionRef.current?.focus()
        break
      case 'p':
        projectSelectRef.current?.focus()
        break
      case 'b':
        toggleBillable()
        break
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [timer.state])
```

---

## Time Display

### Format

- Always show `HH:MM:SS` (even if hours is 00)
- Use monospace font (prevents layout shift as digits change)
- Large enough to read at a glance

### Tab Title

When timer is running, update browser tab title:

```typescript
useEffect(() => {
  if (timer.state === 'running') {
    document.title = `${formatTime(elapsed)} - BillMint`
  } else {
    document.title = 'BillMint'
  }
}, [elapsed, timer.state])
```

### Calculate Elapsed Time

```typescript
function calculateElapsed(timer: ActiveTimer): number {
  if (!timer) return 0
  
  const now = Date.now()
  const started = new Date(timer.started_at).getTime()
  
  if (timer.paused_at) {
    // Paused: show time up to pause
    const paused = new Date(timer.paused_at).getTime()
    return timer.accumulated_seconds + Math.floor((paused - started) / 1000)
  }
  
  // Running: show live time
  return timer.accumulated_seconds + Math.floor((now - started) / 1000)
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
```

---

## Timezone Handling

### Rule: Store UTC, Display Local

```
DATABASE (Supabase)         → Always UTC (TIMESTAMPTZ)
API requests/responses      → Always UTC (ISO 8601)
Browser JS Date objects     → UTC internally
Display to user             → Convert to user's local timezone
```

### Implementation

```typescript
// Storing (client → server)
const startedAt = new Date().toISOString() // "2026-01-22T14:30:00.000Z"

// Displaying
const display = new Date(entry.startedAt).toLocaleTimeString() 
// Automatically shows in user's local time
```

### Date Grouping for Entries

Group by user's local date, not UTC date:

```typescript
// User in Bucharest (UTC+2) tracks time at 1am local
// UTC = 11pm previous day
// Must group by local date, not UTC

entries.reduce((groups, entry) => {
  const localDate = new Date(entry.startedAt).toLocaleDateString()
  groups[localDate] = groups[localDate] || []
  groups[localDate].push(entry)
  return groups
}, {})
```

### User Settings

For MVP: use browser's timezone automatically:

```typescript
const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone 
// "Europe/Bucharest"
```

Later: let user override in Settings.

---

## Core Behavior Checklist

### Starting
- [ ] Start with zero fields filled (just click Start)
- [ ] No validation required - description and project optional
- [ ] Timer visible on all pages (top bar)
- [ ] Only one active timer per user (starting new stops old)

### Running
- [ ] Timer counts up in real-time (tick every 1 second)
- [ ] Description editable anytime (debounced auto-save)
- [ ] Project selectable anytime (immediate save)
- [ ] Billable toggle anytime (immediate save)

### Persistence
- [ ] Timer state lives in server (Supabase)
- [ ] Recover running timer on page load
- [ ] Recover timer after browser crash/close
- [ ] Multi-tab: all tabs show same timer (refetch on focus)

### Stopping
- [ ] Minimum entry duration: 1 minute (or prompt to discard)
- [ ] On stop: create time entry immediately
- [ ] On stop: show entry in recent entries list
- [ ] On stop: reset timer to IDLE state
- [ ] On stop: clear description and project

---

## Edge Cases

### Multiple Tabs

- Only one timer instance (server enforced via UNIQUE constraint)
- All tabs refetch on `visibilitychange` event
- Starting in one tab updates all tabs

```typescript
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      refetchTimer()
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)
  return () => document.removeEventListener('visibilitychange', handleVisibility)
}, [])
```

### Offline

For MVP: show error toast if API fails. Don't queue actions.

Future: queue start/stop actions in memory, sync when online.

### Midnight Crossing

Timer that runs past midnight creates single entry with start date. Don't split entries.

### Very Long Timer (24h+)

Still works. Consider: gentle reminder notification after 8+ hours.

### Short Entries (<1 minute)

On stop, if duration < 60 seconds:
- Prompt: "Entry is less than 1 minute. Save anyway?"
- Options: [Save] [Discard]

---

## Feedback & Polish

### Visual Feedback
- [ ] Subtle animation when starting (button color transition)
- [ ] Different button colors per state
- [ ] Monospace font for time display

### Audio (Optional, Off by Default)
- [ ] Sound on start
- [ ] Sound on stop

### Toasts
- [ ] On stop: "Entry saved: 2h 15m"
- [ ] On error: "Failed to start timer"
- [ ] On discard: "Timer discarded"

### Browser Integration
- [ ] Tab title shows time when running
- [ ] Optional: favicon changes when running (green dot)

---

## Performance

- [ ] Timer tick doesn't re-render whole page (isolate in component)
- [ ] Debounce description saves (500ms)
- [ ] Optimistic UI for all actions
- [ ] Use `requestAnimationFrame` or `setInterval` for tick (1s interval is fine)

```typescript
// Efficient tick - only update time display
useEffect(() => {
  if (timer.state !== 'running') return
  
  const interval = setInterval(() => {
    setElapsed(calculateElapsed(timer))
  }, 1000)
  
  return () => clearInterval(interval)
}, [timer.state, timer.started_at])
```

---

## Summary

1. **Server is source of truth** - no IndexedDB
2. **Optimistic UI** - instant feel, revert on error
3. **UTC everywhere** - convert only for display
4. **Keyboard shortcuts** - power users love them
5. **Handle edge cases** - multiple tabs, crashes, midnight

---

## Auto-Pause Setting

Prevents "forgot to stop timer" situations where users accidentally track 24+ hours.

### Behavior

- Timer auto-pauses when it exceeds user's configured limit
- Pauses at exactly the limit (e.g., 8:00:00), not when detected
- User sees warning toast on next visit
- User can review and stop/resume as needed

### User Setting

```typescript
// In user profile
{
  max_timer_hours: number | null  // null = no limit, default = 8
}
```

### Settings UI

```
Auto-pause timer after
┌─────────────────────────────────────┐
│ 8 hours                          ▼  │
└─────────────────────────────────────┘
Options: 4 hours, 8 hours, 12 hours, 24 hours, No limit
```

### Implementation

Check on page load / timer fetch:

```typescript
// On page load or when fetching timer
const checkAutoPause = async (timer: ActiveTimer, maxHours: number | null) => {
  if (!timer || timer.paused_at || !maxHours) return
  
  const elapsed = calculateElapsed(timer)
  const maxSeconds = maxHours * 3600
  
  if (elapsed > maxSeconds) {
    // Calculate exact pause time (started_at + max duration)
    const pausedAt = new Date(
      new Date(timer.started_at).getTime() + maxSeconds * 1000
    ).toISOString()
    
    // Auto-pause at the limit
    await api.timer.pause({ pausedAt })
    
    toast.warning(
      `Timer was automatically paused after ${maxHours} hours. Review and stop when ready.`,
      { duration: 10000 }  // Show longer
    )
  }
}
```

### Server-Side Enforcement (Optional)

For extra safety, run a cron job to pause stale timers:

```sql
-- Run every hour
UPDATE active_timers
SET 
  paused_at = started_at + (
    SELECT (max_timer_hours * INTERVAL '1 hour') 
    FROM users 
    WHERE users.id = active_timers.user_id
  ),
  updated_at = now()
WHERE 
  paused_at IS NULL
  AND started_at + (
    SELECT (COALESCE(max_timer_hours, 24) * INTERVAL '1 hour')
    FROM users
    WHERE users.id = active_timers.user_id
  ) < now();
```

### Edge Cases

- User increases limit after timer already paused → stays paused, user can resume
- User decreases limit while timer running → will pause on next check
- No limit set → timer runs indefinitely (user's choice)
