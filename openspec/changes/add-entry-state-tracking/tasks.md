# Tasks: Add Entry State Tracking & Unread Counters

**Change ID:** `add-entry-state-tracking`

## Task Ordering

Tasks are ordered to deliver user-visible progress incrementally. Each task is independently testable.

---

## Backend API Tasks

### Task 1: Create Entry State Update API
**File:** `app/api/entries/[id]/route.ts`
**Priority:** High
**Estimated Effort:** 30 minutes

**Acceptance Criteria:**
- `PUT /api/entries/[id]` endpoint exists
- Accepts `{ isRead?: boolean, isStarred?: boolean }` payload
- Returns updated entry object
- Returns 404 if entry not found
- Validates input types
- Uses Prisma transaction

**Testing:**
```bash
# Test mark as read
curl -X PUT http://localhost:3000/api/entries/1 \
  -H "Content-Type: application/json" \
  -d '{"isRead": true}'

# Test star entry
curl -X PUT http://localhost:3000/api/entries/1 \
  -H "Content-Type: application/json" \
  -d '{"isStarred": true}'
```

**Dependencies:** None

---

### Task 2: Create Bulk Clear API
**File:** `app/api/entries/clear/route.ts`
**Priority:** High
**Estimated Effort:** 20 minutes

**Acceptance Criteria:**
- `POST /api/entries/clear` endpoint exists
- Accepts `{ feedId: number }` payload
- Marks all unread entries for feed as read using `updateMany`
- Returns `{ updated: number }` with count of updated entries
- Returns 200 even if no entries updated

**Testing:**
```bash
# Test bulk clear
curl -X POST http://localhost:3000/api/entries/clear \
  -H "Content-Type: application/json" \
  -d '{"feedId": 1}'

# Verify in Prisma Studio all entries for feed are read
```

**Dependencies:** None

---

### Task 3: Create Unread Count Utility
**File:** `lib/utils/counterUtils.ts`
**Priority:** High
**Estimated Effort:** 30 minutes

**Acceptance Criteria:**
- `calculateUnreadCounts()` function exists
- Uses Prisma `groupBy` to aggregate counts
- Returns `{ total, byFolder, byFeed }` structure
- Handles feeds without folders (folderId=null)
- Completes within 100ms for 10,000 entries

**Testing:**
- Unit test: Feed with 10 unread entries → byFeed shows 10
- Unit test: Folder with 2 feeds (5+3 unread) → byFolder shows 8
- Performance test: Measure query time with large dataset

**Dependencies:** None (can be developed in parallel)

---

### Task 4: Create Unread Counts API
**File:** `app/api/counts/route.ts`
**Priority:** High
**Estimated Effort:** 15 minutes

**Acceptance Criteria:**
- `GET /api/counts` endpoint exists
- Calls `calculateUnreadCounts()` from Task 3
- Returns JSON response
- Returns 200 status
- Response matches `UnreadCounts` type

**Testing:**
```bash
# Test get counts
curl http://localhost:3000/api/counts

# Expected response:
# {
#   "total": 42,
#   "byFolder": { "1": 20, "2": 22 },
#   "byFeed": { "10": 5, "11": 15, "12": 22 }
# }
```

**Dependencies:** Task 3 (counterUtils)

---

## Frontend State Management Tasks

### Task 5: Create Unread Counts Context
**File:** `lib/context/UnreadCountsContext.tsx`
**Priority:** High
**Estimated Effort:** 30 minutes

**Acceptance Criteria:**
- React Context provider for unread counts
- Fetches counts from `/api/counts` on mount
- Polls for updates every 30 seconds
- Provides `refetchCounts()` function for manual refresh
- Exports `useUnreadCounts()` hook for consuming components

**Testing:**
- Render component, verify initial fetch occurs
- Wait 30s, verify automatic refetch
- Call `refetchCounts()`, verify fetch triggered

**Dependencies:** Task 4 (counts API)

---

### Task 6: Create Entry State Hook
**File:** `lib/hooks/useEntryState.ts`
**Priority:** High
**Estimated Effort:** 30 minutes

**Acceptance Criteria:**
- Hook accepts `entryId` and initial state
- Returns `{ isRead, isStarred, toggleRead, toggleStar, markRead }`
- Implements optimistic updates
- Rolls back on API error
- Triggers count refetch on success

**Testing:**
- Call `toggleRead()`, verify state updates immediately
- Mock API failure, verify state rolls back
- Mock API success, verify counts refetch triggered

**Dependencies:** Task 1 (entry update API), Task 5 (counts context)

---

## Frontend UI Component Tasks

### Task 7: Create ArticleCard Component
**File:** `components/ArticleCard.tsx`
**Priority:** High
**Estimated Effort:** 60 minutes

**Acceptance Criteria:**
- Displays entry title, summary, metadata
- Shows unread badge when `isRead=false`
- Shows filled star icon when `isStarred=true`
- Expands/collapses on click to show full content
- Provides star button (calls `toggleStar`)
- Provides "Mark as read" button (calls `markRead`)
- Provides "Open in browser" button (marks read + opens URL)

**Testing:**
- Render with unread entry → shows badge
- Click star → state toggles, API called
- Click "Open in browser" → marks read, opens new tab
- Click card → expands to show content

**Dependencies:** Task 6 (entry state hook)

---

