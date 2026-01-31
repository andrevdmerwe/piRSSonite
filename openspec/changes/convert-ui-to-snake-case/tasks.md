# Tasks: Convert UI Text to snake_case

Implementation checklist for converting all UI text to snake_case formatting. Tasks should be completed sequentially.

## Task 1: Create toSnakeCase Utility (~15 mins)

**File**: `lib/utils/textUtils.ts` (NEW)

**Work**:
- [x] Create new file `lib/utils/textUtils.ts`
- [x] Implement `toSnakeCase(str: string): string` function
  - Convert to lowercase
  - Replace spaces with underscores
  - Replace special characters with underscores
  - Collapse multiple underscores
  - Trim leading/trailing underscores
- [x] Add TypeScript type exports
- [x] Test edge cases manually:
  - "3D Printing" → "3d_printing"
  - "Technology & News" → "technology_news"
  - "  Extra Spaces  " → "extra_spaces"

**Validation**:
```typescript
// Quick tests in console
import { toSnakeCase } from '@/lib/utils/textUtils'
console.log(toSnakeCase("3D Printing"))  // "3d_printing"
console.log(toSnakeCase("Tech & News"))   // "tech_news"
```

**Files Modified**: `lib/utils/textUtils.ts` (new file, ~20 lines)

---

## Task 2: Update Sidebar Component (~20 mins)

**File**: `components/Sidebar.tsx`

**Work**:
- [x] Import `toSnakeCase` from `@/lib/utils/textUtils`
- [x] Line 76: Convert "unread articles" → "unread_articles"
- [x] Line 83: Convert "Manage Feeds" → "manage_feeds"
- [x] Line 90: Convert "Views" → "views"
- [x] Line 96: Convert "All Items" → "all_items"
- [x] Line 108: Convert "Feeds" → "feeds"
- [x] Line 122: Apply `toSnakeCase()` to feed.title:
  ```typescript
  {toSnakeCase(feed.title)}
  ```
- [x] Line 135: Apply `toSnakeCase()` to folder.name:
  ```typescript
  {toSnakeCase(folder.name)}
  ```

**Validation**:
- Open application
- Check sidebar displays: "views", "all_items", "feeds"
- Verify feed names show as snake_case (e.g., "3d_printing")
- Verify folder names show as snake_case

**Files Modified**: `components/Sidebar.tsx` (~7 changes)

---

## Task 3: Update EntryFeed Component (~10 mins)

**File**: `components/EntryFeed.tsx`

**Work**:
- [x] Line 62: Convert "Loading entries..." → "loading_entries..."
- [x] Line 70: Keep "Error:" prefix, rest unchanged
- [x] Line 80: Convert "No entries found" → "no_entries_found"
- [x] Line 88: Convert "No unread feeds" → "no_unread_feeds"

**Validation**:
- Test empty feed state → see "no_entries_found"
- Test unread filter with no items → see "no_unread_feeds"
- Test loading state → see "loading_entries..."

**Files Modified**: `components/EntryFeed.tsx` (~4 changes)

---

## Task 4: Update ArticleCard Component (~15 mins)

**File**: `components/ArticleCard.tsx`

**Work**:
- [x] Import `toSnakeCase` from `@/lib/utils/textUtils`
- [x] Line 87: "unread" → already snake_case, no change
- [x] Line 117: Convert "Collapse" → "collapse" (2 occurrences)
- [x] Line 122: Convert "Collapse"/"Expand" → "collapse"/"expand"
- [x] Line 128: Convert "Unstar"/"Star" → "unstar"/"star"
- [x] Line 133: Convert "Starred"/"Star" → "starred"/"star"
- [x] Line 141: Convert "Mark as read" → "mark_as_read"
- [x] Line 90: Apply `toSnakeCase()` to feed title:
  ```typescript
  {toSnakeCase(entry.feed.title)}
  ```
- [x] Line 100: VERIFY article title remains unchanged:
  ```typescript
  {entry.title}  // NO toSnakeCase() here!
  ```

**Validation**:
- Click article → verify "collapse"/"expand" button works
- Check star button → verify "star"/"starred" toggle
- Check "mark_as_read" button label
- **Critical**: Verify article titles show exact RSS content (not snake_case)
- Verify feed name badge shows snake_case

**Files Modified**: `components/ArticleCard.tsx` (~8 changes)

---

## Task 5: Update ManageFeedsModal Component (~45 mins)

**File**: `components/ManageFeedsModal.tsx`

**Work**:

### Section A: Import and Helpers
- [x] Import `toSnakeCase` from `@/lib/utils/textUtils`

### Section B: Error Messages (Lines 90-266)
- [x] Line 90: "Please enter a feed URL" → "please_enter_a_feed_url"
- [x] Line 110: Keep "Failed to" prefix
- [x] Line 114: Convert success message:
  ```typescript
  showSuccess(`added_feed: ${toSnakeCase(data.title)}`)
  ```
- [x] Line 120: "Network error. Please try again." → "network_error_please_try_again"
- [x] Line 130: "Please enter a folder name" → "please_enter_a_folder_name"
- [x] Line 147: Keep "Failed to" prefix
- [x] Line 151: Convert success message:
  ```typescript
  showSuccess(`created_folder: ${toSnakeCase(data.name)}`)
  ```
- [x] Lines 156, 188, 217, 241, 266: Convert "Network error..." messages
- [x] Lines 164, 178, 182, 194-196, 209, 213, 222, 233, 237, 255, 262: Update all success/error messages with snake_case

