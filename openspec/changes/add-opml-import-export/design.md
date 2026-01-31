# Design: OPML Import/Export

## Architecture Overview

The OPML feature adds data portability through two new API endpoints and UI integration in the existing feed management modal. The design follows piRSSonite's existing patterns for API routes, error handling, and transactional database operations.

```
┌──────────────────────────────────────────────────────────┐
│                  ManageFeedsModal (UI)                   │
│  ┌────────────────┐           ┌────────────────┐         │
│  │  Export OPML   │           │  Import OPML   │         │
│  │   (download)   │           │  (file upload) │         │
│  └────────┬───────┘           └────────┬───────┘         │
└───────────┼─────────────────────────────┼────────────────┘
            │                             │
            ▼                             ▼
  ┌─────────────────┐         ┌─────────────────┐
  │ GET /api/opml/  │         │ POST /api/opml/ │
  │     export      │         │     import      │
  └─────────┬───────┘         └────────┬────────┘
            │                          │
            ▼                          ▼
  ┌──────────────────────────────────────────────┐
  │          lib/utils/opmlUtils.ts              │
  │  ┌──────────────┐    ┌────────────────────┐ │
  │  │ generateOpml │    │   parseOpml        │ │
  │  │ (XML string) │    │   (XML → objects)  │ │
  │  └──────────────┘    └────────────────────┘ │
  └──────────┬───────────────────┬───────────────┘
             │                   │
             ▼                   ▼
  ┌──────────────────────────────────────────────┐
  │            Prisma (Database)                 │
  │     Folder ◄──┬── Feed (folderId)            │
  └───────────────┴──────────────────────────────┘
```

## OPML Format Specification

### OPML 2.0 Structure

piRSSonite exports and imports OPML 2.0 format, backward compatible with 1.0:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>piRSSonite Feeds</title>
    <dateCreated>Tue, 18 Jan 2026 12:00:00 GMT</dateCreated>
  </head>
  <body>
    <!-- Folder (outline without xmlUrl) -->
    <outline text="Technology" title="Technology">
      <!-- Feeds in folder (child outlines with xmlUrl) -->
      <outline type="rss" text="Ars Technica" title="Ars Technica"
               xmlUrl="https://arstechnica.com/feed/"/>
      <outline type="rss" text="Hacker News" title="Hacker News"
               xmlUrl="https://news.ycombinator.com/rss"/>
    </outline>

    <!-- Feed without folder (top-level outline with xmlUrl) -->
    <outline type="rss" text="Personal Blog" title="Personal Blog"
             xmlUrl="https://example.com/feed.xml"/>
  </body>
</opml>
```

### Mapping Rules

| piRSSonite Model | OPML Element | Attributes |
|-----------------|--------------|------------|
| Folder | `<outline>` (parent) | `text`, `title` (no `xmlUrl`) |
| Feed in folder | `<outline>` (child) | `type="rss"`, `text`, `title`, `xmlUrl` |
| Feed without folder | `<outline>` (top-level) | `type="rss"`, `text`, `title`, `xmlUrl` |

**Attribute Priority**:
- Feed title: `text` > `title` > domain name from `xmlUrl`
- Folder name: `text` > `title` > "Unnamed Folder"

## API Endpoint Designs

### GET /api/opml/export

**Purpose**: Generate downloadable OPML 2.0 file with all feeds and folders

**Request**: None

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/xml; charset=utf-8
Content-Disposition: attachment; filename="pirssonite-feeds-2026-01-18.opml"

<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  ...
</opml>
```

**Error Responses**:
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Failed to generate OPML"
}
```

**Implementation**:
```typescript
export async function GET() {
  try {
    // Fetch all folders with feeds (single query)
    const folders = await prisma.folder.findMany({
      include: { feeds: true },
      orderBy: { order: 'asc' }
    })

    // Fetch feeds without folder
    const rootFeeds = await prisma.feed.findMany({
      where: { folderId: null },
      orderBy: { order: 'asc' }
    })

    // Generate OPML XML string
    const opmlXml = generateOpml(folders, rootFeeds)

    // Return as downloadable file
    const filename = `pirssonite-feeds-${formatDate(new Date())}.opml`
    return new NextResponse(opmlXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate OPML' },
      { status: 500 }
    )
  }
}
```

---

### POST /api/opml/import

**Purpose**: Parse uploaded OPML file and import feeds with folder mapping

**Request**:
```http
POST /api/opml/import
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="feeds.opml"
Content-Type: application/xml

