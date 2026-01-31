# Tasks: Sidebar Enhancements

- [ ] Install `@dnd-kit` dependencies (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`).
- [ ] **Sticky Header**:
    - [ ] Update `Sidebar.tsx` to apply sticky positioning, z-index, and background to the header section.
- [ ] **API**:
    - [ ] Create `PATCH /api/folders/reorder` to update folder orders.
    - [ ] Create `PATCH /api/feeds/reorder` to update feed orders (global or per-folder).
- [ ] **Frontend Logic**:
    - [ ] Implement `SortableContext` for Folders list.
    - [ ] Implement `SortableContext` for Feeds list (root and inside folders).
    - [ ] Handle `onDragEnd` events to calculate new orders and call APIs.
    - [ ] Optimistically update local state to avoid flicker.
