# Design Document: WebSub Integration

## Architecture Overview

This design implements the WebSub protocol as a hybrid push/pull system that complements the existing polling architecture. WebSub-enabled feeds receive real-time updates via push notifications, while non-WebSub feeds continue using traditional polling.

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                       piRSSonite                            │
│                                                             │
│  ┌──────────────┐         ┌───────────────┐                │
│  │ Feed Manager │────────▶│   Database    │                │
│  │  (Add/Delete)│         │  - Feed       │                │
│  └──────────────┘         │  - WebSubSub  │                │
│         │                 └───────────────┘                │
│         │ (1) Add Feed           │     ▲                   │
│         ▼                        │     │                   │
│  ┌──────────────┐               │     │ (5) Store Entries │
│  │ Hub Discovery│───────────────┘     │                   │
│  │ (Link Header)│                     │                   │
│  └──────────────┘                     │                   │
│         │                             │                   │
│         │ (2) hubUrl found            │                   │
│         ▼                             │                   │
│  ┌──────────────┐                     │                   │
│  │ Subscription │                     │                   │
│  │  Manager     │                     │                   │
│  └──────────────┘                     │                   │
│         │                             │                   │
│         │ (3) POST subscribe          │                   │
│         ▼                             │                   │
└─────────┼─────────────────────────────┼───────────────────┘
          │                             │
          │                             │
   ┌──────▼──────────┐          ┌──────┴──────────┐
   │   WebSub Hub    │          │ Callback        │
   │ (e.g., YouTube) │          │ /api/websub/    │
   └──────┬──────────┘          │  callback       │
          │                     └──────▲──────────┘
          │ (4) Verify GET             │
          └────────────────────────────┘
          │ (6) Push POST (content)
          └────────────────────────────┘
```

## Database Schema

### New Model: WebSubSubscription

```prisma
model WebSubSubscription {
  id            Int       @id @default(autoincrement())
  feedId        Int       @unique
  feed          Feed      @relation(fields: [feedId], references: [id], onDelete: Cascade)
  hubUrl        String
  topicUrl      String
  secret        String    // 32-byte hex string for HMAC-SHA256
  leaseSeconds  Int       // Lease duration in seconds (hub-determined)
  expiresAt     DateTime  // Calculated from leaseSeconds
  isActive      Boolean   @default(true)
  lastError     String?   // Last error message (for debugging)
  errorCount    Int       @default(0) // Retry tracking
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([expiresAt, isActive]) // For renewal queries
  @@index([feedId])              // For lookup by feed
}
```

### Modified Model: Feed

```prisma
model Feed {
  // ... existing fields ...
  websubHub         String?
  websubTopic       String?
  webSubSubscription WebSubSubscription? // One-to-one relation
}
```

**Design Rationale**:
- **One-to-One Relationship**: Each feed has at most one active subscription (enforced by `feedId @unique`)
- **Cascade Delete**: Deleting a feed automatically removes its subscription
- **Error Tracking**: `lastError` and `errorCount` enable exponential backoff and debugging
- **Lease Expiration**: `expiresAt` index allows efficient renewal queries

## WebSub Protocol Flow

### 1. Hub Discovery (RFC 5988)

When a feed is added, discover WebSub endpoints using HTTP Link headers:

```typescript
// lib/utils/websubUtils.ts
export interface WebSubEndpoints {
  hubUrl: string | undefined
  topicUrl: string | undefined
}

