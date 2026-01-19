# Design: Convert UI Text to snake_case

## Overview

This change implements snake_case formatting for all UI text elements while preserving article content and specific branding. The approach uses a utility function for dynamic content and direct string replacement for static UI elements.

## Text Transformation Rules

### Rule 1: Static UI Text → snake_case
All hardcoded UI strings in components convert to snake_case.

**Examples**:
```typescript
// Before
"Manage Feeds"
"Add New Feed"
"Mark as Read"
"Loading entries..."

// After
"manage_feeds"
"add_new_feed"
"mark_as_read"
"loading_entries..."
```

### Rule 2: Dynamic Feed/Folder Names → snake_case
Feed titles and folder names transform on display using `toSnakeCase()` utility.

**Examples**:
```typescript
// Feed title from RSS: "3D Printing"
{toSnakeCase(feed.title)} // Displays: "3d_printing"

// Folder name from database: "Technology & News"
{toSnakeCase(folder.name)} // Displays: "technology_news"
```

### Rule 3: Article Titles → Unchanged
Article titles from RSS feeds display exactly as received.

**Example**:
```typescript
// Article title: "Welcome to R/3D Printing! Come for the Benchy, stay for the Calibration!"
{entry.title} // Displays exactly as-is (NO transformation)
```

### Rule 4: Error Messages → Mixed Approach
Prefixes remain standard case; dynamic details use snake_case.

**Examples**:
```typescript
// Before
"Added feed: React Blog"
"Deleted folder: News Feeds"

// After
"Added feed: react_blog"
"Deleted folder: news_feeds"
```

### Rule 5: Product Branding → Unchanged
Product name "piRSSonite" remains as-is for branding consistency.

## snake_case Utility Function

### Implementation

```typescript
/**
 * Convert string to snake_case format
 * Handles spaces, special characters, and multiple words
 */
export function toSnakeCase(str: string): string {
  return str
    .toLowerCase()                 // Convert to lowercase
    .replace(/\s+/g, '_')          // Spaces → underscores
    .replace(/[^\w_]/g, '_')       // Special chars → underscores
    .replace(/_+/g, '_')           // Collapse multiple underscores
    .replace(/^_|_$/g, '')         // Trim leading/trailing underscores
}
```

### Edge Cases Handled

| Input | Output | Explanation |
|-------|--------|-------------|
| `"3D Printing"` | `"3d_printing"` | Space to underscore |
| `"Technology & News"` | `"technology_news"` | Ampersand removed, collapsed underscores |
| `"Web Dev / Design"` | `"web_dev_design"` | Slash removed |
| `"AI/ML Updates"` | `"ai_ml_updates"` | Multiple special chars |
| `"  Extra Spaces  "` | `"extra_spaces"` | Trimmed |
| `"__Multiple___"` | `"multiple"` | Collapsed underscores |

## Component Modifications

### Sidebar.tsx

**Static Strings** (Lines 76, 83, 90, 96, 108):
```typescript
// Before
<div>{feed.unreadCount} unread articles</div>
<button>Manage Feeds</button>
<h3>Views</h3>
<button>All Items</button>
<h3>Feeds</h3>

// After
<div>{feed.unreadCount} unread_articles</div>
<button>manage_feeds</button>
<h3>views</h3>
<button>all_items</button>
<h3>feeds</h3>
```

**Dynamic Content** (Lines 122, 135):
```typescript
// Before
<span>{feed.title}</span>
<span>{folder.name}</span>

// After
<span>{toSnakeCase(feed.title)}</span>
<span>{toSnakeCase(folder.name)}</span>
```

### EntryFeed.tsx

**Static Strings** (Lines 62, 70, 80, 88):
```typescript
// Before
"Loading entries..."
"Error: {error}"
"No entries found"
"No unread feeds"

// After
"loading_entries..."
"Error: {error}"  // Prefix unchanged
"no_entries_found"
"no_unread_feeds"
```

### ArticleCard.tsx

**Static Strings** (Lines 87, 117, 122, 128, 133, 141):
```typescript
// Before
"unread"      // Already snake_case
"Collapse"
"Expand"
"Unstar"
"Star"
"Starred"
"Mark as read"

// After
"unread"      // No change
"collapse"
"expand"
"unstar"
"star"
"starred"
"mark_as_read"
```

**Dynamic Feed Title** (Line 90):
```typescript
// Before
<span>{entry.feed.title}</span>

// After
<span>{toSnakeCase(entry.feed.title)}</span>
```

