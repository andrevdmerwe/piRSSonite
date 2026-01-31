# Spec Delta: Feed Management - OPML Import/Export

## ADDED Requirements

### Requirement: OPML Export
The system SHALL provide an HTTP endpoint to export all feeds and folders as an OPML 2.0 XML file.

#### Scenario: Export all feeds with folder hierarchy
**WHEN** user sends GET request to `/api/opml/export`
**THEN** system generates valid OPML 2.0 XML document
**AND** includes all folders as nested `<outline>` elements without `xmlUrl` attribute
**AND** includes all feeds within their folders as child `<outline>` elements with `type="rss"` and `xmlUrl` attributes
**AND** includes feeds without folders as top-level `<outline>` elements
**AND** returns file with `Content-Type: application/xml` header
**AND** returns file with `Content-Disposition: attachment` header containing filename `pirssonite-feeds-YYYY-MM-DD.opml`

#### Scenario: Export from empty database
**WHEN** user sends GET request to `/api/opml/export`
**AND** database contains no feeds or folders
**THEN** system generates valid OPML 2.0 XML document
**AND** document contains empty `<body>` element
**AND** returns 200 OK status

#### Scenario: Export with special characters in feed titles
**WHEN** user sends GET request to `/api/opml/export`
**AND** database contains feeds with titles containing `&`, `<`, `>`, `"`, or `'` characters
**THEN** system escapes special characters to XML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`)
**AND** generated XML is well-formed and valid

---

### Requirement: OPML Import
The system SHALL accept OPML file uploads and import feeds with folder hierarchy preservation.

#### Scenario: Valid OPML 2.0 import with folders
**WHEN** user uploads valid OPML 2.0 file via POST to `/api/opml/import`
**THEN** system parses all `<outline>` elements
**AND** creates folders for outlines without `xmlUrl` attribute
**AND** imports feeds from outlines with `xmlUrl` attribute
**AND** maps feeds to folders based on parent-child outline hierarchy
**AND** returns JSON response with 200 status
**AND** response contains `imported` count (number of feeds successfully imported)
**AND** response contains `skipped` count (number of duplicate feeds)
**AND** response contains `errors` array (feed URLs that failed validation/fetching)

#### Scenario: OPML 1.0 backward compatibility
**WHEN** user uploads valid OPML 1.0 file
**THEN** system parses file successfully using same logic as OPML 2.0
**AND** imports feeds correctly

#### Scenario: Import with duplicate feed URLs
**WHEN** user uploads OPML file containing feed URLs that already exist in database
**THEN** system skips duplicate feeds without creating database records
**AND** increments `skipped` counter for each duplicate
**AND** does NOT add duplicate URLs to `errors` array
**AND** continues processing remaining feeds

#### Scenario: Import with invalid feed URLs
**WHEN** user uploads OPML file containing invalid feed URLs (malformed, non-http/https protocol, unreachable)
**THEN** system attempts to validate each feed URL
**AND** skips feeds with invalid URLs
**AND** adds error message to `errors` array for each failed feed
**AND** continues processing remaining feeds
**AND** does NOT fail entire import transaction

#### Scenario: Import with existing folder names
**WHEN** user uploads OPML file containing folder names that already exist in database
**THEN** system uses existing folder instead of creating duplicate
**AND** imports feeds into existing folder

#### Scenario: Import with new folder names
**WHEN** user uploads OPML file containing folder names that do NOT exist in database
**THEN** system creates new folders with auto-incremented `order` field
**AND** imports feeds into newly created folders

#### Scenario: Import with multi-level nested outlines
**WHEN** user uploads OPML file with 3+ levels of nested outlines
**THEN** system flattens nested structure to 1 level of folders
**AND** uses first-level outline as folder name
**AND** ignores deeper nesting levels

---

### Requirement: File Upload Validation
The system SHALL validate uploaded files before processing OPML imports.

#### Scenario: File size validation
**WHEN** user uploads file larger than 5MB
**THEN** system returns 400 Bad Request status
**AND** returns error message "File too large (max 5MB)"
**AND** does NOT process file

#### Scenario: File type validation
**WHEN** user uploads file with extension other than `.opml` or `.xml`
**AND** file MIME type is not `text/xml` or `application/xml`
**THEN** system returns 400 Bad Request status
**AND** returns error message "Invalid file type (expected XML/OPML)"
**AND** does NOT process file

#### Scenario: Missing file validation
**WHEN** user sends POST request without file upload
**THEN** system returns 400 Bad Request status
**AND** returns error message "No file provided"

---

### Requirement: XML Validation
The system SHALL validate OPML XML structure before importing feeds.

#### Scenario: Malformed XML rejection
**WHEN** user uploads file with invalid XML syntax (unclosed tags, invalid characters)
**THEN** system returns 422 Unprocessable Entity status
**AND** returns error message starting with "Invalid OPML format:"
**AND** includes specific parsing error details

#### Scenario: Missing OPML root element
**WHEN** user uploads XML file without `<opml>` root element
**THEN** system returns 422 Unprocessable Entity status
**AND** returns error message "Invalid OPML format: Missing <opml> root element"

#### Scenario: Invalid OPML version
**WHEN** user uploads OPML file with version other than "1.0" or "2.0"
**THEN** system returns 422 Unprocessable Entity status
**AND** returns error message indicating invalid version

---

### Requirement: Transactional Import
The system SHALL use database transactions to ensure atomic folder creation during OPML imports.

#### Scenario: Partial import success
**WHEN** OPML import transaction creates folders successfully
**BUT** some feeds fail validation or fetching
**THEN** system commits transaction with successfully imported feeds
**AND** returns summary indicating which feeds succeeded and which failed
**AND** does NOT rollback entire transaction due to individual feed failures

#### Scenario: Transaction rollback on critical failure
**WHEN** database constraint violation occurs during import (e.g., duplicate folder name race condition)
**THEN** system rolls back entire transaction
**AND** returns 500 Internal Server Error status
**AND** returns error message "Database transaction failed"

---

### Requirement: UI Integration
The system SHALL provide user interface elements for OPML import and export in the feed management modal.

#### Scenario: Export button functionality
**WHEN** user opens ManageFeedsModal
**THEN** "Import/Export Feeds" section is visible
**AND** "Export OPML" button is present
**WHEN** user clicks "Export OPML" button
**THEN** browser downloads OPML file with current date in filename

#### Scenario: Import button functionality
**WHEN** user opens ManageFeedsModal
**THEN** "Import OPML" button is present
**WHEN** user clicks "Import OPML" button
**THEN** file selection dialog opens
**AND** only .opml and .xml files are selectable

#### Scenario: Import loading state
**WHEN** user selects OPML file for import
**THEN** "Import OPML" button changes to "Importing..." text
**AND** button is disabled during import process
**AND** button returns to normal state after import completes

#### Scenario: Import results display
**WHEN** OPML import completes successfully
**THEN** import results section displays below buttons
**AND** shows count of imported feeds
**AND** shows count of skipped feeds
**AND** shows list of errors (if any) with scrollable list
**AND** feed list automatically refreshes to show new feeds

#### Scenario: Import error display
**WHEN** OPML import fails (file too large, malformed XML, etc.)
**THEN** error message displays using existing error message pattern
**AND** error auto-dismisses after 5 seconds
**AND** import results section does NOT display

---

## Implementation Notes

**API Routes**:
- `GET /api/opml/export` - Export endpoint (new file: `app/api/opml/export/route.ts`)
- `POST /api/opml/import` - Import endpoint (new file: `app/api/opml/import/route.ts`)

**Utilities**:
- `lib/utils/opmlUtils.ts` - XML generation and parsing functions (new file)

**UI Components**:
- `components/ManageFeedsModal.tsx` - Add import/export section (modified)

**Database Impact**:
- No schema changes required
- Uses existing `Feed` and `Folder` models
- Relies on existing `folderId` foreign key relationship

**Dependencies**:
- No new npm packages required
- Uses native XML handling (template strings for generation, regex for parsing)
- Leverages existing `fetchAndParseFeed()` utility for feed validation

**Performance**:
- Export: Single database query with `include` relation (< 1s for 1000 feeds)
- Import: Transactional with individual feed validation (< 5s for 100 feeds)
- File size limit (5MB) prevents memory issues

**Security**:
- File size limit prevents DoS attacks
- XML escaping prevents XSS in exported OPML
- URL protocol validation prevents malicious feeds
- Prisma ORM prevents SQL injection
