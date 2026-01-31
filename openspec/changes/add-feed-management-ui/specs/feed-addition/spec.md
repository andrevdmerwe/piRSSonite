# Capability: Feed Addition

Add new RSS/Atom feeds to the system via API and UI, with validation and preview capabilities.

## ADDED Requirements

### Requirement: Add Feed via API Endpoint

**ID:** `feed-addition-api`

The system SHALL provide a `POST /api/feeds` endpoint that accepts a feed URL and optional folder ID, validates the feed, and adds it to the database.

#### Scenario: Successfully add feed to root

```
GIVEN no existing feed with URL "https://example.com/feed.rss"
WHEN POST /api/feeds with {"url": "https://example.com/feed.rss"}
THEN response status is 201
AND response body contains {"id": <number>, "url": "https://example.com/feed.rss", "title": <string>, "folderId": null}
AND feed is created in database with isAvailable=true, failureCount=0
AND feed's nextCheckAt is set to current time (triggers immediate refresh)
```

#### Scenario: Successfully add feed to folder

```
GIVEN folder with id=5 exists
AND no existing feed with URL "https://example.com/tech.rss"
WHEN POST /api/feeds with {"url": "https://example.com/tech.rss", "folderId": 5}
THEN response status is 201
AND response body contains {"folderId": 5}
AND feed is associated with folder 5 in database
```

#### Scenario: Reject duplicate feed URL

```
GIVEN existing feed with URL "https://example.com/feed.rss"
WHEN POST /api/feeds with {"url": "https://example.com/feed.rss"}
THEN response status is 400
AND response body contains {"error": "Feed URL already exists"}
AND no new feed is created
```

#### Scenario: Reject invalid URL format

```
GIVEN URL "not-a-valid-url"
WHEN POST /api/feeds with {"url": "not-a-valid-url"}
THEN response status is 400
AND response body contains error message about invalid URL format
```

#### Scenario: Reject non-HTTP(S) protocols

```
GIVEN URL "ftp://example.com/feed.rss"
WHEN POST /api/feeds with {"url": "ftp://example.com/feed.rss"}
THEN response status is 400
AND response body contains error about unsupported protocol
```

#### Scenario: Handle unreachable feed URL

```
GIVEN URL "https://nonexistent.example.com/feed.rss" returns network error
WHEN POST /api/feeds with {"url": "https://nonexistent.example.com/feed.rss"}
THEN response status is 422
AND response body contains error about unable to fetch feed
AND no feed is created in database
```

#### Scenario: Handle invalid RSS/Atom XML

```
GIVEN URL "https://example.com/notafeed.xml" returns invalid XML
WHEN POST /api/feeds with {"url": "https://example.com/notafeed.xml"}
THEN response status is 422
AND response body contains error about invalid feed format
```

### Requirement: Extract Feed Metadata

**ID:** `feed-addition-metadata`

When adding a feed, the system SHALL fetch the feed URL, parse the RSS/Atom XML, and extract the feed title to populate the database.

#### Scenario: Extract feed title from RSS

```
GIVEN URL "https://example.com/feed.rss" returns valid RSS with <title>Example Blog</title>
WHEN adding feed via POST /api/feeds
THEN created feed has title="Example Blog"
```

#### Scenario: Extract feed title from Atom

```
GIVEN URL "https://example.com/atom.xml" returns valid Atom with <title>Tech News</title>
WHEN adding feed via POST /api/feeds
THEN created feed has title="Tech News"
```

#### Scenario: Use URL as fallback title

```
GIVEN URL "https://example.com/feed.rss" returns XML without <title> element
WHEN adding feed via POST /api/feeds
THEN created feed has title="https://example.com/feed.rss"
```

### Requirement: Feed Addition UI Form

**ID:** `feed-addition-ui-form`

The management modal SHALL provide a form with URL input, folder selector, and submit button for adding feeds.

#### Scenario: Display add feed form

```
GIVEN user opens manage feeds modal
WHEN viewing the "Add Feed" section
THEN URL input field is visible
AND folder dropdown is visible with "No folder" as default
AND "Add Feed" button is visible and enabled
```

#### Scenario: Validate URL format client-side

```
GIVEN user enters "not-a-url" in URL input
WHEN focus leaves the input field
THEN input shows red border indicating error
AND helper text displays "Please enter a valid URL"
```

#### Scenario: Submit feed addition

```
GIVEN user enters "https://example.com/feed.rss" in URL input
AND selects folder "Tech News" from dropdown
WHEN user clicks "Add Feed" button
THEN button shows loading spinner
AND POST /api/feeds request is sent
AND upon success, form is cleared
AND success message is displayed
AND sidebar updates to show new feed
```

#### Scenario: Display error on failure

```
GIVEN user submits feed that already exists
WHEN API returns 400 error
THEN loading state stops
AND error message "Feed URL already exists" is displayed
AND form remains populated for correction
```

### Requirement: Feed URL Validation

**ID:** `feed-addition-validation`

The system SHALL validate feed URLs before adding them to the database, checking format, reachability, and content validity.

#### Scenario: Accept standard HTTP URL

```
GIVEN URL "http://example.com/feed.rss"
WHEN validating URL format
THEN validation passes
```

#### Scenario: Accept HTTPS URL

```
GIVEN URL "https://example.com/feed.rss"
WHEN validating URL format
THEN validation passes
```

#### Scenario: Reject URL without protocol

```
GIVEN URL "example.com/feed.rss"
WHEN validating URL format
THEN validation fails with "URL must start with http:// or https://"
```

#### Scenario: Timeout long-running fetches

```
GIVEN URL "https://slow.example.com/feed.rss" takes >30 seconds to respond
WHEN attempting to fetch feed
THEN request times out after 30 seconds
AND returns error "Feed fetch timed out"
```

### Requirement: Immediate Feed Refresh on Addition

**ID:** `feed-addition-immediate-refresh`

When a new feed is added, the system SHALL set nextCheckAt to the current time to trigger an immediate refresh, populating initial entries.

#### Scenario: Trigger immediate refresh

```
GIVEN current time is 2026-01-17T14:00:00Z
WHEN adding new feed via POST /api/feeds
THEN created feed has nextCheckAt <= 2026-01-17T14:00:00Z
AND next refresh cycle will fetch this feed immediately
```

#### Scenario: Initial entries appear after refresh

```
GIVEN new feed is added with URL "https://example.com/feed.rss"
AND refresh cycle runs within 15 minutes
WHEN user views feed in UI
THEN entries from feed are displayed
AND unread counter shows count of new entries
```
