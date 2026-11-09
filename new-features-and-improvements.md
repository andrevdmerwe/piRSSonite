# piRSSonite — Suggested Improvements & New Features

A review of the codebase (as of `eaa8325`) with suggestions grouped by priority. Since this is
a personal-use, self-hosted app, suggestions lean toward practical wins over enterprise concerns.

---

## 🐛 Bugs & Correctness Issues (fix first)

### 1. Starred articles can be silently deleted
`truncateOldEntries()` in `lib/utils/refreshUtils.ts:103` keeps only the 200 newest entries per
feed and deletes the rest — **including starred ones**. Star an article on a busy feed and it
will vanish within days.

**Fix:** exclude starred entries from deletion:
```ts
await prisma.entry.deleteMany({
  where: { feedId, isStarred: false, id: { notIn: idsToKeep } },
})
```

### 2. There is no way to view starred articles
The README advertises "Starred Articles — dedicated filtered views", but:
- `app/api/entries/route.ts` only supports `feedId` / `folderId` filters — no `starred` filter.
- The sidebar has no "Starred" item.

You can star and unstar articles, but never see them as a list. Add a `starred=true` query param
to the entries API and a pinned "★ starred" item in the sidebar (above or below "all_items").

### 3. Header refresh button is a degraded copy of the initial fetch
The inline refresh handler in `components/EntryFeed.tsx:192` duplicates the fetch logic from the
`useEffect` but skips: `sessionUnreadIds` reset, `Array.isArray` validation, and all error
handling (a failed fetch leaves the view stuck on `loading_entries...`). Extract a single
`fetchEntries()` function (e.g. wrapped in `useCallback`) and call it from both places.

### 4. Unvalidated `parseInt` on query params
`app/api/entries/route.ts:11-12` — `?limit=abc` produces `NaN`, which Prisma will reject with a
500. Clamp and default: `Math.min(Math.max(parseInt(...) || 50, 1), 1000)`.

### 5. Feeds stay dead forever after 15 failures
`app/api/refresh/route.ts:109` sets `isAvailable = false` after 15 failures and the refresh query
filters on `isAvailable: true`, so a feed that had a bad week never recovers without manual DB
surgery. Options: retry unavailable feeds once a day, or add a "retry" button in Manage Feeds
that resets `failureCount`/`isAvailable`.

### 6. Dead `Config` table
The `Config` model in `prisma/schema.prisma` is never referenced anywhere in the code. Either
remove it or (better) start using it — several suggestions below need server-side settings.

---

## 🏗️ Architecture Improvements

### 7. Server-side refresh scheduling (biggest architectural win)
Refresh is driven entirely by `components/AutoRefresher.tsx` — a client-side `setInterval`. This
means **feeds only update while a browser tab is open**. Close the tab and polling stops (WebSub
pushes still land, but most feeds are poll-only). Also, two open tabs = two competing refresh
loops.

For a self-hosted app the server should own the schedule. Options, in order of preference:

1. **`instrumentation.ts`** — Next.js supports a server-startup hook; start a `setInterval`
   there (guard with `process.env.NEXT_RUNTIME === 'nodejs'`). Zero new infrastructure.
2. **Container cron** — a sidecar/cron hitting `POST /api/refresh` every 15 min.

Keep a slimmed-down AutoRefresher that just refetches counts periodically for UI freshness.

### 8. Conditional GET (ETag / Last-Modified)
`fetchAndParseFeed()` downloads the full feed body every cycle. Store `etag` and `lastModified`
on the `Feed` model, send `If-None-Match` / `If-Modified-Since`, and skip parsing on `304`. This
is the single biggest bandwidth/CPU saving available and is what feed publishers expect from
well-behaved readers.

