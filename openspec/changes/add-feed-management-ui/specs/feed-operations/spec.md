# Capability: Feed Operations

Delete feeds and move feeds between folders.

## ADDED Requirements

### Requirement: Delete Feed via API

**ID:** `feed-delete-api`

The system SHALL provide a `DELETE /api/feeds/[id]` endpoint that removes a feed and all its entries from the database.

#### Scenario: Successfully delete feed

```
GIVEN feed with id=10
WHEN DELETE /api/feeds/10
THEN response status is 204
AND feed is deleted from database
AND all entries with feedId=10 are deleted (cascade)
```

#### Scenario: Handle non-existent feed deletion

```
GIVEN no feed with id=999
WHEN DELETE /api/feeds/999
THEN response status is 404
AND response body contains error about feed not found
```

#### Scenario: Cascade delete entries

```
GIVEN feed with id=10 has 50 entries
WHEN DELETE /api/feeds/10
THEN feed is deleted
AND all 50 entries are also deleted from database
```

### Requirement: Update Feed Folder via API

**ID:** `feed-update-folder-api`

The system SHALL provide a `PUT /api/feeds/[id]` endpoint that accepts a folderId and moves the feed to that folder.

#### Scenario: Move feed to folder

```
GIVEN feed with id=15 has folderId=null (root)
AND folder with id=3 exists
WHEN PUT /api/feeds/15 with {"folderId": 3}
THEN response status is 200
AND feed 15 has folderId=3 in database
```

#### Scenario: Move feed to root

```
GIVEN feed with id=20 has folderId=5
WHEN PUT /api/feeds/20 with {"folderId": null}
THEN response status is 200
AND feed 20 has folderId=null (moved to root)
```

#### Scenario: Reject move to non-existent folder

```
GIVEN feed with id=15
AND no folder with id=999
WHEN PUT /api/feeds/15 with {"folderId": 999}
THEN response status is 400
AND response body contains error about folder not found
AND feed remains in original folder
```

### Requirement: Feed Deletion UI

**ID:** `feed-delete-ui`

The management modal SHALL provide interface for deleting feeds with confirmation.

#### Scenario: Display feed list with delete buttons

```
GIVEN 10 feeds exist in database
WHEN viewing "Manage Feeds" section
THEN all 10 feeds are listed
AND each feed has a delete button (trash icon or X)
```

#### Scenario: Delete feed with confirmation

```
GIVEN feed "Example Blog" in feed list
WHEN user clicks delete button
THEN confirmation dialog appears with "Delete 'Example Blog'? All its articles will be removed."
WHEN user confirms
THEN DELETE /api/feeds/[id] request is sent
AND feed is removed from list
AND sidebar updates to remove feed
AND unread counter updates
```

#### Scenario: Cancel feed deletion

```
GIVEN user clicks delete button for feed
WHEN confirmation dialog appears
AND user clicks "Cancel"
THEN no API request is sent
AND feed remains in list
```

### Requirement: Feed Move UI

**ID:** `feed-move-ui`

The management modal SHALL provide interface for moving feeds between folders via dropdown selector.

#### Scenario: Display folder selector per feed

```
GIVEN feed "Example Blog" in folder "Tech News"
WHEN viewing feed in management list
THEN folder dropdown next to feed shows "Tech News" selected
AND dropdown contains all folders plus "No folder" option
```

#### Scenario: Move feed via dropdown

```
GIVEN feed "Example Blog" in folder "Tech News"
WHEN user selects "Science" from folder dropdown
THEN PUT /api/feeds/[id] request is sent with {"folderId": <science-id>}
AND feed moves to "Science" in sidebar
AND unread counters update for both folders
```

#### Scenario: Move feed to root

```
GIVEN feed "Example Blog" in folder "Tech News"
WHEN user selects "No folder" from dropdown
THEN PUT /api/feeds/[id] request is sent with {"folderId": null}
AND feed appears at root level in sidebar
```

### Requirement: Feed List Grouping

**ID:** `feed-list-grouping`

The management modal SHALL display feeds grouped by folder for easier navigation and organization.

#### Scenario: Group feeds by folder

```
GIVEN 3 feeds in folder "Tech News"
AND 2 feeds in folder "Science"
AND 1 feed at root
WHEN viewing feed list in modal
THEN feeds are grouped with headers:
  - "No folder" (1 feed)
  - "Tech News" (3 feeds)
  - "Science" (2 feeds)
```

#### Scenario: Show feed count per group

```
GIVEN folder "Tech News" with 5 feeds
WHEN viewing in management modal
THEN folder header displays "Tech News (5)"
```

### Requirement: Feed Operations Error Handling

**ID:** `feed-operations-errors`

The system SHALL handle errors gracefully during feed deletion and movement, providing clear feedback to users.

#### Scenario: Handle network error during deletion

```
GIVEN user attempts to delete feed
AND network request fails
WHEN error occurs
THEN error message "Unable to delete feed. Please try again." is displayed
AND feed remains in list
```

#### Scenario: Handle concurrent deletion

```
GIVEN feed with id=10 is displayed in modal
AND another user/session deletes feed 10
WHEN user attempts to delete same feed
THEN API returns 404
AND error message "Feed not found. It may have been already deleted." is displayed
AND feed is removed from list
```
