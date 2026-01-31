# Spec Delta: Sticky Sidebar Header

## MODIFIED Requirements

### Requirement: Sticky Header Behavior
The sidebar header containing the app title and settings MUST remain visible at the top while scrolling.

#### Scenario: Scrolling the sidebar
-   **Given** the sidebar has enough content to scroll
-   **When** the user scrolls down
-   **Then** the header section (App Title, Settings, Unread Count) **MUST** remain pinned to the top of the view.
-   **And** the header **MUST** have a solid background to obscure content scrolling underneath.
