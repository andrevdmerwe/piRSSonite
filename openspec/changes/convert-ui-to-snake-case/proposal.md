# Proposal: Convert UI Text to snake_case

## Why

The current UI uses standard mixed-case formatting for labels, buttons, and headings (e.g., "Manage Feeds", "All Items", "Mark as Read"). This proposal implements snake_case formatting across all UI elements to match a specific design aesthetic.

**User Pain Points**:
- Inconsistent text formatting makes the UI feel less cohesive
- Design reference shows snake_case style throughout
- Current mixed-case doesn't match the desired visual identity

**Design Goals**:
- Achieve consistent snake_case formatting across all UI text
- Maintain readability while implementing the new style
- Preserve data integrity (article content, RSS feed data)

## What

Convert all static UI text elements to snake_case formatting while preserving specific content:

### Text to Convert

**Static UI Elements** (82 strings across 5 files):
- Button labels: "Manage Feeds" → "manage_feeds"
- Section headings: "Import/Export Feeds" → "import_export_feeds"
- Navigation labels: "All Items" → "all_items"
- Form labels: "Feed URL" → "feed_url"
- Status messages: "Loading entries..." → "loading_entries..."
- Empty states: "No entries found" → "no_entries_found"

**Dynamic Content to Transform**:
- Feed names: "3D Printing" → "3d_printing"
- Folder names: "Technology News" → "technology_news"

### Text to Preserve

**Keep Unchanged**:
- Product name: "piRSSonite" (branding)
- Article titles: Preserve exact formatting from RSS feeds
- Error prefixes: "Error:", "Failed to" (standard case for readability)

### Implementation Approach

1. **Create Utility Function**: `toSnakeCase()` helper for dynamic content transformation
2. **Direct String Replacement**: Update all hardcoded UI strings in components
3. **Apply to Dynamic Content**: Transform feed names and folder names on display

## Impact

### User Benefits
- **Visual Consistency**: Unified snake_case style throughout the application
- **Design Alignment**: Matches reference design aesthetic
- **Improved Identity**: Distinctive visual style sets piRSSonite apart

### System Changes
- **New utility file**: `lib/utils/textUtils.ts` with `toSnakeCase()` function
- **Component updates**: 5 component files modified
- **String replacements**: 82 static strings converted
- **No database changes**: Original data preserved, transformation happens on display
- **No breaking changes**: Purely cosmetic UI update

### Technical Scope
- **Files created**: 1 file (textUtils.ts, ~20 lines)
- **Files modified**: 5 files (~150 lines total changes)
- **No new dependencies**: Pure JavaScript string manipulation
- **Estimated effort**: ~2.5 hours implementation + testing

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Reduced readability for non-technical users | Medium | Keep error messages in standard case; snake_case is familiar from programming/web contexts |
| Special characters create ugly underscores | Low | Utility function collapses multiple underscores and handles edge cases cleanly |
| Folder/feed names become unrecognizable | Medium | Users created these names, so snake_case transformation should still be identifiable |
| Article titles accidentally converted | High | Explicitly preserve article titles in code; only apply to UI labels and metadata |

## Alternatives Considered

### 1. Keep Current Mixed-Case
**Rejected**: Doesn't match design vision; current format doesn't provide distinctive visual identity

### 2. Use kebab-case Instead
**Rejected**: snake_case is more common in terminal/code aesthetics and matches reference image

### 3. Convert Everything Including Article Titles
**Rejected**: Would destroy readability of RSS content; article titles must remain as-is from source

### 4. Store snake_case in Database
**Rejected**: Database should store original user input; transformation should be display-only

## Success Metrics

- **Visual Consistency**: 100% of UI text elements use snake_case formatting
- **Design Match**: UI matches reference image style
- **Data Preservation**: Article titles remain unchanged from RSS sources
- **User Feedback**: No complaints about readability (monitor for 2 weeks post-deployment)

## Dependencies

- No external dependencies required
- Relies on existing component structure
- No database schema changes needed

## Timeline

1. **Phase 1 - Utility** (~15 mins): Create `toSnakeCase()` function
2. **Phase 2 - Components** (~1.5 hours): Update 5 component files with string replacements
3. **Phase 3 - Testing** (~20 mins): Manual testing of all UI elements

**Total**: 2.5 hours over 1 day

## Open Questions

None. Requirements clarified with user:
- ✅ Product name "piRSSonite" remains unchanged
- ✅ Feed names converted to snake_case
- ✅ Folder names converted to snake_case
- ✅ Article titles preserved as-is
- ✅ Error prefixes remain standard case
