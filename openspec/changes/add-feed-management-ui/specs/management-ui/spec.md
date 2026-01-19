# Capability: Management UI Modal

Provide a modal interface for accessing all feed and folder management functions.

## ADDED Requirements

### Requirement: Management Modal Structure

**ID:** `management-modal-structure`

The system SHALL provide a modal dialog component that serves as the container for all feed and folder management interfaces.

#### Scenario: Open modal from sidebar

```
GIVEN user viewing main application
WHEN user clicks "Manage Feeds" button in sidebar
THEN modal opens centered on screen
AND background is dimmed with semi-transparent overlay
AND modal has close button (X) in header
```

#### Scenario: Close modal with close button

```
GIVEN management modal is open
WHEN user clicks X button in header
THEN modal closes
AND user returns to main view
AND sidebar remains visible
```

#### Scenario: Close modal with backdrop click

```
GIVEN management modal is open
WHEN user clicks on dimmed background outside modal
THEN modal closes
```

#### Scenario: Close modal with Escape key

```
GIVEN management modal is open
WHEN user presses Escape key
THEN modal closes
```

### Requirement: Modal Sections Layout

**ID:** `management-modal-sections`

The modal SHALL organize management functions into clear sections: Add Feed, Manage Folders, and Manage Feeds.

#### Scenario: Display all sections

```
GIVEN management modal is open
THEN "Add Feed" section is visible at top
AND "Manage Folders" section is visible in middle
AND "Manage Feeds" section is visible at bottom
AND sections are separated by horizontal dividers
```

#### Scenario: Section headers are clear

```
GIVEN viewing modal sections
THEN "Add Feed" section has heading "Add New Feed"
AND "Manage Folders" section has heading "Manage Folders"
AND "Manage Feeds" section has heading "Your Feeds"
```

### Requirement: Responsive Modal Styling

**ID:** `management-modal-styling`

The modal SHALL use consistent styling with the rest of the application and be appropriately sized for content.

#### Scenario: Apply color scheme

```
GIVEN application uses dark theme colors (bg-panel, bg-card, accent-cyan)
WHEN modal is displayed
THEN modal background uses bg-panel color
AND sections use bg-card color
AND accent elements use accent-cyan color
AND text uses text-primary, text-secondary colors
```

#### Scenario: Appropriate modal size

```
GIVEN modal is displayed on desktop screen
THEN modal width is maximum 800px
AND modal height adapts to content (max-height 90vh)
AND content is scrollable if exceeds max height
```

#### Scenario: Mobile responsive

```
GIVEN modal is displayed on mobile screen (<768px width)
THEN modal takes full width minus small padding
AND sections stack vertically
AND touch targets are minimum 44px height
```

### Requirement: State Synchronization

**ID:** `management-modal-sync`

The modal SHALL maintain synchronization with the sidebar, updating the sidebar immediately after operations complete.

#### Scenario: Refresh sidebar after adding feed

```
GIVEN user adds new feed "Example Blog"
WHEN feed creation succeeds
THEN modal remains open
AND sidebar immediately shows new feed in correct folder
AND unread counter updates if feed has entries
```

#### Scenario: Refresh sidebar after deleting feed

```
GIVEN user deletes feed from modal
WHEN deletion succeeds
THEN sidebar immediately removes feed
AND unread counters update
AND if deleted feed was selected, view switches to "All Items"
```

#### Scenario: Refresh sidebar after folder operations

```
GIVEN user creates or renames folder
WHEN operation succeeds
THEN sidebar immediately reflects changes
AND feed groupings update
```

### Requirement: Loading States

**ID:** `management-modal-loading`

The modal SHALL provide clear visual feedback during asynchronous operations.

#### Scenario: Loading state during feed addition

```
GIVEN user submits add feed form
WHEN request is in progress
THEN "Add Feed" button shows spinner icon
AND button is disabled
AND button text changes to "Adding..."
```

#### Scenario: Loading state during feed deletion

```
GIVEN user confirms feed deletion
WHEN DELETE request is in progress
THEN delete button shows spinner
AND delete button is disabled
AND feed row shows slight opacity to indicate processing
```

#### Scenario: Loading state for feed list

```
GIVEN modal opens for first time
WHEN fetching feed and folder data
THEN skeleton loaders are displayed in place of feed list
AND "Loading feeds..." message is shown
```

### Requirement: Error Display

**ID:** `management-modal-errors`

The modal SHALL display errors inline near the relevant form/action, with clear messaging and retry options.

#### Scenario: Display API error inline

```
GIVEN user submits add feed form
AND API returns 400 error "Feed URL already exists"
WHEN error occurs
THEN red error message appears below URL input
AND message text is "Feed URL already exists"
AND error icon is displayed
AND form remains populated for correction
```

#### Scenario: Display network error

```
GIVEN network connection is lost
WHEN user attempts any operation
THEN error message "Network error. Please check your connection." appears
AND retry button is displayed
```

#### Scenario: Clear errors on retry

```
GIVEN error message is displayed
WHEN user corrects input and resubmits
THEN previous error message is cleared
AND new validation occurs
```

### Requirement: Accessibility

**ID:** `management-modal-a11y`

The modal SHALL follow accessibility best practices for keyboard navigation and screen readers.

#### Scenario: Keyboard navigation

```
GIVEN modal is open
WHEN user presses Tab key
THEN focus moves through interactive elements in order:
  1. Close button
  2. URL input
  3. Folder dropdown
  4. Add Feed button
  5. Folder name input
  6. Create Folder button
  7. Feed list items...
```

#### Scenario: Screen reader announcements

```
GIVEN screen reader is active
WHEN modal opens
THEN screen reader announces "Manage Feeds dialog opened"
WHEN operation succeeds
THEN screen reader announces success (e.g., "Feed added successfully")
```

#### Scenario: Focus trap in modal

```
GIVEN modal is open
WHEN user tabs through all elements
THEN focus cycles within modal (doesn't leave to background)
AND Shift+Tab works in reverse
```
