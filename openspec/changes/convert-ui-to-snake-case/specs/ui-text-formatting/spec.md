# Spec Delta: UI Text Formatting - snake_case Conversion

## ADDED Requirements

### Requirement: Static UI Text Formatting
The system SHALL display all static UI text elements in snake_case format.

#### Scenario: Button labels display in snake_case
**WHEN** user views any button in the interface
**THEN** button text uses snake_case formatting
**AND** examples include "manage_feeds", "add_feed", "mark_as_read", "export_opml"

#### Scenario: Section headings display in snake_case
**WHEN** user views section headings throughout the application
**THEN** heading text uses snake_case formatting
**AND** examples include "views", "feeds", "import_export_feeds", "manage_folders"

#### Scenario: Form labels display in snake_case
**WHEN** user views form input labels
**THEN** label text uses snake_case formatting
**AND** examples include "feed_url", "folder_optional", "new_folder_name"

#### Scenario: Navigation labels display in snake_case
**WHEN** user views navigation menu items
**THEN** navigation text uses snake_case formatting
**AND** examples include "all_items", "unread", "starred"

#### Scenario: Status messages display in snake_case
**WHEN** system displays loading or empty states
**THEN** status message text uses snake_case formatting
**AND** examples include "loading_entries...", "no_entries_found", "no_unread_feeds"

---

### Requirement: Dynamic Content Transformation
The system SHALL transform feed names and folder names to snake_case format when displayed.

#### Scenario: Feed names display in snake_case
**WHEN** system displays a feed name from RSS source
**THEN** feed name is transformed to snake_case
**AND** transformation converts "3D Printing" to "3d_printing"
**AND** transformation converts "Technology & News" to "technology_news"
**AND** original feed data remains unchanged in database

#### Scenario: Folder names display in snake_case
**WHEN** system displays a folder name
**THEN** folder name is transformed to snake_case
**AND** transformation converts "My Folder" to "my_folder"
**AND** original folder name remains unchanged in database

#### Scenario: Special characters handled in transformation
**WHEN** feed or folder name contains special characters
**THEN** special characters are replaced with underscores
**AND** multiple consecutive underscores are collapsed to single underscore
**AND** leading and trailing underscores are removed

---

### Requirement: Text Transformation Utility
The system SHALL provide a utility function to convert strings to snake_case format.

#### Scenario: toSnakeCase utility converts text correctly
**WHEN** toSnakeCase() is called with a string
**THEN** function returns lowercase version
**AND** spaces are converted to underscores
**AND** special characters are converted to underscores
**AND** multiple underscores are collapsed to single underscore

#### Scenario: toSnakeCase handles edge cases
**WHEN** toSnakeCase() receives strings with edge cases
**THEN** "3D Printing" returns "3d_printing"
**AND** "Technology & News" returns "technology_news"
**AND** "  Extra Spaces  " returns "extra_spaces"
**AND** "__Multiple___" returns "multiple"

---

### Requirement: Content Preservation
The system SHALL preserve specific content types from snake_case transformation.

#### Scenario: Article titles remain unchanged
**WHEN** system displays an article title from RSS feed
**THEN** article title is displayed exactly as received from source
**AND** NO snake_case transformation is applied
**AND** capitalization is preserved
**AND** punctuation is preserved

#### Scenario: Product branding preserved
**WHEN** system displays product name "piRSSonite"
**THEN** name is displayed exactly as "piRSSonite"
**AND** NO snake_case transformation is applied
**AND** mixed case is preserved for branding

#### Scenario: Error message prefixes remain standard case
**WHEN** system displays error messages
**THEN** prefixes like "Error:" and "Failed to" remain in standard case
**AND** dynamic details in message use snake_case transformation
**AND** example: "Failed to add feed: react_blog"

---

### Requirement: Success/Error Message Formatting
The system SHALL apply snake_case to dynamic portions of success and error messages.

#### Scenario: Feed addition success message
**WHEN** user successfully adds a feed
**THEN** success message displays "added_feed: {snake_case_feed_name}"
**AND** feed name is transformed to snake_case

#### Scenario: Folder creation success message
**WHEN** user successfully creates a folder
**THEN** success message displays "created_folder: {snake_case_folder_name}"
**AND** folder name is transformed to snake_case

#### Scenario: Folder deletion confirmation
**WHEN** user deletes a folder
**THEN** success message displays "deleted_folder: {snake_case_folder_name}"
**AND** folder name is transformed to snake_case

#### Scenario: Network error message
**WHEN** network error occurs
**THEN** message displays "network_error_please_try_again"
**AND** all text uses snake_case except standard error prefixes

---

### Requirement: Component Text Updates
The system SHALL implement snake_case formatting across all UI components.

#### Scenario: Sidebar component uses snake_case
**WHEN** user views sidebar
**THEN** "views" heading is displayed
**AND** "all_items" navigation label is displayed
**AND** "feeds" heading is displayed
**AND** feed names are displayed in snake_case
**AND** folder names are displayed in snake_case

#### Scenario: Entry feed component uses snake_case
**WHEN** user views entry feed area
**THEN** loading state shows "loading_entries..."
**AND** empty state shows "no_entries_found"
**AND** no unread state shows "no_unread_feeds"

#### Scenario: Article card component uses snake_case
**WHEN** user views an article card
**THEN** "mark_as_read" button is displayed
**AND** "star"/"starred" toggle is displayed
**AND** "collapse"/"expand" button is displayed
**AND** feed name badge uses snake_case
**AND** article title remains unchanged

#### Scenario: Manage feeds modal uses snake_case
**WHEN** user opens manage feeds modal
**THEN** modal title shows "manage_feeds"
**AND** section headings use snake_case
**AND** all button labels use snake_case
**AND** all form labels use snake_case
**AND** folder names display in snake_case

---

### Requirement: Metadata Text Formatting
The system SHALL apply snake_case to page metadata descriptions.

#### Scenario: Page description in snake_case
**WHEN** page metadata is rendered
**THEN** description meta tag contains "self_hosted_rss_reader"
**AND** page title remains "piRSSonite" (branding preserved)

---

## Implementation Notes

**Affected Components**:
- `components/Sidebar.tsx` - navigation and listings
- `components/EntryFeed.tsx` - feed view states
- `components/ArticleCard.tsx` - article display
- `components/ManageFeedsModal.tsx` - feed/folder management
- `app/layout.tsx` - page metadata

**Utility Function**:
- `lib/utils/textUtils.ts` - toSnakeCase() implementation

**Transformation Rules**:
1. Convert to lowercase
2. Replace spaces with underscores
3. Replace special characters with underscores
4. Collapse multiple underscores to single
5. Trim leading/trailing underscores

**Preserved Content**:
- Article titles from RSS feeds (display exactly as received)
- Product name "piRSSonite" (branding)
- Error prefixes "Error:", "Failed to" (readability)

**Database Impact**:
- NO database schema changes
- Original feed/folder names remain in database
- Transformation is display-only (client-side)

**Performance**:
- snake_case transformation uses simple regex operations (O(n))
- No caching required (feed/folder names are relatively static)
- Minimal performance impact

**Accessibility**:
- Screen readers may read underscores differently across implementations
- Visual clarity maintained through underscore word separation
- Semantic meaning unchanged (only formatting modified)
