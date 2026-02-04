# Spec Delta: Entry State API

**Capability:** `entry-state-api`

---

## MODIFIED Requirements

### Requirement: Bulk Mark as Read

The system SHALL provide an API endpoint to mark all unread entries as read. The endpoint SHALL support optional filtering by feedId, folderId, or no filter to clear all entries globally.

#### Scenario: Clear all entries for a feed

**Given** feed with `id=5` has 10 unread entries
**When** a POST request is made to `/api/entries/clear` with body `{ "feedId": 5 }`
**Then** all entries where `feedId=5` and `isRead=false` are updated to `isRead=true`
**And** the response contains `{ "updated": 10 }`
**And** the HTTP status code is 200

#### Scenario: Clear all entries for a folder

**Given** folder with `id=3` contains feeds with a total of 15 unread entries
**When** a POST request is made to `/api/entries/clear` with body `{ "folderId": 3 }`
**Then** all entries where the entry's feed belongs to `folderId=3` and `isRead=false` are updated to `isRead=true`
**And** the response contains `{ "updated": 15 }`
**And** the HTTP status code is 200

#### Scenario: Clear all entries globally

**Given** there are 25 unread entries across all feeds
**When** a POST request is made to `/api/entries/clear` with empty body `{}`
**Then** all entries where `isRead=false` are updated to `isRead=true`
**And** the response contains `{ "updated": 25 }`
**And** the HTTP status code is 200

#### Scenario: Clear when no unread entries exist

**Given** feed with `id=5` has 0 unread entries
**When** a POST request is made to `/api/entries/clear` with body `{ "feedId": 5 }`
**Then** the response contains `{ "updated": 0 }`
**And** the HTTP status code is 200

#### Scenario: Invalid feed ID

**Given** no feed exists with `id=999`
**When** a POST request is made to `/api/entries/clear` with body `{ "feedId": 999 }`
**Then** the response contains `{ "updated": 0 }`
**And** the HTTP status code is 200

---

## ADDED Requirements

### Requirement: Mark All Read UI Button

The system SHALL display a "mark all read" button in the articles panel header. The button SHALL be positioned next to the refresh button and SHALL call `/api/entries/clear` when clicked.

#### Scenario: Button present in header

**Given** the user is viewing the articles panel
**When** entries are loaded
**Then** a "mark all read" button is visible in the header next to the refresh button

#### Scenario: Mark all read for feed

**Given** the user is viewing a single feed with 5 unread entries
**When** the user clicks the "mark all read" button
**Then** a POST request is made to `/api/entries/clear` with the current feedId
**And** all entries in the view are updated to show as read
**And** the unread count in the header updates to 0
**And** the sidebar unread counts refresh

#### Scenario: Mark all read for folder

**Given** the user is viewing a folder containing feeds with 12 total unread entries
**When** the user clicks the "mark all read" button
**Then** a POST request is made to `/api/entries/clear` with the current folderId
**And** all entries in that folder are marked as read
**And** the sidebar unread counts refresh

#### Scenario: Mark all read for all items

**Given** the user is viewing "all items" with 20 unread entries
**When** the user clicks the "mark all read" button
**Then** a POST request is made to `/api/entries/clear` with no filter params
**And** all entries are marked as read
**And** the sidebar unread counts refresh

#### Scenario: Button disabled when no unread entries

**Given** the user is viewing articles with 0 unread entries
**When** the articles panel is displayed
**Then** the "mark all read" button is disabled or hidden