### Section C: Import Handler (Lines 290-296)
- [x] Line 290: Keep "Import failed" (standard case)
- [x] Line 296: Convert import success message to snake_case format

### Section D: Modal Content (Lines 325-581)
- [x] Line 325: "Manage Feeds" → "manage_feeds"
- [x] Line 329: "Close" → "close" (aria-label)
- [x] Line 353: "Import/Export Feeds" → "import_export_feeds"
- [x] Line 362: "Export OPML" → "export_opml"
- [x] Line 375: "Importing..."/"Import OPML" → "importing..."/"import_opml"
- [x] Line 384: Convert "✓ Imported: ... | Skipped: ..." → "✓ imported: ... | skipped: ..."
- [x] Line 388: "Errors ({count}):" → "errors ({count}):"
- [x] Line 403: "Add New Feed" → "add_new_feed"
- [x] Line 408: "Feed URL" → "feed_url"
- [x] Line 415: "https://example.com/feed.rss" → "https://example.com/feed.rss" (keep as-is, it's a URL)
- [x] Line 422-423: "Folder (optional)" → "folder_optional"
- [x] Line 432: "No folder" → "no_folder"
- [x] Line 446: "Adding..."/"Add Feed" → "adding..."/"add_feed"
- [x] Line 454: "Manage Folders" → "manage_folders"
- [x] Line 462: "New folder name" → "new_folder_name"
- [x] Line 471: "Creating..."/"Create Folder" → "creating..."/"create_folder"
- [x] Line 477: "No folders yet" → "no_folders_yet"
- [x] Line 503: "Save" → "save"
- [x] Line 512: "Cancel" → "cancel"
- [x] Line 520: "{count} feeds" → "{count} feeds" (dynamic)
- [x] Line 551: "Your Feeds" → "your_feeds"
- [x] Line 554: "No feeds yet. Add one above!" → "no_feeds_yet_add_one_above"
- [x] Line 560: "No Folder" → "no_folder"
- [x] Line 581: "No folder" → "no_folder"

### Section E: Dynamic Folder Names
- [x] Line 518: Apply `toSnakeCase()` to folder.name:
  ```typescript
  <h4>{toSnakeCase(folder.name)}</h4>
  ```
- [x] Find all other folder.name displays and apply `toSnakeCase()`

**Validation**:
- Open "manage_feeds" modal
- Check all section headings use snake_case
- Check all button labels use snake_case
- Test adding feed → verify success message uses snake_case
- Test creating folder → verify folder name displays as snake_case
- Test deleting folder → verify confirmation message
- Test import/export buttons show correct labels

**Files Modified**: `components/ManageFeedsModal.tsx` (~70 changes)

---

## Task 6: Update Layout Metadata (~5 mins)

**File**: `app/layout.tsx`

**Work**:
- [x] Line 7: Keep "piRSSonite" (product branding)
- [x] Line 8: Convert "Self-hosted RSS reader" → "self_hosted_rss_reader"

**Validation**:
- View page source
- Check `<meta name="description">` contains "self_hosted_rss_reader"

**Files Modified**: `app/layout.tsx` (~1 change)

---

## Task 7: Manual Testing (~20 mins)

**Comprehensive UI Test**:

### Sidebar Testing
- [x] Verify "views" heading
- [x] Verify "all_items" button
- [x] Verify "unread" button
- [x] Verify "starred" button
- [x] Verify "feeds" heading
- [x] Verify feed names show as snake_case (e.g., "3d_printing")
- [x] Verify folder names show as snake_case
- [x] Check unread count displays correctly

### Feed View Testing
- [x] Test loading state shows "loading_entries..."
- [x] Test empty state shows "no_entries_found"
- [x] Test no unread shows "no_unread_feeds"
- [x] **Critical**: Verify article titles are NOT converted to snake_case

### Article Card Testing
- [x] Verify "mark_as_read" button
- [x] Verify "star"/"starred" toggle
- [x] Verify "collapse"/"expand" button
- [x] Verify feed name badge uses snake_case
- [x] **Critical**: Verify article title remains unchanged

### Manage Feeds Modal Testing
- [x] Verify modal title "manage_feeds"
- [x] Verify "import_export_feeds" section
- [x] Verify "export_opml" button
- [x] Verify "import_opml" button
- [x] Test adding feed → check success message
- [x] Test creating folder → verify snake_case display
- [x] Test deleting folder → check confirmation dialog
- [x] Verify all form labels use snake_case

### Error Handling Testing
- [x] Trigger validation error → verify message
- [x] Trigger network error → verify message format
- [x] Check error prefixes remain "Error:" or "Failed to"

**Files Modified**: None (testing only)

---

## Completion Criteria

- [x] All static UI text converted to snake_case
- [x] Feed names display in snake_case
- [x] Folder names display in snake_case
- [x] Article titles remain unchanged
- [x] Product name "piRSSonite" preserved
- [x] Error prefixes remain standard case
- [x] No TypeScript compilation errors
- [x] All components render correctly
- [x] UI matches reference image style

---

## Estimated Time

| Task | Time |
|------|------|
| Task 1: Create Utility | 15 mins |
| Task 2: Update Sidebar | 20 mins |
| Task 3: Update EntryFeed | 10 mins |
| Task 4: Update ArticleCard | 15 mins |
| Task 5: Update ManageFeedsModal | 45 mins |
| Task 6: Update Layout | 5 mins |
| Task 7: Manual Testing | 20 mins |
| **Total** | **2.5 hours** |

---

## Dependencies

- Task 2-6 depend on Task 1 (utility function must exist first)
- Task 7 depends on all previous tasks
- No external package dependencies required
