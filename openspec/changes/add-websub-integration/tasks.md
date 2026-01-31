# Implementation Tasks: WebSub Integration

## Task Overview

Total estimated effort: **~14.5 hours**

Tasks are ordered to deliver incremental, testable value:
1. Database schema first (foundation for all features)
2. Hub discovery (proper endpoint detection)
3. Core WebSub utilities (subscribe, verify, unsubscribe)
4. Callback endpoint (receive push notifications)
5. Integration hooks (feed creation/deletion)
6. Lease renewal (maintain subscriptions)
7. Polling optimization (skip active subscriptions)
8. Testing and validation

## Tasks

### Database & Schema (30 mins)

**Task 1: Add WebSubSubscription Model to Prisma Schema** (~30 mins)
- **File:** `prisma/schema.prisma`
- **Work:**
  - Add `WebSubSubscription` model with all fields (id, feedId, hubUrl, topicUrl, secret, leaseSeconds, expiresAt, isActive, lastError, errorCount, timestamps)
  - Add one-to-one relation to Feed model (`webSubSubscription WebSubSubscription?`)
  - Add indexes: `@@index([expiresAt, isActive])` and `@@index([feedId])`
  - Run `npx prisma migrate dev --name add-websub-subscription` to create migration
  - Run `npx prisma generate` to update Prisma client
- **Validation:** `npx prisma studio` → Verify WebSubSubscription table exists
- **Acceptance:** Migration runs successfully, schema updated, no errors

### Hub Discovery (2 hours)

**Task 2: Implement RFC 5988 Link Header Parsing** (~2 hours)
- **File:** `lib/utils/websubUtils.ts` (NEW)
- **Work:**
  - Create `WebSubEndpoints` interface (hubUrl, topicUrl)
  - Implement `discoverWebSubEndpoints(feedUrl, xmlText, responseHeaders)` function
  - Parse HTTP Link headers for `rel="hub"` and `rel="self"` using regex
  - Fallback to XML `<link>` element parsing using DOMParser
  - Handle multiple Link headers (use first hub found)
  - Use feedUrl as topicUrl if `rel="self"` not found
  - Add unit tests for:
    - Link header with hub and self
    - Link header with only hub (uses feedUrl as topic)
    - XML fallback (no Link header)
    - Feed with no WebSub support (returns undefined)
- **Validation:** Unit tests pass, test with sample feeds (YouTube, Medium)
- **Acceptance:** Correctly extracts hub/topic from various feed formats

**Task 3: Update Feed Refresh to Use Proper Hub Discovery** (~30 mins)
- **File:** `lib/utils/refreshUtils.ts`
- **Work:**
  - Import `discoverWebSubEndpoints` from websubUtils
  - Replace naive hub detection (line 50: `feed.link.includes('hub')`) with proper discovery
  - Pass `response.headers` to discovery function
  - Update return type to include hubUrl/topicUrl from discovery
- **Validation:** Add feed → Check database for correct websubHub/websubTopic
- **Acceptance:** Hub URLs accurately extracted and stored in database

### WebSub Core Utilities (3 hours)

**Task 4: Implement Subscription Functions** (~1.5 hours)
- **File:** `lib/utils/websubUtils.ts`
- **Work:**
  - Implement `generateSecret()` → `crypto.randomBytes(32).toString('hex')`
  - Implement `subscribeToWebSub({ feedId, hubUrl, topicUrl })`
    - Generate secret
    - Build callback URL from `process.env.NEXT_PUBLIC_BASE_URL`
    - POST to hub with form data (hub.callback, hub.mode=subscribe, hub.topic, hub.secret)
    - Create WebSubSubscription record (isActive=false, pending verification)
  - Add error handling and timeout (10 second fetch timeout)
- **Validation:** `curl -X POST` → Verify subscription record created in database
- **Acceptance:** Subscription request sent to hub, record created