### Task 8: Create EntryFeed Component
**File:** `components/EntryFeed.tsx`
**Priority:** High
**Estimated Effort:** 40 minutes

**Acceptance Criteria:**
- Fetches entries for selected feed/folder
- Renders list of `ArticleCard` components
- Sorts entries by published date (newest first)
- Shows loading state while fetching
- Shows "No entries" message when empty

**Testing:**
- Select feed with 10 entries → renders 10 cards
- Select empty feed → shows "No entries"
- Verify entries sorted correctly

**Dependencies:** Task 7 (ArticleCard)

---

### Task 9: Add Scroll Detection to ArticleCard
**File:** `components/ArticleCard.tsx` (modify)
**Priority:** Medium
**Estimated Effort:** 30 minutes

**Acceptance Criteria:**
- Attach IntersectionObserver to card element on mount
- Detect when card scrolls past viewport top
- Call `markRead()` when triggered
- Disconnect observer on unmount
- Only trigger for unread entries

**Testing:**
- Scroll unread entry past top → marks as read
- Scroll read entry past top → no API call
- Scroll rapidly through 10 entries → all marked

**Dependencies:** Task 7 (ArticleCard), Task 6 (entry state hook)

---

### Task 10: Create Sidebar Component with Counts
**File:** `components/Sidebar.tsx`
**Priority:** High
**Estimated Effort:** 45 minutes

**Acceptance Criteria:**
- Displays list of folders and feeds
- Shows unread count badge for each feed
- Shows aggregate count badge for each folder
- Hides badge when count is 0
- Uses `useUnreadCounts()` hook
- Updates in real-time when counts change

**Testing:**
- Feed with 10 unread → shows badge "10"
- Mark entry as read → badge updates to "9"
- Feed with 0 unread → no badge shown

**Dependencies:** Task 5 (counts context)

---

### Task 11: Update Main Page Layout
**File:** `app/page.tsx` (modify)
**Priority:** High
**Estimated Effort:** 30 minutes

**Acceptance Criteria:**
- Implements two-column grid layout
- Left column: Sidebar (280px width)
- Right column: EntryFeed
- Wraps with `UnreadCountsProvider`
- Maintains dark theme styling

**Testing:**
- Page loads showing sidebar + entry feed
- Sidebar shows counts
- Entries display correctly

**Dependencies:** Task 8 (EntryFeed), Task 10 (Sidebar)

---

## Integration & Polish Tasks

### Task 12: Add Entry Fetching API
**File:** `app/api/entries/route.ts`
**Priority:** High
**Estimated Effort:** 30 minutes

**Acceptance Criteria:**
- `GET /api/entries?feedId={id}` endpoint
- Returns paginated entries for feed
- Includes entry state (isRead, isStarred)
- Sorts by published date descending
- Supports optional `limit` and `offset` params

**Testing:**
```bash
curl http://localhost:3000/api/entries?feedId=1&limit=20
```

**Dependencies:** None (can be done in parallel)

---

### Task 13: Add Error Toast Notifications
**File:** `components/Toast.tsx` + `lib/hooks/useToast.ts`
**Priority:** Low
**Estimated Effort:** 30 minutes

**Acceptance Criteria:**
- Toast component for displaying errors
- `useToast()` hook for triggering toasts
- Shows error when API calls fail
- Auto-dismisses after 5 seconds

**Testing:**
- Trigger API error → toast appears
- Wait 5s → toast disappears

**Dependencies:** None

---

### Task 14: Add Loading States
**File:** Multiple components (modify)
**Priority:** Low
**Estimated Effort:** 20 minutes

**Acceptance Criteria:**
- Show loading spinner while fetching entries
- Show skeleton UI while counts load
- Disable buttons during API calls

**Testing:**
- Slow network → loading states appear
- Fast network → no flicker

**Dependencies:** All component tasks

---

## Testing & Validation Tasks

### Task 15: Manual Integration Testing
**Effort:** 60 minutes

**Test Scenarios:**
1. Add feed with entries via Prisma Studio
2. Verify entries appear in UI
3. Click star → entry stars, count doesn't change
4. Click "Mark as read" → badge disappears, count decreases
5. Scroll entry past top → auto-marks as read
6. Click "Open in browser" → marks read, opens new tab
7. Bulk clear feed → all entries marked, count = 0
8. Reload page → all state persists

---

### Task 16: Update testing_steps.md
**File:** `testing_steps.md`
**Priority:** Medium
**Estimated Effort:** 30 minutes

**Acceptance Criteria:**
- Add Phase 3 & 4 test instructions
- Document all new API endpoints
- Provide curl examples
- Add troubleshooting section

**Dependencies:** All tasks complete

---

## Task Summary

**Total Tasks:** 16
**Estimated Total Effort:** ~9 hours

**Critical Path:**
1. Task 1 → Task 6 → Task 7 → Task 9 (Entry state management)
2. Task 3 → Task 4 → Task 5 → Task 10 (Unread counters)
3. Task 12 → Task 8 → Task 11 (Entry display)

**Parallelizable:**
- Tasks 1-4 (all backend APIs)
- Tasks 12 (entries API) can be done anytime
- Tasks 13-14 (polish) can be done anytime

**Quick Wins (deliver value early):**
- Complete Tasks 1-2 first → manual entry state updates work
- Complete Task 7 → see entries in UI (even without counts)
- Complete Task 5 + 10 → see counts in sidebar
