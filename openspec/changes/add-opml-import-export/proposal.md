# Proposal: OPML Import/Export

## Why

piRSSonite currently lacks data portability features, making it difficult for users to:
- Migrate their feed subscriptions from other RSS readers
- Backup their feed lists for disaster recovery
- Share curated feed collections with others
- Switch between RSS readers without manual reconfiguration

OPML (Outline Processor Markup Language) is the de facto standard for RSS feed list interchange, supported by virtually all RSS readers including Feedly, Inoreader, NewsBlur, and legacy Google Reader exports.

**User Pain Points**:
- New users cannot easily import existing subscriptions → high barrier to entry
- Existing users have no backup mechanism → risk of data loss
- No way to export curated feeds → limited sharing/collaboration

## What

Add OPML 2.0 import and export capabilities to piRSSonite:

### Export Feature
- **GET /api/opml/export** endpoint returning OPML 2.0 XML file
- Includes all feeds and folders in standard hierarchical format
- Downloadable file named `pirssonite-feeds-YYYY-MM-DD.opml`
- Preserves folder structure using nested `<outline>` elements
- Compatible with all major RSS readers

### Import Feature
- **POST /api/opml/import** endpoint accepting multipart/form-data
- Parses OPML 1.0 and 2.0 formats
- Maps outline hierarchy to piRSSonite folder structure
- Validates feed URLs before database insertion
- Skips duplicate feeds gracefully
- Creates new folders automatically when needed
- Returns detailed import summary (imported/skipped/errors)

### UI Integration
- Two buttons in ManageFeedsModal: "Import OPML" and "Export OPML"
- File upload dialog for imports (max 5MB)
- Real-time import progress feedback
- Clear success/error messaging following existing patterns

## Impact

### User Benefits
- **Onboarding**: New users can import existing subscriptions in seconds
- **Backup**: Users can export feeds before server maintenance/migration
- **Portability**: Freedom to move between RSS readers without lock-in
- **Sharing**: Users can share curated feed lists (e.g., tech news, blogs)

### System Changes
- **New API routes**: 2 routes (`/api/opml/export`, `/api/opml/import`)
- **New utility**: `lib/utils/opmlUtils.ts` for XML generation/parsing
- **UI modification**: ManageFeedsModal gains import/export section
- **No database changes**: Uses existing Feed and Folder models
- **No breaking changes**: Fully additive feature

### Technical Scope
- **Files created**: 3 files (~400 lines total)
- **Files modified**: 1 file (ManageFeedsModal.tsx, ~50 lines added)
- **New dependencies**: None (native XML handling)
- **Estimated effort**: ~8 hours implementation + testing

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Malformed OPML imports crash server | High | Validate XML structure before parsing; return 422 for invalid files |
| Large OPML files (>100MB) cause memory issues | Medium | Enforce 5MB file size limit; stream parsing not needed (OPML files are small) |
| Feed validation slows imports | Low | Import in transaction; individual feed failures don't block others |
| Duplicate folder names cause confusion | Low | Use existing folder if name matches; document behavior |
| Special characters in titles break XML | Medium | Escape all user content (`&`, `<`, `>`, `"`, `'`) during export |
| Import partially succeeds then fails | Medium | Use Prisma transaction; return detailed summary of what succeeded/failed |

## Alternatives Considered

### 1. JSON Import/Export Instead of OPML
**Rejected**: OPML is the industry standard; JSON would not be compatible with other RSS readers, defeating the portability goal.

### 2. Add External Library for XML Parsing
**Rejected**: Native string manipulation for generation and DOMParser for parsing are sufficient for OPML's simple structure. Adding dependencies increases bundle size unnecessarily.

### 3. Batch Feed Validation (All-or-Nothing Import)
**Rejected**: Users want partial imports to succeed even if some feeds fail. Better UX is to import what works and report what failed.

### 4. Support Only OPML 2.0
**Rejected**: Many legacy RSS readers still export OPML 1.0. Supporting both versions requires no additional effort (parsing is identical).

## Success Metrics

- **Adoption**: 50%+ of new users use OPML import for onboarding (track import endpoint usage)
- **Compatibility**: Successfully imports OPML files from 5+ major RSS readers (Feedly, Inoreader, NewsBlur, The Old Reader, FreshRSS)
- **Reliability**: Import success rate >95% for valid OPML files
- **Performance**: Exports complete in <1s, imports complete in <5s for 100 feeds

## Dependencies

- No external package dependencies required
- Relies on existing infrastructure:
  - Prisma ORM for database transactions
  - Next.js formData() API for file uploads
  - Existing `fetchAndParseFeed()` for feed validation
  - Existing ManageFeedsModal for UI integration

## Timeline

1. **Phase 1 - Export** (~2 hours): OPML generation utility + export endpoint + UI button
2. **Phase 2 - Import** (~4.5 hours): OPML parsing utility + import endpoint + UI upload
3. **Phase 3 - Testing** (~1.5 hours): Edge case testing + UX polish

**Total**: 8 hours over 1-2 days

## Open Questions

None. Design is well-defined and follows existing patterns in the codebase.