**Task 5: Implement Unsubscription Function** (~30 mins)
- **File:** `lib/utils/websubUtils.ts`
- **Work:**
  - Implement `unsubscribeFromWebSub(subscription)`
    - POST to hub with hub.mode=unsubscribe
    - Delete WebSubSubscription record
  - Handle errors gracefully (log but don't throw)
- **Validation:** Unsubscribe → Verify hub receives request, record deleted
- **Acceptance:** Unsubscription sent to hub, database cleaned up

**Task 6: Implement Signature Verification** (~1 hour)
- **File:** `lib/utils/websubUtils.ts`
- **Work:**
  - Import `createHmac` and `timingSafeEqual` from 'crypto'
  - Implement `verifySignature(body: string, signature: string, secret: string): boolean`
    - Extract algorithm and expected hash from signature (format: "sha256=abc123")
    - Compute HMAC-SHA256 of body using secret
    - Use `timingSafeEqual` to compare buffers (prevent timing attacks)
  - Add unit tests with known secrets and payloads
- **Validation:** Unit tests pass with valid/invalid signatures
- **Acceptance:** Signature verification working with timing-safe comparison

### Callback Endpoint (4 hours)

**Task 7: Implement Callback Verification Handler (GET)** (~1.5 hours)
- **File:** `app/api/websub/callback/route.ts` (NEW)
- **Work:**
  - Create GET handler for hub verification challenges
  - Extract query params: hub.mode, hub.topic, hub.challenge, hub.lease_seconds
  - Validate required parameters present
  - Find subscription by topicUrl
  - Return 404 if subscription not found
  - For hub.mode=subscribe:
    - Update subscription with leaseSeconds, expiresAt, set isActive=true, clear errors
  - For hub.mode=unsubscribe:
    - Set isActive=false
  - Return hub.challenge as plain text response (status 200)
- **Validation:** `curl GET` with challenge → Returns challenge, database updated
- **Acceptance:** Verification challenges handled correctly, subscription activated

**Task 8: Implement Callback Content Delivery Handler (POST)** (~2.5 hours)
- **File:** `app/api/websub/callback/route.ts`
- **Work:**
  - Create POST handler for content push notifications
  - Read request body as text
  - Extract X-Hub-Signature header
  - Parse XML to extract topic URL (from `<link rel="self">`)
  - Find active subscription by topicUrl (include feed relation)
  - Return 404 if no active subscription found
  - Verify signature using `verifySignature()` function
  - Return 403 if signature invalid
  - Call `parseAndStoreFeed(feed.id, body)` to store new entries
  - Return 204 No Content on success
  - Add error handling and logging
- **Validation:** Simulate hub POST with signature → Entries stored, 204 returned
- **Acceptance:** Content delivery works, signatures verified, entries stored

### Integration Hooks (2 hours)

**Task 9: Add Subscription Hook to Feed Creation** (~1 hour)
- **File:** `app/api/feeds/route.ts`
- **Work:**
  - After feed created successfully (POST handler)
  - Check if `feedData.hubUrl && feedData.topicUrl` exist
  - Call `subscribeToWebSub({ feedId: newFeed.id, hubUrl, topicUrl })` asynchronously
  - Use `.catch()` to log errors without blocking response
  - Ensure feed creation succeeds even if subscription fails
- **Validation:** Add feed with WebSub → Subscription created in background
- **Acceptance:** Feed creation non-blocking, subscription attempted

**Task 10: Add Unsubscription Hook to Feed Deletion** (~30 mins)
- **File:** `app/api/feeds/[id]/route.ts`
- **Work:**
  - In DELETE handler, before deleting feed
  - Find WebSubSubscription by feedId
  - If subscription exists, call `unsubscribeFromWebSub(subscription)`
  - Use try/catch to handle errors gracefully
  - Delete feed (cascade deletes subscription via schema)
  - Return 204 No Content
- **Validation:** Delete feed → Hub receives unsubscribe, subscription removed
- **Acceptance:** Clean unsubscription on feed deletion

**Task 11: Update Feed Deletion to Handle Folders** (~30 mins)
- **File:** `app/api/feeds/[id]/route.ts`, `app/api/folders/[id]/route.ts`
- **Work:**
  - Ensure folder deletion handles WebSub subscriptions for child feeds
  - Test cascade deletion works correctly
  - Verify no orphaned subscriptions remain
- **Validation:** Delete folder with WebSub feeds → All subscriptions cleaned up
- **Acceptance:** No orphaned subscriptions, cascades work correctly

### Lease Renewal (1.5 hours)

**Task 12: Implement Renewal Endpoint** (~1.5 hours)
- **File:** `app/api/websub/renew/route.ts` (NEW)
- **Work:**
  - Create POST handler (no auth required initially)
  - Query subscriptions expiring within 2 days: `WHERE isActive=true AND expiresAt <= (now + 2 days)`
  - Limit to 20 subscriptions (batch processing)
  - For each subscription:
    - Try to call `subscribeToWebSub()` to renew
    - On success: record as renewed
    - On failure: increment errorCount, update lastError
    - If errorCount >= 5: set isActive=false (polling takes over)
  - Return JSON summary: `{ renewed: count, results: [...] }`
- **Validation:** Manually set expiresAt to tomorrow → Call endpoint → Subscriptions renewed
- **Acceptance:** Renewal works, exponential backoff implemented, failures handled

### Polling Optimization (30 mins)

**Task 13: Modify Polling Query to Skip Active WebSub Feeds** (~30 mins)
- **File:** `app/api/refresh/route.ts`
- **Work:**
  - Update feed query to add condition:
    ```typescript
    where: {
      AND: [
        {
          OR: [
            { webSubSubscription: null },
            { webSubSubscription: { isActive: false } }
          ]
        },
        { nextRefreshAt: { lte: new Date() } }
      ]
    }
    ```
  - Include webSubSubscription in query for logging
  - Add logging to show feeds skipped due to active WebSub
- **Validation:** Add WebSub feed → Verify it's excluded from polling
- **Acceptance:** Active WebSub feeds skip polling, polling continues for others

### Testing & Validation (1.5 hours)

**Task 14: Integration Testing with Real Feeds** (~1 hour)
- **Files:** Manual testing
- **Work:**
  - Test with YouTube channel feed (known WebSub support)
  - Test with Medium publication feed
  - Test with WordPress blog (if WebSub plugin enabled)
  - Verify hub discovery finds correct endpoints
  - Verify subscription created and verified
  - Monitor for push notifications (may take time for new content)
  - Test renewal endpoint with near-expiring subscription
  - Test feed deletion → unsubscribe
- **Validation:** End-to-end flow works with real feeds
- **Acceptance:** At least 2 real feeds successfully subscribed and verified

**Task 15: WebSub.rocks Protocol Compliance Testing** (~30 mins)
- **Files:** N/A (external test suite)
- **Work:**
  - Visit https://websub.rocks/
  - Run subscriber tests:
    - Test 100: Subscriber rejects invalid signature
    - Test 101: Subscriber verifies signatures
    - Test 102: Subscriber returns challenge on verification
  - Configure ngrok for local callback URL
  - Fix any compliance issues discovered
- **Validation:** Pass WebSub.rocks test suite
- **Acceptance:** All core subscriber tests pass

## Dependencies

**Sequential:**
- Task 1 must complete before all other tasks (database foundation)
- Task 2-3 (hub discovery) must complete before Task 4 (subscription)
- Task 4-6 (utilities) must complete before Task 7-8 (callback)
- Task 7-8 must complete before Task 9-10 (integration)

**Parallelizable:**
- Task 2-3 can be done in parallel with Task 6 (signature verification)
- Task 4-5 (subscribe/unsubscribe) independent after Task 1
- Task 9-11 (integration hooks) can be done in parallel
- Task 13 (polling) independent of Task 12 (renewal)

## Critical Path

1. Task 1 (Database) → Task 2-3 (Hub Discovery) → Task 4 (Subscribe) → Task 7 (Callback GET) → Task 9 (Feed Creation Hook) → Task 14 (Testing)

This represents the minimum path to deliver basic WebSub functionality (subscribe on feed add, verify subscription).

## Post-Implementation Checklist

- [ ] All 15 tasks completed and tested
- [ ] Database migration applied to production
- [ ] `NEXT_PUBLIC_BASE_URL` environment variable set in Vercel
- [ ] Ngrok or production URL configured for local/staging testing
- [ ] At least 2 real feeds successfully subscribed
- [ ] WebSub.rocks compliance tests passed
- [ ] Monitoring added for subscription errors
- [ ] Documentation updated with WebSub setup instructions

## Known Limitations

1. **Callback URL Accessibility**: Local development requires ngrok or similar tunneling service
2. **No Automatic Renewal Scheduling**: Renewal endpoint must be called manually or via external cron
3. **Single Hub per Feed**: Only first hub discovered is used (future enhancement: multi-hub support)
4. **No Rate Limiting**: Callback endpoint unprotected against abuse (future enhancement)
5. **No UI Feedback**: Users won't see WebSub status in UI (future enhancement: subscription health dashboard)

## Future Enhancements

1. Add cron job or Vercel scheduled function for automatic renewal
2. Display WebSub subscription status in feed management UI
3. Add admin dashboard showing subscription health and statistics
4. Implement rate limiting on callback endpoint
5. Support multiple hubs per feed (redundancy)
6. Add WebSocket/SSE for real-time UI updates when content pushed