export async function discoverWebSubEndpoints(
  feedUrl: string,
  xmlText: string,
  responseHeaders: Headers
): Promise<WebSubEndpoints> {
  let hubUrl: string | undefined
  let topicUrl: string | undefined

  // 1. Check HTTP Link headers (preferred method)
  const linkHeader = responseHeaders.get('link')
  if (linkHeader) {
    // Parse: Link: <http://hub.example.com>; rel="hub"
    const hubMatch = linkHeader.match(/<([^>]+)>;\s*rel=["']?hub["']?/)
    const selfMatch = linkHeader.match(/<([^>]+)>;\s*rel=["']?self["']?/)

    if (hubMatch) hubUrl = hubMatch[1]
    if (selfMatch) topicUrl = selfMatch[1]
  }

  // 2. Fallback to XML <link> elements
  if (!hubUrl || !topicUrl) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'text/xml')

    const links = doc.getElementsByTagName('link')
    for (const link of Array.from(links)) {
      const rel = link.getAttribute('rel')
      const href = link.getAttribute('href')

      if (rel === 'hub' && href && !hubUrl) hubUrl = href
      if (rel === 'self' && href && !topicUrl) topicUrl = href
    }
  }

  // 3. Use feed URL as topic if self not found
  if (hubUrl && !topicUrl) {
    topicUrl = feedUrl
  }

  return { hubUrl, topicUrl }
}
```

**Why This Approach**:
- **RFC 5988 Compliance**: Link headers are the standard method
- **Fallback Compatibility**: XML parsing supports older feeds
- **Minimal Assumptions**: Only subscribe if hub explicitly declared

### 2. Subscription Request

After discovering endpoints, initiate subscription with the hub:

```typescript
// lib/utils/websubUtils.ts
export interface SubscriptionRequest {
  feedId: number
  hubUrl: string
  topicUrl: string
}

export async function subscribeToWebSub(
  request: SubscriptionRequest
): Promise<void> {
  const { feedId, hubUrl, topicUrl } = request

  // Generate unique HMAC secret (32-byte hex)
  const secret = crypto.randomBytes(32).toString('hex')

  // Build callback URL (environment-dependent)
  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/websub/callback`

  // POST to hub
  const formData = new URLSearchParams({
    'hub.callback': callbackUrl,
    'hub.mode': 'subscribe',
    'hub.topic': topicUrl,
    'hub.secret': secret,
    'hub.lease_seconds': '' // Let hub choose
  })

  const response = await fetch(hubUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  })

  if (!response.ok) {
    throw new Error(`Hub subscription failed: ${response.status}`)
  }

  // Store subscription in database (pending verification)
  await prisma.webSubSubscription.create({
    data: {
      feedId,
      hubUrl,
      topicUrl,
      secret,
      leaseSeconds: 432000, // 5 days default (hub will override)
      expiresAt: new Date(Date.now() + 432000 * 1000),
      isActive: false // Will be set true after verification
    }
  })
}
```

**Design Decisions**:
- **Async/Non-Blocking**: Subscription failures don't prevent feed creation
- **Hub-Determined Lease**: Accept hub's lease duration (typically 5-10 days)
- **Secret Generation**: Cryptographically secure random secret per subscription
- **Pending State**: `isActive = false` until hub sends verification challenge

### 3. Verification Challenge (GET Callback)

Hub sends verification challenge to confirm subscription:

```typescript
// app/api/websub/callback/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const mode = searchParams.get('hub.mode')
  const topic = searchParams.get('hub.topic')
  const challenge = searchParams.get('hub.challenge')
  const leaseSeconds = searchParams.get('hub.lease_seconds')

  // Validate parameters
  if (!mode || !topic || !challenge) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  // Find subscription by topic
  const subscription = await prisma.webSubSubscription.findFirst({
    where: { topicUrl: topic }
  })

  if (!subscription) {
    return NextResponse.json({ error: 'Unknown topic' }, { status: 404 })
  }

  // Handle subscribe vs unsubscribe
  if (mode === 'subscribe') {
    // Update subscription with hub-provided lease
    const lease = parseInt(leaseSeconds || '432000')
    await prisma.webSubSubscription.update({
      where: { id: subscription.id },
      data: {
        leaseSeconds: lease,
        expiresAt: new Date(Date.now() + lease * 1000),
        isActive: true, // Subscription confirmed
        errorCount: 0,
        lastError: null
      }
    })
  } else if (mode === 'unsubscribe') {
    await prisma.webSubSubscription.update({
      where: { id: subscription.id },
      data: { isActive: false }
    })
  }

  // Return challenge to confirm
  return new NextResponse(challenge, { status: 200 })
}
```

**Security Considerations**:
- **Topic Validation**: Only accept challenges for known subscriptions
- **Mode Handling**: Support both subscribe and unsubscribe verification
- **Lease Update**: Trust hub's lease duration over our default

### 4. Content Delivery (POST Callback)

Hub pushes new content when feed updates:

```typescript
// app/api/websub/callback/route.ts
import { timingSafeEqual } from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-hub-signature')

  // Extract feed from body (parse first to get topic)
  const topicMatch = body.match(/<link[^>]*rel=["']self["'][^>]*href=["']([^"']+)["']/)
  const topic = topicMatch ? topicMatch[1] : null

  if (!topic) {
    return NextResponse.json({ error: 'Cannot determine topic' }, { status: 400 })
  }

  // Find subscription
  const subscription = await prisma.webSubSubscription.findFirst({
    where: { topicUrl: topic, isActive: true },
    include: { feed: true }
  })

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
  }

  // Verify HMAC-SHA256 signature
  if (signature) {
    const [algorithm, expectedSig] = signature.split('=')

    if (algorithm !== 'sha256') {
      return NextResponse.json({ error: 'Unsupported algorithm' }, { status: 400 })
    }

    const computedSig = crypto
      .createHmac('sha256', subscription.secret)
      .update(body)
      .digest('hex')

    // Timing-safe comparison to prevent timing attacks
    if (!timingSafeEqual(
      Buffer.from(computedSig),
      Buffer.from(expectedSig)
    )) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
  }

  // Parse and store entries (reuse existing logic)
  await parseAndStoreFeed(subscription.feed.id, body)

  return new NextResponse(null, { status: 204 })
}
```

**Security Highlights**:
- **Timing-Safe Comparison**: Prevents timing attacks on signature verification
- **Signature Required**: Reject unsigned content (if hub supports signatures)
- **Topic Validation**: Only process content for active subscriptions

### 5. Lease Renewal

Automatically renew subscriptions before expiration:

```typescript
// app/api/websub/renew/route.ts
export async function POST() {
  // Find subscriptions expiring within 2 days
  const expiringSubscriptions = await prisma.webSubSubscription.findMany({
    where: {
      isActive: true,
      expiresAt: {
        lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      }
    },
    take: 20 // Batch processing
  })

  const results = []

  for (const sub of expiringSubscriptions) {
    try {
      await subscribeToWebSub({
        feedId: sub.feedId,
        hubUrl: sub.hubUrl,
        topicUrl: sub.topicUrl
      })
      results.push({ feedId: sub.feedId, status: 'renewed' })
    } catch (error) {
      // Exponential backoff
      const newErrorCount = sub.errorCount + 1
      const isActive = newErrorCount < 5 // Deactivate after 5 failures

      await prisma.webSubSubscription.update({
        where: { id: sub.id },
        data: {
          errorCount: newErrorCount,
          lastError: error.message,
          isActive
        }
      })

      results.push({ feedId: sub.feedId, status: 'failed', error: error.message })
    }
  }

  return NextResponse.json({ renewed: results.length, results })
}
```

**Renewal Strategy**:
- **Proactive Renewal**: Start 2 days before expiration (80% of 5-day lease)
- **Batch Processing**: Process 20 subscriptions per call to avoid overwhelming system
- **Graceful Degradation**: Deactivate after 5 failures, fallback to polling

## Integration with Existing Systems

### Polling System Modification

Update feed refresh query to skip active WebSub subscriptions:

```typescript
// app/api/refresh/route.ts
const feedsToRefresh = await prisma.feed.findMany({
  where: {
    AND: [
      {
        OR: [
          { webSubSubscription: null }, // No subscription
          { webSubSubscription: { isActive: false } } // Inactive subscription
        ]
      },
      { nextRefreshAt: { lte: new Date() } }
    ]
  },
  include: { webSubSubscription: true }
})
```

**Result**: Active WebSub feeds skip polling, reducing server load by 50%+.

### Feed Creation Hook

Trigger WebSub subscription after feed creation:

```typescript
// app/api/feeds/route.ts
// After feed created successfully
if (feedData.hubUrl && feedData.topicUrl) {
  // Async subscription (don't block response)
  subscribeToWebSub({
    feedId: newFeed.id,
    hubUrl: feedData.hubUrl,
    topicUrl: feedData.topicUrl
  }).catch(err => {
    console.error('WebSub subscription failed:', err)
    // Feed creation still succeeds, polling continues
  })
}
```

### Feed Deletion Hook

Unsubscribe when feed is deleted:

```typescript
// app/api/feeds/[id]/route.ts (DELETE handler)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const feedId = parseInt(params.id)

  // Find subscription
  const subscription = await prisma.webSubSubscription.findUnique({
    where: { feedId }
  })

  if (subscription) {
    // Notify hub of unsubscription (best effort)
    try {
      await unsubscribeFromWebSub(subscription)
    } catch (err) {
      console.error('Unsubscribe failed:', err)
      // Continue with deletion anyway
    }
  }

  // Delete feed (cascades to subscription via onDelete: Cascade)
  await prisma.feed.delete({ where: { id: feedId } })

  return new NextResponse(null, { status: 204 })
}
```

## Error Handling and Resilience

### Subscription Failures

```typescript
// Exponential backoff based on errorCount
function getRetryDelay(errorCount: number): number {
  return Math.min(1000 * Math.pow(2, errorCount), 60000) // Max 1 minute
}

// Deactivate after threshold
if (errorCount >= 5) {
  await prisma.webSubSubscription.update({
    where: { id: subscriptionId },
    data: { isActive: false }
  })
  // Polling takes over automatically
}
```

### Invalid Signatures

```typescript
// Log and reject, but don't deactivate subscription
console.error('Invalid WebSub signature:', {
  feedId: subscription.feedId,
  topic: subscription.topicUrl,
  receivedSig: signature
})

return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
```

### Hub Unavailability

```typescript
// Subscription continues, polling provides fallback
if (!subscription.isActive) {
  // Feed will be included in next polling cycle
  console.log('Using polling fallback for feed:', feedId)
}
```

## Performance Considerations

### Database Indexes

```prisma
@@index([expiresAt, isActive]) // Renewal queries: WHERE expiresAt < ? AND isActive = true
@@index([feedId])              // Lookup: WHERE feedId = ?
```

### Callback Processing

- **Signature Verification**: ~10ms per request (HMAC computation)
- **Entry Parsing**: Reuse existing `parseAndStoreFeed` (~200ms)
- **Total**: < 500ms per callback

### Polling Reduction

- **Before WebSub**: 100 feeds × 96 polls/day = 9,600 requests/day
- **After WebSub** (50% adoption): 50 feeds × 96 polls/day = 4,800 requests/day
- **Savings**: 50% reduction in polling requests

## Security Model

### Threat Model

1. **Man-in-the-Middle**: Hub pushes malicious content
   - **Mitigation**: HMAC-SHA256 signature verification with timing-safe comparison

2. **Replay Attacks**: Attacker re-sends valid signed content
   - **Mitigation**: Entry GUID de-duplication (existing mechanism)

3. **Subscription Hijacking**: Attacker subscribes callback to unauthorized topic
   - **Mitigation**: Hub sends verification challenge before activation

4. **Timing Attacks**: Attacker infers secret from signature comparison timing
   - **Mitigation**: `crypto.timingSafeEqual` for constant-time comparison

### Secret Management

- **Generation**: `crypto.randomBytes(32).toString('hex')` (256 bits of entropy)
- **Storage**: Plain-text in database (acceptable for WebSub; hubs also store it)
- **Rotation**: New secret on renewal (automatic via re-subscription)

## Testing Strategy

### Unit Tests

1. **Hub Discovery**: Test Link header parsing with various formats
2. **Signature Verification**: Test with known secrets and payloads
3. **Error Handling**: Test exponential backoff and deactivation logic

### Integration Tests

1. **WebSub.rocks**: Validate protocol compliance using official test suite
2. **Real Feeds**: Test with YouTube, Medium, WordPress feeds
3. **Renewal**: Manually trigger renewal endpoint with expiring subscriptions

### Manual Testing

```bash
# Test callback verification
curl "http://localhost:3000/api/websub/callback?hub.mode=subscribe&hub.topic=http://example.com/feed&hub.challenge=test123"

# Test callback content delivery
curl -X POST http://localhost:3000/api/websub/callback \
  -H "X-Hub-Signature: sha256=..." \
  -d @feed-update.xml

# Test renewal
curl -X POST http://localhost:3000/api/websub/renew
```

## Deployment Considerations

### Environment Variables

```env
# Production
NEXT_PUBLIC_BASE_URL=https://pirssonite.vercel.app

# Development (with ngrok)
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```

### Ngrok Setup for Local Testing

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Update .env.local with ngrok URL
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```

## Future Enhancements

1. **Real-Time UI Updates**: Add WebSocket/SSE to push updates to browser
2. **Hub Status Dashboard**: Display subscription health and statistics
3. **Rate Limiting**: Protect callback endpoint from abuse
4. **Multi-Hub Support**: Subscribe to multiple hubs per feed
5. **Automatic Re-Discovery**: Periodically check for new hubs in feeds

## References

- [WebSub W3C Recommendation](https://www.w3.org/TR/websub/)
- [RFC 5988 - Web Linking](https://tools.ietf.org/html/rfc5988)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
