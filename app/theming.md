# Dark Reader‑Style Web App – Design Brief

## Color palette and mood

- Overall mood: dark, muted, technical; reminiscent of a code editor.
- Suggested base palette:
  - Global background: very dark gray/blue‑black (e.g., `#05070A`).
  - Sidebar background: slightly lighter dark gray (e.g., `#0B0F16`).
  - Card background (default): dark blue‑gray (e.g., `#111623`).
  - Primary text: light gray / off‑white (e.g., `#E5E9F0`).
  - Secondary text: mid gray (e.g., `#7A8395`).
  - Primary accent (buttons, selected tabs): muted blue (e.g., `#3B82F6`).
  - Status accent (e.g., “read” badge): soft green (e.g., `#10B981`).
- Colors should be restrained and professional with no overly bright tones.

---

## Typography

- Use a monospace or developer‑style typeface across the interface:
  - Examples: Fira Code, JetBrains Mono, Source Code Pro, or system monospace.
- Base size around 14px; titles 16–18px; metadata 12–13px.
- Many labels and titles can be lowercase to emphasize the utilitarian feel.
- Section labels (e.g., “VIEWS”, “FEEDS”) may use small caps or uppercase with letter spacing.

---

## Left sidebar: views and feeds

### Views

- “VIEWS” label at top in subtle small‑caps text.
- Items:
  - `all_items`
- Each item:
  - Small icon/indicator on the left (dot/square).
  - Optional rectangular unread count on the right.
- Selected view:
  - Slightly brighter text and/or faint background highlight.

### Feeds

- “FEEDS” label below “VIEWS”.
- Feed groups (e.g., `3d_printing`, `all_things_blades`, `sa_motoring`) show:
  - Small caret/chevron icon for expanded/collapsed state.
  - Group name in monospace.
  - Small unread count badge on the right.
- Nested feeds:
  - Indented under group heading.
  - Each feed line shows:
    - Feed name.
    - Small unread count right‑aligned.
- Selected feed:
  - Subtle highlight via lighter text and/or a faint background strip.

---

## Top bar in main content column

- Displays current feed name (e.g., `3d_printing`) prominently in monospace.
- Slim metadata row beneath with:
  - Folder ID / technical string.
  - “Found XXX entries” and “XXX unread” labels.
- Right side of this bar includes:
  - Filter pills such as “all” and “unread”; selected pill uses filled blue background with white text, unselected pills are outlined or muted.
  - A primary action button, e.g., `mark_all_read`, in blue with light text.

---

## Article cards (right column)

### Default card

- Full‑width rectangles stacked vertically with small gaps.
- Background: dark blue‑gray (`#111623` or similar).
- Slightly rounded corners (small radius).
- Inner padding (approx. 16–20px).

### Card content

- Top metadata row:
  - Small pill badge (e.g., “read”) in soft green with rounded ends.
  - Source label (e.g., subreddit or feed name) in tiny text next to the badge.
  - Timestamp (e.g., “about 13 hours ago”) aligned to the far right in faded gray.
- Title:
  - One or two lines, bold/semibold, light text, often lowercase.
- Excerpt/body:
  - Short paragraph in smaller, lighter gray text beneath the title.
- Footer:
  - Small “RSS” label, comments link, or other tiny badges/links.
  - Star/favorite icon aligned right, typically outline style when inactive.

---

## Hover and interaction states

### Card hover

- On mouse hover, the article card’s background becomes slightly lighter than the default card background, making it stand out from other cards.[conversation_history:2]
- Optional: add a faint border or glow to increase focus on the hovered card.[conversation_history:2]
- Action icons and small links can increase in brightness/opacity on hover to emphasize clickability.[conversation_history:2]

### Sidebar interactions

- Hovering over views/feeds:
  - Slight text color lightening and/or faint background strip.
- Clicking a feed:
  - Updates main column article list for that feed.
  - Applies the “selected” style in the sidebar.

### Filter tabs and buttons

- Hover on filter pills and main action button slightly lightens background and may add a subtle border.
- Active filter pill:
  - Filled blue with white text.
- Inactive pills:
  - Outlined or dimmed relative to the active state.

---

## Spacing, borders, and rhythm

- Consistent vertical spacing:
  - Small gaps between sidebar items and slightly larger gaps between feed groups.
  - Small vertical spacing between article cards for a dense but readable stack.
- Borders are minimal; rely on background shades and spacing for separation.
- The overall feel should be compact and information‑rich, but not cramped.

---

## Implementation notes

- Use CSS Grid or Flexbox for three‑column layout:
  - Sidebar fixed width around 260–280px.
  - Optional middle column around 300–320px, or use it as flexible spacer.
  - Main content column takes remaining width.
- Base font stack:
  - `font-family: "Fira Code", "JetBrains Mono", Menlo, monospace;`.
- Dark mode is the primary and default theme; no light theme is required for this brief.
