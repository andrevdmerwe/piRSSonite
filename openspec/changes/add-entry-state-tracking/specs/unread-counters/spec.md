# Spec: Unread Counters

**Capability:** `unread-counters`
**Status:** Proposed
**Version:** 1.0.0

## Overview

System to calculate and display unread entry counts at global, folder, and feed levels.

---

## ADDED Requirements

### Requirement: Calculate Unread Counts

**ID:** `unread-counters.calculate`
**Priority:** High

The system SHALL calculate accurate unread counts aggregated by feed and folder.

#### Scenario: Calculate counts for feeds with unread entries

**Given** feed `id=1` has 5 unread entries
**And** feed `id=2` has 3 unread entries
**When** the count calculation runs
**Then** the result contains `byFeed: { "1": 5, "2": 3 }`
**And** the result contains `total: 8`

#### Scenario: Aggregate counts by folder

**Given** folder `id=10` contains feeds `1` and `2`
**And** feed `1` has 5 unread entries
**And** feed `2` has 3 unread entries
**When** the count calculation runs
**Then** the result contains `byFolder: { "10": 8 }`

#### Scenario: No unread entries

**Given** all entries are marked as read
**When** the count calculation runs
**Then** the result contains `total: 0`
**And** the result contains `byFolder: {}`
**And** the result contains `byFeed: {}`

#### Scenario: Feeds without folders

**Given** feed `id=5` has `folderId=null` and 10 unread entries
**When** the count calculation runs
**Then** the result contains `byFeed: { "5": 10 }`
**And** the feed's count is NOT included in any folder count

---

### Requirement: Unread Counts API

**ID:** `unread-counters.api`
**Priority:** High

The system SHALL provide an API endpoint to retrieve current unread counts.

#### Scenario: Get current counts

**Given** the database has entries with various read states
**When** a GET request is made to `/api/counts`
**Then** the HTTP status code is 200
**And** the response contains `{ total, byFolder, byFeed }`
**And** all counts are accurate as of request time

#### Scenario: Performance within limits

**Given** the database contains 10,000 entries
**When** a GET request is made to `/api/counts`
**Then** the response is returned within 100ms
**And** the query uses database indexes efficiently

---

### Requirement: Real-Time Count Updates

**ID:** `unread-counters.realtime`
**Priority:** Medium

The system SHALL update counts automatically when entry states change.

#### Scenario: Count decreases when entry marked read

**Given** feed `id=1` has 10 unread entries
**And** the client has cached counts showing `byFeed: { "1": 10 }`
**When** an entry is marked as read
**And** the client refetches counts
**Then** the new counts show `byFeed: { "1": 9 }`

#### Scenario: Count increases when entry marked unread

**Given** feed `id=1` has 10 unread entries
**When** a read entry is marked as unread
**And** the client refetches counts
**Then** the new counts show `byFeed: { "1": 11 }`

---

### Requirement: Client-Side Count Caching

**ID:** `unread-counters.caching`
**Priority:** Medium

The system SHALL cache counts on the client to minimize API calls.

#### Scenario: Poll for count updates

**Given** the client has loaded the application
**When** 30 seconds have elapsed
**Then** the client automatically fetches fresh counts from `/api/counts`

#### Scenario: Immediate refresh after state change

**Given** the user marks an entry as read
**When** the API call succeeds
**Then** the client immediately refetches counts
**And** the UI updates with new values

---

### Requirement: Optimistic Count Updates

**ID:** `unread-counters.optimistic`
**Priority:** Low

The system SHOULD update counts optimistically before API confirmation.

#### Scenario: Optimistic decrement on mark read

**Given** feed `id=1` shows 10 unread entries
**When** the user clicks "mark as read" on an entry
**Then** the count immediately decreases to 9 in the UI
**And** the count is corrected if the API call fails

---

## MODIFIED Requirements

None. This is a new capability.

---

## REMOVED Requirements

None.

---

## Related Capabilities

- `entry-state-api`: Provides the `isRead` values used for counting
- `entry-display-ui`: Displays the counts in sidebar and UI

---

## Performance Requirements

- Count calculation SHALL complete within 100ms for 10,000 entries
- Count queries SHALL use database indexes on `[feedId, isRead]`
- Client polling interval SHALL be 30 seconds minimum
