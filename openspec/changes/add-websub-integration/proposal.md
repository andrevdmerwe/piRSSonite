# Proposal: WebSub (PubSubHubbub) Integration

## Why

Currently, piRSSonite relies entirely on 15-minute polling intervals to detect new feed content. This creates latency for users (up to 15 minutes for new articles) and wastes server resources checking feeds that haven't updated. Many popular feeds (YouTube, Medium, WordPress) support WebSub for real-time push notifications, but piRSSonite doesn't utilize this capability despite having database fields for it.

Adding WebSub support will deliver articles to users within seconds of publication for 50%+ of feeds, reduce polling requests by half, and provide a better user experience while decreasing server costs.

## Overview

Add WebSub (formerly PubSubHubbub) protocol support to piRSSonite to enable real-time push notifications for RSS/Atom feeds that support the protocol. This will transform piRSSonite from a polling-only RSS reader into a hybrid system that can receive instant updates when new content is published, significantly reducing latency and server load for supported feeds.

## Problem Statement

Currently, piRSSonite relies entirely on periodic polling (15-minute intervals with exponential backoff) to detect new feed content. This approach has several limitations:

1. **Latency**: Users may wait up to 15 minutes to see new content
2. **Server Load**: Unnecessary polling requests consume bandwidth even when no new content exists
3. **Inefficiency**: The system checks feeds that haven't updated, wasting resources
4. **Battery Impact**: On mobile devices, frequent polling drains battery life

While the database schema includes `websubHub` and `websubTopic` fields in the Feed model, these fields are currently populated with incorrect data due to naive hub detection logic (`feed.link.includes('hub')`), and no WebSub infrastructure exists to utilize them.

## Proposed Solution

Implement full WebSub protocol support following RFC 5988 and the WebSub W3C Recommendation, consisting of:

### Core Components

1. **Proper Hub Discovery**
   - Parse HTTP Link headers for `rel="hub"` and `rel="self"` per RFC 5988
   - Fallback to XML `<link>` element parsing
   - Store hub URL and topic URL accurately in database

2. **Subscription Management**
   - New `WebSubSubscription` database model (one-to-one with Feed)
   - Asynchronous subscription on feed creation (non-blocking)
   - Automatic unsubscription on feed deletion
   - Error tracking and retry logic with exponential backoff

3. **Callback Endpoint** (`/api/websub/callback`)
   - GET handler for hub verification challenges
   - POST handler for content push notifications
   - HMAC-SHA256 signature verification for security
   - Atomic database updates for new entries

4. **Lease Renewal System**
   - Scheduled task to renew expiring subscriptions
   - Process subscriptions at 80% of lease duration
   - Batch processing (20 subscriptions per cycle)
   - Fallback to polling if renewal fails

5. **Hybrid Poll/Push Architecture**
   - Polling continues for feeds without WebSub support
   - Active WebSub subscriptions skip polling to reduce load
   - Automatic fallback if subscriptions become inactive

## Goals

### Primary Goals

- **Reduce Content Latency**: New articles appear within seconds instead of minutes for WebSub-enabled feeds
- **Decrease Server Load**: Eliminate unnecessary polling for active WebSub subscriptions
- **Maintain Reliability**: Ensure graceful degradation and fallback to polling
- **Security**: Verify all push notifications using HMAC-SHA256 signatures

### Success Criteria

1. WebSub-enabled feeds (e.g., YouTube, Medium) deliver new content within 30 seconds of publication
2. Polling requests decrease by 50%+ for feeds with active WebSub subscriptions
3. Zero errors from invalid hub configurations or signature failures
4. Subscription renewal maintains 99%+ uptime for active subscriptions
5. Manual testing passes with WebSub.rocks test suite

## Non-Goals

- **Real-time UI Updates**: This proposal does not include WebSocket/SSE for browser updates (use existing polling in UI)
- **Hub Server Implementation**: piRSSonite will only act as a subscriber, not a hub
- **Historic Feed Migration**: Existing feeds without WebSub will continue using polling
- **Rate Limiting**: Future enhancement, not included in initial implementation

## Impact Assessment

### User Impact

- **Positive**: Faster content delivery for supported feeds, better user experience
- **Neutral**: No visible change for feeds without WebSub support
- **Migration**: None required; WebSub is opt-in per feed

### System Impact

- **Database**: New `WebSubSubscription` table with indexes
- **API**: Three new endpoints (`/api/websub/callback`, `/api/websub/renew`)
- **Performance**: Reduced polling load, minimal callback processing overhead
- **Security**: Enhanced via HMAC signature verification

### Development Impact

- **Estimated Effort**: 14.5 hours across 9 tasks
- **Risk Level**: Medium (external dependencies on hub availability)
- **Testing Requirements**: WebSub.rocks compliance, real feed testing

## Alternatives Considered

### Alternative 1: Polling-Only (Status Quo)

- **Pros**: Simple, no external dependencies, already works
- **Cons**: High latency, inefficient, wastes bandwidth
- **Decision**: Rejected; does not address core latency problem

### Alternative 2: Server-Sent Events (SSE) for Real-Time UI

- **Pros**: Browser receives instant updates
- **Cons**: Requires persistent connections, complex infrastructure
- **Decision**: Deferred to future phase; WebSub provides backend efficiency without UI changes

### Alternative 3: Full RSS Cloud Protocol

- **Pros**: Alternative to WebSub
- **Cons**: Less widely adopted than WebSub, limited hub support
- **Decision**: Rejected; WebSub has broader ecosystem support

## Dependencies

### Internal Dependencies

- Phase 1-5 complete (database, polling system, feed management)
- Existing `websubHub` and `websubTopic` fields in Feed model
- Feed parsing utilities (`fetchAndParseFeed`, `parseAndStoreFeed`)

### External Dependencies

- **WebSub Hubs**: Accessible from server (e.g., pubsubhubbub.appspot.com, superfeedr.com)
- **Callback Endpoint**: Publicly accessible URL (ngrok for local dev, Vercel URL in production)
- **Node.js Crypto**: Built-in library for HMAC-SHA256 (no new npm packages)

### Breaking Changes

None. WebSub is additive; existing polling functionality remains unchanged.

## Timeline

- **Planning & Proposal**: 2 hours (complete)
- **Implementation**: 14.5 hours across 9 tasks
- **Testing & Validation**: 1.5 hours
- **Total**: ~18 hours

## Open Questions

1. **Callback URL for Local Development**: Use ngrok or similar service for testing?
   - **Recommendation**: Document ngrok setup in implementation guide

2. **Lease Duration Preference**: Request specific lease duration from hubs?
   - **Recommendation**: Accept hub's default, typically 5-10 days

3. **Renewal Scheduling**: Cron job or manual endpoint?
   - **Recommendation**: Start with manual endpoint (`/api/websub/renew`), add cron in future

4. **Error Notification**: Alert users if WebSub subscription fails?
   - **Recommendation**: Log errors server-side, no user notification (polling continues seamlessly)

## References

- [WebSub W3C Recommendation](https://www.w3.org/TR/websub/)
- [RFC 5988 - Web Linking](https://tools.ietf.org/html/rfc5988)
- [WebSub.rocks Testing Suite](https://websub.rocks/)
- [PubSubHubbub Core 0.4](https://pubsubhubbub.github.io/PubSubHubbub/pubsubhubbub-core-0.4.html)

## Approval

This proposal requires approval before proceeding to implementation. See `design.md` for detailed architecture and `tasks.md` for implementation plan.