### 9. Batch entry inserts
Both `app/api/refresh/route.ts:73` and `parseAndStoreFeed()` insert new entries one-by-one in a
loop inside a transaction. Prisma's interactive transactions default to a 5 s timeout — a feed
with 200 new entries on SQLite can flirt with that. Use one `tx.entry.createMany({ data: newEntries })`
(you already dedupe manually, so `skipDuplicates` isn't needed).

### 10. Pagination instead of `limit=1000`
`EntryFeed` fetches up to 1000 entries **with full content** (up to 50 KB each) in one request —
that's potentially tens of MB of JSON for "all items". You already ship
`react-intersection-observer`; add infinite scroll: fetch 50 at a time, load more when the
sentinel enters the viewport. Alternatively return content-less previews in the list call and
lazy-load content on expand.

### 11. Authentication option
There is no auth at all. Fine on a trusted LAN, but one `docker run -p` on a VPS away from
exposing your reading habits (and write access to your DB) to the internet. Even a single
shared-password cookie + middleware, or documented Basic-Auth-via-reverse-proxy guidance in the
README, would cover the realistic deployment cases.

### 12. Remove or gate the debug endpoint
`app/api/debug/route.ts` dumps every unread entry with no guard. Delete it, or gate behind
`process.env.NODE_ENV !== 'production'`.

---

## 🧹 Code Quality

### 13. Deduplicate the parse/sanitize/store logic
`fetchAndParseFeed()` and `parseAndStoreFeed()` in `refreshUtils.ts` contain ~50 identical lines
(sanitize config, truncation, mapping). Extract `parseFeedItems(items): ParsedEntry[]` and a
shared `storeNewEntries(feedId, entries, tx)`.

### 14. Type the Prisma transaction clients
`truncateOldEntries(feedId, prisma: any)` and `parseAndStoreFeed(..., prismaClient?: any)` use
`any`. Use `Prisma.TransactionClient` from `@prisma/client`.

### 15. Strip console noise
`console.log` calls ship in production paths (`EntryFeed.tsx:95` logs the entire entries array;
`entries/route.ts` logs every request). Remove them or put them behind a debug flag.

### 16. Shared `Entry` type
`EntryFeed.tsx` and `ArticleCard.tsx` each declare their own near-identical `Entry` interface,
and `lib/types.ts` has a third view. Define it once in `lib/types.ts` (or derive from Prisma's
generated types) and import.

### 17. Repo hygiene
Root-level working notes (`my_notes.md`, `cli_text.md`, `git_steps.md`, `testing_steps.md`,
`theming_options.md`, `app_summary.md`, `app_details.md`, `advanced-theming-system-brief.md`,
`new_theme/`) could move to a `docs/` folder or be deleted if stale. Also add
`tsconfig.tsbuildinfo` and `prisma/*.db` to `.gitignore` if not already covered.

### 18. Tests
There are zero tests and no test script. Highest-value, lowest-effort targets:
- `calculateNextCheckTime` (pure function, backoff logic)
- `parseFeedItems` (once extracted — feed edge cases: missing dates, missing links, huge content)
- OPML import/export round-trip (`lib/utils/opmlUtils.ts`)
Vitest fits this stack with almost no config, and a `npm test` step could be added to the
existing Docker-publish workflow.

---

## ✨ UX Improvements

### 19. Keyboard navigation
The classic RSS-reader feature set: `j`/`k` next/previous article, `o`/`Enter` open in browser,
`m` toggle read, `s` toggle star, `r` refresh, `Shift+A` mark all read. Cheap to add, transforms
daily use.

### 20. Mobile / responsive layout
The layout is a fixed-width sidebar with a mouse-only resize handle — unusable on a phone, which
is where a lot of RSS reading happens. Collapse the sidebar into a hamburger drawer below a
breakpoint. Pair with a **PWA manifest** (`manifest.json` + icons — you already have SVG icons)
so it installs to the home screen.

### 21. Feed favicons in the sidebar
Fetch `https://<feed-domain>/favicon.ico` (or use a favicon service, or fetch and cache locally)
and show it next to each feed name. Big scannability win for long feed lists.

### 22. Surface refresh results and feed health
`POST /api/refresh` returns `{ refreshed, errors }` but the UI drops it. Show a toast
("refreshed 12 feeds, 2 errors") and add a health indicator in Manage Feeds: `lastFetched`,
`failureCount`, `isAvailable`, and WebSub status per feed — the data is all already in the DB.

### 23. Open article links from content in a new tab
Sanitized entry HTML keeps `<a href>` but rendered links navigate the app tab away. Use
sanitize-html's `transformTags` to force `target="_blank" rel="noopener noreferrer"` on content
links at ingest time.

### 24. Undo for "mark all as read"
Mark-all is one accidental click from nuking hundreds of unread flags. Either an "undo" toast
(store affected IDs client-side and flip them back), or a confirm when the count is large.

### 25. Relative-date polish
`formatDate` in `ArticleCard.tsx` renders "0 minutes ago" and "1 minutes ago". Use
`Intl.RelativeTimeFormat` for correct pluralisation for free.

---

## 🚀 New Feature Ideas (roughly prioritised)

### 26. Full-text search — likely the most-missed feature
SQLite ships FTS5. Add an FTS virtual table over `Entry(title, content)` maintained by trigger
or on insert, a `GET /api/entries?q=...` param, and a search box above the entry list. No new
services needed.

### 27. Feed autodiscovery
`POST /api/feeds` requires the exact feed URL. Paste `https://example.com` and it 422s. When the
URL isn't parseable as a feed, fetch it as HTML and look for
`<link rel="alternate" type="application/rss+xml|application/atom+xml">`. Nearly every reader
does this; it makes adding feeds effortless.

### 28. Reader mode (full-content fetch)
Many feeds only publish teasers. Add a per-feed "fetch full content" toggle that pulls the
article page and extracts the body with `@mozilla/readability` + `jsdom` (sanitized with your
existing pipeline). This turns truncated feeds into a proper reading experience.

### 29. Configurable retention & refresh interval
Hard-coded today: 200 entries/feed, 15-minute base interval, 50 KB content cap. Wire these into
the (currently unused) `Config` table with a section in Settings, plus optional per-feed
overrides (a high-volume feed at 500 entries, a slow blog polled hourly).

### 30. "Saved for later" → Obsidian export
You work in an Obsidian vault — add a "save to notes" action on an article that writes a
markdown note (title, URL, date, excerpt, your tags) into the vault via a configured folder path.
Starred = transient bookmark; exported = permanent note.

### 31. Daily digest / AI summaries (personal-use superpower)
A scheduled job that takes the last 24 h of unread entries and produces a short digest ("what
happened in your feeds today"), either rendered as a synthetic "digest" entry at the top of
all_items or emailed/pushed. The Claude API makes the summarisation itself a ~20-line call.

### 32. Notifications for chosen feeds
A per-feed "notify" flag; on refresh, new entries in flagged feeds fire a push via
[ntfy](https://ntfy.sh) (a single HTTP POST, perfect for self-hosters) or Web Push. Great for
low-volume, high-importance feeds (releases, security advisories).

### 33. Filters & sorting on the entry list
Quick filters: today / this week / unread / starred; sort: newest, oldest (nice for catching up
on serialised content), by feed. Mostly query-param plumbing on the existing API.

### 34. Reading stats
A small stats view: articles read per day/week, most-read feeds, feeds you never read (candidates
for unsubscribing). All derivable from existing data if you add a `readAt DateTime?` column
(currently read state is a bare boolean — adding the timestamp also enables "mark older than X
as read").

### 35. Image proxy / privacy option
Entry content allows `<img>`, so every render can hit third-party servers (tracking pixels
included). An optional `/api/image-proxy?url=...` route (with caching) keeps reading private and
fixes mixed-content breakage.

### 36. Backup & restore
The DB is one SQLite file — add a Settings action to download a snapshot (`/data/main.db` +
theme/localStorage settings as JSON) and an import to restore. Cheap insurance for a
personal-data app.

### 37. Theme scheduling
You already have light (Catppuccin Latte) and dark themes — add "auto" mode that follows
`prefers-color-scheme` or a time-of-day schedule, with a configurable light/dark theme pair.

---

## Quick-win shortlist

If you only do five things, do these:

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Protect starred entries from truncation | ~5 lines | Stops silent data loss |
| 2 | Starred view (API filter + sidebar item) | Small | Makes an existing feature real |
| 7 | Server-side refresh via `instrumentation.ts` | Small | Feeds update without a tab open |
| 26 | Full-text search (SQLite FTS5) | Medium | Most-missed daily feature |
| 19 | Keyboard navigation | Small | Daily quality-of-life |
