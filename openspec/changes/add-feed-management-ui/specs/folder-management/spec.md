# Capability: Folder Management

Create, rename, and delete folders for organizing feeds.

## ADDED Requirements

### Requirement: Create Folder via API

**ID:** `folder-create-api`

The system SHALL provide a `POST /api/folders` endpoint that accepts a folder name and creates a new folder in the database.

#### Scenario: Successfully create folder

```
GIVEN no existing folder named "Tech News"
WHEN POST /api/folders with {"name": "Tech News"}
THEN response status is 201
AND response body contains {"id": <number>, "name": "Tech News", "order": <number>}
AND folder is created in database
```

#### Scenario: Reject duplicate folder name

```
GIVEN existing folder named "Tech News"
WHEN POST /api/folders with {"name": "Tech News"}
THEN response status is 400
AND response body contains {"error": "Folder name already exists"}
```

#### Scenario: Reject empty folder name

```
GIVEN empty name ""
WHEN POST /api/folders with {"name": ""}
THEN response status is 400
AND response body contains error about name being required
```

#### Scenario: Trim whitespace from folder name

```
GIVEN name "  Tech News  "
WHEN POST /api/folders with {"name": "  Tech News  "}
THEN created folder has name="Tech News" (whitespace trimmed)
```

### Requirement: Rename Folder via API

**ID:** `folder-rename-api`

The system SHALL provide a `PUT /api/folders/[id]` endpoint that accepts a new name and updates the folder.

#### Scenario: Successfully rename folder

```
GIVEN folder with id=3 and name="Old Name"
WHEN PUT /api/folders/3 with {"name": "New Name"}
THEN response status is 200
AND response body contains {"id": 3, "name": "New Name"}
AND folder name is updated in database
```

#### Scenario: Reject rename to duplicate name

```
GIVEN folder with id=3 named "Folder A"
AND folder with id=5 named "Folder B"
WHEN PUT /api/folders/3 with {"name": "Folder B"}
THEN response status is 400
AND response body contains error about duplicate name
AND folder 3 retains name "Folder A"
```

#### Scenario: Handle non-existent folder

```
GIVEN no folder with id=999
WHEN PUT /api/folders/999 with {"name": "New Name"}
THEN response status is 404
AND response body contains error about folder not found
```

### Requirement: Delete Folder via API

**ID:** `folder-delete-api`

The system SHALL provide a `DELETE /api/folders/[id]` endpoint that deletes a folder and moves its feeds to the root level.

#### Scenario: Delete empty folder

```
GIVEN folder with id=7 containing 0 feeds
WHEN DELETE /api/folders/7
THEN response status is 204
AND folder is deleted from database
```

#### Scenario: Delete folder with feeds moves feeds to root

```
GIVEN folder with id=5 containing feeds [10, 11, 12]
WHEN DELETE /api/folders/5
THEN response status is 204
AND folder is deleted
AND feeds 10, 11, 12 have folderId=null (moved to root)
```

#### Scenario: Handle non-existent folder deletion

```
GIVEN no folder with id=999
WHEN DELETE /api/folders/999
THEN response status is 404
AND response body contains error about folder not found
```

### Requirement: Folder Management UI

**ID:** `folder-management-ui`

The management modal SHALL provide interface for creating, renaming, and deleting folders.

#### Scenario: Display create folder form

```
GIVEN user opens manage feeds modal
WHEN viewing "Manage Folders" section
THEN folder name input is visible
AND "Create Folder" button is visible
AND existing folders list is visible
```

#### Scenario: Create new folder via UI

```
GIVEN user enters "Tech News" in folder name input
WHEN user clicks "Create Folder" button
THEN POST /api/folders request is sent
AND upon success, "Tech News" appears in folder list
AND input is cleared
AND sidebar updates to show new folder
```

#### Scenario: Rename folder inline

```
GIVEN folder "Old Name" in folder list
WHEN user clicks on folder name
THEN name becomes editable input field
WHEN user changes to "New Name" and presses Enter
THEN PUT /api/folders/[id] request is sent
AND folder name updates in list and sidebar
```

#### Scenario: Delete folder with confirmation

```
GIVEN folder "Tech News" with 5 feeds
WHEN user clicks delete button next to folder
THEN confirmation dialog appears with message "Delete 'Tech News'? Its 5 feeds will be moved to the root."
WHEN user confirms
THEN DELETE /api/folders/[id] request is sent
AND folder is removed from list
AND feeds appear in root in sidebar
```

#### Scenario: Display folder feed count

```
GIVEN folder "Tech News" contains 12 feeds
WHEN viewing folder in management list
THEN folder row displays "Tech News (12 feeds)"
```

### Requirement: Folder Order Preservation

**ID:** `folder-order-preservation`

The system SHALL maintain folder order using the `order` field, ensuring folders appear consistently across sessions.

#### Scenario: Assign order to new folders

```
GIVEN existing folders have order values [0, 1, 2]
WHEN creating new folder
THEN new folder is assigned order=3
```

#### Scenario: Maintain order after deletion

```
GIVEN folders with orders [0, 1, 2, 3]
WHEN deleting folder with order=1
THEN remaining folders keep their orders [0, 2, 3]
AND display order is preserved (order by order field ascending)
```
