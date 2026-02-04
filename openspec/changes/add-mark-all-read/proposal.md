# Change: Add Mark All as Read Button

## Why

Users currently have no quick way to mark all visible articles as read in the articles panel. The existing `/api/entries/clear` endpoint only supports clearing entries by feedId, but the UI needs a button in the header to mark all displayed entries as read (whether viewing all entries, a folder, or a single feed).

## What Changes

- **Frontend**: Add a "mark all read" button in the `EntryFeed.tsx` header alongside the existing refresh button
- **Backend**: Extend `/api/entries/clear` to support `folderId` parameter and clearing all entries (no params)
- **UI/UX**: Button displays next to the refresh icon, disabled when no unread entries exist

## Impact

- Affected specs: `entry-state-api` (extends bulk mark as read requirement)
- Affected code:
  - `components/EntryFeed.tsx` (add button to header)
  - `app/api/entries/clear/route.ts` (extend to support folderId and all)
