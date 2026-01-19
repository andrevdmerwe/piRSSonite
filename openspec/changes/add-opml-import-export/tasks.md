# Tasks: OPML Import/Export

Implementation checklist for OPML import/export feature. Tasks should be completed sequentially within each phase. Phases 1-2 can be developed in parallel if multiple developers are available.

## Phase 1: OPML Export (~2 hours)

### Task 1: Create OPML Utility Functions (~1 hour)

**File**: `lib/utils/opmlUtils.ts`

**Work**:
- [x] Create `escapeXml(str: string): string` function
  - Escape `&`, `<`, `>`, `"`, `'` to XML entities
  - Test with all special characters
- [x] Create `formatDateRFC2822(date: Date): string` function
  - Return date in RFC 2822 format (e.g., "Tue, 18 Jan 2026 12:00:00 GMT")
  - Use `date.toUTCString()`
- [x] Create `generateOpml(folders, rootFeeds): string` function
  - Accept `folders: (Folder & { feeds: Feed[] })[]`
  - Accept `rootFeeds: Feed[]`
  - Build OPML 2.0 XML string using template literals
  - Nest feed outlines within folder outlines
  - Include top-level feed outlines for feeds without folders
  - Escape all user-generated content (titles, folder names)
- [x] Add TypeScript types for function parameters
- [x] Test edge cases: empty arrays, special characters, null titles

**Validation**:
```typescript
// Test with sample data
const opml = generateOpml(
  [{ id: 1, name: 'Tech & News', feeds: [{ id: 1, title: 'HN', url: 'https://...' }] }],
  [{ id: 2, title: 'Blog', url: 'https://...' }]
)
// Verify valid XML structure, special chars escaped
```

**Files Modified**: `lib/utils/opmlUtils.ts` (new file, ~80 lines)

---

### Task 2: Create Export API Route (~30 mins)

**File**: `app/api/opml/export/route.ts`

**Work**:
- [x] Create directory `app/api/opml/export/`
- [x] Create `route.ts` with GET handler
- [x] Import Prisma client and `generateOpml` utility
- [x] Fetch all folders with included feeds:
  ```typescript
  const folders = await prisma.folder.findMany({
    include: { feeds: true },
    orderBy: { order: 'asc' }
  })
  ```
- [x] Fetch all feeds without folder:
  ```typescript
  const rootFeeds = await prisma.feed.findMany({
    where: { folderId: null },
    orderBy: { order: 'asc' }
  })
  ```
- [x]Generate OPML XML using utility function
- [x]Generate filename: `pirssonite-feeds-YYYY-MM-DD.opml`
- [x]Return NextResponse with headers:
  - `Content-Type: application/xml; charset=utf-8`
  - `Content-Disposition: attachment; filename="..."`
- [x]Add error handling (try/catch → 500 response)

**Validation**:
- Visit `http://localhost:3000/api/opml/export` in browser
- Verify file downloads with correct filename
- Open downloaded file → validate XML structure
- Test with empty database → verify valid OPML with empty `<body>`

**Files Modified**: `app/api/opml/export/route.ts` (new file, ~50 lines)

---

### Task 3: Add Export Button to UI (~30 mins)

**File**: `components/ManageFeedsModal.tsx`

**Work**:
- [x]Add new section before "Add New Feed" section (around line 300)
- [x]Add heading: "Import/Export Feeds"
- [x]Add export button:
  ```tsx
  <a
    href="/api/opml/export"
    download
    className="flex-1 px-4 py-2 bg-accent-cyan text-bg-main rounded font-semibold hover:opacity-90 transition-opacity text-center"
  >
    Export OPML
  </a>
  ```
- [x]Match existing button styling (use existing classes)
- [x]Ensure section is inside modal scroll container

**Validation**:
- Open ManageFeedsModal
- Click "Export OPML" button
- Verify OPML file downloads
- Test styling matches existing buttons

**Files Modified**: `components/ManageFeedsModal.tsx` (~20 lines added)

---

## Phase 2: OPML Import (~4.5 hours)

### Task 4: Add OPML Parsing Function (~1.5 hours)

**File**: `lib/utils/opmlUtils.ts`

**Work**:
- [x]Define `ParsedOpml` interface:
  ```typescript
  interface ParsedOpml {
    folders: Array<{ name: string; feeds: Array<{ title: string; url: string }> }>
    rootFeeds: Array<{ title: string; url: string }>
  }
  ```
- [x]Create `parseOpml(xmlText: string): ParsedOpml` function
- [x]Validate OPML structure:
  - Check for `<opml version="...">` root element
  - Throw error if missing or invalid version