<?xml version="1.0"?>
<opml version="2.0">...</opml>
------WebKitFormBoundary--
```

**Success Response** (200):
```json
{
  "imported": 15,
  "skipped": 3,
  "errors": [
    "Invalid URL format: not-a-url",
    "Failed to fetch https://example.com/broken: HTTP 404"
  ]
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "No file provided"
}
{
  "error": "File too large (max 5MB)"
}
{
  "error": "Invalid file type (expected XML/OPML)"
}

// 422 Unprocessable Entity
{
  "error": "Invalid OPML format: Missing <opml> root element"
}
{
  "error": "Malformed XML: Unexpected token at line 5"
}

// 500 Internal Server Error
{
  "error": "Database transaction failed"
}
```

**Import Transaction Flow**:
```
1. Validate file (size, type)
2. Parse XML → ParsedOpml object
3. BEGIN TRANSACTION
   a. Process folders
      - Find existing by name
      - Create new if not found
      - Build folder name → ID map
   b. Process feeds (for each)
      - Check if URL exists → skip if duplicate
      - Validate URL format → add to errors if invalid
      - Fetch feed → add to errors if unreachable
      - Create feed with folder mapping
   c. Return summary
4. COMMIT TRANSACTION
```

**Implementation**:
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    // 2. Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 }
      )
    }

    const validTypes = ['text/xml', 'application/xml']
    const validExts = ['.opml', '.xml']
    const hasValidType = validTypes.includes(file.type)
    const hasValidExt = validExts.some(ext => file.name.endsWith(ext))

    if (!hasValidType && !hasValidExt) {
      return NextResponse.json(
        { error: 'Invalid file type (expected XML/OPML)' },
        { status: 400 }
      )
    }

    // 3. Parse OPML
    const xmlText = await file.text()
    let parsed: ParsedOpml
    try {
      parsed = parseOpml(xmlText)
    } catch (error) {
      return NextResponse.json(
        { error: `Invalid OPML format: ${error.message}` },
        { status: 422 }
      )
    }

    // 4. Import in transaction
    const result = await prisma.$transaction(async (tx) => {
      // ... (see Import Strategy section)
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Database transaction failed' },
      { status: 500 }
    )
  }
}
```

## Import Strategy (Detailed)

### Folder Processing

```typescript
// Build folder name → ID mapping
const folderMap = new Map<string, number>()

for (const folder of parsed.folders) {
  // Check if folder exists
  const existing = await tx.folder.findUnique({
    where: { name: folder.name }
  })

  if (existing) {
    folderMap.set(folder.name, existing.id)
  } else {
    // Create new folder with max order + 1
    const maxOrder = await tx.folder.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const newFolder = await tx.folder.create({
      data: {
        name: folder.name,
        order: (maxOrder?.order ?? -1) + 1
      }
    })

    folderMap.set(folder.name, newFolder.id)
  }
}
```

### Feed Processing

```typescript
let imported = 0
let skipped = 0
const errors: string[] = []

// Combine all feeds (from folders + root)
const allFeeds = [
  ...parsed.folders.flatMap(f =>
    f.feeds.map(feed => ({ ...feed, folderName: f.name }))
  ),
  ...parsed.rootFeeds.map(feed => ({ ...feed, folderName: null }))
]

for (const feedData of allFeeds) {
  // Check duplicate
  const existing = await tx.feed.findUnique({
    where: { url: feedData.url }
  })

  if (existing) {
    skipped++
    continue
  }

  // Validate URL format
  try {
    const url = new URL(feedData.url)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol')
    }
  } catch (err) {
    errors.push(`Invalid URL format: ${feedData.url}`)
    continue
  }

  // Fetch and validate feed
  try {
    const parsedFeed = await fetchAndParseFeed(feedData.url)

    // Get max order for new feed
    const maxOrder = await tx.feed.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    // Create feed
    await tx.feed.create({
      data: {
        url: feedData.url,
        title: parsedFeed.title,
        folderId: feedData.folderName
          ? folderMap.get(feedData.folderName) ?? null
          : null,
        order: (maxOrder?.order ?? -1) + 1,
        nextCheckAt: new Date(),
        websubHub: parsedFeed.hubUrl ?? null,
        websubTopic: parsedFeed.topicUrl ?? null
      }
    })

    imported++
  } catch (error) {
    errors.push(`Failed to fetch ${feedData.url}: ${error.message}`)
  }
}

return { imported, skipped, errors }
```

## XML Handling

### XML Generation (Export)

**Approach**: Template strings with XML escaping

