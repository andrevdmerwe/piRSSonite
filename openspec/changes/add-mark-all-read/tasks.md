# Tasks: Add Mark All as Read Button

## 1. Backend
- [x] 1.1 Extend `/api/entries/clear` to accept optional `folderId` parameter
- [x] 1.2 Add support for clearing all entries when no feedId or folderId provided
- [x] 1.3 Ensure proper response with updated count

## 2. Frontend
- [x] 2.1 Add "mark all read" icon button to `EntryFeed.tsx` header next to refresh
- [x] 2.2 Implement click handler to call `/api/entries/clear` with appropriate params
- [x] 2.3 Update local state after successful clear to reflect read status
- [x] 2.4 Refresh unread counts via context after clearing
- [x] 2.5 Disable button when `localUnreadCount === 0`

## 3. Validation
- [ ] 3.1 Start dev server and verify button appears in header
- [ ] 3.2 Test mark all read for single feed view
- [ ] 3.3 Test mark all read for folder view
- [ ] 3.4 Test mark all read for "all items" view
- [ ] 3.5 Verify unread counts update in sidebar after clearing
