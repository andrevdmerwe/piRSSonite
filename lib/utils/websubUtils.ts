import { randomBytes, createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'

export interface WebSubEndpoints {
  hubUrl: string | undefined
  topicUrl: string | undefined
}

export interface SubscriptionRequest {
  feedId: number
  hubUrl: string
  topicUrl: string
}

/**
 * Discovers WebSub hub and topic URLs from feed response.
 * Follows RFC 5988 for Link header parsing, with XML fallback.
 *
 * @param feedUrl - The original feed URL (used as topic fallback)
 * @param xmlText - The raw XML feed content
 * @param responseHeaders - HTTP response headers from feed fetch
 * @returns Object with hubUrl and topicUrl (undefined if not found)
 */
export async function discoverWebSubEndpoints(
  feedUrl: string,
  xmlText: string,
  responseHeaders: Headers
): Promise<WebSubEndpoints> {
  let hubUrl: string | undefined
  let topicUrl: string | undefined

  // 1. Check HTTP Link headers (preferred method per RFC 5988)
  const linkHeader = responseHeaders.get('link')
  if (linkHeader) {
    // Parse: Link: <http://hub.example.com>; rel="hub"
    // Case-insensitive rel matching, supports quotes or no quotes
    const hubMatch = linkHeader.match(/<([^>]+)>;\s*rel=["']?hub["']?/i)
    const selfMatch = linkHeader.match(/<([^>]+)>;\s*rel=["']?self["']?/i)

    if (hubMatch) hubUrl = hubMatch[1]
    if (selfMatch) topicUrl = selfMatch[1]
  }

  // 2. Fallback to XML <link> elements
  if (!hubUrl || !topicUrl) {
    try {
      // Parse XML to find <link> elements with rel="hub" or rel="self"
      const hubXmlMatch = xmlText.match(/<link[^>]*rel=["']hub["'][^>]*href=["']([^"']+)["']/i) ||
                          xmlText.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']hub["']/i) ||
                          xmlText.match(/<atom:link[^>]*rel=["']hub["'][^>]*href=["']([^"']+)["']/i) ||
                          xmlText.match(/<atom:link[^>]*href=["']([^"']+)["'][^>]*rel=["']hub["']/i)

      const selfXmlMatch = xmlText.match(/<link[^>]*rel=["']self["'][^>]*href=["']([^"']+)["']/i) ||
                           xmlText.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']self["']/i) ||
                           xmlText.match(/<atom:link[^>]*rel=["']self["'][^>]*href=["']([^"']+)["']/i) ||
                           xmlText.match(/<atom:link[^>]*href=["']([^"']+)["'][^>]*rel=["']self["']/i)

      if (hubXmlMatch && !hubUrl) hubUrl = hubXmlMatch[1]
      if (selfXmlMatch && !topicUrl) topicUrl = selfXmlMatch[1]
    } catch (error) {
      console.error('XML parsing error during WebSub discovery:', error)
    }
  }

  // 3. Use feed URL as topic if self not found
  if (hubUrl && !topicUrl) {
    topicUrl = feedUrl
  }

  return { hubUrl, topicUrl }
}

/**
 * Generates a cryptographically secure secret for HMAC.
 *
 * @returns 64-character hex string (32 bytes)
 */
export function generateSecret(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Subscribes to a WebSub hub for real-time feed updates.
 *
 * @param request - Subscription parameters
 * @throws Error if hub returns non-2xx response or network fails
 * @returns Promise<void>
 */
export async function subscribeToWebSub(
  request: SubscriptionRequest
): Promise<void> {
  const { feedId, hubUrl, topicUrl } = request

  // Generate unique HMAC secret (32-byte hex)
  const secret = generateSecret()

  // Build callback URL (environment-dependent)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const callbackUrl = `${baseUrl}/api/websub/callback`

  // POST to hub with form data
  const formData = new URLSearchParams({
    'hub.callback': callbackUrl,
    'hub.mode': 'subscribe',
    'hub.topic': topicUrl,
    'hub.secret': secret,
    'hub.lease_seconds': '' // Let hub choose
  })

  // Set timeout for hub request (10 seconds)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(hubUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      signal: controller.signal
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
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Hub subscription timeout after 10s')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Unsubscribes from a WebSub hub.
 *
 * @param subscription - The WebSubSubscription to cancel
 * @returns Promise<void>
 */
export async function unsubscribeFromWebSub(
  subscription: { hubUrl: string; topicUrl: string }
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const callbackUrl = `${baseUrl}/api/websub/callback`

  const formData = new URLSearchParams({
    'hub.callback': callbackUrl,
    'hub.mode': 'unsubscribe',
    'hub.topic': subscription.topicUrl
  })

  try {
    const response = await fetch(subscription.hubUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })

    if (!response.ok) {
      console.warn(`Unsubscribe failed: ${response.status}`)
    }
  } catch (error) {
    console.warn('Unsubscribe request error:', error)
    // Don't throw - unsubscribe is best-effort
  }
}

/**
 * Verifies HMAC-SHA256 signature from hub using timing-safe comparison.
 *
 * @param body - Raw request body as string
 * @param signature - X-Hub-Signature header value (format: "sha256=abc123")
 * @param secret - Subscription secret used for HMAC
 * @returns true if signature is valid, false otherwise
 */
export function verifySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Extract algorithm and expected hash
    const parts = signature.split('=')
    if (parts.length !== 2) {
      return false
    }

    const [algorithm, expectedSig] = parts

    // Only support sha256
    if (algorithm !== 'sha256') {
      return false
    }

    // Compute HMAC-SHA256
    const computedSig = createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    // Timing-safe comparison to prevent timing attacks
    return timingSafeEqual(
      Buffer.from(computedSig, 'hex'),
      Buffer.from(expectedSig, 'hex')
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}
