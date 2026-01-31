# Change: Add Feed Management UI

**Change ID:** `add-feed-management-ui`
**Status:** Proposed
**Created:** 2026-01-17

## Why

piRSSonite currently lacks UI for managing feeds and folders, requiring users to manually manipulate the database to add or remove feeds. This makes the application incomplete and impractical for end users.

## What Changes

- Add `POST /api/feeds` endpoint to add new feeds with validation
- Add `DELETE /api/feeds/[id]` endpoint to remove feeds
- Add `PUT /api/feeds/[id]` endpoint to update feed folder assignment
- Add `POST /api/folders` endpoint to create folders
- Add `DELETE /api/folders/[id]` endpoint to remove folders (moves feeds to root)
- Add `PUT /api/folders/[id]` endpoint to rename folders
- Create `ManageFeedsModal.tsx` component with three sections: Add Feed, Manage Folders, Manage Feeds
- Add "Manage Feeds" button to sidebar that opens the modal
- Implement feed URL validation and metadata extraction (title from RSS/Atom XML)
- Implement optimistic UI updates with error rollback for all operations
- Add confirmation dialogs for destructive actions (delete feed, delete folder)

## Impact

- **Users**: Can now add, organize, and remove feeds entirely through the UI
- **Database**: No schema changes required (all necessary fields already exist)
- **Dependencies**: Uses existing `fetchAndParseFeed` utility from Phase 2
- **Performance**: Feed validation may take 5-10 seconds for slow feeds (with 30s timeout)
- **Testing**: Adds 6 new API endpoints requiring integration testing
