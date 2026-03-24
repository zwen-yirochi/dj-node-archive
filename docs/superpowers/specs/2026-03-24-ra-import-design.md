# RA Import Feature Design

## Overview

Two import features for bringing Resident Advisor data into the platform:

1. **Artist Migration** (Settings modal) — One-time bulk import of all events from a DJ's RA artist profile
2. **Single Event Import** (CreateEntryPanel) — Import individual events by RA event URL

---

## Feature A: Artist Migration

### Location

Settings modal > new "RA Import" tab

### Flow

```
1. User enters RA artist profile URL (ra.co/dj/xxxxx)
2. [Preview] → Show artist name + event count
3. [Import All] → Fetch all events, create entries
4. Progress indicator during import
5. Result report: success N, failed N + failed event list
```

### Constraints

- **One-time only** per user. Checked via `import_logs` where `import_type = 'artist'` and `status IN ('completed', 'partial')`
- After completion, Settings shows read-only summary (artist name, event count, date)

### UI States

**Not migrated:**

```
┌──────────────────────────────────────┐
│  RA Artist Migration                 │
│                                      │
│  Import your full event history      │
│  from your RA profile.               │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ https://ra.co/dj/...        │    │
│  └──────────────────────────────┘    │
│  [Preview]                           │
│                                      │
│  ── Preview (conditional) ──         │
│  Artist: DJ Name                     │
│  Events: 127                         │
│                                      │
│  [Import All]                        │
│                                      │
│  ── Progress (conditional) ──        │
│  ████████░░░░ 67/127                 │
│                                      │
│  ── Report (conditional) ──          │
│  Success: 120                        │
│  Failed: 7                           │
│    - Event Title A: duplicate        │
│    - Event Title B: parse error      │
└──────────────────────────────────────┘
```

**Migrated:**

```
┌──────────────────────────────────────┐
│  RA Artist Migration          Done   │
│                                      │
│  Artist: DJ Name                     │
│  Imported: 120 events | 2026-03-24   │
└──────────────────────────────────────┘
```

---

## Feature B: Single Event Import

### Location

CreateEntryPanel > Event > "Import from RA URL" (replace existing "coming soon" placeholder)

### Flow

```
1. User clicks "Import from RA URL"
2. URL input field expands
3. User enters RA event URL (ra.co/events/1234567)
4. [Import] → Fetch event → Create event + entry → Navigate to detail view
5. On failure: inline error message
```

### UI

```
Event creation options:
  [+ Create new]
  [Search database]
  [Import from RA URL]  ← expands on click

Expanded:
  ┌──────────────────────────────┐
  │ https://ra.co/events/...     │
  └──────────────────────────────┘
  [Import]

  Loading: spinner + "Fetching event from RA..."
  Success: auto-navigate to detail view
  Failure: inline error message
```

---

## API Design

### New Endpoints

#### Artist Migration Preview

```
POST /api/import/artist/preview
Body: { ra_url: "https://ra.co/dj/xxxxx" }
Response: {
  artist: { name: string, eventCount: number },
  sampleEvents: [{ title, date, venue }...] // 5-10 samples
}
```

#### Artist Migration Confirm

```
POST /api/import/artist/confirm
Body: { ra_url: "https://ra.co/dj/xxxxx" }
Response: {
  artist: { name: string },
  totalEvents: number,
  successCount: number,
  failedCount: number,
  failedEvents: [{ title: string, reason: string }...]
}
```

#### Single Event Import

```
POST /api/import/event
Body: { ra_url: "https://ra.co/events/1234567", page_id: string }
Response: {
  entry: { id, slug, ... },
  event: { title, date, venue }
}
```

### RA Service Extensions (`ra.service.ts`)

New functions added to existing service:

```typescript
parseRAArtistUrl(url: string): string           // Extract artistId from URL
fetchRAArtistInfo(artistId: string)              // Artist name + event count
fetchAllRAArtistEvents(artistId: string)         // All past events
fetchRAEventByUrl(eventUrl: string)              // Single event details
```

Uses same RA GraphQL endpoint as existing venue import.

### Handler Pattern

All handlers follow existing 7-step pattern in `import.handlers.ts`:

```
Parse → Validate (URL regex) → Verify (limits) → Logic (RA API)
→ Transform (map to DB) → Database (save) → Response
```

**Artist confirm handler** additionally creates entries in bulk:

- For each event: create event row → create entry row (reference type, event_id)
- Collect success/failure per event → return report

---

## Rate Limiting & Constraints

| Feature             | Limit                                     |
| ------------------- | ----------------------------------------- |
| Artist migration    | Once per user (checked via `import_logs`) |
| Single event import | Existing rate limit: 5/hour per user      |

---

## Data Flow

### Shared Logic

Both features go through:

```
RA GraphQL → Event data → events table → entries table (reference type)
```

Entry creation uses `EventReferenceData: { event_id: string }` — the entry references the events table row.

### Duplicate Handling

| Scenario                                 | Action                                                              |
| ---------------------------------------- | ------------------------------------------------------------------- |
| Same RA event already in `events` table  | Reuse existing event, create entry only                             |
| Entry already references same `event_id` | Skip, report as "duplicate"                                         |
| Venue already in DB                      | Reuse existing venue                                                |
| Venue not in DB                          | Store venue name as text in event data only (no venue row creation) |

### Error Cases

| Error                             | Handling                                 |
| --------------------------------- | ---------------------------------------- |
| Invalid URL format                | Client-side validation, inline error     |
| RA API failure                    | "Failed to fetch from RA" error          |
| Artist has 0 events               | "No events found" message                |
| Migration already completed       | Show completed state UI, button disabled |
| Single import rate limit exceeded | "Rate limit exceeded, try again later"   |

---

## Migration State Management

### import_logs Table

Existing table, extended with new `import_type` values:

```
import_type: 'venue' (existing) | 'artist' (new) | 'event' (new)
```

**Artist migration record:**

```
{
  user_id: string,
  import_type: 'artist',
  ra_url: string,          // artist profile URL
  event_count: number,     // success count
  status: 'completed' | 'partial',
  metadata: {              // JSONB
    artist_name: string,
    total: number,
    success: number,
    failed: number,
    failed_events: [{ title: string, reason: string }...]
  }
}
```

**One-time check query:**

```sql
SELECT * FROM import_logs
WHERE user_id = ? AND import_type = 'artist' AND status IN ('completed', 'partial')
LIMIT 1
```

---

## Component Structure

### Settings

```
SettingsModal.tsx (existing — add tab)
└── SettingsRAImport.tsx (new)
    ├── RAMigrationForm      — URL input + preview
    ├── RAMigrationProgress  — progress bar
    └── RAMigrationResult    — success/failure report
```

### CreateEntry

```
CreateEntryPanel.tsx (existing — replace "coming soon")
└── EventRAImport.tsx (new)
    └── URL input + validation + entry creation
```

---

## Technical Notes

- RA GraphQL artist events query needs to be verified during implementation. If the query shape differs from venue events, the mapper will need adjustment.
- Artist migration may take 10-30 seconds for large event histories (300+ events). The progress UI is essential.
- All UI text in English.
