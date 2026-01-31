# Sidebar Enhancements Proposal

## 1. Goal

Improve the usability of the sidebar by adding drag-and-drop reordering for feeds and folders and fixing the header to the top of the pane for easier access.

## 2. Context

The current sidebar lists feeds and folders in a static order (likely creation or ID based, though schema has `order`). Users cannot reorganize their subscriptions. Additionally, scrolling down a long list hides the header (app title, settings, global unread count), reducing accessibility.

## 3. Scope

### In Scope
-   **UI**:
    -   Implement "sticky" positioning for the Sidebar header.
    -   Integrate a drag-and-drop library (e.g., `@dnd-kit`) to allow reordering of:
        -   Root-level feeds.
        -   Folders.
        -   Feeds within folders.
-   **API**:
    -   Create endpoints to persist the new order of feeds and folders.
-   **Database**:
    -   Utilize the existing `order` columns in `Feed` and `Folder` tables.

### Out of Scope
-   Moving feeds *between* folders (drag-and-drop is strictly for reordering within the same container for this iteration, unless effortless to include). *Self-correction: Users usually expect moving between folders if DnD is present. I will target reordering first, but design for moving.*
-   Visual redesign of the sidebar items (beyond necessary drag handles or states).

## 4. Risks

-   **Complexity**: Drag-and-drop with nested lists (folders + feeds) can be tricky.
-   **Performance**: Persisting order updates shouldn't lag the UI. Optimistic UI updates are required.
