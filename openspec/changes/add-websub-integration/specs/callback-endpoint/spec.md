# Capability: Callback Endpoint

Implements the WebSub subscriber callback endpoint at `/api/websub/callback` to handle hub verification challenges (GET) and content push notifications (POST) with HMAC signature verification.

## ADDED Requirements

### Requirement: Handle Hub Verification Challenges

**ID:** `callback-verification`

The endpoint SHALL respond to GET requests from hubs to verify subscription intent by returning the challenge parameter.

#### Scenario: Subscribe verification challenge

```
GIVEN subscription pending verification
WHEN hub sends GET /api/websub/callback?hub.mode=subscribe&hub.topic=https://example.com/feed.xml&hub.challenge=random123&hub.lease_seconds=864000
THEN finds subscription by topicUrl
AND updates leaseSeconds to 864000
AND calculates expiresAt = current time + 864000 seconds
AND sets isActive = true
AND clears errorCount and lastError
AND returns status 200 with body "random123"
```

#### Scenario: Unsubscribe verification challenge

```
GIVEN active subscription for topic
WHEN hub sends GET /api/websub/callback?hub.mode=unsubscribe&hub.topic=https://example.com/feed.xml&hub.challenge=xyz789
THEN finds subscription
AND sets isActive = false
AND returns status 200 with body "xyz789"
```

#### Scenario: Missing required parameters

```
GIVEN verification request without hub.challenge
WHEN GET /api/websub/callback?hub.mode=subscribe&hub.topic=https://example.com/feed.xml
THEN returns status 400
AND response body contains {"error": "Missing parameters"}
```

#### Scenario: Unknown topic in verification

```
GIVEN verification for non-existent subscription
WHEN GET /api/websub/callback?hub.mode=subscribe&hub.topic=https://unknown.com/feed.xml&hub.challenge=test
THEN returns status 404
AND response body contains {"error": "Unknown topic"}
```

### Requirement: Verify HMAC-SHA256 Signatures

**ID:** `callback-signature-verification`

The endpoint SHALL verify X-Hub-Signature headers using timing-safe comparison to prevent forgery and timing attacks.

#### Scenario: Valid signature verification

```
GIVEN active subscription with secret "abc123..."
AND hub POSTs content with X-Hub-Signature: sha256=<computed_hmac>
WHEN POST /api/websub/callback is received
THEN computes HMAC-SHA256 of body using subscription.secret
AND compares using crypto.timingSafeEqual()
AND signatures match
AND processes content
AND returns status 204
```

#### Scenario: Invalid signature rejection

```
GIVEN active subscription
AND hub POSTs content with incorrect X-Hub-Signature
WHEN signature verification runs
THEN timingSafeEqual returns false
AND returns status 403
AND response body contains {"error": "Invalid signature"}
AND does not store entries
AND logs error with feedId and topic
```

#### Scenario: Unsupported signature algorithm

```
GIVEN POST request with X-Hub-Signature: sha1=abc123
WHEN signature algorithm is checked
THEN returns status 400
AND response body contains {"error": "Unsupported algorithm"}
```

### Requirement: Process Content Push Notifications

**ID:** `callback-content-delivery`

The endpoint SHALL parse and store new feed entries from hub POST requests after signature verification.

#### Scenario: Successful content delivery

```
GIVEN active subscription for feed
AND hub POSTs valid XML with correct signature
WHEN POST /api/websub/callback is received
THEN reads body as text
AND verifies signature
AND extracts topic from XML <link rel="self" href="..."/>
AND finds subscription by topicUrl
AND calls parseAndStoreFeed(feedId, xmlBody)
AND new entries stored in database
AND returns status 204 No Content
```

#### Scenario: Content push for unknown topic

```
GIVEN hub POSTs content for non-existent subscription
WHEN topic extracted from XML not found in database
THEN returns status 404
AND response body contains {"error": "No active subscription"}
AND does not store entries
```

#### Scenario: Content push for inactive subscription

```
GIVEN subscription with isActive=false
WHEN hub POSTs content
THEN finds subscription but sees isActive=false
AND returns status 404
AND treats as non-existent
```

#### Scenario: Malformed XML in push

```
GIVEN hub POSTs invalid XML
WHEN parseAndStoreFeed() fails
THEN catches parse error
AND returns status 400
AND response body contains {"error": "Invalid XML"}
AND logs error for debugging
AND does not crash server
```

### Requirement: Atomic Database Updates

**ID:** `callback-atomic-updates`

Entry storage from push notifications SHALL use atomic database operations to prevent partial updates.

#### Scenario: Duplicate entry handling

```
GIVEN hub re-sends content for already-stored entry
AND entry GUID matches existing entry in database
WHEN parseAndStoreFeed() processes the content
THEN uses upsert logic (existing mechanism)
AND entry not duplicated
AND returns status 204
AND no errors logged
```
