# Implementation Tasks: Feed Management UI

## Task Overview

Total estimated effort: **~8 hours**

Tasks are ordered to deliver incremental user-visible value:
1. Backend APIs first (enables testing via curl)
2. Basic modal structure (visible but non-functional)
3. Add feed flow (first complete user journey)
4. Folder management (extends functionality)
5. Feed management (delete, move operations)
6. Polish and error handling

## Tasks

### Backend APIs (3 hours)

**Task 1: Implement POST /api/feeds - Add New Feed** (~1.5 hours) ✅
- **File:** `app/api/feeds/route.ts`
- **Work:**
  - Add POST handler to existing GET route
  - Validate URL format (must be http/https)
  - Check for duplicate URLs in database
  - Fetch and parse feed using `fetchAndParseFeed` utility
  - Extract feed title from parsed data
  - Create feed record with `folderId` (nullable)
  - Trigger initial refresh for the new feed
  - Return feed object with ID
- **Validation:** `curl -X POST http://localhost:3003/api/feeds -d '{"url":"...","folderId":1}'`
- **Acceptance:** Returns 201 with feed object, or 400/422 with error message

**Task 2: Implement DELETE /api/feeds/[id] - Delete Feed** (~30 mins) ✅
- **File:** `app/api/feeds/[id]/route.ts`
- **Work:**
  - Create new dynamic route file
  - Add DELETE handler
  - Validate feed ID exists
  - Delete feed record (cascades to entries via Prisma schema)
  - Return 204 No Content on success
- **Validation:** `curl -X DELETE http://localhost:3003/api/feeds/1`
- **Acceptance:** Feed deleted, returns 204, or 404 if not found

**Task 3: Implement PUT /api/feeds/[id] - Update Feed** (~30 mins) ✅
- **File:** `app/api/feeds/[id]/route.ts`
- **Work:**
  - Add PUT handler to same file as Task 2
  - Accept `folderId` and/or `title` in request body
  - Update feed record
  - Return updated feed object
- **Validation:** `curl -X PUT http://localhost:3003/api/feeds/1 -d '{"folderId":2}'`
- **Acceptance:** Feed updated and returned, or 404/400 on error

**Task 4: Implement POST /api/folders - Create Folder** (~15 mins) ✅
- **File:** `app/api/folders/route.ts`
- **Work:**
  - Add POST handler to existing GET route
  - Validate folder name (required, max 100 chars)
  - Check for duplicate names
  - Create folder with auto-incremented order
  - Return folder object with ID
- **Validation:** `curl -X POST http://localhost:3003/api/folders -d '{"name":"Tech"}'`
- **Acceptance:** Returns 201 with folder object, or 400 if duplicate name

**Task 5: Implement DELETE /api/folders/[id] - Delete Folder** (~15 mins) ✅
- **File:** `app/api/folders/[id]/route.ts`
- **Work:**
  - Create new dynamic route file
  - Add DELETE handler
  - Set `folderId = null` for all feeds in folder (move to root)
  - Delete folder record
  - Return 204 No Content
- **Validation:** `curl -X DELETE http://localhost:3003/api/folders/1`
- **Acceptance:** Folder deleted, feeds moved to root, returns 204

**Task 6: Implement PUT /api/folders/[id] - Rename Folder** (~15 mins) ✅
- **File:** `app/api/folders/[id]/route.ts`
- **Work:**
  - Add PUT handler to same file as Task 5
  - Accept `name` in request body
  - Validate name not empty and not duplicate
  - Update folder record
  - Return updated folder object
- **Validation:** `curl -X PUT http://localhost:3003/api/folders/1 -d '{"name":"Technology"}'`
- **Acceptance:** Folder renamed, or 400 if duplicate name

### Frontend Components (3.5 hours)

**Task 7: Create ManageFeedsModal Component Shell** (~30 mins) ✅
- **File:** `components/ManageFeedsModal.tsx`
- **Work:**
  - Create modal component with Tailwind styling
  - Add backdrop overlay, centered card layout
  - Add header with title and close button (X icon)
  - Add `isOpen` and `onClose` props
  - Create three sections: Add Feed, Manage Folders, Manage Feeds
  - Use existing color scheme (bg-panel, bg-card, accent-cyan, etc.)
- **Validation:** Modal renders when opened, closes when X clicked
- **Acceptance:** Modal displays correctly with proper styling and structure

**Task 8: Add "Manage Feeds" Button to Sidebar** (~15 mins) ✅
- **File:** `components/Sidebar.tsx`
- **Work:**
  - Add state for modal open/closed
  - Add button below "piRSSonite" header
  - Import and render `ManageFeedsModal` component
  - Pass `isOpen` and `onClose` props
- **Validation:** Button click opens modal, modal close works
- **Acceptance:** Modal accessible from sidebar, opens/closes correctly

