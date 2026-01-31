# Capability: Lease Renewal

Automatically renews expiring WebSub subscriptions before they expire to maintain continuous push notification delivery and prevent fallback to polling.

## ADDED Requirements

### Requirement: Identify Expiring Subscriptions

**ID:** `renewal-query`

The system SHALL query for active subscriptions expiring within 2 days to allow sufficient time for renewal processing.

#### Scenario: Find subscriptions expiring soon

```
GIVEN 3 subscriptions: A expires in 1 day, B expires in 3 days, C expires in 1 hour
AND renewal threshold is 2 days
WHEN renewal endpoint queries database
THEN returns subscriptions A and C (expiring <= 2 days)
AND excludes subscription B (expires > 2 days)
AND orders by expiresAt ascending (C first, then A)
AND limits to 20 subscriptions per query
```

### Requirement: Renew Subscriptions Proactively

**ID:** `renewal-resubscribe`

The system SHALL re-subscribe to hubs before leases expire by calling the subscription function with existing hub and topic URLs.

#### Scenario: Successful renewal

```
GIVEN subscription expiring in 1 day
WHEN POST /api/websub/renew is called
THEN calls subscribeToWebSub() with existing hubUrl and topicUrl
AND generates new secret
AND hub sends verification challenge
AND subscription updated with new lease (e.g., 10 days)
AND expiresAt = current time + new lease
AND errorCount reset to 0
AND lastError cleared
AND returns {status: "renewed", feedId: 1, newExpiresAt: "..."}
```

#### Scenario: Hub unavailable during renewal

```
GIVEN subscription expiring tomorrow
AND hub is unreachable (network error)
WHEN renewal attempted
THEN subscribeToWebSub() throws network error
AND errorCount incremented to 1
AND lastError = "Hub unreachable: ECONNREFUSED"
AND isActive remains true (for retry)
AND returns {status: "failed", feedId: 1, error: "Hub unreachable", errorCount: 1}
```

### Requirement: Handle Renewal Failures

**ID:** `renewal-error-handling`

The system SHALL track renewal failures, deactivate subscriptions after repeated failures, and allow feeds to fall back to polling.

#### Scenario: Deactivate after 5 failures

```
GIVEN subscription with errorCount=4
AND renewal attempt fails
WHEN 5th failure occurs
THEN errorCount = 5
AND isActive = false
AND lastError updated with error message
AND feed included in next polling cycle (automatic fallback)
AND no further renewal attempts
```

#### Scenario: Recovery after previous failures

```
GIVEN subscription with errorCount=2
WHEN renewal succeeds
THEN errorCount reset to 0
AND lastError = null
AND new lease applied
AND isActive remains true
```

### Requirement: Batch Processing

**ID:** `renewal-batch`

The renewal endpoint SHALL process subscriptions in batches of 20 to avoid overwhelming the system and hubs.

#### Scenario: Process batch of expiring subscriptions

```
GIVEN 25 subscriptions expiring within 2 days
WHEN POST /api/websub/renew called once
THEN processes first 20 subscriptions (batch limit)
AND returns 20 results
AND remaining 5 available for next call
```

#### Scenario: No expiring subscriptions

```
GIVEN all subscriptions have expiresAt > 2 days from now
WHEN renewal endpoint called
THEN query returns empty array
AND no renewal attempts made
AND returns {renewed: 0, failed: 0, results: []}
```

### Requirement: Manual Trigger Endpoint

**ID:** `renewal-endpoint`

The system SHALL provide a POST endpoint at /api/websub/renew to manually trigger the renewal process.

#### Scenario: Trigger renewal endpoint

```
GIVEN expiring subscriptions exist
WHEN POST /api/websub/renew is called
THEN processes up to 20 subscriptions
AND returns JSON summary: {renewed: <count>, failed: <count>, results: [...]}
AND each result includes {feedId, status, error?, errorCount?, newExpiresAt?}
```

#### Scenario: Renewal endpoint with mixed results

```
GIVEN 5 subscriptions expiring: 3 succeed, 2 fail
WHEN renewal processes all 5
THEN returns {renewed: 3, failed: 2, results: [5 items]}
AND results include success and failure details
```
