# Spec: Scroll Detection

**Capability:** `scroll-detection`
**Status:** Proposed
**Version:** 1.0.0

## Overview

Automatic read-state tracking based on user scroll behavior using Intersection Observer API.

---

## ADDED Requirements

### Requirement: Auto-Mark Read on Scroll

**ID:** `scroll-detection.auto-mark`
**Priority:** High

The system SHALL automatically mark entries as read when they scroll past the top of the viewport.

#### Scenario: Entry scrolls past viewport top

**Given** an unread entry is visible in the viewport
**And** the entry has `isRead=false`
**When** the user scrolls down and the entry's bottom edge crosses above the viewport top
**Then** the entry is automatically marked as read
**And** a PUT request is sent to `/api/entries/[id]` with `{ "isRead": true }`

#### Scenario: Entry scrolls but stays in viewport

**Given** an unread entry is visible
**When** the user scrolls but the entry remains within the viewport
**Then** the entry is NOT marked as read
**And** no API call is made

#### Scenario: Already read entry

**Given** an entry with `isRead=true` is displayed
**When** the entry scrolls past the viewport top
**Then** no API call is made (already read)

---

### Requirement: Intersection Observer Implementation

**ID:** `scroll-detection.observer`
**Priority:** High

The system SHALL use the Intersection Observer API for performant scroll tracking.

#### Scenario: Observer attached on mount

**Given** an entry component renders
**When** the component mounts
**Then** an Intersection Observer is attached to the entry element

#### Scenario: Observer detached on unmount

**Given** an entry component with active observer
**When** the component unmounts
**Then** the observer is disconnected
**And** no memory leaks occur

---

### Requirement: Debounce Auto-Mark Calls

**ID:** `scroll-detection.debounce`
**Priority:** Medium

The system SHALL debounce mark-as-read API calls during rapid scrolling.

#### Scenario: Rapid scrolling through multiple entries

**Given** the user rapidly scrolls past 10 unread entries
**When** all 10 entries cross the viewport top within 2 seconds
**Then** API calls are batched or debounced
**And** the system does NOT make 10 simultaneous API calls

---

### Requirement: Threshold Configuration

**ID:** `scroll-detection.threshold`
**Priority:** Low

The system SHALL trigger auto-mark when entry fully exits viewport upwards.

#### Scenario: Entry bottom crosses viewport top

**Given** an unread entry is scrolling upwards
**When** the entry's `boundingClientRect.bottom < 0`
**Then** the auto-mark trigger activates

#### Scenario: Entry partially visible

**Given** an entry is 50% scrolled past viewport top
**When** the entry's `boundingClientRect.bottom >= 0`
**Then** the auto-mark trigger does NOT activate (not fully past)

---

### Requirement: User Preference Opt-Out

**ID:** `scroll-detection.opt-out`
**Priority:** Low (Future)

The system SHOULD allow users to disable auto-mark on scroll.

**Note:** Not implemented in initial version. Future enhancement.

---

### Requirement: Performance

**ID:** `scroll-detection.performance`
**Priority:** Medium

The system SHALL handle scroll events efficiently without impacting scroll smoothness.

#### Scenario: Smooth scrolling with many entries

**Given** 100 entries are rendered on the page
**When** the user scrolls rapidly
**Then** scrolling remains smooth (60 FPS)
**And** no janky scroll behavior occurs

---

## MODIFIED Requirements

None. This is a new capability.

---

## REMOVED Requirements

None.

---

## Related Capabilities

- `entry-state-api`: Calls the update API when auto-mark triggers
- `entry-display-ui`: Entry components integrate scroll detection

---

## Implementation Notes

**Intersection Observer Options:**
```javascript
{
  threshold: 0,           // Trigger when any part enters/exits
  root: null,             // Use viewport as root
  rootMargin: '0px'       // No margin adjustment
}
```

**Detection Logic:**
```javascript
// Trigger when entry scrolls above viewport
if (entry.boundingClientRect.bottom < 0 && !entry.target.dataset.isRead) {
  markAsRead(entry.target.dataset.entryId)
}
```