```typescript
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generateOpml(
  folders: (Folder & { feeds: Feed[] })[],
  rootFeeds: Feed[]
): string {
  const now = new Date()
  const dateCreated = formatDateRFC2822(now)

  // Build folder outlines
  const folderOutlines = folders.map(folder => {
    const feedOutlines = folder.feeds.map(feed =>
      `    <outline type="rss" text="${escapeXml(feed.title)}" ` +
      `title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.url)}"/>`
    ).join('\n')

    return (
      `  <outline text="${escapeXml(folder.name)}" ` +
      `title="${escapeXml(folder.name)}">\n` +
      feedOutlines + '\n' +
      `  </outline>`
    )
  }).join('\n')

  // Build root feed outlines
  const rootOutlines = rootFeeds.map(feed =>
    `  <outline type="rss" text="${escapeXml(feed.title)}" ` +
    `title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.url)}"/>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>piRSSonite Feeds</title>
    <dateCreated>${dateCreated}</dateCreated>
  </head>
  <body>
${folderOutlines}
${rootOutlines}
  </body>
</opml>`
}

function formatDateRFC2822(date: Date): string {
  // Example: "Tue, 18 Jan 2026 12:00:00 GMT"
  return date.toUTCString()
}
```

### XML Parsing (Import)

**Approach**: Recursive regex-based parsing (simple, no dependencies)

```typescript
interface ParsedOpml {
  folders: Array<{
    name: string
    feeds: Array<{ title: string; url: string }>
  }>
  rootFeeds: Array<{ title: string; url: string }>
}

