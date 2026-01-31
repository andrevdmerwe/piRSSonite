# Design: Sidebar Drag-and-Drop & Sticky Header

## 1. Sticky Header

**Approach**:
-   Identify the header container in `Sidebar.tsx`.
-   Apply `sticky top-0 z-10 bg-bg-primary` (or appropriate theme background to prevent transparency issues).
-   Ensure the parent container has `overflow-y-auto` (which it currently does).

## 2. Drag-and-Drop Reordering

**Library**: `@dnd-kit`
-   Modular, lightweight, accessible.

**Data Model**:
-   `Folder` and `Feed` models already have `order` (Int).
-   API will accept an ordered array of IDs.
    -   `PATCH /api/folders/reorder`: Body `{ folderIds: [1, 5, 2] }`
    -   `PATCH /api/feeds/reorder`: Body `{ feedIds: [10, 11, 12], folderId: null | number }`

**UX**:
-   **Folders**: Draggable vertically.
-   **Feeds**: Draggable vertically within their container (root or specific folder).
-   **Drag Handle**: Entire row or specific handle? Entire row is easier for touch/mouse but might conflict with click-to-select. A specific drag handle or long-press is safer. *Decision: Use a visible drag handle icon on hover.*

**Optimistic Updates**:
-   When `onDragEnd` triggers, immediately update the `feeds` / `folders` state variable.
-   Send API request in background.
-   Revert on failure.