**Article Title Unchanged** (Line 100):
```typescript
// IMPORTANT: Article title remains unchanged
<h2>{entry.title}</h2>  // NO transformation applied
```

### ManageFeedsModal.tsx

**Section Headings**:
```typescript
// Lines 353, 403, 454, 551
"Import/Export Feeds" → "import_export_feeds"
"Add New Feed" → "add_new_feed"
"Manage Folders" → "manage_folders"
"Your Feeds" → "your_feeds"
```

**Button Labels**:
```typescript
// Lines 362, 375, 446, 471, 503, 512
"Export OPML" → "export_opml"
"Import OPML" → "import_opml"
"Add Feed" → "add_feed"
"Create Folder" → "create_folder"
"Save" → "save"
"Cancel" → "cancel"
```

**Form Labels**:
```typescript
// Lines 408, 422
"Feed URL" → "feed_url"
"Folder (optional)" → "folder_optional"
```

**Loading States**:
```typescript
// Lines 375, 446, 471
"Importing..." → "importing..."
"Adding..." → "adding..."
"Creating..." → "creating..."
```

**Success Messages**:
```typescript
// Before
showSuccess(`Added feed: ${data.title}`)
showSuccess(`Created folder: ${data.name}`)
showSuccess(`Deleted folder: ${folderName}`)

// After
showSuccess(`added_feed: ${toSnakeCase(data.title)}`)
showSuccess(`created_folder: ${toSnakeCase(data.name)}`)
showSuccess(`deleted_folder: ${toSnakeCase(folderName)}`)
```

**Dynamic Folder Names** (Lines 518, 569, throughout):
```typescript
// Before
<h4>{folder.name}</h4>

// After
<h4>{toSnakeCase(folder.name)}</h4>
```

### app/layout.tsx

**Metadata** (Line 8):
```typescript
// Before
description: "Self-hosted RSS reader"

// After
description: "self_hosted_rss_reader"
```

## Complete File Changes Summary

| File | Static Strings | Dynamic Transformations | Total Changes |
|------|----------------|-------------------------|---------------|
| Sidebar.tsx | 5 | 2 (feed.title, folder.name) | 7 |
| EntryFeed.tsx | 4 | 0 | 4 |
| ArticleCard.tsx | 7 | 1 (feed.title) | 8 |
| ManageFeedsModal.tsx | 60+ | Multiple folder.name | 70+ |
| app/layout.tsx | 1 | 0 | 1 |
| **Total** | **77** | **Multiple** | **90+** |

## Testing Strategy

### Unit Tests (textUtils.ts)

```typescript
describe('toSnakeCase', () => {
  test('handles spaces', () => {
    expect(toSnakeCase('Hello World')).toBe('hello_world')
  })

  test('handles special characters', () => {
    expect(toSnakeCase('Tech & News')).toBe('tech_news')
  })

  test('collapses underscores', () => {
    expect(toSnakeCase('__test__')).toBe('test')
  })

  test('handles mixed case', () => {
    expect(toSnakeCase('3D Printing')).toBe('3d_printing')
  })
})
```

### Manual Testing Checklist

**Sidebar**:
- [ ] "views" heading displays correctly
- [ ] "all_items" navigation label shows
- [ ] "feeds" heading displays
- [ ] Feed names show as snake_case
- [ ] Folder names show as snake_case

**Entry Feed**:
- [ ] "loading_entries..." appears during load
- [ ] "no_entries_found" shows when empty
- [ ] Article titles remain unchanged

**Article Card**:
- [ ] "mark_as_read" button label correct
- [ ] "star"/"starred" toggle works
- [ ] Feed name displays as snake_case
- [ ] Article title unchanged

**Manage Feeds Modal**:
- [ ] All button labels in snake_case
- [ ] Form labels in snake_case
- [ ] Success messages use snake_case
- [ ] Folder names display as snake_case

## Performance Considerations

- **String Operations**: `toSnakeCase()` uses simple regex replacements (fast, O(n))
- **No Caching Needed**: Feed/folder names are relatively static; transformation overhead negligible
- **Client-Side Only**: All transformations happen in browser; no server impact

## Accessibility Considerations

- **Screen Readers**: snake_case may be read as separate words or as one word depending on screen reader
- **Visual Clarity**: Underscores provide visual separation similar to spaces
- **No Semantic Change**: Text meaning remains the same; only formatting changes

## Future Enhancements (Out of Scope)

- User preference toggle for snake_case vs. standard case
- Custom text transformation rules per folder/feed
- Internationalization (i18n) support with snake_case