- [x]Extract `<body>` content
- [x]Parse top-level `<outline>` elements:
  - If has `xmlUrl` attribute → add to `rootFeeds`
  - If has child outlines (no `xmlUrl`) → folder
- [x]For folder outlines:
  - Extract folder name from `text` or `title` attribute
  - Recursively parse child outlines (feeds)
  - Add to `folders` array
- [x]Create `extractAttribute(str, attrName)` helper function
- [x]Handle multi-level nesting (flatten to 1 level)
- [x]Handle missing attributes (use fallbacks)
- [x]Add comprehensive error handling

**Validation**:
```typescript
// Test OPML 2.0 with folders
const parsed = parseOpml(`
  <opml version="2.0">
    <body>
      <outline text="Tech">
        <outline xmlUrl="https://hn.com/rss" text="HN"/>
      </outline>
      <outline xmlUrl="https://blog.com/feed" text="Blog"/>
    </body>
  </opml>
`)
// Verify: folders = [{ name: 'Tech', feeds: [{ title: 'HN', url: '...' }] }]
//         rootFeeds = [{ title: 'Blog', url: '...' }]

// Test malformed XML
expect(() => parseOpml('<invalid>')).toThrow()

// Test OPML 1.0
// Test nested outlines (3+ levels)
// Test missing attributes
```

**Files Modified**: `lib/utils/opmlUtils.ts` (~120 lines added)

---

### Task 5: Create Import API Route (~2 hours)

**File**: `app/api/opml/import/route.ts`

**Work**:
- [x]Create directory `app/api/opml/import/`
- [x]Create `route.ts` with POST handler
- [x]Import Prisma client, `parseOpml`, and `fetchAndParseFeed`
- [x]Parse multipart form data:
  ```typescript
  const formData = await request.formData()
  const file = formData.get('file') as File
  ```
- [x]Validate file exists (400 if missing)
- [x]Validate file size <= 5MB (400 if too large)
- [x]Validate file type (check MIME type or extension):
  ```typescript
  const validTypes = ['text/xml', 'application/xml']
  const validExts = ['.opml', '.xml']
  ```
- [x]Read file content: `const xmlText = await file.text()`
- [x]Parse OPML (catch errors → 422 response)
- [x]Implement transaction:
  ```typescript
  const result = await prisma.$transaction(async (tx) => {
    // ... (see below)
  })
  ```
- [x]**Inside transaction**:
  - [x]Create folder map (`Map<string, number>`)
  - [x]For each parsed folder:
    - Find existing by name
    - If not exists, create with max order + 1
    - Add to map
  - [x]Initialize counters: `imported = 0`, `skipped = 0`, `errors = []`
  - [x]Combine all feeds (from folders + root)
  - [x]For each feed:
    - Check duplicate URL → skip if exists
    - Validate URL format → add to errors if invalid
    - Fetch feed with `fetchAndParseFeed()` (catch errors)
    - If successful: create feed with folder mapping, increment `imported`
    - If failed: add to `errors`, continue
  - [x]Return `{ imported, skipped, errors }`
- [x]Return JSON response with result
- [x]Add error handling (400, 422, 500 responses)

**Validation**:
- Upload valid OPML file → verify feeds imported correctly
- Check database for new feeds and folders
- Upload OPML with duplicates → verify skipped counter
- Upload OPML with invalid URLs → verify errors array
- Upload malformed XML → verify 422 error
- Upload oversized file → verify 400 error
- Upload non-XML file → verify 400 error

**Files Modified**: `app/api/opml/import/route.ts` (new file, ~150 lines)

---

### Task 6: Add Import UI (~1 hour)

**File**: `components/ManageFeedsModal.tsx`

**Work**:
- [x]Add state variables:
  ```typescript
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    errors: string[]
  } | null>(null)
  ```
- [x]Add import button to "Import/Export Feeds" section:
  ```tsx
  <label className="flex-1 cursor-pointer">
    <input
      type="file"
      accept=".opml,.xml,application/xml,text/xml"
      onChange={handleImportFile}
      className="hidden"
      disabled={importing}
    />
    <div className="...">
      {importing ? 'Importing...' : 'Import OPML'}
    </div>
  </label>
  ```
- [x]Create `handleImportFile` async function:
  - Get file from event
  - Set `importing = true`
  - Create FormData, append file
  - POST to `/api/opml/import`
  - Handle response:
    - If error: show error message
    - If success: set `importResult`, show success message
  - Refresh feed list (`fetchData()`, `onRefresh()`)
  - Set `importing = false`
  - Reset file input (`e.target.value = ''`)