function parseOpml(xmlText: string): ParsedOpml {
  // Validate OPML structure
  if (!/<opml\s+version=["']([12]\.\d)["']/.test(xmlText)) {
    throw new Error('Missing <opml> root element or invalid version')
  }

  // Extract body content
  const bodyMatch = xmlText.match(/<body>([\s\S]*)<\/body>/)
  if (!bodyMatch) {
    throw new Error('Missing <body> element')
  }

  const bodyContent = bodyMatch[1]

  // Extract all top-level outlines
  const outlineRegex = /<outline\s+([^>]*?)(?:\/?>|>([\s\S]*?)<\/outline>)/g
  const folders: Array<{ name: string; feeds: Array<{ title: string; url: string }> }> = []
  const rootFeeds: Array<{ title: string; url: string }> = []

  let match
  while ((match = outlineRegex.exec(bodyContent)) !== null) {
    const attributes = match[1]
    const children = match[2] || ''

    const xmlUrl = extractAttribute(attributes, 'xmlUrl')

    if (xmlUrl) {
      // It's a feed (has xmlUrl)
      const title = extractAttribute(attributes, 'text') ||
                   extractAttribute(attributes, 'title') ||
                   xmlUrl.split('/')[2] // domain name fallback
      rootFeeds.push({ title, url: xmlUrl })
    } else {
      // It's a folder (no xmlUrl, has children)
      const folderName = extractAttribute(attributes, 'text') ||
                        extractAttribute(attributes, 'title') ||
                        'Unnamed Folder'

      // Extract child feeds
      const childFeeds: Array<{ title: string; url: string }> = []
      const childRegex = /<outline\s+([^>]*?)\/?>/g
      let childMatch

      while ((childMatch = childRegex.exec(children)) !== null) {
        const childAttrs = childMatch[1]
        const childXmlUrl = extractAttribute(childAttrs, 'xmlUrl')

        if (childXmlUrl) {
          const childTitle = extractAttribute(childAttrs, 'text') ||
                           extractAttribute(childAttrs, 'title') ||
                           childXmlUrl.split('/')[2]
          childFeeds.push({ title: childTitle, url: childXmlUrl })
        }
      }

      if (childFeeds.length > 0) {
        folders.push({ name: folderName, feeds: childFeeds })
      }
    }
  }

  return { folders, rootFeeds }
}

function extractAttribute(str: string, attrName: string): string | null {
  const regex = new RegExp(`${attrName}=["']([^"']*?)["']`, 'i')
  const match = str.match(regex)
  return match ? match[1] : null
}
```

## UI Integration

### ManageFeedsModal Changes

Add new section before "Add New Feed":

```tsx
{/* Import/Export Section */}
<section className="mb-6">
  <h3 className="text-lg font-semibold text-text-primary mb-4">
    Import/Export Feeds
  </h3>
  <div className="bg-bg-card rounded-lg p-4">
    <div className="flex gap-2 mb-3">
      {/* Export Button */}
      <a
        href="/api/opml/export"
        download
        className="flex-1 px-4 py-2 bg-accent-cyan text-bg-main rounded font-semibold hover:opacity-90 transition-opacity text-center"
      >
        Export OPML
      </a>

      {/* Import Button (hidden file input + label) */}
      <label className="flex-1 cursor-pointer">
        <input
          type="file"
          accept=".opml,.xml,application/xml,text/xml"
          onChange={handleImportFile}
          className="hidden"
          disabled={importing}
        />
        <div className="px-4 py-2 bg-accent-cyan text-bg-main rounded font-semibold hover:opacity-90 transition-opacity text-center disabled:opacity-50">
          {importing ? 'Importing...' : 'Import OPML'}
        </div>
      </label>
    </div>

    {/* Import Results */}
    {importResult && (
      <div className="p-3 bg-bg-main rounded text-sm">
        <div className="text-text-primary">
          ✓ Imported: {importResult.imported} | Skipped: {importResult.skipped}
        </div>
        {importResult.errors.length > 0 && (
          <div className="mt-2 text-red-400">
            <div className="font-semibold">Errors ({importResult.errors.length}):</div>
            <ul className="list-disc ml-4 mt-1 max-h-32 overflow-y-auto">
              {importResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
  </div>
</section>
```

**State Management**:
```typescript
interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

const [importing, setImporting] = useState(false)
const [importResult, setImportResult] = useState<ImportResult | null>(null)

const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  setImporting(true)
  setError(null)
  setImportResult(null)

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/opml/import', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      showError(data.error || 'Import failed')
      return
    }

    setImportResult(data)
    showSuccess(`Imported ${data.imported} feeds${data.skipped > 0 ? ` (${data.skipped} skipped)` : ''}`)

    // Refresh feed list
    await fetchData()
    onRefresh()
  } catch (err) {
    showError('Network error during import')
  } finally {
    setImporting(false)
    // Reset file input
    e.target.value = ''
  }
}
```

## Edge Cases

### Export Edge Cases

| Case | Handling |
|------|----------|
| Empty database (no feeds) | Valid OPML with empty `<body>` |
| Feed with null/empty title | Use URL domain name as fallback |
| Special chars in titles (`&<>"'`) | Escape to `&amp;`, `&lt;`, etc. |
| Very long feed lists (500+ feeds) | No limit; OPML files can be large |

### Import Edge Cases

| Case | Handling |
|------|----------|
| Malformed XML (syntax errors) | Return 422 with specific error message |
| Missing `<opml>` root element | Return 422 error |
| Empty OPML (no outlines) | Return success with 0 imported |
| Outline without `xmlUrl` or children | Skip silently (not a valid feed or folder) |
| Duplicate feed URLs | Skip, increment `skipped` counter |
| Invalid URL format | Skip, add to `errors` array |
| Unreachable feed (404, timeout) | Skip, add to `errors` array |
| Folder name already exists | Use existing folder (don't create duplicate) |
| Multi-level nesting (3+ levels) | Flatten to 1 level (use first-level folder only) |
| OPML 1.0 vs 2.0 | Support both (parsing is identical) |
| File size >5MB | Reject with 400 before parsing |
| Non-XML file (e.g., .txt) | Reject with 400 based on extension/MIME type |

## Testing Strategy

### Unit Tests
- `escapeXml()`: Test all XML special characters
- `parseOpml()`: Test various OPML formats (1.0, 2.0, nested, malformed)
- `generateOpml()`: Test empty database, special characters, large lists

### Integration Tests
1. **Export**: Create feeds + folders → export → validate XML structure
2. **Import**: Upload sample OPML → verify feeds created correctly
3. **Round-trip**: Export → import → compare database state
4. **Error handling**: Upload invalid files → verify error responses

### Compatibility Tests
- Import OPML exports from: Feedly, Inoreader, NewsBlur, The Old Reader, FreshRSS
- Export OPML → import into other RSS readers → verify success

## Performance Considerations

- **Export**: Single database query with `include` → O(n) XML generation → < 1s for 1000 feeds
- **Import**: Transactional with individual feed validation → O(n × fetch_time) → batch processing not needed (max 5MB file = ~1000 feeds max)
- **Memory**: OPML files loaded into memory → 5MB limit prevents OOM issues

## Security Considerations

- **File upload**: Max 5MB limit prevents DoS
- **XML parsing**: No external entities allowed (prevents XXE attacks)
- **URL validation**: Only http/https protocols allowed
- **SQL injection**: Prisma ORM parameterizes queries automatically
- **XSS**: XML escaping prevents code injection in exported OPML

## Future Enhancements (Out of Scope)

- OPML 1.0 strict validation
- Preserve custom OPML attributes (e.g., `htmlUrl`, `description`)
- Import scheduling (queue large OPML files for background processing)
- Export filters (e.g., only starred feeds, only specific folder)
- OPML diff/merge for collaborative feed curation
