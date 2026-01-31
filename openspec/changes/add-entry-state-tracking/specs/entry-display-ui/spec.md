# Spec: Entry Display UI

**Capability:** `entry-display-ui`
**Status:** Proposed
**Version:** 1.0.0

## Overview

User interface components to display RSS entries with read/unread/starred indicators and state management actions.

---

## ADDED Requirements

### Requirement: Entry List View

**ID:** `entry-display-ui.list`
**Priority:** High

The system SHALL display a list of entries with read/unread status indicators.

#### Scenario: Display unread entry

**Given** an entry exists with `isRead=false`
**When** the entry list is rendered
**Then** the entry displays an "unread" badge or indicator
**And** the entry title is displayed prominently

#### Scenario: Display read entry

**Given** an entry exists with `isRead=true`
**When** the entry list is rendered
**Then** the entry does NOT display an unread indicator
**And** the entry may be visually de-emphasized (lighter text)

#### Scenario: Display starred entry

**Given** an entry exists with `isStarred=true`
**When** the entry list is rendered
**Then** a star icon is displayed in a filled/highlighted state

#### Scenario: Sort entries by date

**Given** multiple entries exist
**When** the entry list is rendered
**Then** entries are sorted by `published` date descending (newest first)

---

### Requirement: Entry Expansion

**ID:** `entry-display-ui.expansion`
**Priority:** High

The system SHALL allow users to expand entries to view full content inline.

#### Scenario: Click to expand entry

**Given** an entry is displayed in collapsed state (showing title and summary)
**When** the user clicks the entry card
**Then** the entry expands to show full HTML content
**And** the entry remains expanded until clicked again

#### Scenario: Collapse expanded entry

**Given** an entry is displayed in expanded state
**When** the user clicks the entry card again
**Then** the entry collapses to show only title and summary

---

### Requirement: Entry Actions

**ID:** `entry-display-ui.actions`
**Priority:** High

The system SHALL provide action buttons for each entry to manage state.

#### Scenario: Star button toggles starred state

**Given** an entry with `isStarred=false` is displayed
**When** the user clicks the star button
**Then** the button immediately shows filled/highlighted state (optimistic)
**And** a PUT request is sent to `/api/entries/[id]` with `{ "isStarred": true }`
**And** the state persists after page reload

#### Scenario: Mark as read button

**Given** an unread entry is displayed
**When** the user clicks "Mark as read"
**Then** the unread indicator is immediately removed (optimistic)
**And** a PUT request is sent to `/api/entries/[id]` with `{ "isRead": true }`

#### Scenario: Open in browser button

**Given** an entry with `url="https://example.com/article"` is displayed
**When** the user clicks "Open in browser"
**Then** the entry is marked as read (API call)
**And** a new browser tab opens with `https://example.com/article`

---

### Requirement: Optimistic UI Updates

**ID:** `entry-display-ui.optimistic`
**Priority:** High

The system SHALL update the UI immediately when user takes actions, before API confirmation.

#### Scenario: Optimistic star update

**Given** an entry is displayed
**When** the user clicks the star button
**Then** the star icon changes state within 50ms
**And** no loading spinner is shown
**And** if the API call fails, the state reverts

#### Scenario: Optimistic read state update

**Given** an unread entry is displayed
**When** the user marks it as read
**Then** the unread badge is removed immediately
**And** if the API call fails, the badge reappears

---

### Requirement: Unread Count Display

**ID:** `entry-display-ui.count-display`
**Priority:** High

The system SHALL display unread counts in the feed/folder navigation sidebar.

#### Scenario: Display feed unread count

**Given** a feed has 10 unread entries
**When** the sidebar is rendered
**Then** the feed shows a badge with "10"

#### Scenario: Hide count when zero unread

**Given** a feed has 0 unread entries
**When** the sidebar is rendered
**Then** no unread count badge is displayed for that feed

#### Scenario: Display folder aggregate count

**Given** a folder contains feeds with 5, 10, and 3 unread entries
**When** the sidebar is rendered
**Then** the folder shows a badge with "18" (aggregate)

---

### Requirement: Entry Metadata Display

**ID:** `entry-display-ui.metadata`
**Priority:** Medium

The system SHALL display entry metadata including source feed, publish date, and tags.

#### Scenario: Display entry source

**Given** an entry belongs to feed "Hacker News"
**When** the entry is rendered
**Then** the feed name "Hacker News" is displayed

#### Scenario: Display publish date

**Given** an entry was published "2026-01-17T10:00:00Z"
**When** the entry is rendered
**Then** a relative time is displayed (e.g., "2 hours ago")

---

### Requirement: Error Handling

**ID:** `entry-display-ui.errors`
**Priority:** Medium

The system SHALL handle API errors gracefully with user feedback.

#### Scenario: API failure on star

**Given** an entry is displayed
**When** the user clicks star and the API call fails
**Then** the star state reverts to original
**And** an error message is displayed (toast/notification)
**And** the error message suggests retrying

---

## MODIFIED Requirements

None. This is a new capability.

---

## REMOVED Requirements

None.

---

## Related Capabilities

- `entry-state-api`: UI calls these APIs for state changes
- `unread-counters`: UI displays counts from counter system
- `scroll-detection`: UI integrates scroll tracking
