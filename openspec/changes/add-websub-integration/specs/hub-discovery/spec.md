# Capability: Hub Discovery

Implements RFC 5988-compliant WebSub hub discovery by parsing HTTP Link headers and XML feed elements to extract hub and topic URLs for subscription.

## ADDED Requirements

### Requirement: The system SHALL parse HTTP Link Headers for WebSub Endpoints

**ID:** `hub-discovery-link-headers`

The system SHALL parse HTTP Link headers following RFC 5988 to extract WebSub hub (rel="hub") and topic (rel="self") URLs from feed responses.

#### Scenario: YouTube feed with Link headers

```
GIVEN YouTube channel feed at "https://www.youtube.com/feeds/videos.xml?channel_id=UC123"
AND response includes Link header: <https://pubsubhubbub.appspot.com/>; rel="hub", <https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC123>; rel="self"
WHEN hub discovery is performed on the response
THEN hubUrl = "https://pubsubhubbub.appspot.com/"
AND topicUrl = "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC123"
```

#### Scenario: Link header with case-insensitive rel matching

```
GIVEN feed response with Link header: <http://hub.example.com>; rel="Hub"
WHEN hub discovery parses the header
THEN hubUrl = "http://hub.example.com" (case-insensitive match succeeds)
```

### Requirement: Fallback to XML Link Element Parsing

**ID:** `hub-discovery-xml-fallback`

When Link headers are not present, the system SHALL parse XML feed content to find `<link>` elements with rel="hub" and rel="self" attributes.

#### Scenario: Atom feed with XML links only

```
GIVEN Atom feed without Link headers
AND XML contains <link rel="hub" href="http://hub.example.com"/>
AND XML contains <link rel="self" href="http://example.com/feed.xml"/>
WHEN hub discovery parses the XML
THEN hubUrl = "http://hub.example.com"
AND topicUrl = "http://example.com/feed.xml"
```

#### Scenario: RSS 2.0 feed with atom namespace

```
GIVEN RSS 2.0 feed with atom:link elements
AND XML contains <atom:link rel="hub" href="http://pubsubhubbub.appspot.com/"/>
AND XML contains <atom:link rel="self" href="http://blog.example.com/feed"/>
WHEN hub discovery parses the XML
THEN correctly handles namespaced elements
AND hubUrl = "http://pubsubhubbub.appspot.com/"
AND topicUrl = "http://blog.example.com/feed"
```

### Requirement: Feed URL as Topic Fallback

**ID:** `hub-discovery-topic-fallback`

When hub is found but topic (rel="self") is not present, the system SHALL use the original feed URL as the topic URL.

#### Scenario: Hub found without self link

```
GIVEN feed with hubUrl = "http://hub.example.com"
AND no rel="self" link found in headers or XML
AND original feedUrl = "https://example.com/rss"
WHEN hub discovery completes
THEN topicUrl = "https://example.com/rss" (uses feedUrl as fallback)
```

### Requirement: Graceful Handling of Non-WebSub Feeds

**ID:** `hub-discovery-no-websub`

The system SHALL gracefully handle feeds that do not advertise WebSub hubs without throwing errors.

#### Scenario: Standard RSS feed without WebSub

```
GIVEN standard RSS feed with no Link headers
AND no <link rel="hub"> elements in XML
WHEN hub discovery is performed
THEN returns { hubUrl: undefined, topicUrl: undefined }
AND no errors thrown
AND feed continues to use polling
```

### Requirement: Prefer Link Headers Over XML

**ID:** `hub-discovery-header-priority`

When both Link headers and XML elements are present, the system SHALL prioritize Link headers as the preferred discovery method per RFC 5988.

#### Scenario: Mixed Link header and XML links

```
GIVEN feed with Link header: <http://hub1.example.com>; rel="hub"
AND XML contains <link rel="hub" href="http://hub2.example.com"/>
WHEN hub discovery runs
THEN hubUrl = "http://hub1.example.com" (Link header takes precedence)
AND XML hub is ignored
```
