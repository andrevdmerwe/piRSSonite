# Proposal: Add Entry State Tracking & Unread Counters

**Change ID:** `add-entry-state-tracking`
**Status:** Proposed
**Author:** AI Assistant
**Date:** 2026-01-17

## Overview

Add read/unread/starred state management for RSS entries and real-time unread counters across the application. This implements Phase 3 (Read/Unread Tracking) and Phase 4 (Unread Counter System) from the project plan.

## Motivation

Currently, piRSSonite can fetch and store RSS entries but provides no way for users to:
- Mark entries as read/unread
- Star important entries for later reference
- See unread counts per feed and folder
- Automatically mark entries as read when scrolled past or opened

This change adds the core state management and UI capabilities to make piRSSonite a functional RSS reader.

## Goals

1. **Entry State Management**
   - API to update entry `isRead` and `isStarred` status
   - Optimistic UI updates for instant feedback
   - Bulk "mark all as read" for feeds/folders

2. **Automatic Read Tracking**
   - Mark as read when "Open in Browser" is clicked
   - Mark as read when entry scrolls past viewport top (using Intersection Observer)

3. **Unread Counter System**
   - Real-time unread counts at global, folder, and feed levels
   - Efficient aggregation queries
   - Live updates when entry states change

4. **Entry Display UI**
   - List view showing entries with read/unread/starred indicators
   - Expandable entries showing full content
   - Actions: star, mark read, open in browser

## Non-Goals

- Multi-user support (single-user only)
- Offline sync or service workers
- Advanced filtering beyond folder/feed
- Feed/folder management UI (Phase 5)

## Success Criteria

- Users can mark entries as read/unread via UI
- Users can star/unstar entries
- Unread counters update in real-time when entry states change
- Entries auto-mark as read when scrolled past or opened
- All entry state changes persist across page reloads
- Unread counts are accurate and performant (< 100ms query time)

## Dependencies

- **Completed:** Phase 1 (Bootstrap) and Phase 2 (Auto-Refresh)
- **Database:** Entry model already has `isRead` and `isStarred` fields
- **Types:** `UnreadCounts` interface already defined
- **No external library changes needed**

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SQLite performance with large entry counts | Medium | Add database indexes (already in place), limit queries to visible entries |
| Scroll detection performance issues | Low | Use Intersection Observer (efficient), debounce updates |
| Race conditions on optimistic updates | Low | Rollback on API error, use database transactions |
| Stale unread counts | Low | Poll every 30s, trigger refetch on state changes |

## Related Changes

- Future: Phase 5 (Feed Management UI)
- Future: Phase 6 (WebSub Integration)
- Future: Phase 7 (OPML Import/Export)
