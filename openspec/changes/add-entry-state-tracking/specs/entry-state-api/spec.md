# Spec: Entry State API

**Capability:** `entry-state-api`
**Status:** Proposed
**Version:** 1.0.0

## Overview

API endpoints to manage read/unread and starred state for RSS entries.

---

## ADDED Requirements

### Requirement: Update Single Entry State

**ID:** `entry-state-api.update-single`
**Priority:** High

The system SHALL provide an API endpoint to update the read and starred status of a single entry.

#### Scenario: Mark entry as read

**Given** an entry with `id=123` exists with `isRead=false`
**When** a PUT request is made to `/api/entries/123` with body `{ "isRead": true }`
**Then** the entry's `isRead` field is updated to `true`
**And** the response returns the updated entry object
**And** the HTTP status code is 200

#### Scenario: Star an entry

**Given** an entry with `id=456` exists with `isStarred=false`
**When** a PUT request is made to `/api/entries/456` with body `{ "isStarred": true }`
**Then** the entry's `isStarred` field is updated to `true`
**And** the response contains `{ "id": 456, "isStarred": true, ... }`
**And** the HTTP status code is 200

#### Scenario: Partial update

**Given** an entry with `id=789` exists
**When** a PUT request is made with body `{ "isRead": true }` (omitting `isStarred`)
**Then** only the `isRead` field is updated
**And** the `isStarred` field remains unchanged

#### Scenario: Entry not found

**Given** no entry exists with `id=999`
**When** a PUT request is made to `/api/entries/999`
**Then** the HTTP status code is 404
**And** the response contains an error message

---

### Requirement: Bulk Mark as Read

**ID:** `entry-state-api.bulk-clear`
**Priority:** High

The system SHALL provide an API endpoint to mark all unread entries for a feed as read.

#### Scenario: Clear all entries for a feed

**Given** feed with `id=5` has 10 unread entries
**When** a POST request is made to `/api/entries/clear` with body `{ "feedId": 5 }`
**Then** all entries where `feedId=5` and `isRead=false` are updated to `isRead=true`
**And** the response contains `{ "updated": 10 }`
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
**Note:** Does not error, simply updates 0 entries

---

### Requirement: Request Validation

**ID:** `entry-state-api.validation`
**Priority:** Medium

The system SHALL validate API request payloads and reject invalid data.

#### Scenario: Invalid boolean value

**Given** an entry with `id=123` exists
**When** a PUT request is made with body `{ "isRead": "invalid" }` (string instead of boolean)
**Then** the HTTP status code is 400
**And** the response contains a validation error message

#### Scenario: Unknown fields ignored

**Given** an entry with `id=123` exists
**When** a PUT request is made with body `{ "isRead": true, "unknownField": "value" }`
**Then** the `isRead` field is updated
**And** the `unknownField` is ignored
**And** the HTTP status code is 200

---

### Requirement: Transaction Safety

**ID:** `entry-state-api.transactions`
**Priority:** High

The system SHALL ensure all state updates are atomic and consistent.

#### Scenario: Update completes or rolls back entirely

**Given** an entry exists
**When** a database error occurs during the update
**Then** the entry state remains unchanged
**And** the HTTP status code is 500
**And** no partial updates are persisted

---

## MODIFIED Requirements

None. This is a new capability.

---

## REMOVED Requirements

None.

---

## Related Capabilities

- `unread-counters`: Count queries depend on accurate `isRead` values
- `entry-display-ui`: UI components call these APIs
