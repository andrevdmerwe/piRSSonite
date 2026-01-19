# Capability: Subscription Management

Manages the full lifecycle of WebSub subscriptions including subscribe, verify, unsubscribe, and error handling with exponential backoff.

## ADDED Requirements

### Requirement: Subscribe to WebSub Hub

**ID:** `subscription-subscribe`

The system SHALL send subscription requests to WebSub hubs using application/x-www-form-urlencoded POST requests with callback URL, topic, and cryptographic secret.

#### Scenario: Successfully subscribe to hub

```
GIVEN feed with hubUrl = "https://pubsubhubbub.appspot.com/"
AND topicUrl = "https://example.com/feed.xml"
WHEN subscribeToWebSub({ feedId: 1, hubUrl, topicUrl }) is called
THEN POST request sent to hub with form data
AND form includes hub.callback, hub.mode=subscribe, hub.topic, hub.secret
AND secret is 64-character hex string (32 bytes random)
AND WebSubSubscription record created with isActive=false (pending verification)
AND response status is 2xx
```

#### Scenario: Handle hub error during subscription

```
GIVEN subscription request to hub
AND hub returns 500 Internal Server Error
WHEN subscribeToWebSub() executes
THEN throws error with message "Hub subscription failed: 500"
AND no WebSubSubscription record created
AND error logged but feed creation continues
```

### Requirement: Store Subscription in Database

**ID:** `subscription-database`

The system SHALL create a WebSubSubscription record after sending subscription request, storing hub URL, topic URL, secret, and lease information.

#### Scenario: Create subscription record

```
GIVEN successful hub subscription request
WHEN database record is created
THEN includes feedId, hubUrl, topicUrl, secret (64-char hex)
AND isActive = false (pending verification)
AND leaseSeconds = 432000 (5 days default)
AND expiresAt = current time + leaseSeconds
AND errorCount = 0, lastError = null
```

### Requirement: Non-Blocking Feed Creation

**ID:** `subscription-non-blocking`

Feed creation SHALL NOT block on subscription completion. Subscription failures SHALL NOT prevent feed from being created.

#### Scenario: Feed creation with subscription failure

```
GIVEN user adds feed via POST /api/feeds
AND feed has WebSub support (hubUrl present)
AND hub subscription fails (network error)
WHEN feed creation completes
THEN feed created successfully (status 201)
AND feed returned to user
AND feed appears in sidebar
AND polling continues normally
AND error logged: "WebSub subscription failed for feed 1: network timeout"
```

### Requirement: Unsubscribe on Feed Deletion

**ID:** `subscription-unsubscribe`

The system SHALL send unsubscribe requests to hubs when feeds are deleted to clean up resources.

#### Scenario: Unsubscribe when deleting feed

```
GIVEN feed with active WebSub subscription
WHEN DELETE /api/feeds/1 is called
THEN finds WebSubSubscription for feedId=1
AND POSTs to hub with hub.mode=unsubscribe
AND deletes feed (cascade deletes subscription)
AND returns 204 No Content
```

#### Scenario: Handle unsubscribe failure gracefully

```
GIVEN feed deletion with subscription
AND hub is unavailable (network error)
WHEN unsubscribe attempt fails
THEN error logged but not thrown
AND feed deletion continues
AND returns 204 No Content
```

### Requirement: Handle Errors with Exponential Backoff

**ID:** `subscription-error-handling`

The system SHALL track subscription failures, implement exponential backoff, and deactivate subscriptions after repeated failures.

#### Scenario: Track subscription failures

```
GIVEN subscription attempt fails due to network timeout
WHEN error is caught
THEN errorCount incremented
AND lastError = "Network timeout"
AND subscription remains in database for retry
```

#### Scenario: Deactivate after 5 failures

```
GIVEN subscription with errorCount=4
WHEN 5th consecutive failure occurs
THEN errorCount = 5
AND isActive = false
AND feed included in polling query
AND no further renewal attempts
```

### Requirement: Generate Cryptographic Secrets

**ID:** `subscription-secrets`

Subscription secrets used for HMAC verification SHALL be cryptographically random and unique per subscription.

#### Scenario: Generate secure secret

```
GIVEN new subscription being created
WHEN secret is generated
THEN uses crypto.randomBytes(32) for generation
AND encoded as hex string (64 characters)
AND secret is unique per subscription
AND stored in database for signature verification
```
