# Design: Feed Management UI

## Architecture Decisions

### UI Pattern: Modal Dialog vs. Dedicated Page

**Decision:** Use a modal dialog (`ManageFeedsModal.tsx`) triggered from the sidebar.

**Rationale:**
- Maintains current single-page application flow
- Allows quick access without navigation
- Keeps users in context while managing feeds
- Consistent with modern RSS reader UX (Feedly, Inoreader)

**Trade-offs:**
- Modal may feel cramped for large feed collections → mitigated with search/filter
- Harder to bookmark management view → acceptable for authenticated tool
- Less mobile-friendly → acceptable as desktop-first app

### API Design: RESTful Endpoints

**Endpoints to Add:**

```
POST   /api/feeds              - Add new feed
DELETE /api/feeds/[id]         - Delete feed
PUT    /api/feeds/[id]         - Update feed (move to folder, rename)

POST   /api/folders            - Create folder
DELETE /api/folders/[id]       - Delete folder (moves feeds to root)
PUT    /api/folders/[id]       - Rename folder
```

**Validation Strategy:**
- URL validation: Check format, attempt fetch before saving
- Duplicate detection: Check existing feed URLs before adding
- Title extraction: Parse feed XML to get actual title
- Folder constraints: Cannot delete folder with feeds unless confirmed

### State Management

**Approach:** Optimistic updates with rollback on error

**Data Flow:**
1. User action in modal (e.g., "Add Feed")
2. Optimistic UI update (show loading state)
3. API call to backend
4. On success: Update sidebar state, close modal
5. On error: Rollback UI, show error message

**State Synchronization:**
- Sidebar maintains `feeds` and `folders` state
- Modal receives state as props and callbacks to update
- After operations, trigger sidebar re-fetch to ensure consistency

### Feed Addition Flow

```
User pastes URL → Validate format → Fetch feed XML → Parse title
→ Show preview → User confirms/selects folder → Save to DB
→ Trigger initial refresh → Update sidebar
```

**Key Considerations:**
- Show feed title preview before saving (better UX)
- Allow folder selection during add (not just post-add move)
- Fetch first entry preview to confirm feed is valid
- Handle common feed URL mistakes (missing .rss, wrong protocol)

### Error Handling Strategy

**Categories:**
1. **Validation Errors** (400): Invalid URL format, duplicate feed
2. **Fetch Errors** (404, 403): Feed not found, access denied
3. **Parse Errors** (422): Invalid XML, not a valid RSS/Atom feed
4. **Server Errors** (500): Database issues, unexpected errors

**User Messaging:**
- Clear, actionable error messages (e.g., "Feed URL already exists")
- Distinguish between user error and system error
- Provide suggestions for common issues (e.g., "Try adding .rss to the URL")

## Component Structure

```
ManageFeedsModal.tsx
├── Header (title, close button)
├── Tabs
│   ├── "Add Feed" tab
│   │   ├── URL input
│   │   ├── Folder selector dropdown
│   │   ├── Preview area (feed title, first entry)
│   │   └── Add button
│   ├── "Manage Feeds" tab
│   │   ├── Search/filter input
│   │   ├── Feed list with delete buttons
│   │   └── Move to folder dropdown per feed
│   └── "Manage Folders" tab
│       ├── Folder list with rename/delete
│       ├── Add folder input
│       └── Feed count per folder
└── Footer (cancel/save buttons if needed)
```

**Alternative Simpler Design (Recommended):**

```
ManageFeedsModal.tsx
├── Header with close button
├── Add Feed Section
│   ├── URL input + Folder dropdown
│   └── Add button
├── Manage Folders Section
│   ├── Create folder input
│   └── Folder list (rename/delete)
└── Manage Feeds Section
    └── Feed list grouped by folder
        └── Delete/move actions per feed
```

This flatter structure avoids tab complexity for a simpler, more scannable interface.

## Data Model Changes

**None required.** The existing Prisma schema already supports all operations:
- `Feed.folderId` is nullable (allows root feeds)
- `Folder.feeds` relation handles cascading correctly
- `Feed.url` unique constraint prevents duplicates

## Performance Considerations

**Feed Validation:**
- Timeout: 10 seconds max for feed fetch during addition
- Caching: Consider caching feed metadata to speed up re-adds
- Background processing: Initial fetch happens during add, subsequent refreshes via normal polling

**Modal Rendering:**
- Lazy load: Don't render modal until opened (use dynamic import)
- List virtualization: If users have 100+ feeds, consider virtual scrolling
- Debounce: Search/filter input should debounce to avoid excessive re-renders

## Security Considerations

**URL Validation:**
- Whitelist schemes: Only allow `http://` and `https://`
- SSRF protection: Validate URLs don't point to local/private networks
- Sanitization: Escape feed titles and content before display

**Input Sanitization:**
- Folder names: Limit length (max 100 chars), strip HTML
- Feed URLs: Validate format, check against malicious patterns

## Testing Strategy

**Manual Integration Tests:**
1. Add feed with valid URL → Success, appears in sidebar
2. Add feed with invalid URL → Error message shown
3. Add duplicate feed → Error message "Feed already exists"
4. Create folder → Appears in sidebar
5. Rename folder → Updates immediately
6. Delete folder with feeds → Prompts confirmation, moves feeds to root
7. Delete feed → Removes from sidebar, entries remain in DB
8. Move feed between folders → Updates sidebar grouping

**API Tests:**
```bash
# Add feed
curl -X POST http://localhost:3003/api/feeds \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/feed.rss", "folderId": 1}'

# Delete feed
curl -X DELETE http://localhost:3003/api/feeds/1

# Create folder
curl -X POST http://localhost:3003/api/folders \
  -H "Content-Type: application/json" \
  -d '{"name": "Tech News"}'

# Rename folder
curl -X PUT http://localhost:3003/api/folders/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Technology"}'

# Delete folder
curl -X DELETE http://localhost:3003/api/folders/1
```

## Migration Path

**No database migrations needed.** All schema fields already exist.

**Deployment steps:**
1. Deploy new API routes
2. Deploy modal component
3. Add "Manage Feeds" button to sidebar
4. Test in production

## Open Questions

1. **Should deleting a folder also delete its feeds?**
   - **Recommendation:** No, move feeds to root (safer default)
   - Offer "Delete folder and feeds" as advanced option

2. **Should we validate feeds immediately or allow broken feeds?**
   - **Recommendation:** Validate on add, show warning if fails
   - Allow user to force-add with "Add anyway" option

3. **How to handle feed title conflicts?**
   - **Recommendation:** Use URL as unique identifier, allow duplicate titles
   - Show URL in tooltip if titles match

4. **Should we support folder nesting?**
   - **Recommendation:** No, single-level folders only (current schema)
   - Can be added in future phase if requested
