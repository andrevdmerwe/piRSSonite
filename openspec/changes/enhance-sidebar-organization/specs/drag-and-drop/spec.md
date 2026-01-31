# Spec Delta: Drag-and-Drop Reordering

## ADDED Requirements

### Requirement: Folder Reordering
Users MUST be able to reorder folders via drag and drop.

#### Scenario: Reordering Folders
-   **Given** a list of folders in the sidebar
-   **When** the user drags a folder to a new position
-   **Then** the folder list **MUST** visually update immediately (optimistic).
-   **And** the new order **MUST** be persisted to the server.

### Requirement: Feed Reordering
Users MUST be able to reorder feeds within their container (root or folder).

#### Scenario: Reordering Feeds
-   **Given** a list of feeds (either at root or within a folder)
-   **When** the user drags a feed to a new position within the same list
-   **Then** the feed list **MUST** visually update immediately.
-   **And** the new order **MUST** be persisted to the server.

### Requirement: Persistence
All reordering actions MUST be saved to the database.

#### Scenario: Persisting Order
-   **Given** a reorder action has completed
-   **Then** the application **MUST** save the `order` index for all affected items in the backend.