- [x]Add import results display (below buttons):
  ```tsx
  {importResult && (
    <div className="mt-3 p-3 bg-bg-main rounded text-sm">
      <div>Imported: {importResult.imported} | Skipped: {importResult.skipped}</div>
      {importResult.errors.length > 0 && (
        <div className="mt-2 text-red-400">
          <div>Errors ({importResult.errors.length}):</div>
          <ul className="list-disc ml-4 max-h-32 overflow-y-auto">
            {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}
    </div>
  )}
  ```
- [x]Add loading state to button (disable when importing)
- [x]Match existing styling and error/success message patterns

**Validation**:
- Click "Import OPML" → file dialog opens
- Select valid OPML → verify loading state appears
- Verify import results display correctly
- Verify feed list refreshes automatically
- Test with OPML containing errors → verify error list displays
- Verify styling matches existing components

**Files Modified**: `components/ManageFeedsModal.tsx` (~50 lines added)

---

## Phase 3: Testing & Polish (~1.5 hours)

### Task 7: Edge Case Testing (~1 hour)

**Work**:
- [x]Test empty database export → verify valid OPML
- [x]Test large OPML import (50+ feeds) → verify performance
- [x]Test malformed XML:
  - Missing closing tags → verify 422 error
  - Invalid root element → verify 422 error
  - Non-XML content → verify 400/422 error
- [x]Test duplicate URLs:
  - Import same OPML twice → verify skipped counter
  - Verify no duplicate feeds in database
- [x]Test invalid feed URLs:
  - Non-existent domain → verify in errors array
  - Invalid protocol (ftp://) → verify in errors array
  - Malformed URL → verify in errors array
- [x]Test special characters in titles:
  - Export feed with `&<>"'` in title → verify escaped
  - Import OPML with special chars → verify preserved
- [x]Test multi-level nesting (3+ levels):
  - Import OPML with nested folders → verify flattened to 1 level
- [x]Test folder name collision:
  - Import OPML with existing folder name → verify uses existing
- [x]Test feed without folder:
  - Export → verify top-level outline
  - Import → verify folderId is null

**Validation**:
- All edge cases handled gracefully
- No server crashes or unhandled errors
- Clear error messages for all failure modes

**Files Modified**: None (testing only)

---

### Task 8: Error Handling & UX Polish (~30 mins)

**Work**:
- [x]Review all error messages for clarity:
  - "File too large (max 5MB)" ✓
  - "Invalid OPML format: Missing <opml> root element" ✓
  - "Failed to fetch https://...: HTTP 404" ✓
- [x]Verify HTTP status codes:
  - 400 for validation errors ✓
  - 422 for malformed XML ✓
  - 500 for server errors ✓
- [x]Test import summary formatting:
  - Clear imported/skipped counts ✓
  - Error list with max height + scroll ✓
  - Color coding (green success, red errors) ✓
- [x]Test with real OPML files:
  - Download OPML from Feedly
  - Download OPML from Inoreader
  - Download OPML from The Old Reader
  - Import each into piRSSonite → verify success
- [x]Export piRSSonite feeds → import into other reader → verify compatibility
- [x]Polish UI spacing and alignment
- [x]Verify loading states work correctly
- [x]Verify success messages auto-dismiss

**Validation**:
- All error messages are user-friendly
- Import/export works with major RSS readers
- UI polish matches existing design

**Files Modified**: Minor tweaks to route.ts and ManageFeedsModal.tsx

---

## Completion Criteria

- [x]All 8 tasks completed
- [x]`openspec validate add-opml-import-export --strict` passes
- [x]Export generates valid OPML 2.0 XML
- [x]Import successfully parses OPML 1.0 and 2.0
- [x]Duplicate URLs are skipped gracefully
- [x]Invalid feeds are reported in errors array
- [x]Folders are created automatically when needed
- [x]UI buttons work correctly and match existing design
- [x]All edge cases handled gracefully
- [x]Compatible with major RSS readers (Feedly, Inoreader, etc.)

---

## Estimated Time

| Phase | Tasks | Time |
|-------|-------|------|
| Phase 1: Export | Tasks 1-3 | ~2 hours |
| Phase 2: Import | Tasks 4-6 | ~4.5 hours |
| Phase 3: Testing | Tasks 7-8 | ~1.5 hours |
| **Total** | **8 tasks** | **~8 hours** |

---

## Dependencies

- Task 2 depends on Task 1 (uses `generateOpml`)
- Task 3 depends on Task 2 (UI calls API)
- Task 5 depends on Task 4 (uses `parseOpml`)
- Task 6 depends on Task 5 (UI calls API)
- Tasks 7-8 depend on all previous tasks

**Parallelization**: Tasks 1-3 (export) can be done in parallel with Tasks 4-6 (import) if multiple developers are available.