**Task 9: Implement Add Feed Form** (~1 hour) ✅
- **File:** `components/ManageFeedsModal.tsx`
- **Work:**
  - Add URL input field with validation styling
  - Add folder dropdown (populated from props)
  - Add "Add Feed" button
  - Implement form submission handler
  - Call POST /api/feeds endpoint
  - Show loading state during fetch
  - Display success/error messages
  - Clear form on success
  - Call `onFeedAdded` callback to refresh sidebar
- **Validation:** Paste URL, select folder, click Add → Feed appears in sidebar
- **Acceptance:** Can add feed successfully, errors shown clearly

**Task 10: Implement Create Folder Form** (~30 mins) ✅
- **File:** `components/ManageFeedsModal.tsx`
- **Work:**
  - Add folder name input field
  - Add "Create Folder" button
  - Implement submission handler
  - Call POST /api/folders endpoint
  - Show success/error messages
  - Clear input on success
  - Call `onFolderAdded` callback to refresh sidebar
- **Validation:** Enter name, click Create → Folder appears in sidebar
- **Acceptance:** Can create folder successfully, errors shown

**Task 11: Implement Folder List with Rename/Delete** (~45 mins) ✅
- **File:** `components/ManageFeedsModal.tsx`
- **Work:**
  - Display list of folders with feed counts
  - Add inline rename functionality (click to edit)
  - Add delete button with confirmation dialog
  - Implement rename handler (PUT /api/folders/[id])
  - Implement delete handler (DELETE /api/folders/[id])
  - Update sidebar after operations
- **Validation:** Rename folder → Updates immediately, Delete → Prompts then removes
- **Acceptance:** Folder management fully functional

**Task 12: Implement Feed List with Delete/Move** (~45 mins) ✅
- **File:** `components/ManageFeedsModal.tsx`
- **Work:**
  - Display feeds grouped by folder (or "No folder")
  - Add delete button per feed with confirmation
  - Add folder dropdown per feed to move between folders
  - Implement delete handler (DELETE /api/feeds/[id])
  - Implement move handler (PUT /api/feeds/[id])
  - Update sidebar after operations
- **Validation:** Delete feed → Prompts then removes, Move → Updates grouping
- **Acceptance:** Feed deletion and moving works correctly

### Polish & Integration (1.5 hours)

**Task 13: Add Loading States and Spinners** (~30 mins) ✅
- **Files:** `components/ManageFeedsModal.tsx`
- **Work:**
  - Add loading spinners for all async operations
  - Disable buttons during operations to prevent double-clicks
  - Show skeleton loaders for feed list while fetching
- **Validation:** All buttons show loading state during API calls
- **Acceptance:** User gets clear feedback during all operations

**Task 14: Implement Error Handling and Messages** (~30 mins) ✅
- **Files:** `components/ManageFeedsModal.tsx`, all API routes
- **Work:**
  - Add toast notification system or inline error display
  - Handle all error types (validation, network, server)
  - Show user-friendly messages for each error case
  - Add retry logic for network errors
- **Validation:** Trigger errors (bad URL, duplicate, etc.) → Clear messages shown
- **Acceptance:** All error cases handled gracefully

**Task 15: Add Feed URL Validation and Preview** (~30 mins) ✅
- **Files:** `components/ManageFeedsModal.tsx`, `app/api/feeds/route.ts`
- **Work:**
  - Validate URL format client-side before submission
  - Show feed title preview after successful fetch
  - Display first entry title as confirmation
  - Allow user to customize feed title before saving
- **Validation:** Paste URL → Preview loads → Title editable → Save
- **Acceptance:** Feed preview works, improves confidence before adding

**Task 16: Update Sidebar to Refresh After Management** (~15 mins) ✅
- **File:** `components/Sidebar.tsx`
- **Work:**
  - Add `refreshFeeds` and `refreshFolders` functions
  - Pass as callbacks to `ManageFeedsModal`
  - Call after each successful operation
  - Ensure selected feed state persists after refresh
- **Validation:** Add/delete operations update sidebar without full page reload
- **Acceptance:** Sidebar stays in sync with all operations

## Dependencies

**Sequential:**
- Tasks 1-6 (APIs) must complete before Task 9-12 (forms calling APIs)
- Task 7 (modal shell) must complete before Tasks 9-12 (modal content)
- Task 8 must complete before testing any other tasks

**Parallelizable:**
- Tasks 1-6 can be implemented in parallel (separate API files)
- Tasks 9-12 can be built in parallel after Task 7 completes
- Tasks 13-15 can be done in any order after core functionality

## Critical Path

1. Task 1 (Add Feed API) → Task 9 (Add Feed Form) → Task 15 (Preview)
2. Task 4 (Create Folder API) → Task 10 (Create Folder Form)
3. Task 7 (Modal Shell) → All form tasks

This represents the minimum path to deliver "Add Feed" functionality.
